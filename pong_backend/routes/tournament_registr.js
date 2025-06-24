async function tournamentsRoutes(fastify, options) {
    const db = fastify.sqliteDb;
  
    // Get all tournaments
    fastify.get('/tournaments', async (request, reply) => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM tournament ORDER BY date DESC', [], (err, rows) => {
          if (err) return reject(reply.status(500).send({ error: 'DB error' }));
          resolve(reply.send({ tournaments: rows }));
        });
      });
    });
  
    // Register player to a tournament
    fastify.post('/tournaments/:id/register', async (request, reply) => {
      const tournamentId = parseInt(request.params.id);
      const playerId = request.user?.id || 1; // TEMP
  
      return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO tournament_registrations (tournament_id, player_id) VALUES (?, ?)');
        stmt.run(tournamentId, playerId, (err) => {
          if (err) {
            console.error('Registration error:', err.message);
            return reject(reply.status(500).send({ error: 'DB error' }));
          }
          resolve(reply.send({ message: 'Registered successfully' }));
        });
      });
    });
  
    // Get participants for a tournament
    fastify.get('/tournaments/:id/participants', async (request, reply) => {
      const tournamentId = parseInt(request.params.id);
  
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT p.id, p.username, p.wins, p.losses
          FROM players p
          JOIN tournament_registrations tr ON tr.player_id = p.id
          WHERE tr.tournament_id = ?
        `, [tournamentId], (err, rows) => {
          if (err) return reject(reply.status(500).send({ error: 'DB error' }));
          resolve(reply.send({ participants: rows }));
        });
      });
    });
  }
  
  module.exports = tournamentsRoutes;
  