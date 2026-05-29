import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("🔥 Error detectado:", err.message || err);

    // Si el error viene de Postgres (ej. llave duplicada o campo nulo)
    if (err.code === '23505') { // Código de unique_violation
        return res.status(400).json({
            message: 'El número de serie ya existe en el sistema.'
        });
    }

    if (err.code === '23502') { // Not null violation
        return res.status(400).json({
            message: 'Faltan campos obligatorios en el formulario.'
        });
    }

    // Error genérico para el cliente
    res.status(err.status || 500).json({
        message: err.message || 'Ocurrió un error inesperado en el servidor'
    });
};