import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { assets } from './routes/assetsRoutes';
import { errorHandler } from './middleware/errorHandler';
import { categories } from './routes/categoriesRoutes';
import { auth as authRoute } from './routes/authRoutes';
import cookieParser from 'cookie-parser';
import { users } from './routes/usersRoutes';

const app: Application = express();
 
const PORT: number = parseInt(process.env.PORT || '4000', 10);

// Midlewares

const whiteList = ['http://localhost:5173', 'https://assets-system-manager-app.netlify.app', 'https://feature-migration-to-aws.dw69k3m3yca8o.amplifyapp.com'];

app.use(cors({
  origin: function (origin, callback) {
    // Si el origen está en la lista o es undefined (ej. Postman)
    if (!origin || whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Error de CORS: Origen no permitido'));
    }
  },
  credentials: true
}));

app.use((req, res, next) => {
  // Esto le dice al navegador: "Confío en los popups que yo mismo abro"
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

app.use(errorHandler);
