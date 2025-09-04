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

  async function createActiveMatchWithPlayType(matchId, player1, player2, mode, playType) {
    // For turn-based games, player2 (the joining player) goes first
    const currentTurn = playType === 'turn_based' ? 'player2' : null;
    console.log(`Creating ${playType} match ${matchId}: ${player1.username} vs ${player2.username}, current_turn: ${currentTurn}`);
    
    const query = `
      INSERT INTO tetris_active_matches (
        match_id, player1_id, player1_username, player1_skill_level,
        player2_id, player2_username, player2_skill_level,
        mode, play_type, current_turn, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await runQuery(query, [
      matchId, player1.id, player1.username, player1.skillLevel,
      player2.id, player2.username, player2.skillLevel,
      mode, playType, currentTurn, 'pending', Date.now()
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
      WHERE (player1_id = ? OR player2_id = ?)
    `;
    return await getQuery(query, [userId, userId]);
  }

  async function getUserSimultaneousMatch(userId) {
    const query = `
      SELECT * FROM tetris_active_matches 
      WHERE (player1_id = ? OR player2_id = ?) AND play_type = 'simultaneous'
    `;
    return await getQuery(query, [userId, userId]);
  }

  // Get user's matchmaking status
  fastify.get('/status/:userId', async (request, reply) => {
    try {
        const userId = request.params.userId;
        console.log(`Getting status for user ${userId}`);
        
        // Check if user is in queue
        const queueStatus = await getQueuePlayer(userId);
        if (queueStatus) {
            console.log(`User ${userId} is in queue with skill level ${queueStatus.skill_level}`);
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
            
            // Get user's skill level even when in match
            const user = await getQuery(`
                SELECT p.username, 
                       COALESCE(AVG(th.score), 0) as avg_score,
                       COUNT(th.id) as games_played,
                       MAX(th.score) as best_score
                FROM players p
                LEFT JOIN tetris_history th ON p.id = th.player_id
                WHERE p.id = ?
                GROUP BY p.id, p.username
            `, [userId]);

            const skillLevel = user ? calculateSkillLevel(user.avg_score, user.games_played, user.best_score) : 100;
            console.log(`User ${userId} in match, calculated skill level: ${skillLevel}`);
            
            return reply.send({
                status: 'in_match',
                matchId: activeMatch.match_id,
                opponent: opponent,
                skillLevel: skillLevel
            });
        }

        // Get user's skill level from database
        const user = await getQuery(`
            SELECT p.username, 
                   COALESCE(AVG(th.score), 0) as avg_score,
                   COUNT(th.id) as games_played,
                   MAX(th.score) as best_score
            FROM players p
            LEFT JOIN tetris_history th ON p.id = th.player_id
            WHERE p.id = ?
            GROUP BY p.id, p.username
        `, [userId]);

        const skillLevel = user ? calculateSkillLevel(user.avg_score, user.games_played, user.best_score) : 100;
        console.log(`User ${userId} idle state - user data:`, user);
        console.log(`User ${userId} calculated skill level: ${skillLevel}`);
        
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
                   COALESCE(AVG(th.score), 0) as avg_score,
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
        const skillLevel = calculateSkillLevel(user.avg_score, user.games_played, user.best_score);
        
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
        console.log('Join match request body:', request.body);
        console.log('Raw play_type from body:', request.body.play_type);
        console.log('play_type type:', typeof request.body.play_type);
        const { player_id, target_player_id, play_type = 'simultaneous' } = request.body;
        console.log('After destructuring - play_type:', play_type);
        console.log('Extracted parameters:', { player_id, target_player_id, play_type });
        
        // Get user info for the joining player
        const user = await getQuery(`
            SELECT p.username, 
                   COALESCE(AVG(th.score), 0) as avg_score,
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
        console.log('Target player in queue:', targetPlayer);
        if (!targetPlayer) {
            console.log(`Target player ${target_player_id} not found in queue`);
            return reply.code(404).send({ error: 'Target player no longer in queue' });
        }
        
        // Check if joining player is already in queue or match
        const joiningPlayerInQueue = await getQueuePlayer(player_id);
        console.log('Joining player already in queue:', joiningPlayerInQueue);
        // Note: It's OK if the joining player is in queue, they can join another player's match
        // We only need to check if they're already in an active match
        
        // For local multiplayer, users can have multiple matches since they play physically together
        // No restrictions on active matches since gameplay is local, not remote
        
        // Calculate skill level for joining player
        const skillLevel = calculateSkillLevel(user.avg_score, user.games_played, user.best_score);
        
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
        await createActiveMatchWithPlayType(matchId, {
            id: targetPlayer.user_id,
            username: targetPlayer.username,
            skillLevel: targetPlayer.skill_level
        }, joiningPlayer, targetPlayer.mode, play_type);
        
        // Remove target player from queue
        await removeFromQueue(target_player_id);
        
        // Remove joining player from queue if they were also in queue
        if (joiningPlayerInQueue) {
            await removeFromQueue(player_id);
        }
        
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
  function calculateSkillLevel(avgScore, gamesPlayed, bestScore) {
      // Simple skill calculation based on average score and games played
      const scoreFactor = (avgScore || 0) / 10;  // Divide by 10 to normalize score values
      const experienceFactor = Math.min(gamesPlayed * 20, 200);  // Cap at 200 points
      const bestScoreFactor = (bestScore || 0) / 100;  // Bonus for high scores
      
      const skillLevel = Math.floor(scoreFactor + experienceFactor + bestScoreFactor);
      return Math.max(skillLevel, 100);  // Minimum skill level of 100
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
          INSERT INTO tetris_tournament_matches (player1_id, player2_id, mode, play_type, winner_id, 
                                         player1_score, player1_level, player1_lines,
                                         player2_score, player2_level, player2_lines)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const p1 = match.player1.progress || { score: 0, level: 1, lines: 0 };
      const p2 = match.player2.progress || { score: 0, level: 1, lines: 0 };
      
      try {
          await runQuery(insertMatch, [
              match.player1.id, match.player2.id, match.mode, 'simultaneous', winner?.id || null,
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

  // Verify opponent password for simultaneous play
  fastify.post('/verify-password', async (request, reply) => {
    try {
        const { target_player_id, password } = request.body;
        console.log('Password verification request:', { target_player_id, password: '***' });
        
        // Get the target player's password from database
        const user = await getQuery(`
            SELECT password FROM players WHERE id = ?
        `, [target_player_id]);
        
        if (!user) {
            console.log(`User ${target_player_id} not found`);
            return reply.code(404).send({ error: 'User not found' });
        }
        
        // Use bcrypt to verify password since passwords are hashed
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(password, user.password);
        
        console.log(`Password verification for user ${target_player_id}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
        
        reply.send({ 
            valid: isValid,
            message: isValid ? 'Password verified' : 'Invalid password'
        });
        
    } catch (error) {
        console.error('Error verifying password:', error);
        reply.code(500).send({ error: 'Failed to verify password' });
    }
  });

  // Get pending matches for a user
  fastify.get('/pending-matches/:userId', async (request, reply) => {
    try {
        const userId = parseInt(request.params.userId);
        
        const matches = await allQuery(`
            SELECT 
                match_id,
                player1_id,
                player2_id,
                CASE 
                    WHEN player1_id = ? THEN player2_username
                    ELSE player1_username 
                END as opponent_name,
                mode,
                play_type,
                current_turn,
                status,
                CASE 
                    WHEN player1_id = ? THEN player1_turn_completed
                    ELSE player2_turn_completed 
                END as user_turn_completed,
                CASE 
                    WHEN player1_id = ? THEN player2_turn_completed
                    ELSE player1_turn_completed 
                END as opponent_turn_completed,
                CASE 
                    WHEN player1_id = ? THEN player2_score
                    ELSE player1_score 
                END as opponent_score,
                CASE 
                    WHEN player1_id = ? THEN player2_lines
                    ELSE player1_lines 
                END as opponent_lines,
                CASE 
                    WHEN player1_id = ? THEN player1_score
                    ELSE player2_score 
                END as user_score,
                CASE 
                    WHEN player1_id = ? THEN player1_lines
                    ELSE player2_lines 
                END as user_lines,
                created_at
            FROM tetris_active_matches 
            WHERE (player1_id = ? OR player2_id = ?) 
            AND status IN ('pending', 'in_progress', 'waiting_for_turn')
            ORDER BY created_at DESC
        `, [userId, userId, userId, userId, userId, userId, userId, userId, userId]);
        
        const pendingMatches = matches.map(match => {
            let status = 'waiting_for_opponent';
            
            if (match.play_type === 'turn_based') {
                // Determine if user is player1 or player2
                const userIsPlayer1 = match.player1_id == userId;
                
                // Check if it's the user's turn
                if ((match.current_turn === 'player1' && userIsPlayer1) ||
                    (match.current_turn === 'player2' && !userIsPlayer1)) {
                    // It's the user's turn
                    if (!match.user_turn_completed) {
                        status = 'waiting_for_you';
                    }
                } else {
                    // It's the opponent's turn
                    status = 'waiting_for_opponent';
                }
            } else if (match.play_type === 'simultaneous') {
                // For simultaneous games
                if (!match.user_turn_completed) {
                    status = 'waiting_for_you';
                } else if (!match.opponent_turn_completed) {
                    status = 'waiting_for_opponent';
                } else {
                    status = 'both_completed';
                }
            }
            
            return {
                id: match.match_id,
                opponent: match.opponent_name,
                mode: match.mode,
                playType: match.play_type,
                status: status,
                opponentScore: match.opponent_score || 0,
                opponentLines: match.opponent_lines || 0,
                yourScore: match.user_score || 0,
                yourLines: match.user_lines || 0,
                created: new Date(match.created_at)
            };
        });
        
        reply.send({ matches: pendingMatches });
        
    } catch (error) {
        console.error('Error getting pending matches:', error);
        reply.code(500).send({ error: 'Failed to get pending matches' });
    }
  });

  // Submit turn result (alias for complete-turn for frontend compatibility)
  fastify.post('/match/:matchId/turn', async (request, reply) => {
    try {
        const { matchId } = request.params;
        const { player_id, score, level, lines } = request.body;
        
        console.log('Turn submission received:', { matchId, player_id, score, level, lines });
        
        const match = await getActiveMatch(matchId);
        if (!match) {
            console.log(`Match ${matchId} not found`);
            return reply.code(404).send({ error: 'Match not found' });
        }
        
        if (match.play_type !== 'turn_based') {
            console.log(`Match ${matchId} is not turn-based (type: ${match.play_type})`);
            return reply.code(400).send({ error: 'This match is not turn-based' });
        }
        
        const isPlayer1 = match.player1_id === parseInt(player_id);
        const playerPrefix = isPlayer1 ? 'player1_' : 'player2_';
        
        console.log(`Updating match ${matchId} for ${isPlayer1 ? 'player1' : 'player2'}`);
        
        // Update player's results and mark turn as completed
        await runQuery(`
            UPDATE tetris_active_matches 
            SET ${playerPrefix}score = ?, 
                ${playerPrefix}level = ?, 
                ${playerPrefix}lines = ?, 
                ${playerPrefix}turn_completed = 1,
                current_turn = CASE 
                    WHEN ${isPlayer1 ? 'player2_turn_completed' : 'player1_turn_completed'} = 1 
                    THEN current_turn
                    ELSE '${isPlayer1 ? 'player2' : 'player1'}'
                END,
                status = CASE 
                    WHEN ${isPlayer1 ? 'player2_turn_completed' : 'player1_turn_completed'} = 1 
                    THEN 'completed' 
                    ELSE 'waiting_for_turn' 
                END
            WHERE match_id = ?
        `, [score, level, lines, matchId]);
        
        console.log(`Turn data saved for match ${matchId}`);
        
        // Check if both players have completed their turns
        const updatedMatch = await getActiveMatch(matchId);
        if (updatedMatch.player1_turn_completed && updatedMatch.player2_turn_completed) {
            console.log(`Both players completed turns in match ${matchId}, finalizing...`);
            
            // Both turns completed, determine winner and finish match
            const winner = updatedMatch.player1_score > updatedMatch.player2_score ? 'player1' : 
                          updatedMatch.player2_score > updatedMatch.player1_score ? 'player2' : null;
            
            // Save to history
            await runQuery(`
                INSERT INTO tetris_tournament_matches (
                    player1_id, player2_id, mode, play_type, winner_id,
                    player1_score, player1_level, player1_lines,
                    player2_score, player2_level, player2_lines
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                updatedMatch.player1_id, updatedMatch.player2_id, updatedMatch.mode, 'turn_based',
                winner === 'player1' ? updatedMatch.player1_id : 
                winner === 'player2' ? updatedMatch.player2_id : null,
                updatedMatch.player1_score, updatedMatch.player1_level, updatedMatch.player1_lines,
                updatedMatch.player2_score, updatedMatch.player2_level, updatedMatch.player2_lines
            ]);
            
            console.log(`Match ${matchId} saved to history, removing from active matches`);
            
            // Remove from active matches
            await deleteActiveMatch(matchId);
        }
        
        reply.send({ 
            success: true,
            matchCompleted: updatedMatch.player1_turn_completed && updatedMatch.player2_turn_completed,
            message: 'Turn submitted successfully'
        });
        
    } catch (error) {
        console.error('Error submitting turn:', error);
        reply.code(500).send({ error: 'Failed to submit turn' });
    }
  });

  // Update match turn completion
  fastify.post('/match/:matchId/complete-turn', async (request, reply) => {
    try {
        const { matchId } = request.params;
        const { player_id, score, level, lines } = request.body;
        
        const match = await getActiveMatch(matchId);
        if (!match) {
            return reply.code(404).send({ error: 'Match not found' });
        }
        
        if (match.play_type !== 'turn_based') {
            return reply.code(400).send({ error: 'This match is not turn-based' });
        }
        
        const isPlayer1 = match.player1_id === parseInt(player_id);
        const playerPrefix = isPlayer1 ? 'player1_' : 'player2_';
        
        // Update player's results and mark turn as completed
        await runQuery(`
            UPDATE tetris_active_matches 
            SET ${playerPrefix}score = ?, 
                ${playerPrefix}level = ?, 
                ${playerPrefix}lines = ?, 
                ${playerPrefix}turn_completed = 1,
                current_turn = CASE 
                    WHEN ${isPlayer1 ? 'player2_turn_completed' : 'player1_turn_completed'} = 1 
                    THEN current_turn
                    ELSE '${isPlayer1 ? 'player2' : 'player1'}'
                END,
                status = CASE 
                    WHEN ${isPlayer1 ? 'player2_turn_completed' : 'player1_turn_completed'} = 1 
                    THEN 'completed' 
                    ELSE 'waiting_for_turn' 
                END
            WHERE match_id = ?
        `, [score, level, lines, matchId]);
        
        // Check if both players have completed their turns
        const updatedMatch = await getActiveMatch(matchId);
        if (updatedMatch.player1_turn_completed && updatedMatch.player2_turn_completed) {
            // Both turns completed, determine winner and finish match
            const winner = updatedMatch.player1_score > updatedMatch.player2_score ? 'player1' : 
                          updatedMatch.player2_score > updatedMatch.player1_score ? 'player2' : null;
            
            // Save to history
            await runQuery(`
                INSERT INTO tetris_tournament_matches (
                    player1_id, player2_id, mode, play_type, winner_id,
                    player1_score, player1_level, player1_lines,
                    player2_score, player2_level, player2_lines
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                updatedMatch.player1_id, updatedMatch.player2_id, updatedMatch.mode, 'turn_based',
                winner === 'player1' ? updatedMatch.player1_id : 
                winner === 'player2' ? updatedMatch.player2_id : null,
                updatedMatch.player1_score, updatedMatch.player1_level, updatedMatch.player1_lines,
                updatedMatch.player2_score, updatedMatch.player2_level, updatedMatch.player2_lines
            ]);
            
            // Remove from active matches
            await deleteActiveMatch(matchId);
        }
        
        reply.send({ 
            success: true,
            matchCompleted: updatedMatch.player1_turn_completed && updatedMatch.player2_turn_completed
        });
        
    } catch (error) {
        console.error('Error completing turn:', error);
        reply.code(500).send({ error: 'Failed to complete turn' });
    }
  });

  // Get completed matches for a player (Recent Matches)
  fastify.get('/completed-matches/:playerId', async (request, reply) => {
    try {
        const { playerId } = request.params;
        console.log(`Getting completed matches for player ${playerId}`);
        
        // Query the tetris_tournament_matches table which contains completed matches
        const query = `
            SELECT 
                ttm.player1_id,
                ttm.player2_id,
                ttm.mode,
                ttm.play_type,
                ttm.created_at,
                ttm.winner_id,
                ttm.player1_score,
                ttm.player2_score,
                ttm.player1_level,
                ttm.player2_level,
                ttm.player1_lines,
                ttm.player2_lines,
                CASE 
                    WHEN ttm.player1_id = ? THEN p2.username
                    ELSE p1.username 
                END as opponent,
                CASE 
                    WHEN ttm.player1_id = ? THEN ttm.player1_score
                    ELSE ttm.player2_score 
                END as user_score,
                CASE 
                    WHEN ttm.player1_id = ? THEN ttm.player2_score
                    ELSE ttm.player1_score 
                END as opponent_score,
                CASE 
                    WHEN ttm.player1_id = ? THEN ttm.player1_lines
                    ELSE ttm.player2_lines 
                END as user_lines,
                CASE 
                    WHEN ttm.player1_id = ? THEN ttm.player2_lines
                    ELSE ttm.player1_lines 
                END as opponent_lines,
                CASE 
                    WHEN ttm.player1_id = ? THEN ttm.player1_level
                    ELSE ttm.player2_level 
                END as user_level,
                CASE 
                    WHEN ttm.player1_id = ? THEN ttm.player2_level
                    ELSE ttm.player1_level 
                END as opponent_level,
                CASE 
                    WHEN ttm.winner_id = ? THEN 'won'
                    WHEN ttm.winner_id IS NULL THEN 'tie'
                    ELSE 'lost'
                END as result
            FROM tetris_tournament_matches ttm
            JOIN players p1 ON ttm.player1_id = p1.id
            JOIN players p2 ON ttm.player2_id = p2.id
            WHERE (ttm.player1_id = ? OR ttm.player2_id = ?) 
            ORDER BY ttm.created_at DESC 
            LIMIT 10
        `;
        
        const matches = await allQuery(query, [
            playerId, playerId, playerId, playerId, playerId, playerId, playerId, 
            playerId, playerId, playerId
        ]);
        
        console.log(`Found ${matches.length} completed matches for player ${playerId}`);
        
        const formattedMatches = matches.map(match => ({
            matchId: `${match.player1_id}_${match.player2_id}_${match.created_at}`, // Generate unique ID
            opponent: match.opponent,
            mode: match.mode,
            playType: match.play_type || 'simultaneous', // Use actual play_type from database
            result: match.result,
            userScore: match.user_score || 0,
            opponentScore: match.opponent_score || 0,
            userLines: match.user_lines || 0,
            opponentLines: match.opponent_lines || 0,
            userLevel: match.user_level || 1,
            opponentLevel: match.opponent_level || 1,
            completedAt: match.created_at, // Use created_at as completion time
            createdAt: match.created_at
        }));
        
        reply.send({ matches: formattedMatches });
        
    } catch (error) {
        console.error('Error getting completed matches:', error);
        reply.code(500).send({ error: 'Failed to get completed matches' });
    }
  });

  // Submit simultaneous match result
  fastify.post('/simultaneous-result', async (request, reply) => {
    try {
        const { 
            player_id, mode, opponent, 
            player1_score, player1_level, player1_lines,
            player2_score, player2_level, player2_lines,
            winner, completed_at 
        } = request.body;
        
        console.log('Simultaneous match result received:', { 
            player_id, mode, opponent, 
            player1_score, player1_level, player1_lines,
            player2_score, player2_level, player2_lines,
            winner 
        });

        // Get player info for player 1 (current user)
        const player1 = await getQuery('SELECT id, username FROM players WHERE id = ?', [player_id]);
        if (!player1) {
            return reply.code(404).send({ error: 'Player not found' });
        }

        // For simultaneous games, we need to find the opponent by username
        // In a real implementation, you might want to pass opponent_id instead
        const player2 = await getQuery('SELECT id, username FROM players WHERE username = ?', [opponent]);
        if (!player2) {
            console.log(`Creating simultaneous match without opponent player ID for: ${opponent}`);
            // For now, we'll save with null player2_id to indicate local/test match
        }

        // Determine winner_id based on winner field
        let winner_id = null;
        if (winner === 'player1') {
            winner_id = player1.id;
        } else if (winner === 'player2' && player2) {
            winner_id = player2.id;
        }

        // Save the match to tetris_tournament_matches table
        await runQuery(`
            INSERT INTO tetris_tournament_matches (
                player1_id, player2_id, mode, play_type, winner_id,
                player1_score, player1_level, player1_lines,
                player2_score, player2_level, player2_lines,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            player1.id, 
            player2 ? player2.id : null, 
            mode, 
            'simultaneous',
            winner_id,
            player1_score, player1_level, player1_lines,
            player2_score, player2_level, player2_lines,
            Date.now()
        ]);

        // Remove any active matches for these players in simultaneous mode
        // This prevents the match from appearing in "Your turn" list
        if (player2) {
            await runQuery(`
                DELETE FROM tetris_active_matches 
                WHERE ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
                AND play_type = 'simultaneous'
                AND mode = ?
            `, [player1.id, player2.id, player2.id, player1.id, mode]);
            
            console.log(`Cleaned up active matches for simultaneous game: ${player1.username} vs ${player2.username}`);
        } else {
            // Fallback: Remove any active simultaneous matches for player1 in this mode
            // This handles cases where the opponent wasn't found by username
            await runQuery(`
                DELETE FROM tetris_active_matches 
                WHERE (player1_id = ? OR player2_id = ?)
                AND play_type = 'simultaneous'
                AND mode = ?
            `, [player1.id, player1.id, mode]);
            
            console.log(`Cleaned up active matches for player ${player1.username} in ${mode} mode (opponent not found by username)`);
        }

        console.log(`Simultaneous match saved: ${player1.username} vs ${opponent} in ${mode} mode`);
        
        reply.send({ 
            success: true, 
            message: 'Simultaneous match result saved successfully' 
        });
        
    } catch (error) {
        console.error('Error saving simultaneous match result:', error);
        reply.code(500).send({ error: 'Failed to save simultaneous match result' });
    }
  });

  function generateMatchId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};
