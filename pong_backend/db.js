const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

function setupDb(fastify) {
  const dbDir = path.resolve(__dirname, "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "database.sqlite");
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      return;
    }

    console.log("Connected to SQLite database.");

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
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (player_id, friend_id),
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (friend_id) REFERENCES players(id)
      )
    `);

    // Add status column to existing friends table if it doesn't exist
    db.run(`
      ALTER TABLE friends ADD COLUMN status TEXT DEFAULT 'pending'
    `, (err) => {
      if (err && err.message.includes('duplicate column name')) {
        // Column already exists, this is fine
      } else if (err) {
        console.log('Note: Could not add status column (may already exist):', err.message);
      }
    });

    // Add created_at column to existing friends table if it doesn't exist
    db.run(`
      ALTER TABLE friends ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `, (err) => {
      if (err && err.message.includes('duplicate column name')) {
        // Column already exists, this is fine
      } else if (err) {
        console.log('Note: Could not add created_at column (may already exist):', err.message);
      }
    });

    // Tetris game history table (enhanced with level and lines cleared)
    db.run(`
      CREATE TABLE IF NOT EXISTS tetris_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        game_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        score INTEGER NOT NULL,
        level INTEGER DEFAULT 1,
        lines_cleared INTEGER DEFAULT 0,
        FOREIGN KEY (player_id) REFERENCES players(id)
      )
    `);

    // Add level and lines_cleared columns if they don't exist (for existing databases)
    db.run(`ALTER TABLE tetris_history ADD COLUMN level INTEGER DEFAULT 1`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: Could not add level column (may already exist):', err.message);
      }
    });

    db.run(`ALTER TABLE tetris_history ADD COLUMN lines_cleared INTEGER DEFAULT 0`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: Could not add lines_cleared column (may already exist):', err.message);
      }
    });

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

    // Friend request history table (for tracking declined/cancelled requests)
    db.run(`
      CREATE TABLE IF NOT EXISTS friend_request_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        action TEXT NOT NULL, -- 'declined', 'cancelled'
        action_by INTEGER NOT NULL, -- who performed the action
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES players(id),
        FOREIGN KEY (target_id) REFERENCES players(id),
        FOREIGN KEY (action_by) REFERENCES players(id)
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
        ('Azaman', 'azaman@azaman.com', 'azaman', '/avatar3.png', 7, 1),
        ('AnonymousUser', 'anonymous@deleted.local', 'deleted', '/avatars/anonymous.png', 0, 0)
    `);

    // Tetris Matchmaking Queue table
    db.run(`
      CREATE TABLE IF NOT EXISTS tetris_matchmaking_queue (
        user_id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        skill_level INTEGER NOT NULL,
        mode TEXT NOT NULL,
        join_time INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES players(id)
      )
    `);

    // Tetris Active Matches table  
    db.run(`
      CREATE TABLE IF NOT EXISTS tetris_active_matches (
        match_id TEXT PRIMARY KEY,
        player1_id INTEGER NOT NULL,
        player1_username TEXT NOT NULL,
        player1_skill_level INTEGER NOT NULL,
        player1_accepted BOOLEAN DEFAULT 0,
        player1_score INTEGER DEFAULT 0,
        player1_level INTEGER DEFAULT 1,
        player1_lines INTEGER DEFAULT 0,
        player1_game_over BOOLEAN DEFAULT 0,
        player1_turn_completed BOOLEAN DEFAULT 0,
        player2_id INTEGER NOT NULL,
        player2_username TEXT NOT NULL,
        player2_skill_level INTEGER NOT NULL,
        player2_accepted BOOLEAN DEFAULT 0,
        player2_score INTEGER DEFAULT 0,
        player2_level INTEGER DEFAULT 1,
        player2_lines INTEGER DEFAULT 0,
        player2_game_over BOOLEAN DEFAULT 0,
        player2_turn_completed BOOLEAN DEFAULT 0,
        mode TEXT NOT NULL,
        play_type TEXT DEFAULT 'simultaneous',
        status TEXT DEFAULT 'pending',
        current_turn TEXT DEFAULT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (player1_id) REFERENCES players(id),
        FOREIGN KEY (player2_id) REFERENCES players(id)
      )
    `);

    // Tetris Tournament Matches history table (already exists, but ensuring it's here)
    db.run(`
      CREATE TABLE IF NOT EXISTS tetris_tournament_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER NOT NULL,
        mode TEXT NOT NULL,
        winner_id INTEGER,
        player1_score INTEGER DEFAULT 0,
        player1_level INTEGER DEFAULT 1,
        player1_lines INTEGER DEFAULT 0,
        player2_score INTEGER DEFAULT 0,
        player2_level INTEGER DEFAULT 1,
        player2_lines INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player1_id) REFERENCES players(id),
        FOREIGN KEY (player2_id) REFERENCES players(id),
        FOREIGN KEY (winner_id) REFERENCES players(id)
      )
    `);
  });

  db.run(
    `ALTER TABLE tournament ADD COLUMN status TEXT DEFAULT 'pending'`,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Failed to alter table:", err.message);
      }
    }
  );

  // Add new columns for flexible play modes to tetris_active_matches
  db.run(
    `ALTER TABLE tetris_active_matches ADD COLUMN play_type TEXT DEFAULT 'simultaneous'`,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Failed to add play_type column:", err.message);
      }
    }
  );

  db.run(
    `ALTER TABLE tetris_active_matches ADD COLUMN current_turn TEXT DEFAULT NULL`,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Failed to add current_turn column:", err.message);
      }
    }
  );

  db.run(
    `ALTER TABLE tetris_active_matches ADD COLUMN player1_turn_completed BOOLEAN DEFAULT 0`,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Failed to add player1_turn_completed column:", err.message);
      }
    }
  );

  db.run(
    `ALTER TABLE tetris_active_matches ADD COLUMN player2_turn_completed BOOLEAN DEFAULT 0`,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Failed to add player2_turn_completed column:", err.message);
      }
    }
  );

  // Add play_type column to tetris_tournament_matches for proper match type tracking
  db.run(
    `ALTER TABLE tetris_tournament_matches ADD COLUMN play_type TEXT DEFAULT 'simultaneous'`,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Failed to add play_type column to tetris_tournament_matches:", err.message);
      }
    }
  );

  db.run(`
    INSERT OR IGNORE INTO tournament (name, date, status)
    VALUES
    ('Summer Tournament', datetime('now'), 'pending'),
    ('Winter Championship', datetime('now', '+2 months'), 'scheduled')
  `);

  db.run(
    `
	ALTER TABLE tournament_matches ADD COLUMN time_remaining INTEGER DEFAULT 120;
  `,
    (err) => {
      if (err) {
        // Check if it's specifically a "column already exists" error
        if (
          err.message.includes("duplicate column name") ||
          err.message.includes("already exists")
        ) {
          console.log(
            "Column 'time_remaining' already exists in tournament_matches table"
          );
        } else {
          console.error("Error adding time_remaining column:", err.message);
        }
      } else {
        console.log(
          "Successfully added time_remaining column to tournament_matches table"
        );
      }
    }
  );

  fastify.decorate("sqliteDb", db);
}

module.exports = { setupDb };
