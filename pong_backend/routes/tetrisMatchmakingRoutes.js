// Tetris Matchmaking with Database Persistence
// Queue and matches are now stored in SQLite database

module.exports = async function (fastify, opts) {
  const db = fastify.sqliteDb;

  // Helper function to promisify database queries
  function getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  function allQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  // Database helper functions for Tetris Matchmaking
  async function addToQueue(userId, username, skillLevel, mode) {
    const query = `
      INSERT OR REPLACE INTO tetris_matchmaking_queue 
      (user_id, username, skill_level, mode, join_time) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await runQuery(query, [userId, username, skillLevel, mode, Date.now()]);
  }

  async function removeFromQueue(userId) {
    const query = `DELETE FROM tetris_matchmaking_queue WHERE user_id = ?`;
    await runQuery(query, [userId]);
  }

  async function getQueuePlayer(userId) {
    const query = `SELECT * FROM tetris_matchmaking_queue WHERE user_id = ?`;
    return await getQuery(query, [userId]);
  }

  async function getAllQueuePlayers() {
    const query = `SELECT * FROM tetris_matchmaking_queue ORDER BY join_time ASC`;
    return await allQuery(query);
  }

  async function createActiveMatch(matchId, player1, player2, mode) {
    const query = `
      INSERT INTO tetris_active_matches (
        match_id, player1_id, player1_username, player1_skill_level,
        player2_id, player2_username, player2_skill_level,
        mode, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await runQuery(query, [
      matchId, player1.id, player1.username, player1.skillLevel,
      player2.id, player2.username, player2.skillLevel,
      mode, 'pending', Date.now()
    ]);
  }

  async function getActiveMatch(matchId) {
    const query = `SELECT * FROM tetris_active_matches WHERE match_id = ?`;
    return await getQuery(query, [matchId]);
  }

  async function updateMatchPlayer(matchId, playerId, updates) {
    const isPlayer1Query = `SELECT player1_id FROM tetris_active_matches WHERE match_id = ? AND player1_id = ?`;
    const isPlayer1 = await getQuery(isPlayer1Query, [matchId, playerId]);
    
    const prefix = isPlayer1 ? 'player1_' : 'player2_';
    const setClauses = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${prefix}${key} = ?`);
      params.push(value);
    }
    
    if (setClauses.length > 0) {
      params.push(matchId);
      const query = `UPDATE tetris_active_matches SET ${setClauses.join(', ')} WHERE match_id = ?`;
      await runQuery(query, params);
    }
  }

  async function deleteActiveMatch(matchId) {
    const query = `DELETE FROM tetris_active_matches WHERE match_id = ?`;
    await runQuery(query, [matchId]);
  }

  async function getUserActiveMatch(userId) {
    const query = `
      SELECT * FROM tetris_active_matches 
      WHERE player1_id = ? OR player2_id = ?
    `;
    return await getQuery(query, [userId, userId]);
  }

  // Get user's matchmaking status
  fastify.get('/status/:userId', async (request, reply) => {
    try {
        const userId = request.params.userId;
        
        // Check if user is in queue
        const queueStatus = await getQueuePlayer(userId);
        if (queueStatus) {
            return reply.send({
                status: 'in_queue',
                mode: queueStatus.mode,
                waitTime: Date.now() - queueStatus.join_time,
                skillLevel: queueStatus.skill_level
            });
        }
        
        // Check if user is in active match
        const activeMatch = await getUserActiveMatch(userId);
        if (activeMatch) {
            const isPlayer1 = activeMatch.player1_id === parseInt(userId);
            const opponent = isPlayer1 ? {
                id: activeMatch.player2_id,
                username: activeMatch.player2_username
            } : {
                id: activeMatch.player1_id,
                username: activeMatch.player1_username
            };
            
            return reply.send({
                status: 'in_match',
                matchId: activeMatch.match_id,
                opponent: opponent
            });
        }

        // Get user's skill level from database
        const user = await getQuery(`
            SELECT p.username, 
                   COALESCE(AVG(th.level), 1) as avg_level,
                   COUNT(th.id) as games_played,
                   MAX(th.score) as best_score
            FROM players p
            LEFT JOIN tetris_history th ON p.id = th.player_id
            WHERE p.id = ?
            GROUP BY p.id, p.username
        `, [userId]);

        const skillLevel = user ? calculateSkillLevel(user.avg_level, user.games_played, user.best_score) : 100;
        
        reply.send({ 
            status: 'idle',
            skillLevel: skillLevel
        });
    } catch (error) {
        console.error('Error getting matchmaking status:', error);
        reply.code(500).send({ error: 'Failed to get status' });
    }
  });

  // Join matchmaking queue
  fastify.post('/queue', async (request, reply) => {
    try {
        const { player_id, mode } = request.body;
        
        // Get user info and skill level
        const user = await getQuery(`
            SELECT p.username, 
                   COALESCE(AVG(th.level), 1) as avg_level,
                   COUNT(th.id) as games_played,
                   MAX(th.score) as best_score
            FROM players p
            LEFT JOIN tetris_history th ON p.id = th.player_id
            WHERE p.id = ?
            GROUP BY p.id, p.username
        `, [player_id]);
        
        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }
        
        // Calculate skill level based on stats
        const skillLevel = calculateSkillLevel(user.avg_level, user.games_played, user.best_score);
        
        // Add to queue (database)
        await addToQueue(player_id, user.username, skillLevel, mode);
        
        // In the new flow, users create matches and others join them manually
        // No automatic matchmaking when joining the queue
        
        reply.send({ 
            success: true, 
            skillLevel: skillLevel,
            matchFound: false // Always false since we don't auto-match anymore
        });
        
    } catch (error) {
        console.error('Error joining queue:', error);
        reply.code(500).send({ error: 'Failed to join queue' });
    }
  });

  // Leave matchmaking queue
  fastify.delete('/queue/:userId', async (request, reply) => {
    try {
        const userId = request.params.userId;
        await removeFromQueue(userId);
        reply.send({ success: true });
    } catch (error) {
        console.error('Error leaving queue:', error);
        reply.code(500).send({ error: 'Failed to leave queue' });
    }
  });

  // Get current queue (for display purposes)
  fastify.get('/queue', async (request, reply) => {
    try {
        const queuePlayers = await getAllQueuePlayers();
        const queueArray = queuePlayers.map(player => ({
            id: player.user_id,
            username: player.username,
            skillLevel: player.skill_level,
            mode: player.mode,
            waitTime: Date.now() - player.join_time
        }));
        
        reply.send({ queue: queueArray });
    } catch (error) {
        console.error('Error getting queue:', error);
        reply.code(500).send({ error: 'Failed to get queue' });
    }
  });

  // Join an existing match from the queue
  fastify.post('/join-match', async (request, reply) => {
    try {
        const { player_id, target_player_id } = request.body;
        
        // Get user info for the joining player
        const user = await getQuery(`
            SELECT p.username, 
                   COALESCE(AVG(th.level), 1) as avg_level,
                   COUNT(th.id) as games_played,
                   MAX(th.score) as best_score
            FROM players p
            LEFT JOIN tetris_history th ON p.id = th.player_id
            WHERE p.id = ?
            GROUP BY p.id, p.username
        `, [player_id]);
        
        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }
        
        // Check if target player is still in queue
        const targetPlayer = await getQueuePlayer(target_player_id);
        if (!targetPlayer) {
            return reply.code(404).send({ error: 'Target player no longer in queue' });
        }
        
        // Check if joining player is already in queue or match
        const joiningPlayerInQueue = await getQueuePlayer(player_id);
        if (joiningPlayerInQueue) {
            return reply.code(400).send({ error: 'You are already in queue' });
        }
        
        // Check if user is already in an active match
        const userActiveMatch = await getUserActiveMatch(player_id);
        if (userActiveMatch) {
            return reply.code(400).send({ error: 'You are already in a match' });
        }
        
        // Calculate skill level for joining player
        const skillLevel = calculateSkillLevel(user.avg_level, user.games_played, user.best_score);
        
        // Create the joining player object
        const joiningPlayer = {
            id: player_id,
            username: user.username,
            skillLevel: skillLevel,
            mode: targetPlayer.mode,
            joinTime: Date.now()
        };
        
        // Create match between the two players
        const matchId = generateMatchId();
        await createActiveMatch(matchId, {
            id: targetPlayer.user_id,
            username: targetPlayer.username,
            skillLevel: targetPlayer.skill_level
        }, joiningPlayer, targetPlayer.mode);
        
        // Remove target player from queue
        await removeFromQueue(target_player_id);
        
        console.log(`Match created: ${targetPlayer.username} vs ${joiningPlayer.username} in ${targetPlayer.mode} mode`);
        
        reply.send({ 
            success: true,
            matchId: matchId,
            opponent: {
                id: targetPlayer.user_id,
                username: targetPlayer.username,
                skillLevel: targetPlayer.skill_level
            },
            mode: targetPlayer.mode
        });
        
    } catch (error) {
        console.error('Error joining match:', error);
        reply.code(500).send({ error: 'Failed to join match' });
    }
  });

  // Accept/Decline match
  fastify.post('/match/:matchId/response', async (request, reply) => {
    try {
        const { matchId } = request.params;
        const { player_id, response } = request.body; // 'accept' or 'decline'
        
        const match = activeMatches.get(matchId);
        if (!match) {
            return reply.code(404).send({ error: 'Match not found' });
        }
        
        if (response === 'accept') {
            // Mark player as accepted
            if (match.player1.id === player_id) {
                match.player1.accepted = true;
            } else if (match.player2.id === player_id) {
                match.player2.accepted = true;
            }
            
            // If both players accepted, start the game
            if (match.player1.accepted && match.player2.accepted) {
                match.status = 'active';
                // For local multiplayer, we'll just send a start signal
                // The frontend will handle showing both players on the same screen
                console.log(`Local tournament match ${matchId} starting between ${match.player1.username} and ${match.player2.username}`);
            }
        } else {
            // Player declined, cancel match
            activeMatches.delete(matchId);
            // Return both players to queue
            matchmakingQueue.set(match.player1.id, match.player1);
            matchmakingQueue.set(match.player2.id, match.player2);
        }
        
        reply.send({ success: true });
    } catch (error) {
        console.error('Error responding to match:', error);
        reply.code(500).send({ error: 'Failed to respond to match' });
    }
  });

  // Update match progress (for local multiplayer, this will record final results)
  fastify.post('/match/:matchId/progress', async (request, reply) => {
    try {
        const { matchId } = request.params;
        const { player_id, score, level, lines, isGameOver } = request.body;
        
        const match = activeMatches.get(matchId);
        if (!match) {
            return reply.code(404).send({ error: 'Match not found' });
        }
        
        // Update player progress
        if (match.player1.id === player_id) {
            match.player1.progress = { score, level, lines, isGameOver };
        } else if (match.player2.id === player_id) {
            match.player2.progress = { score, level, lines, isGameOver };
        }
        
        // Check win conditions (for local multiplayer)
        checkWinCondition(matchId, match);
        
        reply.send({ success: true });
    } catch (error) {
        console.error('Error updating match progress:', error);
        reply.code(500).send({ error: 'Failed to update progress' });
    }
  });

  // Get current match status (for local multiplayer UI)
  fastify.get('/match/:matchId', async (request, reply) => {
    try {
        const { matchId } = request.params;
        const match = activeMatches.get(matchId);
        
        if (!match) {
            return reply.code(404).send({ error: 'Match not found' });
        }
        
        reply.send({
            matchId: matchId,
            player1: {
                username: match.player1.username,
                progress: match.player1.progress || { score: 0, level: 1, lines: 0 }
            },
            player2: {
                username: match.player2.username,
                progress: match.player2.progress || { score: 0, level: 1, lines: 0 }
            },
            mode: match.mode,
            status: match.status
        });
    } catch (error) {
        console.error('Error getting match status:', error);
        reply.code(500).send({ error: 'Failed to get match status' });
    }
  });

  // Helper Functions
  function calculateSkillLevel(avgLevel, gamesPlayed, bestScore) {
      // Simple skill calculation - can be made more sophisticated
      const levelFactor = (avgLevel || 1) * 100;
      const experienceFactor = Math.min(gamesPlayed * 10, 200);
      const scoreFactor = (bestScore || 0) / 100;
      
      return Math.floor(levelFactor + experienceFactor + scoreFactor);
  }

  function tryFindMatch(playerId, mode) {
      const player = matchmakingQueue.get(playerId);
      if (!player) return false;
      
      // Find suitable opponent
      for (let [opponentId, opponent] of matchmakingQueue) {
          if (opponentId === playerId) continue;
          if (opponent.mode !== mode) continue;
          
          // Check skill level difference (within 200 points for fair match)
          const skillDiff = Math.abs(player.skillLevel - opponent.skillLevel);
          if (skillDiff <= 200) {
              // Create match
              const matchId = generateMatchId();
              activeMatches.set(matchId, {
                  id: matchId,
                  player1: { ...player, accepted: false, progress: null },
                  player2: { ...opponent, accepted: false, progress: null },
                  mode: mode,
                  status: 'pending',
                  createdAt: Date.now()
              });
              
              // Remove from queue
              matchmakingQueue.delete(playerId);
              matchmakingQueue.delete(opponentId);
              
              // For local multiplayer, automatically accept both players
              // and notify via console (frontend will handle the UI)
              console.log(`Local match found: ${player.username} vs ${opponent.username} in ${mode} mode`);
              
              return { matchId, opponent };
          }
      }
      
      return false;
  }

  function checkWinCondition(matchId, match) {
      if (!match.player1.progress || !match.player2.progress) return;
      
      let winner = null;
      
      switch (match.mode) {
          case 'sprint':
              if (match.player1.progress.lines >= 40) winner = match.player1;
              else if (match.player2.progress.lines >= 40) winner = match.player2;
              break;
          case 'ultra':
              // Will be handled by time limit in frontend
              break;
          case 'survival':
              // Check for game over
              if (match.player1.progress.isGameOver && !match.player2.progress.isGameOver) {
                  winner = match.player2;
              } else if (match.player2.progress.isGameOver && !match.player1.progress.isGameOver) {
                  winner = match.player1;
              } else if (match.player1.progress.isGameOver && match.player2.progress.isGameOver) {
                  // Both game over, higher score wins
                  winner = match.player1.progress.score > match.player2.progress.score ? match.player1 : match.player2;
              }
              break;
      }
      
      if (winner) {
          endMatch(matchId, winner);
      }
  }

  async function endMatch(matchId, winner = null) {
      const match = activeMatches.get(matchId);
      if (!match) return;
      
      // Save match result to database
      const insertMatch = `
          INSERT INTO tetris_tournament_matches (player1_id, player2_id, mode, winner_id, 
                                         player1_score, player1_level, player1_lines,
                                         player2_score, player2_level, player2_lines)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const p1 = match.player1.progress || { score: 0, level: 1, lines: 0 };
      const p2 = match.player2.progress || { score: 0, level: 1, lines: 0 };
      
      try {
          await runQuery(insertMatch, [
              match.player1.id, match.player2.id, match.mode, winner?.id || null,
              p1.score, p1.level, p1.lines,
              p2.score, p2.level, p2.lines
          ]);
          
          console.log(`Match ${matchId} ended. Winner: ${winner ? winner.username : 'Draw'}`);
      } catch (error) {
          console.error('Error saving match result:', error);
      }
      
      // Clean up
      activeMatches.delete(matchId);
  }

  function generateMatchId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};
