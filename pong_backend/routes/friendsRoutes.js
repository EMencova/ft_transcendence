async function friendsRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Send a friend request (status = 'pending')
  fastify.post('/friends/:friendId', async (request, reply) => {
    const { userId } = request.body; // Get userId from request body
    const playerId = userId || request.user?.id || 1; // Use userId from request body
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
    const { userId } = request.body;
    const playerId = userId || request.user?.id || 1;
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
    const { userId } = request.body;
    const playerId = userId || request.user?.id || 1;
    const friendId = parseInt(request.params.friendId);

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // First, record the decline action in history
        const insertHistory = db.prepare(`
          INSERT INTO friend_request_history (requester_id, target_id, action, action_by)
          VALUES (?, ?, 'declined', ?)
        `);

        insertHistory.run(friendId, playerId, playerId, (err) => {
          if (err) {
            console.log('Warning: Could not record decline history:', err.message);
          }
        });

        // Then delete the pending request
        const deleteRequest = db.prepare(`
          DELETE FROM friends WHERE player_id = ? AND friend_id = ? AND status = 'pending'
        `);

        deleteRequest.run(friendId, playerId, function(err) {
          if (err) {
            console.error('Decline request error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }

          if (this.changes === 0) {
            return reject(reply.status(400).send({ error: 'No pending friend request found.' }));
          }

          resolve(reply.send({ message: 'Friend request declined.' }));
        });
      });
    });
  });

  // Get friend list (only accepted)
  fastify.get('/friends/:userId', async (request, reply) => {
    const { userId } = request.params;
    const playerId = userId || request.user?.id || 1;

    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.username, p.wins, p.losses, p.avatar
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
  fastify.get('/friends/:userId/requests', async (request, reply) => {
    const { userId } = request.params;
    const playerId = userId || request.user?.id || 1;

    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.username, p.avatar
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

  // Get sent friend requests (requests I sent to others)
  fastify.get('/friends/:userId/sent', async (request, reply) => {
    const { userId } = request.params;
    const playerId = userId || request.user?.id || 1;

    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.username, p.avatar, f.status
        FROM players p
        JOIN friends f ON f.friend_id = p.id
        WHERE f.player_id = ? AND f.status = 'pending'
      `, [playerId], (err, rows) => {
        if (err) {
          console.error('Get sent requests error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        resolve(reply.send({ sentRequests: rows }));
      });
    });
  });

  // Cancel a sent friend request
  fastify.delete('/friends/:friendId/cancel', async (request, reply) => {
    const { userId } = request.body;
    const playerId = userId || request.user?.id || 1;
    const friendId = parseInt(request.params.friendId);

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // First, record the cancel action in history
        const insertHistory = db.prepare(`
          INSERT INTO friend_request_history (requester_id, target_id, action, action_by)
          VALUES (?, ?, 'cancelled', ?)
        `);

        insertHistory.run(playerId, friendId, playerId, (err) => {
          if (err) {
            console.log('Warning: Could not record cancel history:', err.message);
          }
        });

        // Then delete the pending request
        const deleteRequest = db.prepare(`
          DELETE FROM friends WHERE player_id = ? AND friend_id = ? AND status = 'pending'
        `);

        deleteRequest.run(playerId, friendId, function(err) {
          if (err) {
            console.error('Cancel request error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }

          if (this.changes === 0) {
            return reject(reply.status(400).send({ error: 'No pending request found.' }));
          }

          resolve(reply.send({ message: 'Friend request cancelled.' }));
        });
      });
    });
  });

  // Get friend request history (declined and cancelled)
  fastify.get('/friends/:userId/history', async (request, reply) => {
    const { userId } = request.params;
    const playerId = userId || request.user?.id || 1;

    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          frh.id,
          frh.action,
          frh.created_at,
          CASE 
            WHEN frh.requester_id = ? THEN p_target.username
            ELSE p_requester.username
          END as other_username,
          CASE 
            WHEN frh.requester_id = ? THEN p_target.avatar
            ELSE p_requester.avatar
          END as other_avatar,
          CASE 
            WHEN frh.requester_id = ? THEN p_target.id
            ELSE p_requester.id
          END as other_id,
          CASE 
            WHEN frh.requester_id = ? THEN 'sent'
            ELSE 'received'
          END as request_direction
        FROM friend_request_history frh
        JOIN players p_requester ON frh.requester_id = p_requester.id
        JOIN players p_target ON frh.target_id = p_target.id
        WHERE frh.requester_id = ? OR frh.target_id = ?
        ORDER BY frh.created_at DESC
        LIMIT 50
      `, [playerId, playerId, playerId, playerId, playerId, playerId], (err, rows) => {
        if (err) {
          console.error('Get friend history error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        resolve(reply.send({ history: rows }));
      });
    });
  });

  // Search players (excluding yourself and existing friends)
  fastify.get('/players/search/:userId', async (request, reply) => {
    const { userId } = request.params;
    const { q } = request.query; // search query
    
    if (!q || q.length < 2) {
      return reply.status(400).send({ error: 'Search query must be at least 2 characters' });
    }

    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.username, p.avatar, p.wins, p.losses
        FROM players p
        WHERE p.id != ? 
        AND p.username LIKE ?
        AND p.id NOT IN (
          SELECT friend_id FROM friends WHERE player_id = ? AND status IN ('accepted', 'pending')
        )
        AND p.id NOT IN (
          SELECT player_id FROM friends WHERE friend_id = ? AND status IN ('accepted', 'pending')
        )
        LIMIT 10
      `, [userId, `%${q}%`, userId, userId], (err, rows) => {
        if (err) {
          console.error('Search players error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        resolve(reply.send({ players: rows }));
      });
    });
  });

  // Delete a friend (remove accepted friendship both ways)
  fastify.delete('/friends/:friendId', async (request, reply) => {
    const { userId } = request.body;
    const playerId = userId || request.user?.id || 1;
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



