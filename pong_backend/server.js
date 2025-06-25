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


fastify.register(require('./routes/friendsRoutes'));
fastify.register(require('./routes/leaderboard'));
fastify.register(require('./routes/tournament_registr'));
const tetrisRoutes = require('./routes/tetrisRoutes');
fastify.register(tetrisRoutes);


// Serve avatars from public/avatars directory
const avatarDir = path.join(__dirname, 'public/avatars');
fastify.register(require('@fastify/static'), {
  root: avatarDir,
  prefix: '/avatars/',
});

fastify.register(authRoutes, { prefix: '/api' }); // Register auth routes with /api prefix
fastify.register(playersRoutes);

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening on ${fastify.server.address().port}`);
});



