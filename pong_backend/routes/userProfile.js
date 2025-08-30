const path = require('path');
const fs = require('fs');
const pump = require('util').promisify(require('stream').pipeline);

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function userProfile(fastify, options) {
  const db = fastify.sqliteDb;

  // Get user profile
  fastify.get('/profile/:userId', async (request, reply) => {
    const userId = parseInt(request.params.userId, 10);
    if (!userId) return reply.code(400).send({ error: 'Invalid user ID.' });

    try {
      const row = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id, username, email, avatar, wins, losses FROM players WHERE id = ?`,
          [userId],
          (err, row) => (err ? reject(err) : resolve(row))
        );
      });

      if (!row) return reply.code(404).send({ error: 'User not found.' });

      resolve(reply.send({
        id: row.id,
        username: escapeHtml(row.username),
        email: escapeHtml(row.email),
        avatar: escapeHtml(row.avatar),
        wins: row.wins || 0,
        losses: row.losses || 0
      }));
    } catch (err) {
      console.error('Profile fetch error:', err);
      reply.code(500).send({ error: 'Database error' });
    }
  });

  // Update user profile
  fastify.put('/updateProfile', async (request, reply) => {
    const { username, email, userId } = request.body;
    const playerId = parseInt(userId, 10);
    if (!username || !email || !playerId) return reply.code(400).send({ error: 'Invalid input.' });

    try {
      const result = await new Promise((resolve, reject) => {
        const stmt = db.prepare(`
          UPDATE players SET username = ?, email = ? WHERE id = ?
        `);
        stmt.run(username, email, playerId, function (err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      if (result.changes === 0) return reply.code(404).send({ error: 'Player not found.' });
      reply.send({ message: 'Profile updated successfully.' });
    } catch (err) {
      console.error('Profile update error:', err);
      reply.code(500).send({ error: 'Database error' });
    }
  });

  // Change password
  fastify.put('/profile/password', async (request, reply) => {
    const { currentPassword, newPassword, userId } = request.body;
    const playerId = parseInt(userId, 10);
    if (!currentPassword || !newPassword || !playerId) return reply.code(400).send({ error: 'Invalid input.' });
    if (newPassword.length < 6) return reply.code(400).send({ error: 'Password must be at least 6 chars.' });

    try {
      const row = await new Promise((resolve, reject) => {
        db.get(`SELECT password FROM players WHERE id = ?`, [playerId], (err, row) => (err ? reject(err) : resolve(row)));
      });

      if (!row) return reply.code(404).send({ error: 'User not found.' });

      const bcrypt = require('bcrypt');
      const passwordMatch = await bcrypt.compare(currentPassword, row.password);
      if (!passwordMatch) return reply.code(400).send({ error: 'Current password is incorrect.' });

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await new Promise((resolve, reject) => {
        db.run(`UPDATE players SET password = ? WHERE id = ?`, [hashedNewPassword, playerId], function (err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      reply.send({ message: 'Password changed successfully.' });
    } catch (err) {
      console.error('Password change error:', err);
      reply.code(500).send({ error: 'Database error' });
    }
  });

  // File upload avatar
  fastify.register(require('@fastify/multipart'));
  fastify.put('/profile/avatar', async (request, reply) => {
    if (!request.isMultipart()) return reply.code(400).send({ error: 'Must be multipart/form-data' });

    const parts = request.parts();
    let avatarFilename = null;
    let userId = null;

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'avatar') {
        const uploadDir = path.join(__dirname, '../public/avatars');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        avatarFilename = `${Date.now()}_${path.basename(part.filename)}`;
        const filePath = path.join(uploadDir, avatarFilename);
        await pump(part.file, fs.createWriteStream(filePath));
      } else if (part.fieldname === 'userId') {
        userId = parseInt(part.value, 10);
      }
    }

    if (!userId || !avatarFilename) return reply.code(400).send({ error: 'Missing userId or avatar file.' });

    try {
      const result = await new Promise((resolve, reject) => {
        db.run(`UPDATE players SET avatar = ? WHERE id = ?`, [`/avatars/${avatarFilename}`, userId], function (err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      if (result.changes === 0) return reply.code(404).send({ error: 'Player not found.' });
      reply.send({ message: 'Avatar updated successfully.', avatar: `/avatars/${avatarFilename}` });
    } catch (err) {
      console.error('Avatar update error:', err);
      reply.code(500).send({ error: 'Database error' });
    }
  });
}

module.exports = userProfile;
