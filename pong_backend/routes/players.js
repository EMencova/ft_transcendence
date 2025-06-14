

const { sanitizeInput } = require('../sanitize');

async function playersRoutes(fastify, options) {
    
  fastify.get('/players', async (request, reply) => {
    const db = fastify.sqliteDb;

    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, wins, losses FROM players', [], (err, rows) => {
        if (err) {
          console.log('DB fetch error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }


        const safeRows = rows.map(player => ({
          ...player,
          username: sanitizeInput(player.username)
        }));

        resolve(reply.send({ players: safeRows }));
      });
    });
  });

  // Add other players-related endpoints here, but NOT /register or /login
}

module.exports = playersRoutes;


  

  
  