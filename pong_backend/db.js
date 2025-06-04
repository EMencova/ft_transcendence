
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function setupDb(fastify) {
  const dbDir = path.resolve(__dirname, 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'database.sqlite');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Connected to SQLite database.');

      db.run(`
        CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0
          avatar TEXT DEFAULT 'avatar.png'
        )
      `);
    }
  });

  fastify.decorate('sqliteDb', db);
}

module.exports = { setupDb };







