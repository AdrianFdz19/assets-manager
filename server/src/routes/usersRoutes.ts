import { NextFunction, Request, Response, Router } from 'express';
import { pool } from '../config/databaseConfig';
import { globalLimiter } from '../middleware/rateLimiter';
import { isAuth } from '../middleware/isAuth'; // 🔒 Middleware esencial de autenticación

export const users = Router();

// Colocamos isAuth al inicio para interceptar payloads corruptos o sin token inmediatamente
users.get('/', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extraemos el ID del Workspace del contexto de sesión seguro
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
        }

        // 2. LA CLAVE: Filtramos los usuarios forzando la coincidencia con organization_id
        const query = `
            SELECT id, username AS name, email, role, avatar 
            FROM users 
            WHERE organization_id = $1
            ORDER BY username ASC;
        `;
        
        const response = await pool.query(query, [organizationId]);
        const data = response.rows;

        // 3. Respuesta consistente para el frontend (RTK Query absorberá esto limpiamente)
        res.status(200).json({
            message: '',
            data
        });
    } catch (err) {
        next(err);
    }
});