const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const pump = require('util').promisify(require('stream').pipeline);

// Manual escape function
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

// Manual validators
function validateUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

async function authRoutes(fastify, options) {
  const db = fastify.sqliteDb;

 
  function runQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
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
    try {
      let username, email, password, avatarFilename = 'avatar.png';

      if (request.isMultipart()) {
        const parts = request.parts();

        for await (const part of parts) {
          if (part.type === 'file' && part.fieldname === 'avatar') {
            const uploadDir = path.join(__dirname, '../public/avatars');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            avatarFilename = `${Date.now()}_${part.filename}`;
            const filePath = path.join(uploadDir, avatarFilename);
            await pump(part.file, fs.createWriteStream(filePath));
          } else if (part.type === 'field') {
            if (part.fieldname === 'username') username = part.value;
            if (part.fieldname === 'email') email = part.value;
            if (part.fieldname === 'password') password = part.value;
          }
        }
      } else {
        // JSON body fallback
        ({ username, email, password, avatar: avatarFilename = 'avatar.png' } = request.body);
      }

      // Validate inputs
      if (!username || !email || !password) {
        return reply.status(400).send({ error: 'Missing fields' });
      }
      if (!validateUsername(username)) {
        return reply.status(400).send({ error: 'Invalid username. Use 3-20 letters, numbers, or underscores.' });
      }
      if (!validateEmail(email)) {
        return reply.status(400).send({ error: 'Invalid email format.' });
      }
      if (!validatePassword(password)) {
        return reply.status(400).send({ error: 'Password must be at least 6 characters.' });
      }

      // Escape for safety (mostly for display)
      username = escapeHtml(username);
      email = escapeHtml(email);

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const query = `INSERT INTO players (username, email, password, wins, losses, avatar)
                     VALUES (?, ?, ?, 0, 0, ?)`;

      await runQuery(query, [username, email, hashedPassword, `/avatars/${avatarFilename}`]);

      reply.send({ success: true, username, avatar: `/avatars/${avatarFilename}` });

    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return reply.status(400).send({ error: 'Username or email already exists' });
      }
      console.error('Register error:', err);
      reply.status(500).send({ error: 'Registration failed' });
    }
  });

  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply.status(400).send({ error: 'Missing credentials' });
      }
      if (!validateUsername(username)) {
        return reply.status(400).send({ error: 'Invalid username' });
      }
      if (!validatePassword(password)) {
        return reply.status(400).send({ error: 'Invalid password' });
      }

      // Escape username before querying
      const safeUsername = escapeHtml(username);

      const row = await getQuery(`SELECT * FROM players WHERE username = ?`, [safeUsername]);
      if (!row) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const passwordMatch = await bcrypt.compare(password, row.password);
      if (!passwordMatch) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      reply.send({ success: true, userId: row.id, username: row.username, avatar: row.avatar });

    } catch (err) {
      console.error('Login error:', err);
      reply.status(500).send({ error: 'Login failed' });
    }
  });
}

module.exports = authRoutes;


  
  

