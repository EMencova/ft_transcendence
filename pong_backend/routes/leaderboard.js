module.exports = async function (fastify, opts) {
  const db = fastify.sqliteDb;

  // Escape function to prevent XSS
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  fastify.get('/leaderboard', async (request, reply) => {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all(`
          SELECT leaderboard.*, players.username
          FROM leaderboard
          JOIN players ON leaderboard.player_id = players.id
          ORDER BY score DESC
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Escape user-generated fields (like username) to prevent XSS
      const escapedRows = rows.map(r => ({
        ...r,
        username: escapeHtml(r.username)
      }));

      reply.send(escapedRows);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      reply.code(500).send({ error: 'Database error' });
    }
  });
}

