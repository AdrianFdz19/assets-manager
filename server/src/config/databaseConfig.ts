import { Pool } from 'pg';
import { envs } from './envs';

let config;

if (envs.NODE_ENV === 'production') {
    // Configuración para RENDER (Producción)
    config = {
        connectionString: envs.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // Configuración para TU PC (Development)
    config = {
        user: 'postgres',
        database: envs.DATABASE_NAME,
        port: 5432,
        password: envs.DATABASE_PASSWORD,
        host: 'localhost'
    };
}

export const pool = new Pool(config);

pool.on('connect', () => {
    console.log(`✅ Base de Datos conectada en modo: ${envs.NODE_ENV}`);
});