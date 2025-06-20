async function friendsRoutes(fastify, options) {
    const db = fastify.sqliteDb;
  
    // Add a friend (two-way)
    fastify.post('/friends/:friendId', async (request, reply) => {
      const playerId = request.user?.id || 1; // TEMPORARY
      const friendId = parseInt(request.params.friendId);
  
      if (playerId === friendId) {
        return reply.status(400).send({ error: "You can't add yourself as a friend." });
      }
  
      return new Promise((resolve, reject) => {
        const insertFriend = db.prepare(`INSERT OR IGNORE INTO friends (player_id, friend_id) VALUES (?, ?)`);
  
        db.serialize(() => {
          insertFriend.run(playerId, friendId);
          insertFriend.run(friendId, playerId, (err) => {
            if (err) {
              console.error('Insert friend error:', err.message);
              return reject(reply.status(500).send({ error: 'Database error' }));
            }
  
            resolve(reply.send({ message: 'Friend added successfully.' }));
          });
        });
      });
    });
  
    // Get friend list
    fastify.get('/friends', async (request, reply) => {
      const playerId = request.user?.id || 1; // TEMPORARY
  
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT p.id, p.username, p.wins, p.losses
          FROM players p
          JOIN friends f ON f.friend_id = p.id
          WHERE f.player_id = ?
        `, [playerId], (err, rows) => {
          if (err) {
            console.error('Get friends error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }
  
          resolve(reply.send({ friends: rows }));
        });
      });
    });
  
    // Delete a friend (two-way)
    fastify.delete('/friends/:friendId', async (request, reply) => {
      const playerId = request.user?.id || 1; // TEMPORARY
      const friendId = parseInt(request.params.friendId);
  
      if (playerId === friendId) {
        return reply.status(400).send({ error: "You can't unfriend yourself." });
      }
  
      return new Promise((resolve, reject) => {
        const deleteFriend = db.prepare(`
          DELETE FROM friends WHERE 
          (player_id = ? AND friend_id = ?) OR 
          (player_id = ? AND friend_id = ?)
        `);
  
        deleteFriend.run(playerId, friendId, friendId, playerId, (err) => {
          if (err) {
            console.error('Delete friend error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }
  
          resolve(reply.send({ message: 'Friend removed successfully.' }));
        });
      });
    });
  }
  
  module.exports = friendsRoutes;
  
  