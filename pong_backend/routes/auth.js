const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const SALT_ROUNDS = 10;
const pump = require('util').promisify(require('stream').pipeline);

// Escape function to prevent XSS
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function authRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  fastify.register(require('@fastify/multipart'));

  // Helpers to promisify db
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

  fastify.post('/register', async (request, reply) => {
    if (request.isMultipart()) {
      const parts = request.parts();
      let username, email, password;
      let avatarFilename = 'avatar.png';

      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'avatar') {
          console.log('Processing avatar upload:', part.filename);

          const uploadDir = path.join(__dirname, '../public/avatars');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

          // Extract and sanitize file extension
          const ext = path.extname(part.filename || '').toLowerCase();
          const validExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
          const safeExt = validExt.includes(ext) ? ext : '.png';

          // Secure, random filename
          avatarFilename = `${crypto.randomUUID()}${safeExt}`;
          const filePath = path.join(uploadDir, avatarFilename);

          try {
            await pump(part.file, fs.createWriteStream(filePath));
            console.log('Avatar saved in:', filePath);
          } catch (e) {
            console.error('Error saving avatar:', e);
            return reply.status(500).send({ error: 'Avatar upload failed' });
          }
        } else if (part.type === 'field') {
          if (part.fieldname === 'username') username = part.value;
          if (part.fieldname === 'email') email = part.value;
          if (part.fieldname === 'password') password = part.value;
        }
      }

      if (!username || !email || !password) {
        return reply.status(400).send({ error: 'Missing fields' });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const query = `INSERT INTO players (username, email, password, wins, losses, avatar)
                       VALUES (?, ?, ?, 0, 0, ?)`;

        await runQuery(query, [username, email, hashedPassword, `/avatars/${avatarFilename}`]);

        // Escape username before sending response
        const escapedUsername = escapeHtml(username);

        reply.send({ success: true, username: escapedUsername, avatar: `/avatars/${avatarFilename}` });
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return reply.status(400).send({ error: 'Username or email already exists' });
        }
        reply.status(500).send({ error: 'Registration failed' });
      }
    } else {
      // Fallback: JSON body
      const { username, email, password, avatar } = request.body;

      if (!username || !email || !password) {
        return reply.status(400).send({ error: 'Missing fields' });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const query = `INSERT INTO players (username, email, password, wins, losses, avatar)
                       VALUES (?, ?, ?, 0, 0, ?)`;

        await runQuery(query, [username, email, hashedPassword, avatar || 'avatar.png']);

        // Escape username before sending response
        const escapedUsername = escapeHtml(username);

        reply.send({ success: true, username: escapedUsername });
      } catch (err) {
        console.error('Register error:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return reply.status(400).send({ error: 'Username or email already exists' });
        }
        reply.status(500).send({ error: 'Registration failed' });
      }
    }
  });

  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: 'Missing credentials' });
    }

    try {
      const row = await getQuery(`SELECT * FROM players WHERE username = ?`, [username]);

      if (!row) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const passwordMatch = await bcrypt.compare(password, row.password);
      if (!passwordMatch) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Escape username before sending response
      const escapedUsername = escapeHtml(row.username);

      reply.send({ success: true, userId: row.id, username: escapedUsername, avatar: row.avatar });
    } catch (err) {
      console.error('Login error:', err.message);
      reply.status(500).send({ error: 'Login failed' });
    }
  });
}

module.exports = authRoutes;





  
  

