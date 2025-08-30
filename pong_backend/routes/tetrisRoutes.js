function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function tetrisRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Add a new Tetris game history entry
  fastify.post('/tetris/history', async (request, reply) => {
    const player_id = parseInt(request.body.player_id, 10);
    const score = parseInt(request.body.score, 10);

    if (!player_id || score == null || isNaN(player_id) || isNaN(score)) {
      return reply.status(400).send({ error: 'Missing or invalid fields: player_id and score' });
    }

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO tetris_history (player_id, score)
        VALUES (?, ?)
      `);

      stmt.run(player_id, score, function (err) {
        if (err) {
          console.error('Insert tetris history error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        resolve(reply.send({ message: 'Tetris history added', id: this.lastID }));
      });
    });
  });

  // Get all Tetris game history for a player
  fastify.get('/tetris/history/:playerId', async (request, reply) => {
    const playerId = parseInt(request.params.playerId, 10);

    if (!playerId || isNaN(playerId)) {
      return reply.status(400).send({ error: 'Invalid player ID' });
    }

    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT id, score, game_date
        FROM tetris_history
        WHERE player_id = ?
        ORDER BY game_date DESC
        `,
        [playerId],
        (err, rows) => {
          if (err) {
            console.error('Fetch tetris history error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }

          // No user-generated strings here, but if you add any text fields later, escape them
          resolve(reply.send({ history: rows }));
        }
      );
    });
  });
}

module.exports = tetrisRoutes;

  
  