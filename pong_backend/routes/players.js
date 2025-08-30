function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function playersRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Get all players
  fastify.get('/api/players', async (request, reply) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, username, avatar, wins, losses FROM players',
        [],
        (err, rows) => {
          if (err) {
            console.error('DB fetch error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }

          // Sanitize user-generated fields
          const sanitizedRows = rows.map(player => ({
            ...player,
            username: escapeHtml(player.username),
            avatar: escapeHtml(player.avatar)
          }));

          resolve(reply.send(sanitizedRows));
        }
      );
    });
  });

  // Get a specific player
  fastify.get('/api/players/:id', async (request, reply) => {
    const playerId = parseInt(request.params.id);

    if (isNaN(playerId)) {
      return reply.status(400).send({ error: 'Invalid player ID' });
    }

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, avatar, wins, losses FROM players WHERE id = ?',
        [playerId],
        (err, row) => {
          if (err) {
            console.error('DB fetch error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }
          if (!row) return reject(reply.status(404).send({ error: 'Player not found' }));

          // Sanitize user-generated fields
          row.username = escapeHtml(row.username);
          row.avatar = escapeHtml(row.avatar);

          resolve(reply.send(row));
        }
      );
    });
  });
}

module.exports = playersRoutes;

  