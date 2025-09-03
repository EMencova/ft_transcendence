async function tetrisRoutes(fastify, options) {
    const db = fastify.sqliteDb;
  
    // Add a new Tetris game history entry
    fastify.post('/tetris/history', async (request, reply) => {
      const { player_id, score, level, lines_cleared } = request.body;
  
      if (!player_id || score == null) {
        return reply.status(400).send({ error: 'Missing required fields: player_id and score' });
      }
  
      return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
          INSERT INTO tetris_history (player_id, score, level, lines_cleared)
          VALUES (?, ?, ?, ?)
        `);
  
        stmt.run(player_id, score, level || 1, lines_cleared || 0, function (err) {
          if (err) {
            console.error('Insert tetris history error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }
  
          resolve(reply.send({ 
            message: 'Tetris history added', 
            id: this.lastID,
            score: score,
            level: level || 1,
            lines_cleared: lines_cleared || 0
          }));
        });
      });
    });
  
    // Get all Tetris game history for a player
    fastify.get('/tetris/history/:playerId', async (request, reply) => {
      const playerId = parseInt(request.params.playerId, 10);
  
      if (!playerId) {
        return reply.status(400).send({ error: 'Invalid player ID' });
      }
  
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT id, score, level, lines_cleared, game_date
          FROM tetris_history
          WHERE player_id = ?
          ORDER BY game_date DESC
        `, [playerId], (err, rows) => {
          if (err) {
            console.error('Fetch tetris history error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }
  
          resolve(reply.send({ history: rows }));
        });
      });
    });

    // Get Tetris statistics for a player
    fastify.get('/tetris/stats/:playerId', async (request, reply) => {
      const playerId = parseInt(request.params.playerId, 10);
  
      if (!playerId) {
        return reply.status(400).send({ error: 'Invalid player ID' });
      }
  
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            COUNT(*) as total_games,
            MAX(score) as best_score,
            MAX(level) as best_level,
            MAX(lines_cleared) as most_lines_cleared,
            AVG(score) as average_score,
            AVG(level) as average_level,
            SUM(lines_cleared) as total_lines_cleared
          FROM tetris_history
          WHERE player_id = ?
        `, [playerId], (err, rows) => {
          if (err) {
            console.error('Fetch tetris stats error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }
  
          const stats = rows[0] || {
            total_games: 0,
            best_score: 0,
            best_level: 0,
            most_lines_cleared: 0,
            average_score: 0,
            average_level: 0,
            total_lines_cleared: 0
          };
  
          resolve(reply.send({ stats }));
        });
      });
    });
  }
  
  module.exports = tetrisRoutes;
  
  