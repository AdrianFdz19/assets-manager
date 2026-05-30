import { Pool } from 'pg';
import { envs } from './envs';

// Configuración lineal y determinista para tu entorno Cloud de Desarrollo
const config = {
    user: envs.DATABASE_USER || 'postgres',
    database: envs.DATABASE_NAME,
    password: envs.DATABASE_PASSWORD,
    host: envs.DATABASE_HOST, // Endpoint directo inyectado por ECS Fargate
    port: 5432,
    // 🔒 Conexión segura obligatoria para AWS RDS
    ssl: {
        rejectUnauthorized: false
    }
};

export const pool = new Pool(config);

pool.on('connect', () => {
    console.log(`✅ Base de Datos conectada exitosamente en AWS RDS [Host: ${envs.DATABASE_HOST}]`);
});