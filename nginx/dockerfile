# Etapa 1: construir el frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Etapa 2: imagen de producción
FROM nginx:latest

# Instalar openssl
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Crear carpeta para los certificados
RUN mkdir -p /etc/nginx/ssl

# Copiar configuración de nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar script de generación de certificados
COPY nginx/generate-cert.sh /docker-entrypoint.d/generate-cert.sh
RUN chmod +x /docker-entrypoint.d/generate-cert.sh

# ✅ Copiar archivos del frontend generado
COPY --from=builder /app/dist /usr/share/nginx/html
