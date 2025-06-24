function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// async function playersRoutes(fastify, options) {
//   fastify.get('/players', async (request, reply) => {
//     const db = fastify.sqliteDb;

//     return new Promise((resolve, reject) => {
//       db.all('SELECT id, username, wins, losses FROM players', [], (err, rows) => {
//         if (err) {
//           console.log('DB fetch error:', err.message);
//           return reject(reply.status(500).send({ error: 'Database error' }));
//         }

//         // Sanitize usernames before sending
//         const sanitizedPlayers = rows.map(player => ({
//           ...player,
//           username: escapeHtml(player.username)
//         }));

//         resolve(reply.send({ players: sanitizedPlayers }));
//       });
//     });
//   });
// }

// module.exports = playersRoutes;

  

  
// pong_backend/routes/players.js
async function playersRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Get all players
  fastify.get('/api/players', async (request, reply) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, avatar, wins, losses FROM players', [], (err, rows) => {
        if (err) return reject(reply.status(500).send({ error: 'DB error' }));
        resolve(reply.send(rows));
      });
    });
  });

  // Get a specific player
  fastify.get('/api/players/:id', async (request, reply) => {
    const playerId = parseInt(request.params.id);
    
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, avatar, wins, losses FROM players WHERE id = ?', [playerId], (err, row) => {
        if (err) return reject(reply.status(500).send({ error: 'DB error' }));
        if (!row) return reject(reply.status(404).send({ error: 'Player not found' }));
        resolve(reply.send(row));
      });
    });
  });
}

module.exports = playersRoutes;
  