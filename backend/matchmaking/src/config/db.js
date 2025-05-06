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
    // Update matches table to include winner_id column
    const matchesTable = `
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_type TEXT NOT NULL CHECK(match_type IN ('1v1', 'friendly', 'tournament')),
        status TEXT NOT NULL CHECK(status IN ('pending', 'completed')),
        winner_id INTEGER,
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
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
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

    // First, check if we need to add the winner_id column to existing matches table
    this.db.get("PRAGMA table_info(matches)", (err, rows) => {
      if (err) {
        console.error('Error checking matches table schema:', err);
        return;
      }
      
      // Check if winner_id column exists
      // const hasWinnerId = rows && rows.some(row => row.name === 'winner_id');
      
      // if (!hasWinnerId) {
      //   // Add winner_id column to existing table
      //   this.db.run("ALTER TABLE matches ADD COLUMN winner_id INTEGER", (err) => {
      //     if (err) {
      //       console.error('Error adding winner_id column:', err);
      //     } else {
      //       console.log('Added winner_id column to matches table');
      //     }
      //   });
      // }
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

  // Rest of the code remains the same
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('SQL Error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('SQL Error:', err);
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get player by ID
  async getPlayerById(playerId) {
    try {
      const rows = await this.query(
        'SELECT * FROM players WHERE id = ?',
        [playerId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error getting player:', error);
      throw error;
    }
  }

  // Update player ELO
  async updatePlayerElo(playerId, newElo) {
    try {
      await this.run(
        'UPDATE players SET elo_score = ? WHERE id = ?',
        [newElo, playerId]
      );
    } catch (error) {
      console.error('Error updating player ELO:', error);
      throw error;
    }
  }

  // Update match result with ELO information
  async updateMatchResult(matchId, winnerId, player1Id, player2Id, player1Goals, player2Goals, eloData) {
    try {
      // Begin transaction
      await this.run('BEGIN TRANSACTION');

      // Update match status
      await this.run(
        `UPDATE matches 
         SET status = 'completed', 
             winner_id = ?, 
             completed_at = DATETIME('now') 
         WHERE id = ?`,
        [winnerId, matchId]
      );

      // Update player 1 stats
      await this.run(
        `UPDATE match_players 
         SET goals = ?, 
             elo_before = ?, 
             elo_after = ? 
         WHERE match_id = ? AND player_id = ?`,
        [
          player1Goals, 
          eloData.player1OldElo, 
          eloData.player1NewElo, 
          matchId, 
          player1Id
        ]
      );

      // Update player 2 stats
      await this.run(
        `UPDATE match_players 
         SET goals = ?, 
             elo_before = ?, 
             elo_after = ? 
         WHERE match_id = ? AND player_id = ?`,
        [
          player2Goals, 
          eloData.player2OldElo, 
          eloData.player2NewElo, 
          matchId, 
          player2Id
        ]
      );

      // Update player 1 overall stats
      const isPlayer1Winner = winnerId === player1Id;
      await this.run(
        `UPDATE players 
         SET elo_score = ?, 
             wins = wins + ?, 
             losses = losses + ?, 
             total_matches = total_matches + 1, 
             total_goals = total_goals + ? 
         WHERE id = ?`,
        [
          eloData.player1NewElo,
          isPlayer1Winner ? 1 : 0,
          isPlayer1Winner ? 0 : 1,
          player1Goals,
          player1Id
        ]
      );

      // Update player 2 overall stats
      const isPlayer2Winner = winnerId === player2Id;
      await this.run(
        `UPDATE players 
         SET elo_score = ?, 
             wins = wins + ?, 
             losses = losses + ?, 
             total_matches = total_matches + 1, 
             total_goals = total_goals + ? 
         WHERE id = ?`,
        [
          eloData.player2NewElo,
          isPlayer2Winner ? 1 : 0,
          isPlayer2Winner ? 0 : 1,
          player2Goals,
          player2Id
        ]
      );

      // Commit transaction
      await this.run('COMMIT');

      return {
        matchId,
        winner: winnerId,
        finalScore: {
          player1: player1Goals,
          player2: player2Goals
        },
        eloChanges: {
          player1: {
            before: eloData.player1OldElo,
            after: eloData.player1NewElo,
            change: eloData.player1NewElo - eloData.player1OldElo
          },
          player2: {
            before: eloData.player2OldElo,
            after: eloData.player2NewElo,
            change: eloData.player2NewElo - eloData.player2OldElo
          }
        }
      };
    } catch (error) {
      // Rollback transaction on error
      await this.run('ROLLBACK');
      console.error('Error updating match result:', error);
      throw error;
    }
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