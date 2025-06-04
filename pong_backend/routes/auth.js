const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

async function authRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Helper: wrap db.run with Promise
  function runQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  // Helper: wrap db.get with Promise
  function getQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  fastify.post('/register', async (request, reply) => {
    const { username, email, password, avatar} = request.body;

    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'Missing fields' });
    }

    try {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const query = `INSERT INTO players (username, email, password, wins, losses, avatar)
                     VALUES (?, ?, ?, 0, 0, ?)`;

      await runQuery(query, [username, email, hashedPassword, avatar || 'avatar.png']);

      reply.send({ success: true, username });
    } catch (err) {
      console.error('Register error:', err.message);
      // Handle unique constraint violation (username/email taken)
      if (err.message.includes('UNIQUE constraint failed')) {
        return reply.status(400).send({ error: 'Username or email already exists' });
      }
      reply.status(500).send({ error: 'Registration failed' });
    }
  });

  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: 'Missing credentials' });
    }

    try {
      const row = await getQuery(`SELECT * FROM players WHERE username = ?`, [username]);

      if (!row) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Compare password hashes
      const passwordMatch = await bcrypt.compare(password, row.password);
      if (!passwordMatch) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      reply.send({ success: true, userId: row.id, username: row.username });
    } catch (err) {
      console.error('Login error:', err.message);
      reply.status(500).send({ error: 'Login failed' });
    }
  });
}

module.exports = authRoutes;

  
  

