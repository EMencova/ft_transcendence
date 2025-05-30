# Etapa 1: build (opcional si no transpilas)
FROM node:20-alpine

# Crear el directorio de trabajo
WORKDIR ./

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos del backend
COPY . .

# Exponer el puerto de Fastify (por defecto suele ser 3000)
EXPOSE 3000

# Comando para iniciar Fastify
CMD ["node", "server.js"]