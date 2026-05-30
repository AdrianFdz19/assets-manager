// Assets Routes - assetsRoutes.ts
import { NextFunction, Request, Response, Router } from 'express'
import { pool } from '../config/databaseConfig';
import { isAuth } from '../middleware/isAuth';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import upload, { s3 } from '../services/multer';
import { envs } from '../config/envs';
import { globalLimiter, strictLimiter } from '../middleware/rateLimiter';

export const assets = Router();

assets.get('/', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extraemos de forma segura la organización inyectada por isAuth
        const organizationId = req.organizationId;

        // Si por alguna razón extraña no hay organización en el token, bloqueamos temprano
        if (!organizationId) {
            return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
        }

        // Extraemos los filtros normales (eliminamos el organizationId del query si el front lo mandaba)
        const { search, categoryId, status, userId, page = 1, limit = 8 } = req.query;
        console.log('Query recibida:', req.query);
        console.log('Organización del usuario:', organizationId);

        // 2. Calculamos offset
        const currentPage = Math.max(1, Number(page));
        const currentLimit = Math.max(1, Number(limit));
        const offset = (currentPage - 1) * currentLimit;

        // 🔒 LA CLAVE: El primer valor ($1) SIEMPRE será el organization_id corporativo
        const values: any[] = [organizationId];
        let whereClause = ` WHERE organization_id = $1`;

        // --- FILTROS DINÁMICOS (Manteniendo tu excelente lógica secuencial) ---
        
        // Filtro opcional por si quieren ver los assets asignados a un usuario específico de la empresa
        if (userId) {
            values.push(userId);
            whereClause += ` AND user_id = $${values.length}`;
        }

        if (search && typeof search === 'string' && search.trim() !== '') {
            values.push(`%${search.trim()}%`);
            whereClause += ` AND (name ILIKE $${values.length} OR serial_number ILIKE $${values.length})`;
        }

        if (categoryId && categoryId !== '' && categoryId !== 'undefined') {
            values.push(categoryId);
            whereClause += ` AND category_id = $${values.length}`;
        }

        if (status && status !== 'all' && status !== '' && status !== 'undefined') {
            values.push(status);
            whereClause += ` AND status = $${values.length}`;
        }

        // --- 3. CONSULTA DE TOTAL (COUNT) ---
        // Contamos únicamente los items que pertenecen a ESTA organización específica
        const countQuery = `SELECT COUNT(*) FROM assets ${whereClause}`;
        const countRes = await pool.query(countQuery, values);
        const totalItems = parseInt(countRes.rows[0].count, 10);

        // --- 4. CONSULTA DE DATOS PAGINADOS ---
        let dataQuery = `SELECT * FROM assets ${whereClause} ORDER BY created_at DESC`;

        // Añadimos parámetros para limit y offset dinámicamente al array
        values.push(currentLimit);
        dataQuery += ` LIMIT $${values.length}`;

        values.push(offset);
        dataQuery += ` OFFSET $${values.length}`;

        const response = await pool.query(dataQuery, values);

        // --- 5. RESPUESTA ESTRUCTURADA ---
        res.status(200).json({
            total: totalItems,         // Total de la empresa para la paginación
            page: currentPage,         // Página actual
            limit: currentLimit,       // Límite usado
            count: response.rowCount,  // Cuántos llegaron en este bloque
            data: response.rows        // Los assets aislados de forma segura
        });

    } catch (err) {
        next(err);
    }
});

assets.post('/', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extraemos el ID de la organización blindado desde el token de sesión
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
        }

        const {
            name,
            serial_number,
            status,
            value,
            purchase_date,
            category_id,
            user_id,
            image_url, 
            image_public_id 
        } = req.body;

        // Validación básica obligatoria en el backend
        if (!name || !status) {
            return res.status(400).json({ message: 'El nombre y el estado del asset son obligatorios.' });
        }

        // 2. Añadimos 'organization_id' tanto a las columnas del INSERT como al bloque de VALUES ($10)
        const query = `
            INSERT INTO assets
            (
                name, 
                serial_number,
                status,
                value,
                purchase_date,
                category_id,
                user_id,
                image_url,
                image_public_id,
                organization_id -- 👈 Columna relacional multi-tenant obligatoria
            ) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10 )
            RETURNING *
        `;

        // 3. Mapeamos los valores de forma secuencial asegurándonos de colocar organizationId al final ($10)
        const values = [
            name.trim(),
            serial_number ? serial_number.trim() : null,
            status,
            value ? Number(value) : 0,
            purchase_date || null,
            category_id ? Number(category_id) : null,
            user_id ? Number(user_id) : null, // El usuario asignado dentro de la organización
            image_url || null,
            image_public_id || null,
            organizationId // 🔒 Forzado desde el backend
        ];

        const response = await pool.query(query, values);
        const data = response.rows[0];
        console.log('Asset guardado exitosamente:', data);

        // 4. Respuesta estructurada consistente
        res.status(201).json({ // Cambiado a 201 por semántica HTTP (Resource Created)
            message: 'Asset registrado exitosamente',
            data
        });

    } catch (err) {
        next(err);
    }
});

// Usamos /:id para que sea una ruta RESTful clara
assets.put('/:id', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // El ID del asset viene de la URL
        const organizationId = req.organizationId; // 🔒 Extraído de forma segura por isAuth

        if (!organizationId) {
            return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
        }

        const {
            name,
            serial_number,
            status,
            value,
            purchase_date,
            category_id,
            user_id,
            image_url,
            image_public_id
        } = req.body;

        // 1. Sanitización del serial_number para evitar romper el nuevo índice compuesto
        const cleanSerialNumber = (serial_number && serial_number.trim() !== '') 
            ? serial_number.trim() 
            : null;

        // 2. LA CLAVE: El WHERE ahora exige que coincidan tanto el ID del asset como el de la organización
        const query = `
            UPDATE assets
            SET 
                name = $1, 
                serial_number = $2,
                status = $3,
                value = $4,
                purchase_date = $5,
                category_id = $6,
                user_id = $7,
                image_url = $8,
                image_public_id = $9
            WHERE id = $10 AND organization_id = $11 -- 🔒 Aislamiento multi-tenant estricto
            RETURNING *;
        `;

        const values = [
            name.trim(),
            cleanSerialNumber, // Usamos el serial sanitizado
            status,
            value ? Number(value) : 0,
            purchase_date || null,
            category_id ? Number(category_id) : null,
            user_id ? Number(user_id) : null,
            image_url || null,
            image_public_id || null,
            id,              // $10
            organizationId   // $11
        ];

        const response = await pool.query(query, values);

        // 3. Si rowCount es 0, puede significar dos cosas: el asset no existe O existe pero es de otra organización.
        // Por seguridad, respondemos con un genérico 404 para no dar pistas de qué IDs existen.
        if (response.rowCount === 0) {
            return res.status(404).json({ message: 'Asset no encontrado en este Workspace.' });
        }

        const data = response.rows[0];

        res.status(200).json({
            message: 'Asset actualizado correctamente',
            data
        });
    } catch (err) {
        next(err);
    }
});

assets.delete('/:id', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const organizationId = req.organizationId; // 🔒 Inyectado de forma segura por isAuth

    if (!organizationId) {
        return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
    }

    try {
        // 1. Buscamos el asset asegurando que pertenezca a la organización actual
        const findQuery = `SELECT image_public_id FROM assets WHERE id = $1 AND organization_id = $2`; 
        const findResult = await pool.query(findQuery, [id, organizationId]);

        // Si rowCount es 0, el asset no existe o pertenece a otro workspace. Retornamos 404 genérico.
        if (findResult.rowCount === 0) {
            return res.status(404).json({ message: 'Asset not found.' });
        }

        const s3Key = findResult.rows[0].image_public_id;

        // 2. Borramos el registro restringiendo la acción al mismo Workspace
        const deleteQuery = `DELETE FROM assets WHERE id = $1 AND organization_id = $2`;
        await pool.query(deleteQuery, [id, organizationId]);

        // 3. Estrategia de resiliencia con AWS S3 SDK v3 intacta
        if (s3Key) {
            try {
                const deleteParams = {
                    Bucket: envs.AWS_S3_BUCKET_NAME || '',
                    Key: s3Key 
                };

                await s3.send(new DeleteObjectCommand(deleteParams));
                console.log(`🗑️ Objeto S3 eliminado con éxito: ${s3Key}`);
                
            } catch (s3Err) {
                console.error("AWS S3 Delete Object Error:", s3Err);
            }
        }

        res.status(200).json({
            message: 'Asset and associated cloud media deleted successfully.'
        });

    } catch (err) {
        next(err);
    }
});

assets.get('/dashboard-stats', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.organizationId; // 🔒 Inyectado de forma segura por isAuth

    if (!organizationId) {
        return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
    }

    try {
        // Query 1: Estadísticas generales e identificación del Top Asset (Filtrado por org)
        const query = `
            SELECT
                COALESCE(SUM(value), 0) AS total_value,
                COUNT(*) AS asset_count,
                COUNT(DISTINCT category_id) AS category_count,
                (
                    SELECT name 
                    FROM assets 
                    WHERE organization_id = $1 -- 🔒 Filtro en la subquery interna
                    ORDER BY value DESC 
                    LIMIT 1
                ) AS top_asset_name
            FROM assets
            WHERE organization_id = $1; -- 🔒 Filtro en la query principal
        `;

        // Query 2: Distribución por categorías (Solo mapea assets del tenant actual)
        const categoryGroupQuery = `
            SELECT 
                c.name as category_name, 
                COUNT(a.id) as total 
            FROM assets a
            JOIN categories c ON a.category_id = c.id
            WHERE a.organization_id = $1 -- 🔒 Filtro antes del agrupamiento
            GROUP BY c.name;
        `;

        // Query 3: Distribución por estado físico/operacional
        const statusGroupQuery = `
            SELECT 
                status, 
                COUNT(*) as count 
            FROM assets 
            WHERE organization_id = $1 -- 🔒 Filtro antes del agrupamiento
            GROUP BY status;
        `;

        // Ejecución en paralelo pasando de forma atómica el organizationId a cada vector de parámetros
        const [statsRes, categoryRes, statusRes] = await Promise.all([
            pool.query(query, [organizationId]),
            pool.query(categoryGroupQuery, [organizationId]),
            pool.query(statusGroupQuery, [organizationId])
        ]);

        const stats = statsRes.rows[0];

        res.json({
            total_value: parseFloat(stats.total_value),
            asset_count: parseInt(stats.asset_count, 10),
            category_count: parseInt(stats.category_count, 10),
            top_asset_name: stats.top_asset_name || 'N/A',
            category_distribution: categoryRes.rows,
            status_distribution: statusRes.rows
        });

    } catch (err) {
        next(err);
    }
});

// 🛡️ Creamos una interfaz extendida para que TypeScript reconozca las propiedades que inyecta MulterS3
interface MulterS3File extends Express.Multer.File {
    location: string;
    key: string;
    bucket: string;
}

assets.post('/upload', isAuth, strictLimiter, upload.single('image'), async (req: Request, res: Response) => {
    try {
        // 1. Verificación de contexto Multi-tenant corporativo
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. No se identificó un Workspace válido.' 
            });
        }

        // 2. Verificación de seguridad tradicional (Type Guard)
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "No se proporcionó imagen" 
            });
        }

        // 3. Casteamos req.file con nuestra interfaz para tener autocompletado y tipado estricto de AWS
        const s3File = req.file as MulterS3File;

        // 4. Respuesta consistente al Frontend
        // Mantenemos EXACTAMENTE el mismo contrato para RTK Query en el frontend
        res.status(200).json({
            success: true,
            url: s3File.location,   // La URL pública de Amazon S3 que se guardará en tu Postgres
            public_id: s3File.key   // El identificador único del objeto (la ruta interna del bucket)
        });

    } catch (error) {
        console.error("AWS S3 Upload Error:", error);
        res.status(500).json({
            success: false,
            message: "Error al subir la imagen a la nube"
        });
    }
});

