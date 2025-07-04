const path = require('path');
const fs = require('fs');
const pump = require('util').promisify(require('stream').pipeline);

async function userProfile(fastify, options) {
  const db = fastify.sqliteDb;

  // Get user profile information
  fastify.get('/profile/:userId', async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      return reply.status(400).send({ error: 'User ID is required.' });
    }

    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, username, email, avatar, wins, losses FROM players WHERE id = ?`,
        [userId],
        function (err, row) {
          if (err) {
            console.error('Profile fetch error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }

          if (!row) {
            return reject(reply.status(404).send({ error: 'User not found.' }));
          }

          console.log('Profile fetched successfully for user:', userId);
          resolve(reply.send({
            id: row.id,
            username: row.username,
            email: row.email,
            avatar: row.avatar,
            wins: row.wins || 0,
            losses: row.losses || 0
          }));
        }
      );
    });
  });

  // Update user profile information
  fastify.put('/updateProfile', async (request, reply) => {
    const { username, email, userId } = request.body;
    const playerId = userId || request.user?.id || 1; // Use userId from request body

    if (!username || !email) {
      return reply.status(400).send({ error: 'Username and email are required.' });
    }

    if (!userId) {
      return reply.status(400).send({ error: 'User ID is required.' });
    }

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE players 
        SET username = ?, email = ? 
        WHERE id = ?
      `);

      stmt.run(username, email, playerId, function(err) {
        if (err) {
          console.error('Profile update error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        if (this.changes === 0) {
          return reject(reply.status(404).send({ error: 'Player not found.' }));
        }

        resolve(reply.send({ message: 'Profile updated successfully.' }));
      });
    });
  });

  // Get user game history
  fastify.get('/profile/:userId/games', async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      return reply.status(400).send({ error: 'User ID is required.' });
    }

    console.log('Getting game history for userId:', userId);

    return new Promise((resolve, reject) => {
      // First, let's check if there are any games at all
      db.all(`SELECT COUNT(*) as total FROM games`, [], function (err, countResult) {
        if (err) {
          console.error('Count games error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error' }));
        }

        console.log('Total games in database:', countResult[0]?.total || 0);

        // Query to get game history for the user
        db.all(`
          SELECT 
            g.id,
            g.player1_id,
            g.player2_id,
            g.player1_score,
            g.player2_score,
            g.winner_id,
            g.created_at,
            g.game_type,
            p1.username as player1_username,
            p2.username as player2_username,
            CASE 
              WHEN g.winner_id = ? THEN 'win'
              WHEN g.winner_id IS NOT NULL AND g.winner_id != ? THEN 'loss'
              ELSE 'draw'
            END as result
          FROM games g
          JOIN players p1 ON g.player1_id = p1.id
          JOIN players p2 ON g.player2_id = p2.id
          WHERE g.player1_id = ? OR g.player2_id = ?
          ORDER BY g.created_at DESC
          LIMIT 50
        `, [userId, userId, userId, userId], function (err, rows) {
          if (err) {
            console.error('Game history fetch error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error: ' + err.message }));
          }

          console.log('Games found for user', userId, ':', rows?.length || 0);
          console.log('Sample game data:', rows?.[0] || 'No games found');

          resolve(reply.send({
            games: rows || [],
            debug: {
              userId: userId,
              totalGamesInDB: countResult[0]?.total || 0,
              userGamesFound: rows?.length || 0
            }
          }));
        });
      });
    });
  });

  // TEMPORARY: Add sample game data for testing
  fastify.post('/profile/:userId/games/sample', async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      return reply.status(400).send({ error: 'User ID is required.' });
    }

    // Sample games data
    const sampleGames = [
      { player1_id: userId, player2_id: 1, player1_score: 5, player2_score: 3, winner_id: userId, game_type: 'pong' },
      { player1_id: 2, player2_id: userId, player1_score: 2, player2_score: 5, winner_id: userId, game_type: 'pong' },
      { player1_id: userId, player2_id: 3, player1_score: 3, player2_score: 5, winner_id: 3, game_type: 'pong' },
      { player1_id: userId, player2_id: 1, player1_score: 4, player2_score: 5, winner_id: 1, game_type: 'tetris' },
    ];

    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = sampleGames.length;

      sampleGames.forEach(game => {
        db.run(`
          INSERT INTO games (player1_id, player2_id, player1_score, player2_score, winner_id, game_type)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [game.player1_id, game.player2_id, game.player1_score, game.player2_score, game.winner_id, game.game_type], function(err) {
          if (err) {
            console.error('Sample game insert error:', err.message);
          }
          
          completed++;
          if (completed === total) {
            resolve(reply.send({ message: 'Sample games added successfully' }));
          }
        });
      });
    });
  });

  // TEMPORARY: Debug endpoint to check database content
  fastify.get('/debug/tables', async (request, reply) => {
    return new Promise((resolve, reject) => {
      // Check if games table exists and get all games
      db.all(`SELECT * FROM games LIMIT 10`, [], function (err, games) {
        if (err) {
          console.error('Debug games query error:', err.message);
          return reject(reply.status(500).send({ error: 'Database error checking games: ' + err.message }));
        }

        // Get all players
        db.all(`SELECT id, username FROM players LIMIT 10`, [], function (err2, players) {
          if (err2) {
            console.error('Debug players query error:', err2.message);
            return reject(reply.status(500).send({ error: 'Database error checking players: ' + err2.message }));
          }

          // Get table info for games
          db.all(`PRAGMA table_info(games)`, [], function (err3, gamesSchema) {
            if (err3) {
              console.error('Debug schema query error:', err3.message);
              return reject(reply.status(500).send({ error: 'Database error checking schema: ' + err3.message }));
            }

            resolve(reply.send({
              games: games || [],
              players: players || [],
              gamesSchema: gamesSchema || [],
              message: 'Debug info retrieved successfully'
            }));
          });
        });
      });
    });
  });

  // Update user avatar
  fastify.register(require('@fastify/multipart'));
  fastify.put('/profile/avatar', async (request, reply) => {
    console.log('Avatar update request received');
    
    if (!request.isMultipart()) {
      console.log('Request is not multipart');
      return reply.status(400).send({ error: 'Avatar upload must be multipart/form-data.' });
    }

    const parts = request.parts();
    let avatarFilename = null;
    let userId = null;

    console.log('Processing multipart data...');
    for await (const part of parts) {
      console.log('Processing part:', part.fieldname, 'type:', part.type);
      
      if (part.type === 'file' && part.fieldname === 'avatar') {
        const uploadDir = path.join(__dirname, '../public/avatars');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        avatarFilename = `${Date.now()}_${part.filename}`;
        const filePath = path.join(uploadDir, avatarFilename);
        console.log('Saving avatar to:', filePath);
        try {
          await pump(part.file, fs.createWriteStream(filePath));
          console.log('Avatar saved successfully');
        } catch (e) {
          console.error('Error saving avatar:', e);
          return reply.status(500).send({ error: 'Error saving avatar.' });
        }
      } else if (part.fieldname === 'userId') {
        userId = part.value;
        console.log('Received userId:', userId);
      }
    }

    if (!userId) {
      console.log('No userId provided');
      return reply.status(400).send({ error: 'User ID is required.' });
    }

    if (!avatarFilename) {
      console.log('No avatar file uploaded');
      return reply.status(400).send({ error: 'No avatar file uploaded.' });
    }

    const playerId = userId;

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE players SET avatar = ? WHERE id = ?`,
        [`/avatars/${avatarFilename}`, playerId],
        function (err) {
          if (err) {
            console.error('Avatar update error:', err.message);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }
          if (this.changes === 0) {
            return reject(reply.status(404).send({ error: 'Player not found.' }));
          }
          
          console.log('Avatar updated successfully for user:', playerId);
          resolve(reply.send({ 
            message: 'Avatar updated successfully.', 
            avatar: `/avatars/${avatarFilename}` 
          }));
        }
      );
    });
  });
}

module.exports = userProfile;