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

      // Create players table
      db.run(`
        CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          avatar TEXT DEFAULT 'avatar.png'
        )
      `);

      // Create leaderboard table
      db.run(`
        CREATE TABLE IF NOT EXISTS leaderboard (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER NOT NULL,
          score INTEGER DEFAULT 0,
          rank INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id)
        )
      `);

      // Seed sample data just to render leaderboard during development
      db.get("SELECT COUNT(*) as count FROM leaderboard", (err, row) => {
        if (row.count === 0) {
          console.log("Seeding leaderboard sample data...");
          const players = [
            { username: 'Alice', email: 'alice@example.com' },
            { username: 'Bob', email: 'bob@example.com' },
            { username: 'Charlie', email: 'charlie@example.com' },
            { username: 'Diana', email: 'diana@example.com' }
          ];

          const insertPlayer = db.prepare("INSERT OR IGNORE INTO players (username, email, password) VALUES (?, ?, 'test')");
          players.forEach(player => insertPlayer.run(player.username, player.email));
          insertPlayer.finalize(() => {
            // Now insert leaderboard scores after players exist
            db.all("SELECT id, username FROM players", (err, rows) => {
              const insertLeaderboard = db.prepare("INSERT INTO leaderboard (player_id, score, rank) VALUES (?, ?, ?)");
              rows.forEach((row, index) => {
                insertLeaderboard.run(row.id, 1000 - index * 100, index + 1);
              });
              insertLeaderboard.finalize();
            });
          });
        }
      });
    }
  });

  fastify.decorate('sqliteDb', db);
}

module.exports = { setupDb };







