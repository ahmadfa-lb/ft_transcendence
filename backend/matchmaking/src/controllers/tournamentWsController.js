import TournamentService from '../services/tournament.js';

export function registerTournamentMessageHandlers(wsAdapter) {
	wsAdapter.registerMessageHandler('create_tournament', async (clientId, payload) => {
		try {
			const { name, playerCount } = payload;
			const tournament = await TournamentService.createTournament(name, playerCount);

			await TournamentService.registerPlayer(tournament.id, clientId);

			const tournamentDetails = await TournamentService.getTournamentDetails(tournament.id);

			wsAdapter.sendToClient(clientId, 'tournament_created', {
				tournament,
				tournamentDetails
			});
		} catch (error) {
			console.error('Error creating tournament:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error creating tournament: ${error.message}`
			});
		}
	});

	wsAdapter.registerMessageHandler('join_tournament', async (clientId, payload) => {
		try {
			const { tournamentId } = payload;

			const result = await TournamentService.registerPlayer(tournamentId, clientId);

			wsAdapter.sendToClient(clientId, 'tournament_joined', {
				tournamentId,
				success: true
			});

			const tournamentDetails = await TournamentService.getTournamentDetails(tournamentId);
			const playerIds = tournamentDetails.players.map(p => p.player_id);

			wsAdapter.sendToClient(clientId, 'tournament_details', tournamentDetails);

			playerIds.forEach(playerId => {
				if (playerId !== clientId) {
					wsAdapter.sendToClient(playerId, 'tournament_player_joined', {
						tournamentId,
						players: tournamentDetails.players
					});
				}
			});

			if (tournamentDetails.tournament.status === 'in_progress') {
				wsAdapter.sendToClient(clientId, 'tournament_started', {
					tournamentId,
					tournament: tournamentDetails.tournament,
					matches: tournamentDetails.matches
				});

				const playerMatches = tournamentDetails.matches.filter(match =>
					match.status === 'pending' &&
					match.players &&
					match.players.some(p => p.player_id === clientId)
				);

				playerMatches.forEach(match => {
					const opponent = match.players.find(p => p.player_id !== clientId);
					if (opponent) {
						wsAdapter.sendToClient(clientId, 'tournament_match_notification', {
							tournamentId,
							matchId: match.id,
							opponent: {
								id: opponent.player_id,
								username: opponent.nickname || `Player ${opponent.player_id}`,
								elo: opponent.elo_before,
								avatar: opponent.avatar_url
							},
							round: match.round || 1
						});
					}
				});
			}
		} catch (error) {
			console.error('Error joining tournament:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error joining tournament: ${error.message}`
			});
		}
	});

	wsAdapter.registerMessageHandler('leave_tournament', async (clientId, payload) => {
		try {
			const { tournamentId } = payload;

			const tournament = await TournamentService.getTournamentDetails(tournamentId);
			if (!tournament) {
				throw new Error('Tournament not found');
			}

			await TournamentService.removePlayerFromTournament(tournamentId, clientId);

			wsAdapter.sendToClient(clientId, 'tournament_left', {
				tournamentId,
				success: true
			});

			const updatedTournament = await TournamentService.getTournamentDetails(tournamentId);
			const remainingPlayers = updatedTournament.players.map(p => p.player_id);
			console.log(updatedTournament.players);

			remainingPlayers.forEach(playerId => {
				wsAdapter.sendToClient(playerId, 'tournament_player_left', {
					tournamentId,
					playerId: clientId,
					players: updatedTournament.players
				});
			});
		} catch (error) {
			console.error('Error leaving tournament:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error leaving tournament: ${error.message}`
			});
		}
	});

	wsAdapter.registerMessageHandler('start_tournament', async (clientId, payload) => {
		try {
			const { tournamentId } = payload;

			const result = await TournamentService.startTournament(tournamentId);

			const tournamentDetails = await TournamentService.getTournamentDetails(tournamentId);
			const playerIds = tournamentDetails.players.map(p => p.player_id);

			playerIds.forEach(playerId => {
				wsAdapter.sendToClient(playerId, 'tournament_started', {
					tournamentId,
					tournament: tournamentDetails.tournament,
					matches: tournamentDetails.matches
				});
			});
		} catch (error) {
			console.error('Error starting tournament:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error starting tournament: ${error.message}`
			});
		}
	});

	const matchAcceptances = new Map();

	wsAdapter.registerMessageHandler('tournament_match_accept', async (clientId, payload) => {
		try {
			const { matchId } = payload;
			const matchWithPlayers = await TournamentService.getMatchWithPlayers(matchId);
			if (!matchWithPlayers)
				throw new Error(`Match ${matchId} not found`);

			const { match, players } = matchWithPlayers;

			if (!matchAcceptances.has(matchId))
				matchAcceptances.set(matchId, new Set());

			const acceptedPlayers = matchAcceptances.get(matchId);
			acceptedPlayers.add(clientId);

			console.log(`Player ${clientId} accepted match ${matchId}. Accepted: ${acceptedPlayers.size}/${players.length}`);

			wsAdapter.sendToClient(clientId, 'tournament_match_accepted', {
				tournamentId: match.tournament_id,
				matchId,
				message: 'Match accepted! Waiting for opponent...'
			});
			const otherPlayer = players.find(p => String(p.player_id) !== String(clientId));
			if (otherPlayer) {
				wsAdapter.sendToClient(otherPlayer.player_id, 'tournament_opponent_accepted', {
					tournamentId: match.tournament_id,
					matchId,
					acceptingPlayer: clientId,
					message: 'Your opponent is ready!'
				});
			}

			if (acceptedPlayers.size === players.length) {
				console.log(`Both players accepted match ${matchId}. Starting match...`);

				matchAcceptances.delete(matchId);

				players.forEach(player => {
					const opponent = players.find(p => p.player_id !== player.player_id);

					if (opponent) {
						wsAdapter.sendToClient(player.player_id, 'tournament_match_starting', {
							matchId: match.id,
							tournamentId: match.tournament_id,
							opponent: {
								id: opponent.player_id,
								username: opponent.nickname || `Player ${opponent.player_id}`,
								elo: opponent.elo_score,
								avatar: opponent.avatar_url || undefined
							},
							isPlayer1: player.player_id === players[0].player_id
						});
					}
				});
			}
		} catch (error) {
			console.error('Error accepting tournament match:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error accepting tournament match: ${error.message}`
			});
		}
	});

	wsAdapter.registerMessageHandler('tournament_match_ready', async (clientId, payload) => {
		try {
			const { matchId } = payload;

			const matchWithPlayers = await TournamentService.getMatchWithPlayers(matchId);

			if (!matchWithPlayers) {
				throw new Error(`Match ${matchId} not found`);
			}

			const { match, players } = matchWithPlayers;

			players.forEach(player => {
				const opponent = players.find(p => p.player_id !== player.player_id);

				if (opponent) {
					wsAdapter.sendToClient(player.player_id, 'tournament_match_notification', {
						tournamentId: match.tournament_id,
						matchId: match.id,
						opponent: {
							id: opponent.player_id,
							username: opponent.nickname || `Player ${opponent.player_id}`,
							elo: opponent.elo_score,
							avatar: opponent.avatar_url
						},
						round: match.round || 1
					});
				}
			});
		} catch (error) {
			console.error('Error setting up tournament match:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error setting up tournament match: ${error.message}`
			});
		}
	});

	function cleanupPlayerMatchAcceptances(playerId) {
		for (const [matchId, acceptedPlayers] of matchAcceptances.entries()) {
			if (acceptedPlayers.has(playerId)) {
				acceptedPlayers.delete(playerId);

				if (acceptedPlayers.size === 0) {
					matchAcceptances.delete(matchId);
				}
			}
		}
	}

	wsAdapter.registerMessageHandler('tournament_match_result', async (clientId, payload) => {
		try {
			const { matchId, winnerId, finalScore } = payload;
			console.log(`Tournament match result received: Match ${matchId}, Winner ${winnerId}, Score:`, finalScore);

			const result = await TournamentService.updateTournamentMatchResult(matchId, winnerId, finalScore);

			if (result.alreadyCompleted) {
				console.log(`Match ${matchId} was already completed`);
				return;
			}

			const tournamentId = result.tournamentId;
			const tournamentDetails = await TournamentService.getTournamentDetails(tournamentId);
			const playerIds = tournamentDetails.players.map(p => p.player_id);

			playerIds.forEach(playerId => {
				wsAdapter.sendToClient(playerId, 'tournament_match_completed', {
					tournamentId,
					matchId,
					winnerId: result.winnerId,
					winnerGoals: result.winnerGoals,
					loserGoals: result.loserGoals,
					winnerEloChange: result.winnerEloChange,
					loserEloChange: result.loserEloChange,
					tournament: tournamentDetails.tournament,
					matches: tournamentDetails.matches
				});
			});

			if (result.tournamentStatus === 'completed') {
				playerIds.forEach(playerId => {
					wsAdapter.sendToClient(playerId, 'tournament_completed', {
						tournamentId,
						champion: result.champion,
						tournament: tournamentDetails.tournament,
						matches: tournamentDetails.matches,
						players: tournamentDetails.players
					});
				});
				console.log(`Tournament ${tournamentId} completed. Champion: ${result.champion}`);
			}
			else if (result.nextRoundMatches && result.nextRoundMatches.length > 0) {
				console.log(`Next round started for tournament ${tournamentId}`);

				setTimeout(() => {
					result.nextRoundMatches.forEach(async (match) => {
						try {
							const matchWithPlayers = await TournamentService.getMatchWithPlayers(match.matchId);
							if (matchWithPlayers) {
								const { players } = matchWithPlayers;

								players.forEach(player => {
									const opponent = players.find(p => p.player_id !== player.player_id);
									if (opponent) {
										wsAdapter.sendToClient(
											player.player_id,
											'tournament_match_notification',
											{
												tournamentId,
												matchId: match.matchId,
												opponent: {
													id: opponent.player_id,
													username: opponent.nickname || `Player ${opponent.player_id}`,
													elo: opponent.elo_score
												},
												message: 'Your next tournament match is ready!'
											}
										);
									}
								});
							}
						} catch (error) {
							console.error(`Error notifying players about match ${match.matchId}:`, error);
						}
					});
				}, 2000);
			}
		} catch (error) {
			console.error('Error processing tournament match result:', error);
			wsAdapter.sendToClient(
				clientId,
				'error',
				{ message: `Error processing tournament match result: ${error.message}` }
			);
		}
	});

	wsAdapter.registerMessageHandler('get_tournament_details', async (clientId, payload) => {
		try {
			const { tournamentId } = payload;

			const tournamentDetails = await TournamentService.getTournamentDetails(tournamentId);
			if (!tournamentDetails || !tournamentDetails.tournament) {
				wsAdapter.sendToClient(clientId, 'tournament_not_found', {
					message: 'Tournament not found'
				});
				return;
			}

			wsAdapter.sendToClient(clientId, 'tournament_details', tournamentDetails);
		} catch (error) {
			console.error('Error getting tournament details:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error getting tournament details: ${error.message}`
			});
		}
	});

	wsAdapter.registerMessageHandler('list_tournaments', async (clientId, payload) => {
		try {
			const tournaments = await TournamentService.getActiveTournaments();
			wsAdapter.sendToClient(clientId, 'tournament_list', { tournaments });
		} catch (error) {
			console.error('Error listing tournaments:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error listing tournaments: ${error.message}`
			});
		}
	});

	wsAdapter.registerMessageHandler('list_user_tournaments', async (clientId, payload) => {
		try {
			const { limit = 10, offset = 0 } = payload;
			const tournaments = await TournamentService.getUserTournaments(clientId, limit, offset);

			wsAdapter.sendToClient(clientId, 'user_tournament_list', { tournaments });
		} catch (error) {
			console.error('Error listing user tournaments:', error);
			wsAdapter.sendToClient(clientId, 'error', {
				message: `Error listing user tournaments: ${error.message}`
			});
		}
	});
}