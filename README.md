# 📦 AssetFlow - Professional Asset Management System

AssetFlow es una solución de grado industrial para la gestión de inventarios, diseñada bajo la arquitectura **PERN** (PostgreSQL, Express, React, Node.js) y robustecida con **TypeScript** en todo su stack. El sistema permite un control granular de activos, categorización y análisis de datos en tiempo real.

> **Status:** 🚧 In Development - Dockerized & Live

---

## 🚀 Key Features

- **Advanced Authentication:** Sistema dual de autenticación mediante Google OAuth 2.0 y credenciales tradicionales (Email/Password) protegidas con **BcryptJS**.
- **Security First:** Gestión de sesiones mediante **HTTP-Only Cookies** y **JSON Web Tokens (JWT)** para mitigar ataques XSS.
- **Cloud Multimedia:** Integración con **Cloudinary API** para la gestión de imágenes. El servidor procesa archivos en memoria (**Multer Memory Storage**) para optimizar la velocidad y seguridad.
- **Professional Dashboard:** Interfaz analítica para visualización de KPIs (Valor total del inventario, conteo de activos y categorías).
- **Responsive UI:** Maquetación moderna con **Tailwind CSS**, diseñada para alta legibilidad y modo claro profesional.

---

## 🛠 Tech Stack

### Frontend
- **React 18** (TypeScript)
- **Redux Toolkit & RTK Query** (Gestión de estado global y caché de API)
- **Tailwind CSS** (Styling)
- **React Router 6** (Navegación)

### Backend
- **Node.js & Express 5** (TypeScript)
- **PostgreSQL** (Database)
- **Multer** (Procesamiento de archivos)
- **Docker** (Contenerización y orquestación)

---

## 🐳 DevOps & Deployment

Este proyecto utiliza **Docker** para garantizar la consistencia entre entornos de desarrollo y producción, eliminando el clásico problema de "funciona en mi máquina".

- **Containerization:** Configuración de `Dockerfile` optimizada para aplicaciones Node/TypeScript.
- **Deployment:** Desplegado en **Render.com** mediante contenedores, asegurando un entorno inmutable y escalable.
- **Clean Architecture:** Separación clara entre lógica de negocio, rutas y controladores.

---

## 🏗 Setup & Installation

1. **Clone the repository:**
```bash
git clone [https://github.com/AdrianFdz19/asset-management-system.git](https://github.com/AdrianFdz19/asset-management-system.git)
```
2. **Environment Variables:** Configura un archivo .env en la carpeta /server con:

- DATABASE_URL
- JWT_SECRET
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- GOOGLE_CLIENT_ID

2. **Run with Docker:** 

```bash
docker build -t assetflow-server ./server
docker run -p 10000:10000 assetflow-server
```

---

## 📈 Roadmap
- [ ] Implementación de SQL Avanzado (CTEs & Window Functions) para reportes detallados.
- [ ] Exportación de reportes en PDF/Excel.
- [ ] Sistema de alertas para activos con bajo stock o mantenimiento pendiente.

---

Desarrollado con ❤️ por Adrian
