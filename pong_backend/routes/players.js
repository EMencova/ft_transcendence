async function playersRoutes(fastify, options) {
  // Example route - you can add players-specific routes here
  fastify.get('/players', async (request, reply) => {
    const db = fastify.sqliteDb;

    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, wins, losses FROM players', [], (err, rows) => {
        if (err) {
          console.log('DB fetch error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }
        resolve(reply.send({ players: rows }));
      });
    });
  });

  // Add other players-related endpoints here, but NOT /register or /login
}

module.exports = playersRoutes;
  

  

  
  