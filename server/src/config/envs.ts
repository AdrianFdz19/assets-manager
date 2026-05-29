import dotenv from 'dotenv';

dotenv.config();

export const envs = {
    PORT: process.env.PORT || 4000,
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_URL: process.env.CLIENT_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD
};

console.log(envs.GOOGLE_CLIENT_ID);

// Validación opcional (Muy pro para tu portafolio)
if (!envs.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in .env file');
}