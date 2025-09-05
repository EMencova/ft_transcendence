async function tournamentsRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  const escapeHtml = (str) =>
    String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  fastify.get("/tournaments", async (request, reply) => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM tournament ORDER BY date DESC", [], (err, rows) => {
        if (err) return reject(reply.status(500).send({ error: "DB error" }));
        const escapedRows = rows.map((t) => ({ ...t, name: escapeHtml(t.name) }));
        resolve(reply.send({ tournaments: escapedRows }));
      });
    });
  });

  fastify.post("/tournaments/:id/register", async (request, reply) => {
    const tournamentId = parseInt(request.params.id);
    const playerId = request.user?.id || 1;

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO tournament_registrations (tournament_id, player_id) VALUES (?, ?)"
      );
      stmt.run(tournamentId, playerId, (err) => {
        if (err) return reject(reply.status(500).send({ error: "DB error" }));
        resolve(reply.send({ message: "Registered successfully" }));
      });
    });
  });

  fastify.get("/tournaments/:id/participants", async (request, reply) => {
    const tournamentId = parseInt(request.params.id);

    return new Promise((resolve, reject) => {
      db.all(
        "SELECT p.id, p.username, p.avatar, p.wins, p.losses FROM players p JOIN tournament_registrations tr ON tr.player_id = p.id WHERE tr.tournament_id = ?",
        [tournamentId],
        (err, rows) => {
          if (err) return reject(reply.status(500).send({ error: "DB error" }));
          const escapedRows = rows.map((p) => ({
            ...p,
            username: escapeHtml(p.username),
            avatar: escapeHtml(p.avatar || "")
          }));
          resolve(reply.send({ participants: escapedRows }));
        }
      );
    });
  });

  fastify.post("/tournaments", async (request, reply) => {
    let { name, playerIds } = request.body;
    if (!name || !Array.isArray(playerIds)) return reply.status(400).send({ error: "Invalid tournament data" });

    name = escapeHtml(name);

    return new Promise((resolve, reject) => {
      const stmt = db.prepare("INSERT INTO tournament (name, date, status) VALUES (?, ?, ?)");
      const now = new Date().toISOString();
      stmt.run(name, now, "scheduled", function (err) {
        if (err) return reject(reply.status(500).send({ error: "DB error" }));
        const tournamentId = this.lastID;
        const registerStmt = db.prepare("INSERT INTO tournament_registrations (tournament_id, player_id) VALUES (?, ?)");
        let registrationError = null;
        playerIds.forEach((playerId) => {
          registerStmt.run(tournamentId, playerId, (err) => { if (err) registrationError = err; });
        });
        if (registrationError) return reject(reply.status(500).send({ error: "Error registering players" }));
        generateInitialMatches(db, tournamentId, playerIds)
          .then(() => resolve(reply.status(201).send({ message: "Tournament created", tournamentId })))
          .catch(() => reject(reply.status(500).send({ error: "Error generating initial matches" })));
      });
    });
  });

  fastify.get("/tournaments/:id", async (request, reply) => {
    const tournamentId = parseInt(request.params.id);
    if (isNaN(tournamentId)) return reply.status(400).send({ error: "Invalid tournament ID" });

    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM tournament WHERE id = ?", [tournamentId], (err, tournament) => {
        if (err) return reject(reply.status(500).send({ error: "DB error" }));
        if (!tournament) return reject(reply.status(404).send({ error: "Tournament not found" }));
        tournament.name = escapeHtml(tournament.name);
        db.all(
          "SELECT p.id, p.username, p.avatar, p.wins, p.losses FROM players p JOIN tournament_registrations tr ON tr.player_id = p.id WHERE tr.tournament_id = ?",
          [tournamentId],
          (err, players) => {
            if (err) return reject(reply.status(500).send({ error: "DB error" }));
            const escapedPlayers = players.map((p) => ({
              ...p,
              username: escapeHtml(p.username),
              avatar: escapeHtml(p.avatar || "")
            }));
            db.all("SELECT * FROM tournament_matches WHERE tournament_id = ? ORDER BY round, match_number", [tournamentId], (err, matches) => {
              if (err) return reject(reply.status(500).send({ error: "DB error" }));
              resolve(reply.send({ tournament, players: escapedPlayers, matches: matches || [] }));
            });
          }
        );
      });
    });
  });

  fastify.post("/tournaments/matches/:id/result", async (request, reply) => {
    const matchId = parseInt(request.params.id);
    const winnerId = parseInt(request.body.winnerId);
    if (isNaN(matchId) || isNaN(winnerId)) return reply.status(400).send({ error: "Invalid match or winner ID" });

    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM tournament_matches WHERE id = ?", [matchId], (err, match) => {
        if (err || !match) return reject(reply.status(err ? 500 : 404).send({ error: err ? "DB error" : "Match not found" }));
        if (match.status !== "in_progress") return reject(reply.status(400).send({ error: `Match status: ${match.status}` }));
        if (![match.player1_id, match.player2_id].includes(winnerId)) return reject(reply.status(400).send({ error: "Winner not in this match" }));

        db.serialize(() => {
          db.run("BEGIN TRANSACTION", (err) => {
            if (err) return reject(reply.status(500).send({ error: "DB error" }));
            db.run("UPDATE tournament_matches SET winner_id = ?, status = ? WHERE id = ?", [winnerId, "completed", matchId], (err) => {
              if (err) { db.run("ROLLBACK"); return reject(reply.status(500).send({ error: "Error updating match" })); }
              db.get("SELECT COUNT(*) as count FROM tournament_matches WHERE tournament_id = ? AND status != ? AND id != ?", [match.tournament_id, "completed", matchId], (err, result) => {
                if (err) { db.run("ROLLBACK"); return reject(reply.status(500).send({ error: "Error counting matches" })); }
                const isFinalMatch = result.count === 0;
                if (isFinalMatch) {
                  db.run("UPDATE tournament SET status = ?, winner_id = ? WHERE id = ?", ["completed", winnerId, match.tournament_id], (err) => {
                    if (err) { db.run("ROLLBACK"); return reject(reply.status(500).send({ error: "Error updating tournament winner" })); }
                    db.run("COMMIT", (err) => { if (err) { db.run("ROLLBACK"); return reject(reply.status(500).send({ error: "Error committing transaction" })); }
                      resolve(reply.send({ message: "Tournament completed", tournamentWinner: winnerId, tournamentComplete: true }));
                    });
                  });
                } else {
                  createNextRoundMatch(db, match, winnerId, (err) => {
                    if (err) { db.run("ROLLBACK"); return reject(reply.status(500).send({ error: "Error creating next round" })); }
                    db.run("COMMIT", (err) => { if (err) { db.run("ROLLBACK"); return reject(reply.status(500).send({ error: "Error committing transaction" })); }
                      resolve(reply.send({ message: "Match result recorded", winner: winnerId }));
                    });
                  });
                }
              });
            });
          });
        });
      });
    });
  });

  fastify.post("/tournaments/matches/:id/start", async (request, reply) => {
    const matchId = parseInt(request.params.id);
    if (isNaN(matchId)) return reply.status(400).send({ error: "Invalid match ID" });
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM tournament_matches WHERE id = ?", [matchId], (err, match) => {
        if (err) return reject(reply.status(500).send({ error: "DB error" }));
        if (!match) return reject(reply.status(404).send({ error: "Match not found" }));
        if (match.status !== "scheduled") return reject(reply.status(400).send({ error: `Match status: ${match.status}` }));
        db.run("UPDATE tournament_matches SET status = ? WHERE id = ?", ["in_progress", matchId], (err) => {
          if (err) return reject(reply.status(500).send({ error: "DB error" }));
          resolve(reply.send({ message: "Match started" }));
        });
      });
    });
  });

  fastify.post("/tournaments/matches/:id/continue", async (request, reply) => {
    const matchId = parseInt(request.params.id);
    if (isNaN(matchId)) return reply.status(400).send({ error: "Invalid match ID" });
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM tournament_matches WHERE id = ?", [matchId], (err, match) => {
        if (err) return reject(reply.status(500).send({ error: "DB error" }));
        if (!match) return reject(reply.status(404).send({ error: "Match not found" }));
        if (match.status !== "in_progress") return reject(reply.status(400).send({ error: `Match status: ${match.status}` }));
        const gameState = { timeRemaining: match.time_remaining || 120, score1: match.score1 || 0, score2: match.score2 || 0 };
        resolve(reply.send({ message: "Match can continue", match, gameState }));
      });
    });
  });

  fastify.post("/tournaments/matches/:id/pause", async (request, reply) => {
    const matchId = parseInt(request.params.id);
    const { timeRemaining, score1, score2 } = request.body;
    if (isNaN(matchId)) return reply.status(400).send({ error: "Invalid match ID" });
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM tournament_matches WHERE id = ?", [matchId], (err, match) => {
        if (err) return reject(reply.status(500).send({ error: "DB error" }));
        if (!match) return reject(reply.status(404).send({ error: "Match not found" }));
        if (match.status !== "in_progress") return reject(reply.status(400).send({ error: `Match status: ${match.status}` }));
        const updateFields = [];
        const updateValues = [];
        if (timeRemaining !== undefined) { updateFields.push("time_remaining = ?"); updateValues.push(timeRemaining); }
        if (score1 !== undefined) { updateFields.push("score1 = ?"); updateValues.push(score1); }
        if (score2 !== undefined) { updateFields.push("score2 = ?"); updateValues.push(score2); }
        if (updateFields.length === 0) return resolve(reply.send({ message: "No changes" }));
        updateValues.push(matchId);
        db.run(`UPDATE tournament_matches SET ${updateFields.join(", ")} WHERE id = ?`, updateValues, (err) => {
          if (err) return reject(reply.status(500).send({ error: "DB error" }));
          resolve(reply.send({ message: "Match state saved" }));
        });
      });
    });
  });

  fastify.post("/tournaments/matches/:id/score", async (request, reply) => {
    const matchId = parseInt(request.params.id);
    const { score1, score2 } = request.body;
    if (isNaN(matchId) || typeof score1 !== "number" || typeof score2 !== "number") return reply.status(400).send({ error: "Invalid input" });
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM tournament_matches WHERE id = ?", [matchId], (err, match) => {
        if (err) return reject(reply.status(500).send({ error: "DB error" }));
        if (!match) return reject(reply.status(404).send({ error: "Match not found" }));
        if (match.status !== "in_progress") return reject(reply.status(400).send({ error: `Match status: ${match.status}` }));
        db.run("UPDATE tournament_matches SET score1 = ?, score2 = ? WHERE id = ?", [score1, score2, matchId], function (err) {
          if (err) return reject(reply.status(500).send({ error: "DB error" }));
          if (this.changes === 0) return reject(reply.status(404).send({ error: "Match not found" }));
          resolve(reply.send({ message: "Scores updated", matchId, score1, score2 }));
        });
      });
    });
  });

  db.run("ALTER TABLE tournament_matches ADD COLUMN score1 INTEGER DEFAULT 0", () => {});
  db.run("ALTER TABLE tournament_matches ADD COLUMN score2 INTEGER DEFAULT 0", () => {});

  function generateInitialMatches(db, tournamentId, playerIds) {
    return new Promise((resolve, reject) => {
      const playerCount = playerIds.length;
      const firstRoundMatches = Math.floor(playerCount / 2);
      const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);
      const insertPromises = [];
      for (let i = 0; i < firstRoundMatches; i++) {
        const player1Id = shuffledPlayers[i * 2];
        const player2Id = shuffledPlayers[i * 2 + 1];
        insertPromises.push(new Promise((res, rej) => {
          db.run("INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id, status) VALUES (?, ?, ?, ?, ?, ?)",
            [tournamentId, 1, i + 1, player1Id, player2Id, "scheduled"], (err) => { if (err) rej(err); else res(); });
        }));
      }
      Promise.all(insertPromises).then(resolve).catch(reject);
    });
  }

  function createNextRoundMatch(db, currentMatch, winnerId, callback) {
    const matchNumber = currentMatch.match_number;
    const nextRound = currentMatch.round + 1;
    const nextMatchNumber = Math.ceil(matchNumber / 2);
    const isOddMatch = matchNumber % 2 === 1;
    db.get("SELECT * FROM tournament_matches WHERE tournament_id = ? AND round = ? AND match_number = ?",
      [currentMatch.tournament_id, nextRound, nextMatchNumber],
      (err, nextMatch) => {
        if (err) return callback(err);
        if (nextMatch) {
          const updateField = isOddMatch ? "player1_id" : "player2_id";
          db.run(`UPDATE tournament_matches SET ${updateField} = ? WHERE id = ?`, [winnerId, nextMatch.id], callback);
        } else {
          const player1Id = isOddMatch ? winnerId : null;
          const player2Id = isOddMatch ? null : winnerId;
          db.run("INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id, status) VALUES (?, ?, ?, ?, ?, ?)",
            [currentMatch.tournament_id, nextRound, nextMatchNumber, player1Id, player2Id, "scheduled"], callback);
        }
      }
    );
  }
}

module.exports = tournamentsRoutes;

