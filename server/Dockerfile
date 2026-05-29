# 1. Usamos Node 20
FROM node:20-alpine

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiamos archivos de dependencias
COPY package*.json ./

# 4. Instalamos TODAS las dependencias (incluyendo TypeScript para el build)
RUN npm install --legacy-peer-deps

# 5. Copiamos el resto del código
COPY . .

# 6. Compilamos el código (Esto genera la carpeta dist/)
RUN npm run build

# 7. Variable de entorno para el puerto
ENV PORT=10000
EXPOSE 10000

# 8. Comando de arranque
# Usamos el script "start" de tu package.json
CMD ["npm", "start"]