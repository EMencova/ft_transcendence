async function friendsRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Send a friend request (status = 'pending')
  fastify.post('/friends/:friendId', async (request, reply) => {
    const playerId = request.user?.id || 1; // TEMPORARY
    const friendId = parseInt(request.params.friendId);

    if (playerId === friendId) {
      return reply.status(400).send({ error: "You can't add yourself as a friend." });
    }

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO friends (player_id, friend_id, status) 
        VALUES (?, ?, 'pending')
      `);

      stmt.run(playerId, friendId, (err) => {
        if (err) {
          console.error('Friend request error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        resolve(reply.send({ message: 'Friend request sent.' }));
      });
    });
  });

  // Accept a friend request
  fastify.post('/friends/:friendId/accept', async (request, reply) => {
    const playerId = request.user?.id || 1;
    const friendId = parseInt(request.params.friendId);

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Update request to accepted
        const updateRequest = db.prepare(`
          UPDATE friends SET status = 'accepted' 
          WHERE player_id = ? AND friend_id = ? AND status = 'pending'
        `);

        updateRequest.run(friendId, playerId, function(err) {
          if (err) {
            console.error('Accept request error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }

          if (this.changes === 0) {
            return reject(reply.status(400).send({ error: 'No pending friend request found.' }));
          }

          // Create reciprocal friendship
          const insertReciprocal = db.prepare(`
            INSERT OR IGNORE INTO friends (player_id, friend_id, status) 
            VALUES (?, ?, 'accepted')
          `);

          insertReciprocal.run(playerId, friendId, (err2) => {
            if (err2) {
              console.error('Insert reciprocal friend error:', err2.message);
              return reject(reply.status(500).send({ error: 'Database error' }));
            }

            resolve(reply.send({ message: 'Friend request accepted.' }));
          });
        });
      });
    });
  });

  // Decline a friend request
  fastify.post('/friends/:friendId/decline', async (request, reply) => {
    const playerId = request.user?.id || 1;
    const friendId = parseInt(request.params.friendId);

    return new Promise((resolve, reject) => {
      const deleteRequest = db.prepare(`
        DELETE FROM friends WHERE player_id = ? AND friend_id = ? AND status = 'pending'
      `);

      deleteRequest.run(friendId, playerId, (err) => {
        if (err) {
          console.error('Decline request error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        resolve(reply.send({ message: 'Friend request declined.' }));
      });
    });
  });

  // Get friend list (only accepted)
  fastify.get('/friends', async (request, reply) => {
    const playerId = request.user?.id || 1;

    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.username, p.wins, p.losses
        FROM players p
        JOIN friends f ON f.friend_id = p.id
        WHERE f.player_id = ? AND f.status = 'accepted'
      `, [playerId], (err, rows) => {
        if (err) {
          console.error('Get friends error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        resolve(reply.send({ friends: rows }));
      });
    });
  });

  // Get incoming friend requests
  fastify.get('/friends/requests', async (request, reply) => {
    const playerId = request.user?.id || 1;

    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.username
        FROM players p
        JOIN friends f ON f.player_id = p.id
        WHERE f.friend_id = ? AND f.status = 'pending'
      `, [playerId], (err, rows) => {
        if (err) {
          console.error('Get friend requests error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        resolve(reply.send({ requests: rows }));
      });
    });
  });

  // Delete a friend (remove accepted friendship both ways)
  fastify.delete('/friends/:friendId', async (request, reply) => {
    const playerId = request.user?.id || 1;
    const friendId = parseInt(request.params.friendId);

    if (playerId === friendId) {
      return reply.status(400).send({ error: "You can't unfriend yourself." });
    }

    return new Promise((resolve, reject) => {
      const deleteFriend = db.prepare(`
        DELETE FROM friends WHERE 
        (player_id = ? AND friend_id = ? AND status = 'accepted') OR 
        (player_id = ? AND friend_id = ? AND status = 'accepted')
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


  
  