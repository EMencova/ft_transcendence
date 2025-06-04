const Fastify = require('fastify');
const path = require('path');
const { setupDb } = require('./db');

const fastify = Fastify({
  logger: true,
});

setupDb(fastify);

// Import routes
const authRoutes = require('./routes/auth');
const playersRoutes = require('./routes/players');

fastify.register(authRoutes, { prefix: '/api' }); // Register auth routes with /api prefix
fastify.register(playersRoutes);

// // Serve frontend static files
// fastify.register(require('@fastify/static'), {
//   root: path.join(__dirname, '../frontend'),
//   prefix: '/', // serve at root URL
// });

// // Serve index.html on '/'
// fastify.get('/', (request, reply) => {
//   reply.sendFile('index.html'); // make sure frontend/index.html exists
// });

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening on ${fastify.server.address().port}`);
});






/*const Fastify = require('fastify');
const fastify = Fastify();
const bcrypt = require('bcrypt');
const path = require('path');
const { setupDb } = require('./db');


setupDb(fastify);


fastify.get('/players', async (request, reply) => {
  const db = fastify.sqliteDb;
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


fastify.post('/login', async (request, reply) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return reply.status(400).send({ error: 'Missing username or password' });
  }

  const db = fastify.sqliteDb;
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM players WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error(err);
        return reject(reply.status(500).send({ error: 'Database error' }));
      }
      if (!user) {
        return resolve(reply.status(401).send({ error: 'Invalid username or password' }));
      }

      // Compare password hash
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return resolve(reply.status(401).send({ error: 'Invalid username or password' }));
      }

      resolve(reply.send({ 
        message: 'Login successful', 
        username: user.username, 
        wins: user.wins,
        losses: user.losses
      }));
    });
  });
});

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
});*/









