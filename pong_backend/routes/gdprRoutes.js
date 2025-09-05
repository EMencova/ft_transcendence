const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function gdprRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Helper function to promisify database queries
  function runQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
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

  function getAllQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // 1. Data Export - User can download all their personal data
  fastify.get('/gdpr/export/:userId', async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      return reply.status(400).send({ error: 'User ID is required.' });
    }

    try {
      // Get user profile data
      const user = await getQuery(
        'SELECT id, username, email, wins, losses, avatar FROM players WHERE id = ?',
        [userId]
      );

      if (!user) {
        return reply.status(404).send({ error: 'User not found.' });
      }

      // Get game history
      const gameHistory = await getAllQuery(`
        SELECT 
          g.id, g.player1_score, g.player2_score, g.winner_id, 
          g.created_at, g.game_type,
          CASE 
            WHEN g.player1_id = ? THEN 'Player 1'
            WHEN g.player2_id = ? THEN 'Player 2'
            ELSE 'Unknown'
          END as user_position
        FROM games g 
        WHERE g.player1_id = ? OR g.player2_id = ?
        ORDER BY g.created_at DESC
      `, [userId, userId, userId, userId]);

      // Get tournament participation
      const tournaments = await getAllQuery(`
        SELECT t.name, tr.registered_at, t.status, t.winner_id
        FROM tournament_registrations tr
        JOIN tournament t ON tr.tournament_id = t.id
        WHERE tr.player_id = ?
        ORDER BY tr.registered_at DESC
      `, [userId]);

      // Get friends data
      const friends = await getAllQuery(`
        SELECT 
          CASE 
            WHEN f.player_id = ? THEN p2.username
            ELSE p1.username
          END as friend_username,
          f.status, f.created_at
        FROM friends f
        LEFT JOIN players p1 ON f.player_id = p1.id
        LEFT JOIN players p2 ON f.friend_id = p2.id
        WHERE f.player_id = ? OR f.friend_id = ?
      `, [userId, userId, userId]);

      // Get Tetris history if exists
      const tetrisHistory = await getAllQuery(
        'SELECT score, level, lines_cleared, game_date FROM tetris_history WHERE player_id = ? ORDER BY game_date DESC',
        [userId]
      );

      const exportData = {
        export_date: new Date().toISOString(),
        personal_data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          statistics: {
            wins: user.wins,
            losses: user.losses
          }
        },
        game_history: gameHistory,
        tournament_participation: tournaments,
        friends: friends,
        tetris_history: tetrisHistory,
        data_retention_info: {
          message: "Your data is retained as long as your account is active. You can request deletion at any time.",
          last_updated: new Date().toISOString()
        }
      };

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="user_data_${userId}_${Date.now()}.json"`);
      return reply.send(exportData);

    } catch (err) {
      console.error('Data export error:', err);
      return reply.status(500).send({ error: 'Failed to export user data.' });
    }
  });

  // 2. Data Anonymization - Replace personal data with anonymous identifiers
  fastify.post('/gdpr/anonymize/:userId', async (request, reply) => {
    const { userId } = request.params;
    const { confirmPassword } = request.body;

    if (!userId || !confirmPassword) {
      return reply.status(400).send({ error: 'User ID and password confirmation required.' });
    }

    try {
      // Verify password before anonymization
      const user = await getQuery('SELECT password FROM players WHERE id = ?', [userId]);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found.' });
      }

      const passwordMatch = await bcrypt.compare(confirmPassword, user.password);
      if (!passwordMatch) {
        return reply.status(401).send({ error: 'Password confirmation failed.' });
      }

      // Generate anonymous identifier
      const anonymousId = `anon_${crypto.randomBytes(8).toString('hex')}`;
      const anonymousEmail = `${anonymousId}@anonymized.local`;

      // Begin transaction
      await runQuery('BEGIN TRANSACTION', []);

      try {
        // Anonymize personal data but keep gaming statistics
        await runQuery(`
          UPDATE players 
          SET username = ?, email = ?, avatar = '/avatars/anonymous.png'
          WHERE id = ?
        `, [anonymousId, anonymousEmail, userId]);

        // Update any username references in other tables if needed
        // Note: Game history and statistics are preserved for platform integrity

        await runQuery('COMMIT', []);

        reply.send({ 
          success: true, 
          message: 'Account successfully anonymized. Your gaming history is preserved but personal identifiers have been removed.',
          new_username: anonymousId
        });

      } catch (err) {
        await runQuery('ROLLBACK', []);
        throw err;
      }

    } catch (err) {
      console.error('Anonymization error:', err);
      return reply.status(500).send({ error: 'Failed to anonymize user data.' });
    }
  });

  // 3. Account Deletion - Complete removal of user data
  fastify.delete('/gdpr/delete-account/:userId', async (request, reply) => {
    const { userId } = request.params;
    const { confirmPassword, confirmDeletion } = request.body;

    if (!userId || !confirmPassword || confirmDeletion !== 'DELETE_MY_ACCOUNT') {
      return reply.status(400).send({ 
        error: 'User ID, password, and deletion confirmation ("DELETE_MY_ACCOUNT") required.' 
      });
    }

    try {
      // Verify password before deletion
      const user = await getQuery('SELECT password, username FROM players WHERE id = ?', [userId]);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found.' });
      }

      const passwordMatch = await bcrypt.compare(confirmPassword, user.password);
      if (!passwordMatch) {
        return reply.status(401).send({ error: 'Password confirmation failed.' });
      }

      // Begin transaction for complete data removal
      await runQuery('BEGIN TRANSACTION', []);

      try {
        // Delete from all related tables
        await runQuery('DELETE FROM friends WHERE player_id = ? OR friend_id = ?', [userId, userId]);
        await runQuery('DELETE FROM friend_request_history WHERE requester_id = ? OR target_id = ? OR action_by = ?', [userId, userId, userId]);
        await runQuery('DELETE FROM tournament_registrations WHERE player_id = ?', [userId]);
        await runQuery('DELETE FROM tournament_players WHERE player_id = ?', [userId]);
        await runQuery('DELETE FROM tetris_history WHERE player_id = ?', [userId]);
        await runQuery('DELETE FROM tetris_matchmaking_queue WHERE user_id = ?', [userId]);
        await runQuery('DELETE FROM tetris_active_matches WHERE player1_id = ? OR player2_id = ?', [userId, userId]);
        await runQuery('DELETE FROM tetris_tournament_matches WHERE player1_id = ? OR player2_id = ?', [userId, userId]);
        await runQuery('DELETE FROM leaderboard WHERE player_id = ?', [userId]);
        
        // For games table, we might want to keep the records but anonymize the user
        // This preserves platform statistics while removing personal connection
        const anonymousId = `deleted_user_${Date.now()}`;
        await runQuery(`
          UPDATE games 
          SET player1_id = (SELECT id FROM players WHERE username = 'AnonymousUser' LIMIT 1)
          WHERE player1_id = ?
        `, [userId]);
        await runQuery(`
          UPDATE games 
          SET player2_id = (SELECT id FROM players WHERE username = 'AnonymousUser' LIMIT 1)
          WHERE player2_id = ?
        `, [userId]);

        // Finally, delete the user account
        await runQuery('DELETE FROM players WHERE id = ?', [userId]);

        await runQuery('COMMIT', []);

        reply.send({ 
          success: true, 
          message: 'Account and all associated data have been permanently deleted.',
          deleted_user: user.username,
          deletion_timestamp: new Date().toISOString()
        });

      } catch (err) {
        await runQuery('ROLLBACK', []);
        throw err;
      }

    } catch (err) {
      console.error('Account deletion error:', err);
      return reply.status(500).send({ error: 'Failed to delete user account.' });
    }
  });

  // 4. Privacy Settings - View and manage data retention preferences
  fastify.get('/gdpr/privacy-settings/:userId', async (request, reply) => {
    const { userId } = request.params;

    try {
      const user = await getQuery(
        'SELECT id, username, email FROM players WHERE id = ?',
        [userId]
      );

      if (!user) {
        return reply.status(404).send({ error: 'User not found.' });
      }

      // Count data points
      const gameCount = await getQuery(
        'SELECT COUNT(*) as count FROM games WHERE player1_id = ? OR player2_id = ?',
        [userId, userId]
      );

      const friendCount = await getQuery(
        'SELECT COUNT(*) as count FROM friends WHERE player_id = ? OR friend_id = ?',
        [userId, userId]
      );

      const tournamentCount = await getQuery(
        'SELECT COUNT(*) as count FROM tournament_registrations WHERE player_id = ?',
        [userId]
      );

      reply.send({
        user_info: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        data_summary: {
          games_played: gameCount.count,
          friends: friendCount.count,
          tournaments_joined: tournamentCount.count
        },
        privacy_rights: {
          data_export: 'You can export all your personal data at any time',
          data_anonymization: 'You can anonymize your account while preserving game statistics',
          account_deletion: 'You can permanently delete your account and all associated data',
          data_portability: 'Your data can be exported in JSON format'
        },
        contact_info: {
          data_protection_officer: 'privacy@transcendence.local',
          legal_basis: 'Legitimate interest for gaming platform operation'
        }
      });

    } catch (err) {
      console.error('Privacy settings error:', err);
      return reply.status(500).send({ error: 'Failed to load privacy settings.' });
    }
  });

  // 5. Data Rectification - Allow users to correct their personal data
  fastify.put('/gdpr/rectify-data/:userId', async (request, reply) => {
    const { userId } = request.params;
    const { field, newValue, confirmPassword } = request.body;

    const allowedFields = ['username', 'email'];
    
    if (!allowedFields.includes(field)) {
      return reply.status(400).send({ error: 'Invalid field for rectification.' });
    }

    try {
      // Verify password
      const user = await getQuery('SELECT password FROM players WHERE id = ?', [userId]);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found.' });
      }

      const passwordMatch = await bcrypt.compare(confirmPassword, user.password);
      if (!passwordMatch) {
        return reply.status(401).send({ error: 'Password confirmation failed.' });
      }

      // Update the field
      const query = `UPDATE players SET ${field} = ? WHERE id = ?`;
      await runQuery(query, [newValue, userId]);

      reply.send({ 
        success: true, 
        message: `${field} updated successfully.`,
        updated_field: field,
        new_value: newValue
      });

    } catch (err) {
      console.error('Data rectification error:', err);
      
      if (err.message.includes('UNIQUE constraint failed')) {
        return reply.status(400).send({ 
          error: `This ${field} is already in use by another account.` 
        });
      }
      
      return reply.status(500).send({ error: 'Failed to update data.' });
    }
  });
}

module.exports = gdprRoutes;
