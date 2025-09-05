function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function tournamentsRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  function runQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  function getQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  function allQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get all tournaments
  fastify.get("/", async (request, reply) => {
    try {
      const tournaments = await allQuery(
        "SELECT * FROM tournament ORDER BY start_date DESC",
        []
      );
      // Sanitize user-provided tournament names
      tournaments.forEach(t => t.name = escapeHtml(t.name));
      reply.send(tournaments);
    } catch (err) {
      reply.code(500).send({ error: "Database error" });
    }
  });

  // Create a new tournament
  fastify.post("/", async (request, reply) => {
    const { name, playerIds } = request.body;
    if (!name || !Array.isArray(playerIds) || playerIds.some(id => isNaN(parseInt(id, 10)))) {
      return reply.code(400).send({ error: "Invalid tournament name or player IDs" });
    }

    try {
      const result = await runQuery(
        "INSERT INTO tournament (name) VALUES (?)",
        [name]
      );
      const tournamentId = result.lastID;

      for (const playerId of playerIds) {
        await runQuery(
          "INSERT INTO tournament_players (tournament_id, player_id) VALUES (?, ?)",
          [tournamentId, parseInt(playerId, 10)]
        );
      }

      await generateTournamentBracket(tournamentId, playerIds);

      reply.send({ success: true, tournamentId });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Get tournament details
  fastify.get("/:id", async (request, reply) => {
    const tournamentId = parseInt(request.params.id, 10);
    if (!tournamentId) return reply.code(400).send({ error: "Invalid tournament ID" });

    try {
      const tournament = await getQuery(
        "SELECT * FROM tournament WHERE id = ?",
        [tournamentId]
      );
      if (!tournament) return reply.code(404).send({ error: "Tournament not found" });

      tournament.name = escapeHtml(tournament.name);

      const players = await allQuery(
        `SELECT p.id, p.username, p.avatar, tp.eliminated
         FROM tournament_players tp
         JOIN players p ON tp.player_id = p.id
         WHERE tp.tournament_id = ?`,
        [tournamentId]
      );

      const matches = await allQuery(
        `SELECT * FROM tournament_matches
         WHERE tournament_id = ?
         ORDER BY round, match_number`,
        [tournamentId]
      );

      reply.send({ tournament, players, matches });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Start match
  fastify.post("/:id/matches/:matchId/start", async (request, reply) => {
    const matchId = parseInt(request.params.matchId, 10);
    if (!matchId) return reply.code(400).send({ error: "Invalid match ID" });

    try {
      const match = await getQuery(
        "SELECT * FROM tournament_matches WHERE id = ?",
        [matchId]
      );
      if (!match) return reply.code(404).send({ error: "Match not found" });

      const timeRemaining = match.time_remaining || 120;

      await runQuery(
        `UPDATE tournament_matches
         SET status = 'in_progress', time_remaining = ?
         WHERE id = ?`,
        [timeRemaining, matchId]
      );

      reply.send({ success: true, timeRemaining });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Record match result
  fastify.post("/:id/matches/:matchId/result", async (request, reply) => {
    const matchId = parseInt(request.params.matchId, 10);
    const winnerId = parseInt(request.body.winnerId, 10);
    if (!matchId || !winnerId) return reply.code(400).send({ error: "Invalid IDs" });

    try {
      await runQuery(
        `UPDATE tournament_matches
         SET winner_id = ?, status = 'completed'
         WHERE id = ?`,
        [winnerId, matchId]
      );

      await advanceWinner(parseInt(request.params.id, 10), matchId, winnerId);

      reply.send({ success: true });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Helpers remain mostly unchanged
  async function generateTournamentBracket(tournamentId, playerIds) {
    const numPlayers = playerIds.length;
    let rounds = Math.ceil(Math.log2(numPlayers));
    let currentRound = 1;

    for (let i = 0; i < numPlayers / 2; i++) {
      await runQuery(
        `INSERT INTO tournament_matches
         (tournament_id, round, match_number, player1_id, player2_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          tournamentId,
          currentRound,
          i + 1,
          parseInt(playerIds[i * 2], 10),
          parseInt(playerIds[i * 2 + 1], 10),
        ]
      );
    }

    currentRound++;
    while (currentRound <= rounds) {
      const numMatches = Math.pow(2, rounds - currentRound);
      for (let i = 1; i <= numMatches; i++) {
        await runQuery(
          `INSERT INTO tournament_matches
           (tournament_id, round, match_number)
           VALUES (?, ?, ?)`,
          [tournamentId, currentRound, i]
        );
      }
      currentRound++;
    }
  }

  async function advanceWinner(tournamentId, matchId, winnerId) {
    const match = await getQuery(
      "SELECT * FROM tournament_matches WHERE id = ?",
      [matchId]
    );
    if (!match) return;

    const nextMatchNumber = Math.ceil(match.match_number / 2);
    const nextRound = match.round + 1;

    const nextMatch = await getQuery(
      `SELECT * FROM tournament_matches
       WHERE tournament_id = ? AND round = ? AND match_number = ?`,
      [tournamentId, nextRound, nextMatchNumber]
    );
    if (!nextMatch) return;

    // Slot is determined internally, safe
    const slot = match.match_number % 2 === 1 ? "player1_id" : "player2_id";

    await runQuery(
      `UPDATE tournament_matches
       SET ${slot} = ?
       WHERE id = ?`,
      [winnerId, nextMatch.id]
    );
  }
}

module.exports = tournamentsRoutes;

