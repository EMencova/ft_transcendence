const { sanitizeInput } = require('../sanitize'); 


fastify.post('/register', async (request, reply) => {
  if (request.isMultipart()) {
  
    username = sanitizeInput(username);
    email = sanitizeInput(email);

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
      // Sanitize username
      reply.send({ success: true, username: sanitizeInput(username), avatar: `/avatars/${avatarFilename}` });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return reply.status(400).send({ error: 'Username or email already exists' });
      }
      reply.status(500).send({ error: 'Registration failed' });
    }
  } else {
  
    let { username, email, password, avatar } = request.body;

    // Sanitize inputs
    username = sanitizeInput(username);
    email = sanitizeInput(email);

    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'Missing fields' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const query = `INSERT INTO players (username, email, password, wins, losses, avatar)
                     VALUES (?, ?, ?, 0, 0, ?)`;

      await runQuery(query, [username, email, hashedPassword, avatar || 'avatar.png']);
      reply.send({ success: true, username: sanitizeInput(username) });
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
  // Sanitize username input
  let { username, password } = request.body;
  username = sanitizeInput(username);

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

    // Sanitize username
    reply.send({ success: true, userId: row.id, username: sanitizeInput(row.username), avatar: row.avatar });
  } catch (err) {
    console.error('Login error:', err.message);
    reply.status(500).send({ error: 'Login failed' });
  }
});


  
  

