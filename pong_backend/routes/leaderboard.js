module.exports = async function (fastify, opts) {
  const db = fastify.sqliteDb;

  fastify.get('/api/leaderboard', async (request, reply) => {
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

      reply.send(rows);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      reply.code(500).send({ error: 'Database error' });
    }
  });
}