import { NextFunction, Request, Response, Router } from 'express'
import { pool } from '../config/databaseConfig';
import { isAuth } from '../middleware/isAuth';
import cloudinary from '../config/cloudinary';
import upload from '../services/multer';

export const assets = Router();

assets.get('/', isAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, categoryId, status, userId, page = 1, limit = 8 } = req.query;
        console.log(req.query);

        // 1. Calculamos offset
        const currentPage = Math.max(1, Number(page));
        const currentLimit = Math.max(1, Number(limit));
        const offset = (currentPage - 1) * currentLimit;

        // Base de la query y valores
        let whereClause = ` WHERE 1=1`;
        const values: any[] = [];

        // --- FILTROS (Mantenemos tu lógica sólida) ---
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

        // --- 2. CONSULTA DE TOTAL (COUNT) ---
        // Clonamos la lógica de filtros para saber el total real antes de paginar
        const countQuery = `SELECT COUNT(*) FROM assets ${whereClause}`;
        const countRes = await pool.query(countQuery, values);
        const totalItems = parseInt(countRes.rows[0].count);

        // --- 3. CONSULTA DE DATOS PAGINADOS ---
        // Añadimos LIMIT y OFFSET al final
        let dataQuery = `SELECT * FROM assets ${whereClause} ORDER BY created_at DESC`;

        // Añadimos parámetros para limit y offset
        values.push(currentLimit);
        dataQuery += ` LIMIT $${values.length}`;

        values.push(offset);
        dataQuery += ` OFFSET $${values.length}`;

        const response = await pool.query(dataQuery, values);

        // --- 4. RESPUESTA ESTRUCTURADA ---
        res.status(200).json({
            total: totalItems,         // Total para que el front calcule páginas
            page: currentPage,         // Página actual
            limit: currentLimit,       // Límite usado
            count: response.rowCount,  // Cuántos llegaron en este "chunk"
            data: response.rows        // Los assets
        });

    } catch (err) {
        next(err);
    }
});

assets.post('/', isAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            name,
            serial_number,
            status,
            value,
            purchase_date,
            category_id,
            user_id,
            image_url, // <--- Nuevo campo
            image_public_id // <--- Nuevo campo
        } = req.body;
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
                image_public_id
            ) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9 )
            RETURNING *
        `;
        const values = [
            name,
            serial_number,
            status,
            value,
            purchase_date,
            category_id,
            user_id,
            image_url || null,
            image_public_id || null
        ]
        const response = await pool.query(query, values);
        const data = response.rows[0];
        console.log(data);

        res.status(200)
            .json({
                message: '',
                data
            });
    } catch (err) {
        next(err);
    }
});

// Usamos /:id para que sea una ruta RESTful clara
assets.put('/:id', isAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // El ID viene de la URL
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
            WHERE id = $10
            RETURNING *;
        `;

        const values = [
            name,
            serial_number,
            status,
            value,
            purchase_date,
            category_id,
            user_id || null, // Permitir que sea null si no hay usuario asignado
            image_url || null,
            image_public_id || null,
            id // El décimo valor para el WHERE
        ];

        const response = await pool.query(query, values);

        if (response.rowCount === 0) {
            return res.status(404).json({ message: 'Asset no encontrado' });
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

assets.delete('/:id', isAuth, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
        // 1. Primero buscamos el asset para obtener el image_public_id
        const findQuery = `SELECT image_public_id FROM assets WHERE id = $1`;
        const findResult = await pool.query(findQuery, [id]);

        if (findResult.rowCount === 0) {
            return res.status(404).json({ message: 'Asset not found.' });
        }

        const publicId = findResult.rows[0].image_public_id;

        // 2. Borramos el registro de la base de datos
        const deleteQuery = `DELETE FROM assets WHERE id = $1`;
        await pool.query(deleteQuery, [id]);

        // 3. Si tiene una imagen en Cloudinary, la borramos
        // Hacemos esto DESPUÉS de borrar de la DB para asegurar que si falla la DB, no perdamos la imagen
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudErr) {
                // Logueamos el error pero no bloqueamos la respuesta al usuario
                console.error("Cloudinary Delete Error:", cloudErr);
            }
        }

        res.status(200).json({
            message: 'Asset and associated media deleted successfully.'
        });

    } catch (err) {
        next(err);
    }
});

assets.get('/dashboard-stats', isAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = `
            SELECT
                COALESCE(SUM(value), 0) AS total_value,
                COUNT(*) AS asset_count,
                COUNT(DISTINCT category_id) AS category_count,
                (
                    SELECT name 
                    FROM assets 
                    ORDER BY value DESC 
                    LIMIT 1
                ) AS top_asset_name
            FROM assets;
        `;

        const categoryGroupQuery = `
            SELECT 
                c.name as category_name, 
                COUNT(a.id) as total 
            FROM assets a
            JOIN categories c ON a.category_id = c.id
            GROUP BY c.name;
        `;

        const statusGroupQuery = `
            SELECT 
                status, 
                COUNT(*) as count 
            FROM assets 
            GROUP BY status;
        `;

        const [statsRes, categoryRes, statusRes] = await Promise.all([
            pool.query(query),
            pool.query(categoryGroupQuery),
            pool.query(statusGroupQuery)
        ]);

        const stats = statsRes.rows[0];

        res.json({
            total_value: parseFloat(stats.total_value),
            asset_count: parseInt(stats.asset_count),
            category_count: parseInt(stats.category_count),
            top_asset_name: stats.top_asset_name || 'N/A',
            category_distribution: categoryRes.rows,
            status_distribution: statusRes.rows
        });

    } catch (err) {
        next(err);
    }
});

assets.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
    try {
        // 1. Verificación de seguridad (Type Guard)
        // Gracias al declare global, TS ya sabe que req.file existe
        if (!req.file) {
            return res.status(400).json({ message: "No se proporcionó imagen" });
        }

        // 2. Convertir el buffer a Base64
        // req.file.buffer contiene los datos binarios en RAM
        const fileBase64 = req.file.buffer.toString('base64');

        // CORRECCIÓN: El mimetype sale de req.file, no de la variable fileBase64
        const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

        // 3. Subir a Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'assets-manager',
            transformation: [{ width: 500, height: 500, crop: 'limit' }]
        });

        // 4. Respuesta al Frontend
        res.status(200).json({
            success: true,
            url: result.secure_url, // Esta es la URL que guardarás en Postgres
            public_id: result.public_id
        });

    } catch (error) {
        console.error("Cloudinary Error:", error);
        res.status(500).json({
            success: false,
            message: "Error al subir la imagen a la nube"
        });
    }
});

