function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function playersRoutes(fastify, options) {
  fastify.get('/players', async (request, reply) => {
    const db = fastify.sqliteDb;

    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, wins, losses FROM players', [], (err, rows) => {
        if (err) {
          console.log('DB fetch error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        // Sanitize usernames before sending
        const sanitizedPlayers = rows.map(player => ({
          ...player,
          username: escapeHtml(player.username)
        }));

        resolve(reply.send({ players: sanitizedPlayers }));
      });
    });
  });
}

module.exports = playersRoutes;

  

  

  
  