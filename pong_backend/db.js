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

    // Tournament table //added
    db.run(`CREATE TABLE IF NOT EXISTS tournament (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      winner_id INTEGER,
      status TEXT DEFAULT 'pending'
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


    // tournament players table //added
    db.run(`
      CREATE TABLE IF NOT EXISTS tournament_players (
        tournament_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        seed INTEGER,
        eliminated BOOLEAN DEFAULT 0,
        PRIMARY KEY (tournament_id, player_id),
        FOREIGN KEY (tournament_id) REFERENCES tournament(id),
        FOREIGN KEY (player_id) REFERENCES players(id)
      )
    `);

    // Tournament matches table //added
    db.run(`
      CREATE TABLE IF NOT EXISTS tournament_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        round INTEGER NOT NULL,
        match_number INTEGER NOT NULL,
        player1_id INTEGER,
        player2_id INTEGER,
        winner_id INTEGER,
        status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed
        FOREIGN KEY (tournament_id) REFERENCES tournament(id),
        FOREIGN KEY (player1_id) REFERENCES players(id),
        FOREIGN KEY (player2_id) REFERENCES players(id),
        FOREIGN KEY (winner_id) REFERENCES players(id)
      )
    `);
    
    db.run(`
      INSERT OR IGNORE INTO players (username, email, password, avatar, wins, losses) 
        VALUES 
        ('Eliska', 'eliska@eliska.com', 'eliska', '/avatar1.png', 5, 2),
        ('Verca', 'verca@verca.com', 'verca', '/avatar2.png', 3, 4),
        ('Azaman', 'azaman@azaman.com', 'azaman', '/avatar3.png', 7, 1)
    `);

  });

  db.run(`ALTER TABLE tournament ADD COLUMN status TEXT DEFAULT 'pending'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("Failed to alter table:", err.message);
    }
  }); 

  db.run(`
    INSERT OR IGNORE INTO tournament (name, date, status) 
    VALUES 
    ('Summer Tournament', datetime('now'), 'pending'),
    ('Winter Championship', datetime('now', '+2 months'), 'scheduled')
  `);

  fastify.decorate('sqliteDb', db);
}

module.exports = { setupDb };



