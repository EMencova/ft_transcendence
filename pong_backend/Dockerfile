# Use official Node.js image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies (including dotenv)
RUN npm install

# Copy rest of the app files
COPY . .

# Expose port 3000 (Fastify default)
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]


