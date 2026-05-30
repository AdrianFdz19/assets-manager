// isAuth.ts - Modificado para Multi-tenant

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { envs } from '../config/envs';

// 🏢 Extendemos el tipado nativo de Express para reflejar nuestro contexto seguro
declare global {
    namespace Express {
        interface Request {
            userId?: number;
            organizationId?: number; // 👈 Agregamos el ID de la organización al Request
        }
    }
}

// Interfaz para el contenido extendido del token
interface TokenPayload {
    userId: number;
    organizationId: number; // 👈 Ahora el JWT cargará este dato consigo
}

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
    // 1. Extraer la cookie (gracias a cookie-parser)
    const token = req.cookies.session_token; 

    if (!token) {
        return res.status(401).json({ message: 'No estás autenticado, falta el token' });
    }

    try {
        // 2. Verificar el token
        const decoded = jwt.verify(token, envs.JWT_SECRET) as TokenPayload;

        // 3. Inyectar el ID del usuario y de su Organización en la petición
        // Esto blinda por completo el backend contra suplantación de identidad
        req.userId = decoded.userId; 
        req.organizationId = decoded.organizationId; // 🔒 ¡Datos listos para los controladores!

        next(); // ¡Todo bien! Pasa al siguiente paso
    } catch (err) {
        // Si el token expiró o fue manipulado
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};