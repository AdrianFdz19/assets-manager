import { NextFunction, Request, Response, Router } from 'express'
import { pool } from '../config/databaseConfig';
import { OAuth2Client } from 'google-auth-library';
import { envs } from '../config/envs';
import jwt from 'jsonwebtoken'
import { isAuth } from '../middleware/isAuth';
import bcrypt from 'bcryptjs'
const client = new OAuth2Client(envs.GOOGLE_CLIENT_ID);

export const auth = Router();

auth.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.send('Auth route is live...');
    } catch (err) {
        next(err);
    }
});

// Interfaz para el contenido del token
interface TokenPayload {
    userId: number;
}

// Autenticar al usuario en cada recarga
auth.get('/me', isAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. El ID ya viene inyectado gracias a isAuth
        const userId = req.userId;

        // 2. Buscamos al usuario en la base de datos para devolver su info actualizada
        const userQuery = await pool.query(
            'SELECT id, username, email, avatar FROM users WHERE id = $1',
            [userId]
        );

        const user = userQuery.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // 3. Respondemos con la data necesaria para el frontend
        res.status(200).json({
            user: {
                id: user.id,
                name: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (err) {
        next(err); // Tu errorHandler global
    }
});

// Función reutilizable para generar el JWT y setear la Cookie
export const sendTokenCookie = (res: Response, userId: number) => {
    const token = jwt.sign({ userId }, envs.JWT_SECRET, {
        expiresIn: '24h', // El token de Google dura 1h, pero el tuyo puede durar más
    });

    let sameSiteStatus = envs.NODE_ENV === 'production' ? 'none' as const : 'strict' as const

    const cookieOptions = {
        httpOnly: true,
        secure: envs.NODE_ENV === 'production',
        sameSite: sameSiteStatus,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
    };

    res.cookie('session_token', token, cookieOptions);
};

// SignUp
auth.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    // 1. Validación temprana
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        // 2. Verificar si ya existe (Pasamos [email] como array)
        const existUserQuery = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
        const existUser = existUserQuery.rows[0];

        // 3. Verificación segura: si existUser existe, es que el email ya está tomado
        if (existUser) {
            return res.status(400).json({ message: 'Este correo ya está registrado' });
        }

        // 4. Hasheamos la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Insertar usuario (Usando username como columna según tu esquema)
        const userQuery = await pool.query(
            `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, avatar`, 
            [name, email, hashedPassword]
        );
        
        const userData = userQuery.rows[0];

        // 6. Generar sesión inmediata
        sendTokenCookie(res, userData.id);

        // 7. Respuesta consistente con tu frontend
        res.status(201).json({ // 201 es para "Created"
            message: 'Usuario creado exitosamente',
            data: {
                user: {
                    id: userData.id,
                    name: userData.username,
                    email: userData.email,
                    avatar: userData.avatar || ''
                }
            }
        });

    } catch (err) {
        next(err);
    }
});

// Sign In
auth.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body; // 'username' puede ser el email o el nickname

    if (!username || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        // 1. Buscamos al usuario
        const result = await pool.query(
            `SELECT id, username, email, password, avatar FROM users WHERE email = $1 OR username = $1`, 
            [username]
        );
        
        const user = result.rows[0];

        // 2. Verificación: ¿Existe el usuario?
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 3. Verificación: ¿Contraseña manual o usuario de Google?
        // Si el usuario se creó con Google, podría no tener password
        if (!user.password) {
            return res.status(401).json({ message: 'Este usuario utiliza inicio de sesión con Google' });
        }

        // 4. Comparar contraseñas
        const matchPassword = await bcrypt.compare(password, user.password);

        if (!matchPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 5. Generar Cookie
        sendTokenCookie(res, user.id);

        // 6. Respuesta
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            data: {
                user: {
                    id: user.id,
                    name: user.username,
                    email: user.email,
                    avatar: user.avatar || ''
                }
            }
        });

    } catch (err) {
        next(err);
    }
});

auth.post('/google', async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;
    const tokenString = typeof token === 'string' ? token : token.token;
    console.log(tokenString);
    try {
        // A. Validar el token con Google
        const ticket = await client.verifyIdToken({
            idToken: tokenString,
            audience: envs.GOOGLE_CLIENT_ID as string,
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error('Invalid Google Token');

        const { email, name, picture, sub: googleId } = payload;

        // B. Lógica de Base de Datos (Buscar o Crear)
        // Intentamos buscar al usuario por email
        let userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userQuery.rows[0];

        if (!user) {
            // Si no existe, lo creamos
            const newUser = await pool.query(
                'INSERT INTO users (username, email, google_id, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, email, googleId, picture]
            );
            user = newUser.rows[0];
        }

        // C. Generar tu propio token y enviarlo en la cookie
        sendTokenCookie(res, user.id);

        res.status(200).json({
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.username, // Ojo: en tu INSERT usaste 'username'
                    email: user.email,
                    avatar: user.avatar
                }
            }
        });

    } catch (err) {
        next(err); // Tu errorHandler global se encargará
    }
});

// Logout
auth.post('/logout', isAuth, (req: Request, res: Response) => {
    // Es buena práctica usar las mismas opciones que en el login
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'strict' as const,
        path: '/',
        // domain: 'tudominio.com' // Descomenta si usas un dominio específico
    };

    res.clearCookie('session_token', cookieOptions);
    
    // Opcional: Forzar la expiración manualmente por si clearCookie falla
    /* res.cookie('session_token', '', { ...cookieOptions, expires: new Date(0) }); */

    res.status(200).json({ message: 'Logged out successfully' });
});
