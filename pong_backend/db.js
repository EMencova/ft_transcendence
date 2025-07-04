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
      console.error('Error opening database:', err.message);
      return;
    }

    console.log('Connected to SQLite database.');

    // Players table
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

    // Score tables
    db.run(`CREATE TABLE IF NOT EXISTS score_pong (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS score_other (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0
    );`);

    // Tournament table
    db.run(`CREATE TABLE IF NOT EXISTS tournament (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);

    // Tournament registrations table
    db.run(`CREATE TABLE IF NOT EXISTS tournament_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournament(id),
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE (tournament_id, player_id)
    );`);

    // Leaderboard table
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

    // Friends table
    db.run(`
      CREATE TABLE IF NOT EXISTS friends (
        player_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        PRIMARY KEY (player_id, friend_id),
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (friend_id) REFERENCES players(id)
      )
    `);

    // Tetris game history table (score and timestamp only)
    db.run(`
      CREATE TABLE IF NOT EXISTS tetris_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        game_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        score INTEGER NOT NULL,
        FOREIGN KEY (player_id) REFERENCES players(id)
      )
    `);

    // Games table for general game history
    db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER NOT NULL,
        player1_score INTEGER DEFAULT 0,
        player2_score INTEGER DEFAULT 0,
        winner_id INTEGER,
        game_type TEXT DEFAULT 'pong',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player1_id) REFERENCES players(id),
        FOREIGN KEY (player2_id) REFERENCES players(id),
        FOREIGN KEY (winner_id) REFERENCES players(id)
      )
    `);

  });

  fastify.decorate('sqliteDb', db);
}

module.exports = { setupDb };










