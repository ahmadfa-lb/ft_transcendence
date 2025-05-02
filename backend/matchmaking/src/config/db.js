// import { inspect } from 'node:util';
// import sqlite3 from 'sqlite3';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const { Database } = sqlite3;

// let dbInstance = null;

// export async function initDatabase() {
//   try {
//     if (dbInstance) return dbInstance;

//     const dbPath = path.resolve(__dirname, '../../data/elo_matchmaking.sqlite');
//     dbInstance = new Database(dbPath, (err) => {
//       console.dir(Object.getPrototypeOf(dbInstance), { depth: 1 });
//       if (err) {
//         console.error('Database connection error:', err.message);
//       } else {
//         console.log('Connected to the database.');
//       }
//     });

//     console.log(`database connection to ${dbPath} has Initialized!`);

//     // Enable foreign key constraints
//     await dbInstance.run('PRAGMA foreign_keys = ON;');

//     // Create tables if not exists (maintaining your existing structure)
//     await dbInstance.exec(`
//       CREATE TABLE IF NOT EXISTS matches (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         match_type TEXT NOT NULL CHECK(match_type IN ('1v1', 'friendly')),
//         status TEXT NOT NULL CHECK(status IN ('pending', 'completed')),
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         completed_at DATETIME
//       );

//       CREATE TABLE IF NOT EXISTS match_players (
//         match_id INTEGER NOT NULL,
//         user_id INTEGER NOT NULL,
//         elo_before INTEGER NOT NULL,
//         elo_after INTEGER,
//         score INTEGER CHECK(score IN (0, 0.5, 1)),
//         player1_goals INTEGER DEFAULT 0,
//         player2_goals INTEGER DEFAULT 0,
//         PRIMARY KEY (match_id, user_id),
//         FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
//       );
//     `);

//     console.log("Database initialized successfully");
//     return dbInstance;

//   } catch (error) {
//     console.error('Database initialization failed:', error);
//     throw error;
//   }
// };

// export async function getDatabase() {
//   try {
//     if (!dbInstance) {
//       dbInstance = await initDatabase();
//     }
//     return dbInstance;
//   } catch (error) {
//     console.error('Failed to get database connection:', error);
//     throw error;
//   }
// }

// export async function closeDatabase() {
//   try {
//     if (dbInstance) {
//       await dbInstance.close();
//       dbInstance = null;
//       console.log("Database connection closed");
//     }
//   } catch (error) {
//     console.error('Error closing database:', error);
//     throw error;
//   }
// }

// // Add graceful shutdown handling
// ['SIGINT', 'SIGTERM'].forEach(signal => {
//   process.on(signal, async () => {
//     await closeDatabase();
//     process.exit(0);
//   });
// });

// // Add connection health check
// export async function checkDatabaseHealth() {
//   try {
//     const db = await getDatabase();
//     await db.get('SELECT 1 as ping');
//     return true;
//   } catch (error) {
//     console.error('Database health check failed:', error);
//     return false;
//   }
// }

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Database } = sqlite3;

class DatabaseConnection {
  constructor() {
    const dbPath = path.resolve(__dirname, '../../data/elo_matchmaking.sqlite');
    console.log(`database connection to ${dbPath} has Initialized!`);
    this.db = new Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err.message);
      } else {
        console.log('Connected to the database.');
      }
    });
  }

  initializeTables() {
    const matchesTable = `
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_type TEXT NOT NULL CHECK(match_type IN ('1v1', 'friendly', 'tournament')),
        status TEXT NOT NULL CHECK(status IN ('pending', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME
      );
    `;

    const matchPlayersTable = `
      CREATE TABLE IF NOT EXISTS match_players (
        match_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        elo_before INTEGER DEFAULT 1000,
        elo_after INTEGER DEFAULT 1000,
        goals INTEGER DEFAULT 0,
        PRIMARY KEY (match_id, player_id),
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const usersTables = `
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elo_score INTEGER DEFAULT 1000,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        total_matches INTEGER DEFAULT 0,
        total_goals INTEGER DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const tournamentsTable = `
      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('registering', 'in_progress', 'completed')),
        player_count INTEGER NOT NULL CHECK(player_count IN (4, 8)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME
      );
    `;

    const tournamentPlayersTable = `
      CREATE TABLE IF NOT EXISTS tournament_players (
        tournament_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        placement INTEGER DEFAULT NULL,
        PRIMARY KEY (tournament_id, player_id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      );
    `;

    this.db.run(tournamentsTable, (err) => {
      if (err) {
        console.error('Error creating tournaments table', err);
      } else {
        console.log('Tournaments table created or already exists');
      }
    });

    this.db.run(tournamentPlayersTable, (err) => {
      if (err) {
        console.error('Error creating tournament_players table', err);
      } else {
        console.log('Tournament players table created or already exists');
      }
    });

    this.db.run(matchesTable, (err) => {
      if (err) {
        console.error('Error creating matches table', err);
      } else {
        console.log('Matchmaking table created or already exists');
      }
    });

    this.db.run(matchPlayersTable, (err) => {
      if (err) {
        console.error('Error creating match_players table', err);
      } else {
        console.log('Matchmaking table created or already exists');
      }
    });

    this.db.run(usersTables, (err) => {
      if (err) {
        console.error('Error creating players table', err);
      } else {
        console.log('Matchmaking table created or already exists');
      }
    });
  }

  closeDatabase() {
    try {
      if (this.db) {
        this.db.close();
        console.log("Database connection closed");
      }
    } catch (error) {
      console.error('Error closing database:', error);
      throw error;
    }
  }

  getInstance() {
    return this.db;
  }
}

export default new DatabaseConnection();