import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { assets } from './routes/assetsRoutes';
import { categories } from './routes/categoriesRoutes';
import { auth as authRoute } from './routes/authRoutes';
import { users } from './routes/usersRoutes';
import { errorHandler } from './middleware/errorHandler';
import { envs } from './config/envs';
import { runProductionMigration } from './config/initDb'; // 🔒 Tu nuevo esquema multi-tenant unificado

const app: Application = express();

app.set('trust proxy', 1);
 
const PORT: number = parseInt(process.env.PORT || '4000', 10);

// Middlewares
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
app.get('/', (req: Request, res: Response) => {
    res.send('Asset Manager API con Typescript funcionando 🚀');
});

// Test client connection
app.get('/ping', (req: Request, res: Response) => {
    res.status(200).json({ message: 'pong' });
}); 

// 🚀 ARRANQUE ASÍNCRONO SEGURO (Bypassea redes externas desde la VPC de Fargate)
async function startServer() {
  try {
    // Ejecuta las migraciones estructurales, restricciones e índices en RDS si estamos en producción
    await runProductionMigration(); 

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Fallo crítico durante la secuencia de inicialización del ecosistema:', error);
    process.exit(1); // Detiene el contenedor de Fargate de inmediato para que ECS reporte el fallo
  }
}

startServer();

app.use(errorHandler);