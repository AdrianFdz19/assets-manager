import * as express from 'express';

import 'multer'; 

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      // Añadimos el tipo de Multer manualmente para evitar el error de Namespace
      file?: any; 
      files?: any;
    }
  }
}