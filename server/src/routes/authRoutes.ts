import { NextFunction, Request, Response, Router } from 'express'
import { pool } from '../config/databaseConfig';
import { OAuth2Client } from 'google-auth-library';
import { envs } from '../config/envs';
import jwt from 'jsonwebtoken'
import { isAuth } from '../middleware/isAuth';
import bcrypt from 'bcryptjs'
import { strictLimiter } from '../middleware/rateLimiter';
const client = new OAuth2Client(envs.GOOGLE_CLIENT_ID);

export const auth = Router();

auth.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.send('Auth route is live...');
    } catch (err) {
        next(err);
    }
});

auth.get('/organizations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = 'SELECT * FROM organizations';
        const result = await pool.query(query);
        const data = result.rows;
        res.send(data);
    } catch (err) {
        next(err);
    }
});

// Interfaz para el contenido del token
interface TokenPayload {
    userId: number;
}

// 👤 Autenticar al usuario en cada recarga (/me) - ¡Corregido y Multi-tenant!
auth.get('/me', isAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;

        // 🏢 Agregamos el JOIN para mantener la sesión hidratada con su Workspace en cada F5
        const userQuery = await pool.query(
            `SELECT 
                u.id, u.username, u.email, u.avatar, u.role,
                o.id AS org_id, o.name AS org_name
             FROM users u
             LEFT JOIN organizations o ON u.organization_id = o.id
             WHERE u.id = $1`,
            [userId]
        );

        const user = userQuery.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            user: {
                id: user.id,
                name: user.username,
                email: user.email,
                avatar: user.avatar || '',
                role: user.role,
                organization: user.org_id ? {
                    id: user.org_id,
                    name: user.org_name
                } : null
            }
        });

    } catch (err) {
        next(err);
    }
});

// Función reutilizable para generar el JWT y setear la Cookie
export const sendTokenCookie = (res: Response, userId: number, organizationId: number | null) => {
    // 🧠 Guardamos de forma atómica tanto el ID del usuario como el de su organización en el payload
    const token = jwt.sign(
        { userId, organizationId }, 
        envs.JWT_SECRET, 
        { expiresIn: '24h' }
    );

    let sameSiteStatus = envs.NODE_ENV === 'production' ? 'none' as const : 'strict' as const;

    const cookieOptions = {
        httpOnly: true,
        secure: envs.NODE_ENV === 'production',
        sameSite: sameSiteStatus,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
    };

    res.cookie('session_token', token, cookieOptions);
};

// SignUp
// authRoutes.ts - Registro Optimizado

auth.post('/signup', strictLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, organizationName, password } = req.body;

    // 1. Validación temprana
    if (!name || !email || !organizationName || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Solicitamos un cliente dedicado del pool para controlar la transacción de forma aislada
    const client = await pool.connect();

    try {
        // Comenzamos el bloque transaccional
        await client.query('BEGIN');

        // 2. Verificar si el usuario ya existe
        const existUserQuery = await client.query(`SELECT id FROM users WHERE email = $1`, [email.trim().toLowerCase()]);
        if (existUserQuery.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Este correo ya está registrado' });
        }

        // 3. Verificar si la organización ya existe
        const existOrganizationQuery = await client.query(`SELECT id FROM organizations WHERE name = $1`, [organizationName.trim()]);
        if (existOrganizationQuery.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'El nombre de la organización ya está en uso, intenta con uno diferente.' });
        }

        // 4. Crear la organización
        const organizationQuery = await client.query(
            `INSERT INTO organizations (name) VALUES ($1) RETURNING id, name`,
            [organizationName.trim()]
        );
        const organizationData = organizationQuery.rows[0];

        // 5. Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Insertar el usuario vinculando el ID numérico de la organización y asignando 'ADMIN'
        const userQuery = await client.query(
            `INSERT INTO users (username, email, password, role, organization_id) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, username, email, avatar, organization_id`,
            [name.trim(), email.trim().toLowerCase(), hashedPassword, 'ADMIN', organizationData.id] // 👈 Corregido a organizationData.id y rol ADMIN
        );
        const userData = userQuery.rows[0];

        // Si todo el proceso fue exitoso, confirmamos los cambios en disco
        await client.query('COMMIT');

        // 7. Generar sesión inmediata
        sendTokenCookie(res, userData.id, organizationData.id);

        // 8. Respuesta consistente
        res.status(201).json({ 
            message: 'Usuario creado exitosamente',
            data: {
                user: {
                    id: userData.id,
                    name: userData.username,
                    email: userData.email,
                    avatar: userData.avatar || '',
                    organization: { // 🧠 Enviamos el objeto de la organización completo para hidratar el estado de Redux de manera elegante
                        id: organizationData.id,
                        name: organizationData.name
                    },
                    role: 'ADMIN'
                }
            }
        });

    } catch (err) {
        // Ante cualquier fallo del motor, revertimos toda mutación para mantener la BD limpia
        await client.query('ROLLBACK');
        next(err);
    } finally {
        // Devolvemos el cliente al pool de conexiones de inmediato
        client.release();
    }
});

// Sign In
// authRoutes.ts - Sign In Real Modificado (Multi-tenant)

auth.post('/signin', strictLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body; // 'username' puede ser el email o el nickname

    if (!username || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        // 1. Buscamos al usuario agregando el JOIN relacional para la organización
        const query = `
            SELECT 
                u.id, 
                u.username, 
                u.email, 
                u.password, 
                u.role,
                u.avatar,
                o.id AS org_id,
                o.name AS org_name
            FROM users u
            LEFT JOIN organizations o ON u.organization_id = o.id
            WHERE u.email = $1 OR u.username = $1;
        `;

        const result = await pool.query(query, [username.trim()]);
        const user = result.rows[0];

        // 2. Verificación: ¿Existe el usuario?
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 3. Verificación: ¿Contraseña manual o usuario de Google?
        // Nota técnica: Comparamos explícitamente con tu string de control de OAuth o si es nulo
        if (!user.password || user.password === 'OAUTH_EXTERNAL_ACCOUNT') {
            return res.status(401).json({ message: 'Este usuario utiliza inicio de sesión con Google' });
        }

        // 4. Comparar contraseñas
        const matchPassword = await bcrypt.compare(password, user.password);

        if (!matchPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 5. Generar Cookie
        sendTokenCookie(res, user.id, user.org_id);

        // 6. Respuesta consistente hidratando el objeto organization
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            data: {
                user: {
                    id: user.id,
                    name: user.username,
                    email: user.email,
                    avatar: user.avatar || '',
                    role: user.role,
                    organization: user.org_id ? {
                        id: user.org_id,
                        name: user.org_name
                    } : null
                }
            }
        });

    } catch (err) {
        next(err);
    }
});

// authRoutes.ts - Google OAuth Multi-tenant Modificado

auth.post('/google', strictLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;
    const tokenString = typeof token === 'string' ? token : token.token;

    if (!tokenString) {
        return res.status(400).json({ message: 'El token de Google es obligatorio' });
    }

    // Solicitamos un cliente dedicado del pool para controlar la transacción de forma segura
    const dbClient = await pool.connect();

    try {
        // A. Validar el token con Google
        const ticket = await client.verifyIdToken({
            idToken: tokenString,
            audience: envs.GOOGLE_CLIENT_ID as string,
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error('Invalid Google Token');

        const { email, name, picture, sub: googleId } = payload;
        const normalizedEmail = email!.trim().toLowerCase();

        // Iniciamos la transacción atómica
        await dbClient.query('BEGIN');

        // B. Lógica de Base de Datos con Aislamiento Relacional
        // Buscamos al usuario e intentamos traer los datos de su organización con un LEFT JOIN
        const userQuery = await dbClient.query(`
            SELECT u.*, o.id AS org_id, o.name AS org_name 
            FROM users u
            LEFT JOIN organizations o ON u.organization_id = o.id
            WHERE u.email = $1;
        `, [normalizedEmail]);

        let finalUser;
        let organizationData = null;

        if (userQuery.rowCount > 0) {
            // Caso 1: El usuario ya existe. Extraemos su perfil y su espacio de trabajo actual
            const existingUser = userQuery.rows[0];
            
            // Si el usuario existe pero por alguna razón no tiene asignada una organización externa
            if (existingUser.org_id) {
                organizationData = {
                    id: existingUser.org_id,
                    name: existingUser.org_name
                };
            }

            finalUser = {
                id: existingUser.id,
                username: existingUser.username,
                email: existingUser.email,
                avatar: existingUser.avatar,
                role: existingUser.role
            };

            await dbClient.query('COMMIT');
        } else {
            // Caso 2: Es la primera vez que entra (Registro implícito). 
            // 1. Creamos un espacio de trabajo por defecto para su cuenta
            const defaultOrgName = `Workspace de ${name}`;
            const orgInsertResult = await dbClient.query(
                `INSERT INTO organizations (name) VALUES ($1) RETURNING id, name`,
                [defaultOrgName]
            );
            
            const newOrg = orgInsertResult.rows[0];
            organizationData = {
                id: newOrg.id,
                name: newOrg.name
            };

            // 2. Insertamos al nuevo usuario vinculándole la organización con rol de 'ADMIN'
            // Nota: Mandamos un string marcador en password para cumplir con el NOT NULL de tu esquema
            const userInsertResult = await dbClient.query(`
                INSERT INTO users (username, email, role, google_id, avatar, password, organization_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING id, username, email, avatar, role;
            `, [
                name, 
                normalizedEmail, 
                'ADMIN', // Al ser su propio espacio de trabajo, inicia como administrador
                googleId, 
                picture || '', 
                'OAUTH_EXTERNAL_ACCOUNT', 
                newOrg.id
            ]);

            finalUser = userInsertResult.rows[0];

            // Confirmamos toda la creación mutua en la base de datos
            await dbClient.query('COMMIT');
        }

        // 🔥 CORRECCIÓN AQUÍ: Evitamos leer .id de un nulo si organizationData no se creó bien
        sendTokenCookie(res, finalUser.id, organizationData ? organizationData.id : null);

        // D. Respuesta con estructura de datos consistente e hidratada
        res.status(200).json({
            message: 'Inicio de sesión con Google exitoso',
            data: {
                user: {
                    id: finalUser.id,
                    name: finalUser.username,
                    email: finalUser.email,
                    avatar: finalUser.avatar || '',
                    role: finalUser.role,
                    organization: organizationData // Entidad consistente { id, name } o null
                }
            }
        });

    } catch (err) {
        // En caso de que falle el enlace en el registro implícito, limpiamos mutaciones
        await dbClient.query('ROLLBACK');
        next(err);
    } finally {
        // Liberamos el cliente de vuelta al pool
        dbClient.release();
    }
});

// Logout Sólido para Entorno Cloud
auth.post('/logout', strictLimiter, isAuth, (req: Request, res: Response) => {
    
    const cookieOptions = {
        httpOnly: true,
        secure: true,        // Siempre seguro bajo el HTTPS de tu balanceador/subdominio
        sameSite: 'none' as const, // Permite la persistencia cross-origin entre tu front y tu back
        path: '/',
    };

    res.clearCookie('session_token', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
});
