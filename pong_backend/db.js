require('dotenv').config();
const bcrypt = require('bcrypt');


const fastifyMysql = require('fastify-mysql');

function setupDb(fastify) {
  fastify.register(fastifyMysql, {
    promise: true,
    connectionString: `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`,
  });
}

module.exports = { setupDb };

async function createUser(db, username, plainPassword) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
  try {
    await db.query(sql, [username, hashedPassword]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  createUser,
  // other functions...
};

