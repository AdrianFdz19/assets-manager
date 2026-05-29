import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { assets } from './routes/assetsRoutes';
import { errorHandler } from './middleware/errorHandler';
import { categories } from './routes/categoriesRoutes';
import { auth as authRoute } from './routes/authRoutes';
import cookieParser from 'cookie-parser';
import { users } from './routes/usersRoutes';
import { pool } from './config/databaseConfig';
import { envs } from './config/envs';

const app: Application = express();

app.set('trust proxy', 1);
 
const PORT: number = parseInt(process.env.PORT || '4000', 10);

// Midlewares

app.use(cors({
  origin: envs.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

// Rutas
app.use('/assets', assets);
app.use('/categories', categories);
app.use('/auth', authRoute);
app.use('/users', users);

// Ruta de prueba
app.get('/', ( req: Request, res: Response ) => {
    res.send('Asset Manager API con Typescript funcionando 🚀');
});

// Test client conection
app.get('/ping', (req: Request, res: Response) => {
    res.status(200)
        .json({ message: 'pong' });
}); 

// 1. Define el script de tus tablas tal y como lo tenías
const initDbScript = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL,
    google_id VARCHAR(255),
    avatar TEXT,
    password VARCHAR(255) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    purchase_date DATE,
    category_id INT REFERENCES categories(id),
    user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,
    image_public_id TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// 2. Ejecuta el script usando tu instancia de conexión (pool o client)
async function bootstrapDatabase() {
  try {
    // Asumiendo que importas tu 'pool' de base de datos
    await pool.query(initDbScript); 
    console.log('🚀 Esquema de Base de Datos verificado/creado con éxito');
  } catch (error) {
    console.error('❌ Error inicializando la base de datos desde Fargate:', error);
  }
}

// 3. Llama a la función antes del app.listen
bootstrapDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});

app.use(errorHandler);
