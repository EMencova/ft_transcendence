const Fastify = require('fastify');
const path = require('path');
const { setupDb } = require('./db');

const fastify = Fastify({
  logger: true,
});

// Register WebSocket support
fastify.register(require('@fastify/websocket'));

setupDb(fastify);

// Import routes
const authRoutes = require('./routes/auth');
const playersRoutes = require('./routes/players');
const matchmakingRoutes = require('./routes/tetrisMatchmakingRoutes');

fastify.register(require('./routes/friendsRoutes'), { prefix: '/api' });
fastify.register(require('./routes/leaderboard'), { prefix: '/api' });
fastify.register(require('./routes/tournament_registr'), { prefix: '/api' });
fastify.register(require('./routes/userProfile'), { prefix: '/api' });
fastify.register(require('./routes/tournamentsRoutes'), { prefix: '/api' });
const tetrisRoutes = require('./routes/tetrisRoutes');
fastify.register(tetrisRoutes, { prefix: '/api' });
fastify.register(matchmakingRoutes, { prefix: '/api/matchmaking' });


// Serve avatars from public/avatars directory
const avatarDir = path.join(__dirname, 'public/avatars');
fastify.register(require('@fastify/static'), {
  root: avatarDir,
  prefix: '/avatars/',
});

fastify.register(authRoutes, { prefix: '/api' }); // Register auth routes with /api prefix
fastify.register(playersRoutes, { prefix: '/api' });

// WebSocket for real-time matchmaking
const connectedClients = new Map(); // userId -> socket connection

fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    connection.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'register':
            connectedClients.set(data.userId, connection);
            console.log(`User ${data.userId} connected to WebSocket`);
            break;
            
          case 'disconnect':
            connectedClients.delete(data.userId);
            console.log(`User ${data.userId} disconnected from WebSocket`);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    connection.on('close', () => {
      // Remove client from all connections
      for (let [userId, socket] of connectedClients) {
        if (socket === connection) {
          connectedClients.delete(userId);
          break;
        }
      }
    });
  });
});

// Make WebSocket clients available globally for matchmaking routes
global.connectedClients = connectedClients;


fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening on ${fastify.server.address().port}`);
});



