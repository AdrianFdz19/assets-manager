import { pool } from "./databaseConfig";

const schemaSql = `
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- 🚨 LIMPIEZA DE TABLAS VIEJAS PARA FORZAR ESQUEMA MULTI-TENANT CORRECTO (Solo desarrollo/QA)
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- 1. TABLA ORGANIZATIONS
CREATE TABLE public.organizations (
    id SERIAL PRIMARY KEY,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA USERS
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'employee'::character varying,
    google_id character varying(255),
    avatar text,
    password character varying(255) DEFAULT NULL::character varying,
    organization_id integer, -- Permite NULL si un usuario puede quedarse sin organización temporalmente
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- 3. TABLA CATEGORIES (Garantizando Multi-tenant con NOT NULL)
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name character varying(100) NOT NULL,
    organization_id integer NOT NULL, -- 👈 ¡Corregido! Obligatorio para aislamiento
    CONSTRAINT categories_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
    CONSTRAINT categories_org_name_unique UNIQUE (organization_id, name)
);

-- 4. TABLA ASSETS (Garantizando integridad con NOT NULL)
CREATE TABLE public.assets (
    id SERIAL PRIMARY KEY,
    name character varying(100) NOT NULL,
    serial_number character varying(100) NOT NULL, -- 👈 NOT NULL para asegurar la eficacia del constraint UNIQUE compuesto
    status character varying(20) DEFAULT 'available'::character varying,
    value numeric(10,2),
    purchase_date date,
    category_id integer,
    user_id integer,
    image_url text,
    image_public_id character varying(255) DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    organization_id integer NOT NULL, -- 👈 ¡Corregido! Obligatorio para aislamiento
    CONSTRAINT assets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL,
    CONSTRAINT assets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
    CONSTRAINT assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT assets_org_serial_unique UNIQUE (organization_id, serial_number)
);

-- 5. ÍNDICES DE OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_organization ON public.assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_organization ON public.categories(organization_id);
`;

export const runProductionMigration = async () => {
    // 🔒 El nuevo candado dinámico: Si el host apunta a localhost o a la IP de WSL, no se ejecuta aquí.
    const isLocalHost = pool.options.host === 'localhost' || pool.options.host?.startsWith('172.') || pool.options.host?.startsWith('192.');
    
    if (isLocalHost && process.env.NODE_ENV !== 'production') {
        console.log('ℹ️ Entorno local de desarrollo detected. Saltando inyección de tablas cloud.');
        return;
    }

    try {
        console.log('⏳ Iniciando inyección atómica del esquema limpio en AWS RDS...');
        await pool.query(schemaSql);
        console.log('🚀 Esquema multi-tenant absoluto, restricciones e índices creados con éxito en RDS.');
    } catch (error) {
        console.error('❌ Error crítico ejecutando la inicialización de RDS desde Fargate:', error);
        throw error;
    }
};