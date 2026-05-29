import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { envs } from '../config/envs';

// 1. Inicializar el cliente modular v3 de AWS S3
export const s3 = new S3Client({ 
  region: "us-east-1" 
});

// 2. Configurar Multer acoplado directamente a S3
const upload = multer({ 
  storage: multerS3({
    s3: s3,
    bucket: envs.AWS_S3_BUCKET_NAME || '', // Ej: "assetflow-development-media-farf"
    // ❌ BORRA O COMENTA ESTA LÍNEA:
    // acl: 'public-read',
    /* acl: 'public-read', */
    contentType: multerS3.AUTO_CONTENT_TYPE, // Evita que el navegador descargue el archivo en vez de renderizarlo
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Reemplaza la lógica de carpetas de Cloudinary estructurando el nombre del objeto
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      const extension = file.originalname.split('.').pop();
      cb(null, `assets/${uniqueSuffix}.${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Mantenemos tu límite de seguridad de 5MB
});

export default upload;