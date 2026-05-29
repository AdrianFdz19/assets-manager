import rateLimit from 'express-rate-limit';

// 1. Limiter general para proteger endpoints de consulta común (Assets, Categories)
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Ventana de tiempo: 15 minutos
    max: 100, // Máximo 100 peticiones por IP dentro de los 15 minutos
    standardHeaders: true, // Retorna información del límite en los headers 'RateLimit-*'
    legacyHeaders: false, // Desactiva los headers viejos 'X-RateLimit-*'
    message: {
        message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
    }
});

// 2. Limiter estricto para operaciones delicadas o costosas (Auth, Subida de imágenes)
export const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // Ventana de tiempo: 1 hora
    max: 15, // Máximo 15 peticiones por IP por hora (Fuerza bruta / Spam de archivos)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Límite de intentos excedido para esta acción. Intenta de nuevo en una hora.'
    }
});