import { Pool } from 'pg';
import { envs } from './envs';

let config;

// Si estás en producción real (AWS ECS Fargate), usamos las variables del entorno cloud
if (envs.NODE_ENV === 'production') {
    config = {
        user: envs.DATABASE_USER || 'postgres',
        database: envs.DATABASE_NAME,
        port: 5432,
        password: envs.DATABASE_PASSWORD,
        host: envs.DATABASE_HOST, // Aquí ECS inyectará el endpoint de RDS automáticamente
        /* ⚠️ Nota sobre SSL: AWS RDS por defecto soporta conexiones seguras. 
           Si tu contenedor Fargate está en la misma VPC privada que RDS, puedes omitir SSL.
           Si le pegas desde fuera, podrías necesitar activarlo como en Render.
        */
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // Configuración para TU PC (Desarrollo local)
    // Al usar envs.DATABASE_HOST, si en tu .env pones 'localhost', usará tu PC. 
    // Si pegas el host de AWS, ¡tu Express local le pegará directo a la nube!
    config = {
        user: 'postgres',
        database: envs.DATABASE_NAME,
        port: 5432,
        password: envs.DATABASE_PASSWORD,
        host: envs.DATABASE_HOST || 'localhost' 
    };
}

export const pool = new Pool(config);

pool.on('connect', () => {
    console.log(`✅ Base de Datos conectada en modo: ${envs.NODE_ENV}`);
});