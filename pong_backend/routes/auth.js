// authRoutes.js
'use strict';

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pump = require('util').promisify(require('stream').pipeline);

const SALT_ROUNDS = 10;
const DEFAULT_AVATAR = '/avatars/avatar.png';

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────

// Escape function to prevent XSS in any string we send back to the client
function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Trim and coerce to string
function sanitizeInput(input) {
  return String(input ?? '').trim();
}

// Basic validation (tune to your policy)
function isValidUsername(username) {
  // 3–20 chars, letters, numbers, underscore, dash
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
}

function isValidEmail(email) {
  // Simple RFC-5322-ish test; good balance for serverside
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(pw) {
  // 8+ chars; adjust your policy (uppercase/number/symbol etc.)
  return typeof pw === 'string' && pw.length >= 8 && pw.length <= 200;
}

// Whitelists for uploads
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// Safe avatar filename generator (never trust client filename)
function generateSafeAvatarFilename(clientFilename = '') {
  const ext = path.extname(clientFilename.toLowerCase());
  const safeExt = ALLOWED_IMAGE_EXT.has(ext) ? ext : '.png';
  return `${crypto.randomUUID()}${safeExt}`;
}

// ────────────────────────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────────────────────────

async function authRoutes(fastify, options) {
  const db = fastify.sqliteDb;

  // Security headers (optional if already registered app-wide)
  try {
    fastify.register(require('@fastify/helmet'), {
      contentSecurityPolicy: {
        useDefaults: true,
        // Adjust directives to your app; this is conservative and prevents inline JS
        directives: {
          "script-src": ["'self'"],
          "img-src": ["'self'", "data:"],
        },
      },
    });
  } catch {
    // If helmet already registered elsewhere, ignore
  }

  // Safer multipart with tight limits
  fastify.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2 MB max file size
      files: 1,                  // only one file
      fields: 10,                // a few fields
    },
  });

  // Promisified db helpers (kept from your version)
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

  // ────────────────────────────────────────────────────────────────────────────
  // POST /register
  // Supports multipart (avatar upload) and JSON fallback (no avatar upload).
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/register', async (request, reply) => {
    // Always return JSON; generic error messages (avoid reflecting input)
    reply.header('Content-Type', 'application/json; charset=utf-8');

    // Multipart branch (avatar upload)
    if (request.isMultipart()) {
      const parts = request.parts();
      let username, email, password;
      let avatarFilename = null;

      try {
        for await (const part of parts) {
          if (part.type === 'file' && part.fieldname === 'avatar') {
            // Validate MIME type
            if (!ALLOWED_IMAGE_MIME.has(part.mimetype)) {
              return reply.status(400).send({ error: 'Invalid file type' });
            }

            // Ensure upload dir
            const uploadDir = path.join(__dirname, '../public/avatars');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Create safe filename and path (we ignore client filename/path)
            avatarFilename = generateSafeAvatarFilename(part.filename || '');
            const filePath = path.join(uploadDir, avatarFilename);

            // Save file
            try {
              await pump(part.file, fs.createWriteStream(filePath, { flags: 'wx' }));
            } catch (e) {
              // If file exists or fs error, bail safely
              fastify.log.error({ err: e }, 'Error saving avatar');
              return reply.status(500).send({ error: 'Avatar upload failed' });
            }
          } else if (part.type === 'field') {
            if (part.fieldname === 'username') username = sanitizeInput(part.value);
            if (part.fieldname === 'email') email = sanitizeInput(part.value).toLowerCase();
            if (part.fieldname === 'password') password = String(part.value ?? '');
          }
        }

        // Validate presence
        if (!username || !email || !password) {
          return reply.status(400).send({ error: 'Missing fields' });
        }

        // Validate format
        if (!isValidUsername(username) || !isValidEmail(email) || !isValidPassword(password)) {
          return reply.status(400).send({ error: 'Invalid input' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Persist
        const avatarPath = avatarFilename ? `/avatars/${avatarFilename}` : DEFAULT_AVATAR;
        const query = `INSERT INTO players (username, email, password, wins, losses, avatar)
                       VALUES (?, ?, ?, 0, 0, ?)`;
        const result = await runQuery(query, [username, email, hashedPassword, avatarPath]);

        // Respond (escape outputs)
        return reply.send({
          success: true,
          userId: result.lastID,
          username: escapeHtml(username),
          email: escapeHtml(email),
          avatar: escapeHtml(avatarPath),
        });
      } catch (err) {
        fastify.log.error({ err }, 'Register (multipart) error');
        if (String(err?.message || '').includes('UNIQUE constraint failed')) {
          return reply.status(400).send({ error: 'Username or email already exists' });
        }
        return reply.status(500).send({ error: 'Registration failed' });
      }
    }

    // JSON fallback (no file upload)
    try {
      const body = request.body || {};
      const username = sanitizeInput(body.username);
      const email = sanitizeInput(body.email).toLowerCase();
      const password = String(body.password ?? '');

      if (!username || !email || !password) {
        return reply.status(400).send({ error: 'Missing fields' });
      }
      if (!isValidUsername(username) || !isValidEmail(email) || !isValidPassword(password)) {
        return reply.status(400).send({ error: 'Invalid input' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // IMPORTANT: ignore client-provided avatar path in JSON to avoid XSS/protocol abuse
      const avatarPath = DEFAULT_AVATAR;

      const query = `INSERT INTO players (username, email, password, wins, losses, avatar)
                     VALUES (?, ?, ?, 0, 0, ?)`;
      const result = await runQuery(query, [username, email, hashedPassword, avatarPath]);

      return reply.send({
        success: true,
        userId: result.lastID,
        username: escapeHtml(username),
        email: escapeHtml(email),
        avatar: escapeHtml(avatarPath),
      });
    } catch (err) {
      fastify.log.error({ err }, 'Register (JSON) error');
      if (String(err?.message || '').includes('UNIQUE constraint failed')) {
        return reply.status(400).send({ error: 'Username or email already exists' });
      }
      return reply.status(500).send({ error: 'Registration failed' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /login
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/login', async (request, reply) => {
    reply.header('Content-Type', 'application/json; charset=utf-8');

    try {
      const body = request.body || {};
      const username = sanitizeInput(body.username);
      const password = String(body.password ?? '');

      if (!username || !password) {
        return reply.status(400).send({ error: 'Missing credentials' });
      }

      // Optional: username format check (prevents weird inputs)
      if (!isValidUsername(username)) {
        return reply.status(400).send({ error: 'Invalid credentials' });
      }

      const row = await getQuery(`SELECT * FROM players WHERE username = ?`, [username]);
      if (!row) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const passwordMatch = await bcrypt.compare(password, row.password);
      if (!passwordMatch) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Escape values sent back
      const safeUsername = escapeHtml(row.username);
      const safeAvatar = escapeHtml(row.avatar || DEFAULT_AVATAR);

      return reply.send({
        success: true,
        userId: row.id,
        username: safeUsername,
        avatar: safeAvatar,
      });
    } catch (err) {
      fastify.log.error({ err }, 'Login error');
      return reply.status(500).send({ error: 'Login failed' });
    }
  });
}

module.exports = authRoutes;






  
  

