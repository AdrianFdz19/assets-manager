import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { envs } from '../config/envs';

// Interfaz para el contenido del token
interface TokenPayload {
    userId: number;
}

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
    // 1. Extraer la cookie (gracias a cookie-parser)
    const token = req.cookies.session_token; // El nombre que le pusimos en res.cookie
    console.log(token);

    if (!token) {
        return res.status(401).json({ message: 'No estás autenticado, falta el token' });
    }

    try {
        // 2. Verificar el token
        const decoded = jwt.verify(token, envs.JWT_SECRET) as TokenPayload;

        // 3. Inyectar el ID del usuario en la petición
        // Esto permite que el siguiente controlador sepa quién es el dueño del asset
        req.userId = decoded.userId; 

        next(); // ¡Todo bien! Pasa al siguiente paso
    } catch (err) {
        // Si el token expiró o fue manipulado
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};