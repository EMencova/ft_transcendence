//added

async function tournamentsRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Helper function to wrap db operations in promises
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
        "SELECT * FROM tournaments ORDER BY start_date DESC",
        []
      );
      reply.send(tournaments);
    } catch (err) {
      reply.code(500).send({ error: "Database error" });
    }
  });

  // Create a new tournament
  fastify.post("/", async (request, reply) => {
    const { name, playerIds } = request.body;

    try {
      // Create tournament
      const result = await runQuery(
        "INSERT INTO tournaments (name) VALUES (?)",
        [name]
      );
      const tournamentId = result.lastID;

      // Add players to tournament
      for (const playerId of playerIds) {
        await runQuery(
          "INSERT INTO tournament_players (tournament_id, player_id) VALUES (?, ?)",
          [tournamentId, playerId]
        );
      }

      // Create tournament bracket
      await generateTournamentBracket(tournamentId, playerIds);

      reply.send({
        success: true,
        tournamentId,
      });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Get tournament details
  fastify.get("/:id", async (request, reply) => {
    try {
      const tournament = await getQuery(
        "SELECT * FROM tournaments WHERE id = ?",
        [request.params.id]
      );

      const players = await allQuery(
        `SELECT p.id, p.username, p.avatar, tp.eliminated
                 FROM tournament_players tp
                 JOIN players p ON tp.player_id = p.id
                 WHERE tp.tournament_id = ?`,
        [request.params.id]
      );

      const matches = await allQuery(
        `SELECT * FROM tournament_matches
                 WHERE tournament_id = ?
                 ORDER BY round, match_number`,
        [request.params.id]
      );

      reply.send({
        tournament,
        players,
        matches,
      });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Start a match
  fastify.post("/:id/matches/:matchId/start", async (request, reply) => {
    try {
      const match = await getQuery(
        "SELECT * FROM tournament_matches WHERE id = ?",
        [request.params.matchId]
      );

      // Initialize with full time (120 seconds) if not already set
      const timeRemaining = match.time_remaining || 120;

      await runQuery(
        `UPDATE tournament_matches
		 SET status = 'in_progress', time_remaining = ?
		 WHERE id = ?`,
        [timeRemaining, request.params.matchId]
      );

      reply.send({ success: true, timeRemaining });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // New endpoint to update time remaining
fastify.post("/:id/matches/:matchId/update-time", async (request, reply) => {
	const { timeRemaining } = request.body;

	try {
	  await runQuery(
		`UPDATE tournament_matches
		 SET time_remaining = ?
		 WHERE id = ?`,
		[timeRemaining, request.params.matchId]
	  );

	  reply.send({ success: true });
	} catch (err) {
	  reply.code(500).send({ error: err.message });
	}
});

  // Record match result
  fastify.post("/:id/matches/:matchId/result", async (request, reply) => {
    const { winnerId } = request.body;

    try {
      await runQuery(
        `UPDATE tournament_matches
                 SET winner_id = ?, status = 'completed'
                 WHERE id = ?`,
        [winnerId, request.params.matchId]
      );

      // Advance winner to next round if exists
      await advanceWinner(request.params.id, request.params.matchId, winnerId);

      reply.send({ success: true });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Helper function to generate tournament bracket
  async function generateTournamentBracket(tournamentId, playerIds) {
    const numPlayers = playerIds.length;
    let rounds = Math.ceil(Math.log2(numPlayers));
    let currentRound = 1;

    // Create first round matches
    for (let i = 0; i < numPlayers / 2; i++) {
      await runQuery(
        `INSERT INTO tournament_matches
                (tournament_id, round, match_number, player1_id, player2_id)
                VALUES (?, ?, ?, ?, ?)`,
        [
          tournamentId,
          currentRound,
          i + 1,
          playerIds[i * 2],
          playerIds[i * 2 + 1],
        ]
      );
    }

    // Create subsequent rounds
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

  // Helper function to advance winner to next round
  async function advanceWinner(tournamentId, matchId, winnerId) {
    const match = await getQuery(
      "SELECT * FROM tournament_matches WHERE id = ?",
      [matchId]
    );

    // Find next match in bracket
    const nextMatchNumber = Math.ceil(match.match_number / 2);
    const nextRound = match.round + 1;

    const nextMatch = await getQuery(
      `SELECT * FROM tournament_matches
             WHERE tournament_id = ?
             AND round = ?
             AND match_number = ?`,
      [tournamentId, nextRound, nextMatchNumber]
    );

    if (!nextMatch) return;

    // Determine if player1 or player2 slot to fill
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
