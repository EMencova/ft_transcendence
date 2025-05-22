require('dotenv').config();

const fastifyMysql = require('fastify-mysql');

function setupDb(fastify) {
  fastify.register(fastifyMysql, {
    promise: true,
    connectionString: `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`,
  });
}

module.exports = { setupDb };

