export default async function tournamentRoutes(fastify, options) {
	fastify.get('/api/tournaments', async (request, reply) => {
		try {
			const { status, limit = 10, offset = 0 } = request.query;

			let query = `SELECT t.*, COUNT(tp.user_id) as player_count 
					FROM tournaments t 
					LEFT JOIN tournament_players tp ON t.id = tp.tournament_id`;

			const queryParams = [];

			if (status) {
				query += ` WHERE t.status = ?`;
				queryParams.push(status);
			}

			query += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
			queryParams.push(parseInt(limit), parseInt(offset));

			const tournaments = await fastify.db.all(query, queryParams);

			return { tournaments };
		} catch (error) {
			fastify.log.error(`Error fetching tournaments: ${error.message}`);
			return reply.code(500).send({ error: 'Failed to fetch tournaments' });
		}
	});

	fastify.get('/api/tournaments/:id', async (request, reply) => {
		try {
			const { id } = request.params;
			const tournamentService = fastify.tournamentService;
			const details = await tournamentService.getTournamentDetails(id);

			return details;
		} catch (error) {
			fastify.log.error(`Error fetching tournament: ${error.message}`);
			return reply.code(500).send({ error: 'Failed to fetch tournament' });
		}
	});

	fastify.post('/api/tournaments', async (request, reply) => {
		try {
			const { name, playerCount = 4 } = request.body;

			if (!name) {
				return reply.code(400).send({ error: 'Tournament name is required' });
			}

			const tournamentService = fastify.tournamentService;
			const tournament = await tournamentService.createTournament(name, playerCount);

			return { tournament };
		} catch (error) {
			fastify.log.error(`Error creating tournament: ${error.message}`);
			return reply.code(500).send({ error: 'Failed to create tournament' });
		}
	});

	fastify.post('/api/tournaments/:id/players', async (request, reply) => {
		try {
			const { id } = request.params;
			const { userId } = request.body;

			if (!userId) {
				return reply.code(400).send({ error: 'User ID is required' });
			}

			const tournamentService = fastify.tournamentService;
			const result = await tournamentService.registerPlayer(id, userId);

			return result;
		} catch (error) {
			fastify.log.error(`Error registering player: ${error.message}`);
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.post('/api/tournaments/:id/start', async (request, reply) => {
		try {
			const { id } = request.params;

			const tournamentService = fastify.tournamentService;
			const result = await tournamentService.startTournament(id);

			return result;
		} catch (error) {
			fastify.log.error(`Error starting tournament: ${error.message}`);
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.post('/api/tournaments/matches/:matchId/result', async (request, reply) => {
		try {
			const { matchId } = request.params;
			const { winnerId } = request.body;

			if (!winnerId) {
				return reply.code(400).send({ error: 'Winner ID is required' });
			}

			const tournamentService = fastify.tournamentService;
			const result = await tournamentService.updateTournamentMatchResult(matchId, winnerId);

			return result;
		} catch (error) {
			fastify.log.error(`Error updating match result: ${error.message}`);
			return reply.code(500).send({ error: error.message });
		}
	});
}
