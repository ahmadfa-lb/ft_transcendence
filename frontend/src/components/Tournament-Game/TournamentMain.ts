import { createComponent } from "../../utils/StateManager.js";
import { t } from "../../languages/LanguageController.js";
import { TournamentClient } from "./TournamentClient.js";
import { PongGameClient } from "../Online-Game/components/Game.js";
import { OnlineGameBoard } from "../Online-Game/components/OnlineGameBoard.js";
import TournamentBrackets from "./TournamentBrackets.js";
import { WaitingRoom, renderWaitingRoomSlots } from "./WaitingRoom.js";
import { renderResultsTab } from "./TournamentResults.js";
import store from "../../../store/store.js";

// Define possible tournament view states
enum TournamentView {
	LIST = 'LIST',
	CREATE = 'CREATE',
	WAITING_ROOM = 'WAITING_ROOM',
	BRACKETS = 'BRACKETS',
	MATCH = 'MATCH',
	RESULTS = 'RESULTS'
}

export const TournamentMain = createComponent(() => {
	// Track current view state
	let currentView = TournamentView.LIST;
	let activeTournament: any = null;
	let activeMatch: any = null;

	const container = document.createElement('div');
	container.className = "tournament-container flex flex-col h-full w-full";

	// Initialize WebSocket client for tournaments
	const webSocketUrl = `ws://${window.location.hostname}:3001`;
	const gameClient = new PongGameClient(webSocketUrl, String(store.userId));
	const tournamentClient = new TournamentClient(gameClient, String(store.userId));

	// Setup event handlers
	setupEventHandlers();

	// Initial render
	renderView();

	// Handle tournament events
	function setupEventHandlers() {
		tournamentClient.on('onTournamentCreated', (data: any) => {
			activeTournament = data.tournament;
			currentView = TournamentView.WAITING_ROOM;
			renderView();
		});

		tournamentClient.on('onTournamentUpdated', (data: any) => {
			activeTournament = data.tournament;
			renderView();
		});

		tournamentClient.on('onMatchStarting', (data: any) => {
			activeMatch = {
				matchId: data.matchId,
				opponentId: data.opponentId
			};
			showMatchCountdown();
		});

		tournamentClient.on('onMatchStart', (data: any) => {
			currentView = TournamentView.MATCH;
			activeMatch = {
				...activeMatch,
				isPlayer1: data.isPlayer1
			};
			renderView();
		});

		tournamentClient.on('onTournamentCompleted', (data: any) => {
			currentView = TournamentView.RESULTS;
			renderView();
		});
	}

	// Show countdown before match starts
	function showMatchCountdown() {
		const overlay = document.createElement('div');
		overlay.className = "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80";
		overlay.innerHTML = `
      <div class="text-3xl font-bold text-white mb-4">${t('play.tournaments.matchStarting')}</div>
      <div class="text-7xl font-bold text-pongcyan mb-8" id="countdown">3</div>
      <div class="text-xl text-white">${t('play.tournaments.getReady')}</div>
    `;

		document.body.appendChild(overlay);

		let count = 3;
		const countdownElem = document.getElementById('countdown');

		const interval = setInterval(() => {
			count--;
			if (countdownElem) {
				countdownElem.textContent = count.toString();
			}

			if (count <= 0) {
				clearInterval(interval);
				document.body.removeChild(overlay);
			}
		}, 1000);
	}

	// Render the appropriate view based on current state
	function renderView() {
		container.innerHTML = '';

		switch (currentView) {
			case TournamentView.LIST:
				renderTournamentList();
				break;
			case TournamentView.CREATE:
				renderCreateTournament();
				break;
			case TournamentView.WAITING_ROOM:
				renderTournamentWaitingRoom();
				break;
			case TournamentView.BRACKETS:
				renderTournamentBrackets();
				break;
			case TournamentView.MATCH:
				renderTournamentMatch();
				break;
			case TournamentView.RESULTS:
				renderTournamentResults();
				break;
		}
	}

	// Render tournament list view
	function renderTournamentList() {
		const listContainer = document.createElement('div');
		listContainer.className = "tournament-list p-6 h-full";
		listContainer.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">${t('play.tournaments.availableTournaments')}</h1>
        <button id="create-tournament" class="px-4 py-2 bg-pongcyan text-white rounded-lg hover:bg-opacity-80">
          ${t('play.tournaments.createNew')}
        </button>
      </div>
      
      <div id="tournaments-container" class="space-y-4 mb-6">
        <div class="text-center py-10">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pongcyan mx-auto mb-2"></div>
          <div class="text-gray-400">${t('play.tournaments.loadingTournaments')}</div>
        </div>
      </div>
    `;

		container.appendChild(listContainer);

		// Attach event listeners
		document.getElementById('create-tournament')?.addEventListener('click', () => {
			currentView = TournamentView.CREATE;
			renderView();
		});

		// Fetch tournaments
		tournamentClient.fetchTournaments();

		// Listen for tournament list response
		const tournamentListHandler = (data: any) => {
			const tournamentsContainer = document.getElementById('tournaments-container');
			if (!tournamentsContainer) return;

			if (data.tournaments.length === 0) {
				tournamentsContainer.innerHTML = `
          <div class="text-center py-10">
            <div class="text-gray-400">${t('play.tournaments.noTournamentsAvailable')}</div>
          </div>
        `;
				return;
			}

			tournamentsContainer.innerHTML = '';

			interface Tournament {
				id: string;
				name: string;
				registered_players: number;
				player_count: number;
			}

			data.tournaments.forEach((tournament: Tournament) => {
				const tournamentCard = document.createElement('div');
				tournamentCard.className = "tournament-card p-4 bg-pongcyan bg-opacity-20 rounded-lg flex justify-between items-center";
				tournamentCard.innerHTML = `
		<div>
		<div class="font-semibold text-lg">${tournament.name}</div>
		<div class="text-sm text-gray-300">
		  ${t('play.tournaments.players')}: ${tournament.registered_players}/${tournament.player_count}
		</div>
		</div>
		<button class="join-tournament px-4 py-2 bg-pongcyan text-white rounded-lg hover:bg-opacity-80" 
			data-id="${tournament.id}">
		${t('play.tournaments.join')}
		</button>
	  `;

				tournamentsContainer.appendChild(tournamentCard);
			});

			// Add event listeners to join buttons
			document.querySelectorAll('.join-tournament').forEach(button => {
				button.addEventListener('click', (e) => {
					const tournamentId = (e.target as HTMLElement).dataset.id;
					if (tournamentId) {
						tournamentClient.joinTournament(tournamentId);
					}
				});
			});
		};

		tournamentClient.on('tournament_list', tournamentListHandler);

		// Clean up
		return () => {
			tournamentClient.off('tournament_list', tournamentListHandler);
		};
	}

	// Render tournament creation form
	function renderCreateTournament() {
		const createForm = document.createElement('div');
		createForm.className = "create-tournament p-6 max-w-md mx-auto";
		createForm.innerHTML = `
      <h1 class="text-2xl font-bold mb-6">${t('play.tournaments.createTournament.title')}</h1>
      
      <form id="tournament-form" class="space-y-4">
        <div>
          <label for="tournament-name" class="block text-sm font-medium mb-1">
            ${t('play.tournaments.createTournament.name')}
          </label>
          <input type="text" id="tournament-name" required
                 class="w-full px-3 py-2 bg-pongdark border border-gray-600 rounded-lg focus:border-pongcyan focus:outline-none">
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">
            ${t('play.tournaments.createTournament.playerCount')}
          </label>
          <div class="flex gap-4">
            <label class="flex items-center">
              <input type="radio" name="player-count" value="4" checked class="mr-2">
              4 ${t('play.tournaments.createTournament.players')}
            </label>
            <label class="flex items-center">
              <input type="radio" name="player-count" value="8" class="mr-2">
              8 ${t('play.tournaments.createTournament.players')}
            </label>
          </div>
        </div>
        
        <div class="pt-4 flex gap-4">
          <button type="button" id="back-button" 
                  class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
            ${t('play.tournaments.createTournament.back')}
          </button>
          <button type="submit" 
                  class="px-4 py-2 bg-pongcyan text-white rounded-lg hover:bg-opacity-80">
            ${t('play.tournaments.createTournament.create')}
          </button>
        </div>
      </form>
    `;

		container.appendChild(createForm);

		// Add event listeners
		document.getElementById('back-button')?.addEventListener('click', () => {
			currentView = TournamentView.LIST;
			renderView();
		});

		document.getElementById('tournament-form')?.addEventListener('submit', (e) => {
			e.preventDefault();

			const nameInput = document.getElementById('tournament-name') as HTMLInputElement;
			const playerCountInput = document.querySelector('input[name="player-count"]:checked') as HTMLInputElement;

			if (nameInput && playerCountInput) {
				tournamentClient.createTournament(
					nameInput.value,
					parseInt(playerCountInput.value) as 4 | 8
				);
			}
		});
	}

	// Render tournament waiting room
	function renderTournamentWaitingRoom() {
		if (!activeTournament) {
			currentView = TournamentView.LIST;
			renderView();
			return;
		}

		const waitingRoomComponent = WaitingRoom();
		container.appendChild(waitingRoomComponent);

		// Add event listeners
		document.getElementById('leave-tournament')?.addEventListener('click', () => {
			// Implement leave tournament functionality
			currentView = TournamentView.LIST;
			activeTournament = null;
			renderView();
		});

		// Render players in waiting room
		const playerCount = activeTournament.player_count || 4;
		renderWaitingRoomSlots(waitingRoomComponent, playerCount);

		// If tournament status changes to in_progress, switch to brackets view
		if (activeTournament.status === 'in_progress') {
			currentView = TournamentView.BRACKETS;
			renderView();
		}
	}

	// Render tournament brackets
	function renderTournamentBrackets() {
		if (!activeTournament) {
			currentView = TournamentView.LIST;
			renderView();
			return;
		}

		const bracketsContainer = document.createElement('div');
		bracketsContainer.className = "brackets-container p-4 h-full";
		bracketsContainer.innerHTML = `
      <h1 class="text-2xl font-bold mb-4">${activeTournament.name || t('play.tournaments.tournamentBrackets')}</h1>
    `;

		// Get matches and organize by round
		const matches = processMatchesForBrackets(activeTournament);

		// Create tournament bracket component
		const bracketProps = {
			playersCount: activeTournament.player_count || 4,
			matches: matches,
			onMatchClick: (matchId: string) => {
				// Handle match click - check if player is part of this match
				interface Match {
					id: string;
					players: { player_id: string }[];
					status: string;
				}
				const match: Match | undefined = activeTournament.matches.find((m: Match) => m.id === matchId);
				if (match && match.players.some(p => p.player_id === store.userId)) {
					tournamentClient.readyForMatch(matchId);
				}
			}
		};

		const bracketComponent = TournamentBrackets(bracketProps);
		bracketsContainer.appendChild(bracketComponent);

		container.appendChild(bracketsContainer);
	}

	// Helper to process matches for bracket visualization
	interface Tournament {
		matches: Match[];
	}

	interface Match {
		id: string;
		players: Player[];
		status: string;
	}

	interface Player {
		player_id: string;
	}

	interface ProcessedMatch {
		id: string;
		round: number;
		position: number;
		player1?: ProcessedPlayer;
		player2?: ProcessedPlayer;
		isCompleted: boolean;
	}

	interface ProcessedPlayer {
		id: string;
		username: string;
	}

	function processMatchesForBrackets(tournament: Tournament): ProcessedMatch[] {
		if (!tournament || !tournament.matches) return [];

		return tournament.matches.map((match: Match): ProcessedMatch => {
			return {
				id: match.id,
				round: 0, // Determine proper round
				position: 0, // Determine proper position
				player1: match.players[0] ? {
					id: match.players[0].player_id,
					username: 'Player ' + match.players[0].player_id
				} : undefined,
				player2: match.players[1] ? {
					id: match.players[1].player_id,
					username: 'Player ' + match.players[1].player_id
				} : undefined,
				isCompleted: match.status === 'completed'
			};
		});
	}

	// Render tournament match
	function renderTournamentMatch() {
		if (!activeMatch) {
			currentView = TournamentView.BRACKETS;
			renderView();
			return;
		}

		// Create game header
		const gameHeader = document.createElement('div');
		gameHeader.id = 'game-header';

		// Create canvas for game
		const canvas = document.createElement('canvas');
		canvas.id = 'gameCanvas';
		canvas.className = 'w-full h-full block';

		// Append to container
		container.appendChild(gameHeader);
		container.appendChild(canvas);

		// Create game board using OnlineGameBoard
		const gameBoard = new OnlineGameBoard(
			canvas,
			gameHeader,
			gameClient,
			activeMatch.matchId,
			String(store.userId),
			activeMatch.opponentId,
			activeMatch.isPlayer1
		);

		// Start the game
		gameBoard.startGame();

		// Clean up
		return () => {
			gameBoard.stopGame();
		};
	}

	// Render tournament results
	function renderTournamentResults() {
		if (!activeTournament) {
			currentView = TournamentView.LIST;
			renderView();
			return;
		}

		const resultsContainer = document.createElement('div');
		resultsContainer.className = "results-container p-6";
		resultsContainer.innerHTML = `
      <h1 class="text-2xl font-bold mb-6">
        ${activeTournament.name || t('play.tournaments.tournamentResults')}
      </h1>
      
      <div id="results-content" class="flex justify-center">
        <!-- Results will be rendered here -->
      </div>
      
      <div class="flex justify-center mt-8">
        <button id="back-to-tournaments" class="px-4 py-2 bg-pongcyan text-white rounded-lg hover:bg-opacity-80">
          ${t('play.tournaments.backToTournaments')}
        </button>
      </div>
    `;

		container.appendChild(resultsContainer);

		// Process tournament data for results
		const results = processResultsData(activeTournament);
		renderResultsTab(resultsContainer, results);

		// Add event listeners
		document.getElementById('back-to-tournaments')?.addEventListener('click', () => {
			currentView = TournamentView.LIST;
			activeTournament = null;
			renderView();
		});
	}

	// Helper to process tournament data for results
	interface TournamentPlayer {
		user_id: string;
		nickname?: string;
		placement?: number;
	}

	interface ProcessedPlayerResult {
		userId: string;
		username: string;
		avatarUrl: string;
		place: number;
	}

	function processResultsData(tournament: { players?: TournamentPlayer[] }): ProcessedPlayerResult[] {
		if (!tournament || !tournament.players) return [];

		return tournament.players.map((player: TournamentPlayer): ProcessedPlayerResult => {
			return {
				userId: player.user_id,
				username: player.nickname || 'Player ' + player.user_id,
				avatarUrl: '', // Fetch or set default avatar
				place: player.placement || 0
			};
		});
	}

	return container;
});