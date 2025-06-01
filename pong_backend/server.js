const Fastify = require('fastify');
const fastify = Fastify();
const bcrypt = require('bcrypt');
const db = require('./db'); // SQLite instance
const path = require('path');

// Example route to get all players
fastify.get('/players', async (request, reply) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM players', (err, rows) => {
      if (err) {
        reject(reply.code(500).send({ error: 'DB query failed' }));
      } else {
        resolve(rows);
      }
    });
  });
});

// --- Add login route ---
fastify.post('/login', async (request, reply) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return reply.status(400).send({ error: 'Missing username or password' });
  }

  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error(err);
        return reject(reply.status(500).send({ error: 'Database error' }));
      }
      if (!user) {
        return resolve(reply.status(401).send({ error: 'Invalid username or password' }));
      }

      // Compare password hash
      const match = await bcrypt.compare(password, user.hashed_password);
      if (!match) {
        return resolve(reply.status(401).send({ error: 'Invalid username or password' }));
      }

      // Success - return username and score
      resolve(reply.send({ 
        message: 'Login successful', 
        username: user.username, 
        score: user.score 
      }));
    });
  });
});
// --- end login route ---

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../frontend'),
  prefix: '/', // http://localhost:3000 loads index.html
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});





