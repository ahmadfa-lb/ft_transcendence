import db from '../config/db.js';
import EloService from './elo.js';

class TournamentService {
  constructor() {
    this.eloService = EloService;
  }

  // Create a new tournament
  async createTournament(name, playerCount) {
    if (playerCount !== 4 && playerCount !== 8) {
      throw new Error('Tournament must have 4 or 8 players');
    }

    try {
      const result = await db.run(
        `INSERT INTO tournaments (name, status, player_count) 
         VALUES (?, ?, ?)`,
        [name, 'registering', playerCount]
      );

      return {
        id: result.lastID,
        name,
        status: 'registering',
        playerCount
      };
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  // Register a player for a tournament
  async registerPlayer(tournamentId, userId) {
    try {
      const tournament = await db.get(
        `SELECT * FROM tournaments WHERE id = ?`,
        [tournamentId]
      );

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'registering') {
        throw new Error('Tournament is not open for registration');
      }

      // Check if user is already registered
      const existing = await db.get(
        `SELECT * FROM tournament_players 
         WHERE tournament_id = ? AND user_id = ?`,
        [tournamentId, userId]
      );

      if (existing) {
        throw new Error('Player already registered for this tournament');
      }

      // Check if tournament is full
      const currentCount = await db.get(
        `SELECT COUNT(*) as count FROM tournament_players 
         WHERE tournament_id = ?`, 
        [tournamentId]
      );

      if (currentCount.count >= tournament.player_count) {
        throw new Error('Tournament is already full');
      }

      // Add player to tournament
      await db.run(
        `INSERT INTO tournament_players (tournament_id, user_id) 
         VALUES (?, ?)`,
        [tournamentId, userId]
      );

      // If tournament is now full, we could automatically start it
      if (currentCount.count + 1 === tournament.player_count) {
        await this.startTournament(tournamentId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error registering player:', error);
      throw error;
    }
  }

  // Start a tournament and create first round matches
  async startTournament(tournamentId) {
    try {
      const tournament = await db.get(
        `SELECT * FROM tournaments WHERE id = ?`,
        [tournamentId]
      );

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'registering') {
        throw new Error('Tournament already started or completed');
      }

      // Get all players
      const players = await db.all(
        `SELECT tp.player_id, u.elo_score 
         FROM tournament_players tp
         JOIN players u ON tp.player_id = u.id
         WHERE tp.tournament_id = ?`,
        [tournamentId]
      );

      if (players.length !== tournament.player_count) {
        throw new Error(`Not enough players (${players.length}/${tournament.player_count})`);
      }

      // Update tournament status
      await db.run(
        `UPDATE tournaments SET status = 'in_progress', started_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [tournamentId]
      );

      // Randomize player order for fair matchmaking
      const shuffledPlayers = this.shufflePlayers(players);

      // Create first round matches
      const matches = [];
      for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1 = shuffledPlayers[i];
        const player2 = shuffledPlayers[i + 1];

        const matchResult = await this.createTournamentMatch(
          tournamentId, 
          player1.user_id, 
          player2.user_id
        );
        
        matches.push(matchResult);
      }

      return {
        tournamentId,
        status: 'in_progress',
        firstRoundMatches: matches
      };
    } catch (error) {
      console.error('Error starting tournament:', error);
      throw error;
    }
  }

  // Helper to randomize player order for fair matchmaking
  shufflePlayers(players) {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Create a match between two tournament players
  async createTournamentMatch(tournamentId, player1Id, player2Id) {
    try {
      const player1 = await db.get(`SELECT id, elo_score FROM players WHERE id = ?`, [player1Id]);
      const player2 = await db.get(`SELECT id, elo_score FROM players WHERE id = ?`, [player2Id]);

      // Create match record
      const matchResult = await db.run(
        `INSERT INTO matches (match_type, status) VALUES (?, ?)`,
        ['tournament', 'pending']
      );
      const matchId = matchResult.lastID;

      // Add players to match with their current ELO
      await db.run(
        `INSERT INTO match_players (match_id, player_id, elo_before) VALUES (?, ?, ?)`,
        [matchId, player1.id, player1.elo_score]
      );
      await db.run(
        `INSERT INTO match_players (match_id, player_id, elo_before) VALUES (?, ?, ?)`,
        [matchId, player2.id, player2.elo_score]
      );

      return {
        matchId,
        tournamentId,
        player1: { id: player1.id, elo: player1.elo_score },
        player2: { id: player2.id, elo: player2.elo_score }
      };
    } catch (error) {
      console.error('Error creating tournament match:', error);
      throw error;
    }
  }

  // Handle tournament match result and progress tournament
  async updateTournamentMatchResult(matchId, winnerId) {
    try {
      // First update the match result (similar to regular match)
      const match = await db.get(`SELECT * FROM matches WHERE id = ?`, [matchId]);
      if (!match || match.status === 'completed' || match.match_type !== 'tournament') {
        throw new Error('Tournament match not found or already completed');
      }

      // Get players in this match
      const players = await db.all(
        `SELECT mp.*, u.elo_score FROM match_players mp 
         JOIN players u ON mp.player_id = u.id
         WHERE mp.match_id = ?`,
        [matchId]
      );

      const winner = players.find(p => p.player_id === winnerId);
      const loser = players.find(p => p.player_id !== winnerId);

      if (!winner) {
        throw new Error('Winner not found in this match');
      }

      // Calculate new ELO ratings (smaller K-factor for tournaments)
      const tournamentEloService = new EloService({ kFactor: 16 });
      const winnerNewElo = tournamentEloService.calculateNewRatings(
        winner.elo_score, loser.elo_score, true
      );
      const loserNewElo = tournamentEloService.calculateNewRatings(
        loser.elo_score, winner.elo_score, false
      );

      // Update match_players with scores and new ELO
      await db.run(
        `UPDATE match_players SET score = 1, elo_after = ? WHERE match_id = ? AND player_id = ?`,
        [winnerNewElo, matchId, winner.player_id]
      );
      await db.run(
        `UPDATE match_players SET score = 0, elo_after = ? WHERE match_id = ? AND player_id = ?`,
        [loserNewElo, matchId, loser.player_id]
      );

      // Update match status
      await db.run(
        `UPDATE matches SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [matchId]
      );

      // Find tournament for this match by querying related players
      const tournamentPlayers = await db.get(
        `SELECT tournament_id FROM tournament_players 
         WHERE user_id = ? OR user_id = ? 
         LIMIT 1`,
        [winner.player_id, loser.player_id]
      );

      if (!tournamentPlayers) {
        throw new Error('Tournament not found for this match');
      }

      const tournamentId = tournamentPlayers.tournament_id;

      // Check if we need to create next round matches
      await this.progressTournament(tournamentId);

      // Update user stats in auth service
      await this.updateUserStats(winner.player_id, winnerNewElo, true);
      await this.updateUserStats(loser.player_id, loserNewElo, false);

      return {
        matchId,
        tournamentId,
        winner: { id: winner.player_id, newElo: winnerNewElo },
        loser: { id: loser.player_id, newElo: loserNewElo }
      };
    } catch (error) {
      console.error('Error updating tournament match:', error);
      throw error;
    }
  }

  // Progress tournament to next round or complete it
  async progressTournament(tournamentId) {
    try {
      const tournament = await db.get(
        `SELECT * FROM tournaments WHERE id = ?`,
        [tournamentId]
      );

      if (!tournament || tournament.status !== 'in_progress') {
        throw new Error('Tournament not found or not in progress');
      }

      // Get all completed matches for this tournament
      const completedMatches = await db.all(
        `SELECT m.id, m.status, mp.player_id, mp.score
         FROM matches m
         JOIN match_players mp ON m.id = mp.match_id
         JOIN tournament_players tp ON mp.player_id = tp.user_id
         WHERE tp.tournament_id = ? AND m.match_type = 'tournament' AND m.status = 'completed'`,
        [tournamentId]
      );

      // Group by match ID to get winners
      const matchResults = {};
      completedMatches.forEach(match => {
        if (!matchResults[match.id]) {
          matchResults[match.id] = [];
        }
        matchResults[match.id].push(match);
      });

      // Extract winners
      const winners = Object.values(matchResults)
        .map(players => {
          // Find player with score 1 (winner)
          return players.find(p => p.score === 1)?.player_id;
        })
        .filter(Boolean);

      // Get total matches needed for tournament
      // 4 players = 3 matches (2 semifinals + 1 final)
      // 8 players = 7 matches (4 quarterfinals + 2 semifinals + 1 final)
      const totalMatches = tournament.player_count - 1;
      const completedMatchCount = Object.keys(matchResults).length;

      if (completedMatchCount === totalMatches) {
        // Tournament is complete, update final placements
        await this.completeTournament(tournamentId, winners);
        return { status: 'completed', winnerId: winners[winners.length - 1] };
      } else {
        // Create next round matches
        const nextRoundMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
          // Make sure we have pairs
          if (i + 1 < winners.length) {
            const match = await this.createTournamentMatch(
              tournamentId,
              winners[i],
              winners[i + 1]
            );
            nextRoundMatches.push(match);
          }
        }
        return { status: 'in_progress', nextRoundMatches };
      }
    } catch (error) {
      console.error('Error progressing tournament:', error);
      throw error;
    }
  }

  // Complete tournament and assign final placements
  async completeTournament(tournamentId, winners) {
    try {
      // Winner is the last winner (of the final match)
      const champion = winners[winners.length - 1];
      
      // Update tournament status
      await db.run(
        `UPDATE tournaments SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [tournamentId]
      );

      // Set winner's placement to 1
      await db.run(
        `UPDATE tournament_players SET placement = 1
         WHERE tournament_id = ? AND user_id = ?`,
        [tournamentId, champion]
      );

      // We could calculate other placements based on when they lost
      // For simplicity, let's just mark everyone else as placed 2
      await db.run(
        `UPDATE tournament_players SET placement = 2
         WHERE tournament_id = ? AND user_id != ?`,
        [tournamentId, champion]
      );

      return { tournamentId, champion };
    } catch (error) {
      console.error('Error completing tournament:', error);
      throw error;
    }
  }

  // Get tournament details with matches and players
  async getTournamentDetails(tournamentId) {
    try {
      // Get tournament info
      const tournament = await db.get(
        `SELECT * FROM tournaments WHERE id = ?`,
        [tournamentId]
      );

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Get all players
      const players = await db.all(
        `SELECT tp.*, u.nickname, u.elo_score
         FROM tournament_players tp
         JOIN players u ON tp.user_id = u.id
         WHERE tp.tournament_id = ?`,
        [tournamentId]
      );

      // Get all matches
      const matches = await db.all(
        `SELECT m.*, mp.player_id, mp.score, mp.elo_before, mp.elo_after
         FROM matches m
         JOIN match_players mp ON m.id = mp.match_id
         JOIN tournament_players tp ON mp.player_id = tp.user_id
         WHERE tp.tournament_id = ? AND m.match_type = 'tournament'
         ORDER BY m.created_at`,
        [tournamentId]
      );

      // Organize matches by round (simplified)
      const groupedMatches = {};
      matches.forEach(match => {
        if (!groupedMatches[match.id]) {
          groupedMatches[match.id] = { 
            id: match.id,
            status: match.status,
            created_at: match.created_at,
            completed_at: match.completed_at,
            players: []
          };
        }
        groupedMatches[match.id].players.push({
          player_id: match.player_id,
          score: match.score,
          elo_before: match.elo_before,
          elo_after: match.elo_after
        });
      });

      const tournamentMatches = Object.values(groupedMatches);

      return {
        tournament,
        players,
        matches: tournamentMatches
      };
    } catch (error) {
      console.error('Error getting tournament details:', error);
      throw error;
    }
  }

  // Update user stats in the auth service
  async updateUserStats(userId, newElo, isWin) {
    // Implementation depends on your microservice communication strategy
    // Similar to the method in matchmaking service
  }
}

export default new TournamentService();