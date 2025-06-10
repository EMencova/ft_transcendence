const { sanitizeInput } = require('../sanitize'); // adjust path if needed

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); 
const SALT_ROUNDS = 10;
const pump = require('util').promisify(require('stream').pipeline);

async function authRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  fastify.register(require('@fastify/multipart'));
  
  // Helper: wrap db.run with Promise
  function runQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  // Helper: wrap db.get with Promise
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
      let username, email, password, avatarFilename = 'avatar.png';

      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'avatar') {
          console.log('Processing avatar upload:', part.filename);
          const uploadDir = path.join(__dirname, '../public/avatars');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          avatarFilename = `${Date.now()}_${part.filename}`;
          const filePath = path.join(uploadDir, avatarFilename);
          try {
            await pump(part.file, fs.createWriteStream(filePath));
            console.log('Avatar saved in:', filePath);
          } catch (e) {
            console.error('Error saving avatar:', e);
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
        await new Promise((resolve, reject) => {
          db.run(query, [username, email, hashedPassword, `/avatars/${avatarFilename}`], function(err) {
            if (err) reject(err);
            else resolve(this);
          });
        });
        reply.send({ success: true, username, avatar: `/avatars/${avatarFilename}` });
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return reply.status(400).send({ error: 'Username or email already exists' });
        }
        reply.status(500).send({ error: 'Registration failed' });
      }
    } else {
      // fallback to JSON body parsing
      const { username, email, password, avatar } = request.body;
      if (!username || !email || !password) {
        return reply.status(400).send({ error: 'Missing fields' });
      }

    try {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const query = `INSERT INTO players (username, email, password, wins, losses, avatar)
                     VALUES (?, ?, ?, 0, 0, ?)`;

      await runQuery(query, [username, email, hashedPassword, avatar || 'avatar.png']);

      reply.send({ success: true, username });
    } catch (err) {
      console.error('Register error:', err.message);
      // Handle unique constraint violation (username/email taken)
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

      // Compare password hashes
      const passwordMatch = await bcrypt.compare(password, row.password);
      if (!passwordMatch) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      reply.send({ success: true, userId: row.id, username: row.username, avatar: row.avatar });
    } catch (err) {
      console.error('Login error:', err.message);
      reply.status(500).send({ error: 'Login failed' });
    }
  });
}

module.exports = authRoutes;

  
  

