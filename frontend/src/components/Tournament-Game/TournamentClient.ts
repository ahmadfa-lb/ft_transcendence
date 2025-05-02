import { PongGameClient } from '../Online-Game/components/Game';

export class TournamentClient {
	baseClient: PongGameClient;
	userId: string;
	currentTournament: string | null;
	tournamentCallbacks: { [key: string]: ((data: any) => void)[] }

	constructor(baseClient: PongGameClient, userId: string) {
		this.baseClient = baseClient;
		this.userId = userId;
		this.currentTournament = null;
		this.tournamentCallbacks = {
			'onTournamentUpdated': [],
			'onTournamentJoined': [],
			'onTournamentCreated': [],
			'onMatchStarting': [],
			'onMatchStart': [],
			'onTournamentCompleted': []
		};

		this.setupEventHandlers();
	}

	setupEventHandlers() {
		// Register handlers for tournament WebSocket events
		this.baseClient.on('tournament_updated', (data) => {
			this.currentTournament = data.tournament;
			this.triggerCallbacks('onTournamentUpdated', data);
		});

		this.baseClient.on('tournament_created', (data) => {
			this.currentTournament = data.tournament;
			this.triggerCallbacks('onTournamentCreated', data);
		});

		this.baseClient.on('tournament_match_starting', (data) => {
			this.triggerCallbacks('onMatchStarting', data);
		});

		this.baseClient.on('tournament_match_start', (data) => {
			this.triggerCallbacks('onMatchStart', data);
		});

		this.baseClient.on('tournament_completed', (data) => {
			this.triggerCallbacks('onTournamentCompleted', data);
		});
	}

	// Register callback for specific tournament events
	on(eventName: string, callback: (data: any) => void) {
		if (this.tournamentCallbacks[eventName]) {
			this.tournamentCallbacks[eventName].push(callback);
		}
	}

	// Remove callback
	off(eventName: string, callback: (data: any) => void) {
		if (this.tournamentCallbacks[eventName]) {
			const index = this.tournamentCallbacks[eventName].indexOf(callback);
			if (index !== -1) {
				this.tournamentCallbacks[eventName].splice(index, 1);
			}
		}
	}

	// Trigger callbacks for a specific event
	triggerCallbacks(eventName: string, data: any) {
		if (this.tournamentCallbacks[eventName]) {
			this.tournamentCallbacks[eventName].forEach(callback => {
				try {
					callback(data);
				} catch (error) {
					console.error(`Error in tournament ${eventName} callback:`, error);
				}
			});
		}
	}

	// Get available tournaments
	fetchTournaments() {
		this.baseClient.send('tournament_list');
	}

	// Create a new tournament
	createTournament(name: string, playerCount: 4 | 8) {
		this.baseClient.send('tournament_create', {
			name,
			playerCount
		});
	}

	// Join an existing tournament
	joinTournament(tournamentId: string) {
		this.baseClient.send('tournament_join', {
			tournamentId
		});
	}

	// Get details for a specific tournament
	getTournamentDetails(tournamentId: string) {
		this.baseClient.send('tournament_details', {
			tournamentId
		});
	}

	// Mark player as ready for a match
	readyForMatch(matchId: string) {
		this.baseClient.send('tournament_match_ready', {
			matchId
		});
	}

	// Submit tournament match result
	submitMatchResult(matchId: string, winnerId: string, scores: any) {
		this.baseClient.send('tournament_match_complete', {
			matchId,
			winnerId,
			scores
		});
	}
}