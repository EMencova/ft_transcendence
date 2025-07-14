async function tournamentsRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Get all tournaments
  fastify.get("/tournaments", async (request, reply) => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM tournament ORDER BY date DESC", [], (err, rows) => {
        if (err) {
          console.error("Error fetching tournaments:", err);
          return reject(reply.status(500).send({ error: "DB error" }));
        }
        resolve(reply.send({ tournaments: rows }));
      });
    });
  });

  // Register player to a tournament
  fastify.post("/tournaments/:id/register", async (request, reply) => {
    const tournamentId = parseInt(request.params.id);
    const playerId = request.user?.id || 1; // TEMP

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO tournament_registrations (tournament_id, player_id) VALUES (?, ?)"
      );
      stmt.run(tournamentId, playerId, (err) => {
        if (err) {
          console.error("Registration error:", err.message);
          return reject(reply.status(500).send({ error: "DB error" }));
        }
        resolve(reply.send({ message: "Registered successfully" }));
      });
    });
  });

  // Get participants for a tournament
  fastify.get("/tournaments/:id/participants", async (request, reply) => {
    const tournamentId = parseInt(request.params.id);

    return new Promise((resolve, reject) => {
      db.all(
        `
			SELECT p.id, p.username, p.wins, p.losses
			FROM players p
			JOIN tournament_registrations tr ON tr.player_id = p.id
			WHERE tr.tournament_id = ?
		  `,
        [tournamentId],
        (err, rows) => {
          if (err) return reject(reply.status(500).send({ error: "DB error" }));
          resolve(reply.send({ participants: rows }));
        }
      );
    });
  });

  fastify.post("/tournaments", async (request, reply) => {
    const { name, playerIds } = request.body;

    if (!Array.isArray(playerIds)) {
      return reply.status(400).send({ error: "playerIds must be an array" });
    }

    // Add debug logging
    console.log(`Creating tournament ${name} with players:`, playerIds);

    if (!name || !playerIds || !Array.isArray(playerIds)) {
      return reply.status(400).send({ error: "Invalid tournament data" });
    }

    return new Promise((resolve, reject) => {
      // Create a new tournament - match the columns in your schema
      const stmt = db.prepare(
        "INSERT INTO tournament (name, date, status) VALUES (?, ?, ?)"
      );

      const now = new Date().toISOString();
      stmt.run(name, now, "scheduled", function (err) {
        if (err) {
          console.error("Error creating tournament:", err.message);
          return reject(
            reply.status(500).send({ error: "Database error: " + err.message })
          );
        }

        const tournamentId = this.lastID;

        // Register players for the tournament
        const registerStmt = db.prepare(
          "INSERT INTO tournament_registrations (tournament_id, player_id) VALUES (?, ?)"
        );

        let registrationError = null;

        playerIds.forEach((playerId) => {
          registerStmt.run(tournamentId, playerId, (err) => {
            if (err) registrationError = err;
          });
        });

        if (registrationError) {
          console.error(
            "Error registering players:",
            registrationError.message
          );
          return reject(
            reply.status(500).send({ error: "Error registering players" })
          );
        }

        generateInitialMatches(db, tournamentId, playerIds)
          .then(() => {
            resolve(
              reply.status(201).send({
                message: "Tournament created successfully",
                tournamentId,
              })
            );
          })
          .catch((err) => {
            console.error("Error generating initial matches:", err.message);
            reject(
              reply
                .status(500)
                .send({ error: "Error generating initial matches" })
            );
          });
      });
    });
  });

  // Get tournament by ID
  fastify.get("/tournaments/:id", async (request, reply) => {
    const tournamentId = parseInt(request.params.id);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: "Invalid tournament ID" });
    }

    return new Promise((resolve, reject) => {
      // Get tournament details
      db.get(
        "SELECT * FROM tournament WHERE id = ?",
        [tournamentId],
        (err, tournament) => {
          if (err) {
            console.error("Error fetching tournament:", err);
            return reject(reply.status(500).send({ error: "Database error" }));
          }

          if (!tournament) {
            return reject(
              reply.status(404).send({ error: "Tournament not found" })
            );
          }

          // Get participants
          db.all(
            `
			  SELECT p.id, p.username, p.avatar, p.wins, p.losses
			  FROM players p
			  JOIN tournament_registrations tr ON tr.player_id = p.id
			  WHERE tr.tournament_id = ?
			`,
            [tournamentId],
            (err, players) => {
              if (err) {
                console.error("Error fetching participants:", err);
                return reject(
                  reply.status(500).send({ error: "Database error" })
                );
              }

              // Get matches
              db.all(
                `
				SELECT * FROM tournament_matches
				WHERE tournament_id = ?
				ORDER BY round, match_number
			  `,
                [tournamentId],
                (err, matches) => {
                  if (err) {
                    console.error("Error fetching matches:", err);
                    return reject(
                      reply.status(500).send({ error: "Database error" })
                    );
                  }

                  resolve(
                    reply.send({
                      tournament,
                      players,
                      matches: matches || [],
                    })
                  );
                }
              );
            }
          );
        }
      );
    });
  });

  fastify.post("/tournaments/matches/:id/result", async (request, reply) => {
    const matchId = parseInt(request.params.id);
    const { winnerId } = request.body;

    if (isNaN(matchId) || !winnerId) {
      return reply.status(400).send({ error: "Invalid match ID or winner ID" });
    }

    const winnerIdInt = parseInt(winnerId);

    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM tournament_matches WHERE id = ?",
        [matchId],
        (err, match) => {
          if (err || !match) {
            const msg = err
              ? "Database error fetching match"
              : "Match not found";
            return reject(reply.status(err ? 500 : 404).send({ error: msg }));
          }

          if (match.status !== "in_progress") {
            return reject(
              reply.status(400).send({
                error: `Match result cannot be recorded. Current status: ${match.status}`,
              })
            );
          }

          if (![match.player1_id, match.player2_id].includes(winnerIdInt)) {
            return reject(
              reply.status(400).send({
                error: "Winner ID does not match either player in this match",
              })
            );
          }

          db.serialize(() => {
            db.run("BEGIN TRANSACTION", (err) => {
              if (err)
                return reject(
                  reply
                    .status(500)
                    .send({ error: "Database error starting transaction" })
                );

              db.run(
                "UPDATE tournament_matches SET winner_id = ?, status = ? WHERE id = ?",
                [winnerIdInt, "completed", matchId],
                (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return reject(
                      reply
                        .status(500)
                        .send({ error: "Error updating match result" })
                    );
                  }

                  // Check if there are any incomplete matches left
                  db.get(
                    "SELECT COUNT(*) as count FROM tournament_matches WHERE tournament_id = ? AND status != ? AND id != ?",
                    [match.tournament_id, "completed", matchId],
                    (err, result) => {
                      if (err) {
                        db.run("ROLLBACK");
                        return reject(
                          reply
                            .status(500)
                            .send({ error: "Error counting matches" })
                        );
                      }

                      const isFinalMatch = result.count === 0;

                      if (isFinalMatch) {
                        db.run(
                          "UPDATE tournament SET status = ?, winner_id = ? WHERE id = ?",
                          ["completed", winnerIdInt, match.tournament_id],
                          (err) => {
                            if (err) {
                              db.run("ROLLBACK");
                              return reject(
                                reply.status(500).send({
                                  error: "Error updating tournament winner",
                                })
                              );
                            }

                            db.run("COMMIT", (err) => {
                              if (err) {
                                db.run("ROLLBACK");
                                return reject(
                                  reply.status(500).send({
                                    error: "Error committing transaction",
                                  })
                                );
                              }

                              resolve(
                                reply.send({
                                  message:
                                    "Tournament completed! Winner declared!",
                                  tournamentWinner: winnerIdInt,
                                  tournamentComplete: true,
                                })
                              );
                            });
                          }
                        );
                      } else {
                        createNextRoundMatch(db, match, winnerIdInt, (err) => {
                          if (err) {
                            db.run("ROLLBACK");
                            return reject(
                              reply.status(500).send({
                                error: "Error creating next round match",
                              })
                            );
                          }

                          db.run("COMMIT", (err) => {
                            if (err) {
                              db.run("ROLLBACK");
                              return reject(
                                reply.status(500).send({
                                  error: "Error committing transaction",
                                })
                              );
                            }

                            resolve(
                              reply.send({
                                message: "Match result recorded successfully",
                                winner: winnerIdInt,
                              })
                            );
                          });
                        });
                      }
                    }
                  );
                }
              );
            });
          });
        }
      );
    });
  });

  // Start a match
  fastify.post("/tournaments/matches/:id/start", async (request, reply) => {
    const matchId = parseInt(request.params.id);

    if (isNaN(matchId)) {
      return reply.status(400).send({ error: "Invalid match ID" });
    }

    return new Promise((resolve, reject) => {
      // First check if the match exists and is in 'scheduled' status
      db.get(
        "SELECT * FROM tournament_matches WHERE id = ?",
        [matchId],
        (err, match) => {
          if (err) {
            console.error("Error fetching match:", err);
            return reject(reply.status(500).send({ error: "Database error" }));
          }

          if (!match) {
            return reject(reply.status(404).send({ error: "Match not found" }));
          }

          if (match.status !== "scheduled") {
            return reject(
              reply.status(400).send({
                error: `Match cannot be started. Current status: ${match.status}`,
              })
            );
          }

          // Update match status to in_progress
          db.run(
            "UPDATE tournament_matches SET status = ? WHERE id = ?",
            ["in_progress", matchId],
            (err) => {
              if (err) {
                console.error("Error starting match:", err);
                return reject(
                  reply.status(500).send({ error: "Database error" })
                );
              }

              resolve(reply.send({ message: "Match started successfully" }));
            }
          );
        }
      );
    });
  });

  // Continue a match that's already in progress (enhanced version)
  fastify.post("/tournaments/matches/:id/continue", async (request, reply) => {
    const matchId = parseInt(request.params.id);

    if (isNaN(matchId)) {
      return reply.status(400).send({ error: "Invalid match ID" });
    }

    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM tournament_matches WHERE id = ?",
        [matchId],
        (err, match) => {
          if (err) {
            console.error("Error fetching match:", err);
            return reject(reply.status(500).send({ error: "Database error" }));
          }

          if (!match) {
            return reject(reply.status(404).send({ error: "Match not found" }));
          }

          // Check if match is actually in progress
          if (match.status !== "in_progress") {
            return reject(
              reply.status(400).send({
                error: `Match is not in progress. Current status: ${match.status}`,
              })
            );
          }

          // Return match data with any saved game state
          const gameState = {
            timeRemaining: match.time_remaining || 120,
            score1: match.score1 || 0,
            score2: match.score2 || 0,
          };

          resolve(
            reply.send({
              message: "Match can be continued",
              match: match,
              gameState: gameState,
            })
          );
        }
      );
    });
  });

  // Helper function to generate initial tournament matches
  function generateInitialMatches(db, tournamentId, playerIds) {
    return new Promise((resolve, reject) => {
      const playerCount = playerIds.length;
      const firstRoundMatches = playerCount / 2;

      console.log(
        `Generating ${firstRoundMatches} initial matches for ${playerCount} players`
      );

      // Shuffle players for random matchups
      const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);

      // Create first round matches
      const insertPromises = [];
      for (let i = 0; i < firstRoundMatches; i++) {
        const player1Id = shuffledPlayers[i * 2];
        const player2Id = shuffledPlayers[i * 2 + 1];
        const matchNumber = i + 1;

        const insertPromise = new Promise((resolveMatch, rejectMatch) => {
          db.run(
            `INSERT INTO tournament_matches
					  (tournament_id, round, match_number, player1_id, player2_id, status)
					  VALUES (?, ?, ?, ?, ?, ?)`,
            [tournamentId, 1, matchNumber, player1Id, player2Id, "scheduled"],
            function (err) {
              if (err) {
                console.error(`Error creating match ${matchNumber}:`, err);
                return rejectMatch(err);
              }
              console.log(
                `Created match ${matchNumber}: Player ${player1Id} vs Player ${player2Id}`
              );
              resolveMatch();
            }
          );
        });

        insertPromises.push(insertPromise);
      }

      Promise.all(insertPromises)
        .then(() => {
          console.log(
            `Successfully created all ${firstRoundMatches} initial matches`
          );
          resolve();
        })
        .catch((err) => {
          console.error("Error creating initial matches:", err);
          reject(err);
        });
    });
  }

  // Helper function to create the next round match
  function createNextRoundMatch(db, currentMatch, winnerId, callback) {
    // Find if this match has a pair match in the same round
    const matchNumber = currentMatch.match_number;
    const nextRound = currentMatch.round + 1;
    const nextMatchNumber = Math.ceil(matchNumber / 2);

    // Determine if this is an odd or even match number to know which player position to fill
    const isOddMatch = matchNumber % 2 === 1;

    // Find the next round match or create it
    db.get(
      "SELECT * FROM tournament_matches WHERE tournament_id = ? AND round = ? AND match_number = ?",
      [currentMatch.tournament_id, nextRound, nextMatchNumber],
      (err, nextMatch) => {
        if (err) return callback(err);

        if (nextMatch) {
          // Update existing next round match with this winner
          const updateField = isOddMatch ? "player1_id" : "player2_id";

          db.run(
            `UPDATE tournament_matches SET ${updateField} = ? WHERE id = ?`,
            [winnerId, nextMatch.id],
            callback
          );
        } else {
          // Create a new match for the next round
          const player1Id = isOddMatch ? winnerId : null;
          const player2Id = isOddMatch ? null : winnerId;

          db.run(
            `INSERT INTO tournament_matches
					  (tournament_id, round, match_number, player1_id, player2_id, status)
					  VALUES (?, ?, ?, ?, ?, ?)`,
            [
              currentMatch.tournament_id,
              nextRound,
              nextMatchNumber,
              player1Id,
              player2Id,
              "scheduled",
            ],
            callback
          );
        }
      }
    );
  }

  // Get match by ID
  fastify.get("/tournaments/matches/:id", async (request, reply) => {
    const matchId = parseInt(request.params.id);

    if (isNaN(matchId)) {
      return reply.status(400).send({ error: "Invalid match ID" });
    }

    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM tournament_matches WHERE id = ?",
        [matchId],
        (err, match) => {
          if (err) {
            console.error("Error fetching match:", err);
            return reject(reply.status(500).send({ error: "Database error" }));
          }

          if (!match) {
            return reject(reply.status(404).send({ error: "Match not found" }));
          }

          resolve(reply.send(match));
        }
      );
    });
  });

  fastify.post(
    "/tournaments/matches/:id/update-time",
    async (request, reply) => {
      const matchId = parseInt(request.params.id);
      const { timeRemaining } = request.body;

      if (isNaN(matchId)) {
        return reply.status(400).send({ error: "Invalid match ID" });
      }

      if (typeof timeRemaining !== "number") {
        return reply
          .status(400)
          .send({ error: "Invalid time remaining value" });
      }

      return new Promise((resolve, reject) => {
        db.run(
          "UPDATE tournament_matches SET time_remaining = ? WHERE id = ?",
          [timeRemaining, matchId],
          function (err) {
            if (err) {
              console.error("Error updating match time:", err);
              return reject(
                reply.status(500).send({ error: "Database error" })
              );
            }

            if (this.changes === 0) {
              return reject(
                reply.status(404).send({ error: "Match not found" })
              );
            }

            resolve(
              reply.send({
                message: "Time updated successfully",
                timeRemaining: timeRemaining,
              })
            );
          }
        );
      });
    }
  );

  // Update match score (without ending the match)
  fastify.post("/tournaments/matches/:id/score", async (request, reply) => {
    const matchId = parseInt(request.params.id);
    const { score1, score2 } = request.body;

    if (isNaN(matchId)) {
      return reply.status(400).send({ error: "Invalid match ID" });
    }

    if (typeof score1 !== "number" || typeof score2 !== "number") {
      return reply.status(400).send({ error: "Invalid score values" });
    }

    return new Promise((resolve, reject) => {
      // First check if match exists and is in progress
      db.get(
        "SELECT * FROM tournament_matches WHERE id = ?",
        [matchId],
        (err, match) => {
          if (err) {
            console.error("Error fetching match:", err);
            return reject(reply.status(500).send({ error: "Database error" }));
          }

          if (!match) {
            return reject(reply.status(404).send({ error: "Match not found" }));
          }

          if (match.status !== "in_progress") {
            return reject(
              reply.status(400).send({
                error: `Cannot update score. Match status: ${match.status}`,
              })
            );
          }

          // Update the scores
          db.run(
            "UPDATE tournament_matches SET score1 = ?, score2 = ? WHERE id = ?",
            [score1, score2, matchId],
            function (err) {
              if (err) {
                console.error("Error updating match scores:", err);
                return reject(
                  reply.status(500).send({ error: "Database error" })
                );
              }

              if (this.changes === 0) {
                return reject(
                  reply.status(404).send({ error: "Match not found" })
                );
              }

              resolve(
                reply.send({
                  message: "Scores updated successfully",
                  matchId: matchId,
                  score1: score1,
                  score2: score2,
                })
              );
            }
          );
        }
      );
    });
  });

  // Add score columns if they don't exist
  db.run(
    `
	ALTER TABLE tournament_matches ADD COLUMN score1 INTEGER DEFAULT 0;
  `,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Failed to add score1 column:", err.message);
      }
    }
  );

  db.run(
    `
	ALTER TABLE tournament_matches ADD COLUMN score2 INTEGER DEFAULT 0;
  `,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Failed to add score2 column:", err.message);
      }
    }
  );

  fastify.post('/tournaments/matches/:id/pause', async (request, reply) => {
  const matchId = parseInt(request.params.id);
  const { timeRemaining, score1, score2 } = request.body;
  
  if (isNaN(matchId)) {
    return reply.status(400).send({ error: 'Invalid match ID' });
  }
  
  return new Promise((resolve, reject) => {
    // First check if the match exists and is in 'in_progress' status
    db.get('SELECT * FROM tournament_matches WHERE id = ?', [matchId], (err, match) => {
      if (err) {
        console.error('Error fetching match:', err);
        return reject(reply.status(500).send({ error: 'Database error' }));
      }
      
      if (!match) {
        return reject(reply.status(404).send({ error: 'Match not found' }));
      }
      
      if (match.status !== 'in_progress') {
        return reject(reply.status(400).send({ 
          error: `Match cannot be paused. Current status: ${match.status}` 
        }));
      }
      
      // Update match with saved state
      const updateFields = [];
      const updateValues = [];
      
      if (timeRemaining !== undefined) {
        updateFields.push('time_remaining = ?');
        updateValues.push(timeRemaining);
      }
      
      if (score1 !== undefined) {
        updateFields.push('score1 = ?');
        updateValues.push(score1);
      }
      
      if (score2 !== undefined) {
        updateFields.push('score2 = ?');
        updateValues.push(score2);
      }
      
      if (updateFields.length === 0) {
        return resolve(reply.send({ message: 'No changes to save' }));
      }
      
      updateValues.push(matchId);
      
      db.run(
        `UPDATE tournament_matches SET ${updateFields.join(', ')} WHERE id = ?`, 
        updateValues, 
        (err) => {
          if (err) {
            console.error('Error pausing match:', err);
            return reject(reply.status(500).send({ error: 'Database error' }));
          }
          
          resolve(reply.send({ message: 'Match state saved successfully' }));
        }
      );
    });
  });
});
}

module.exports = tournamentsRoutes;
