FROM node:20

WORKDIR /app

# Install SQLite support
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]