import matchmakingService from '../services/matchmaking.js';
import { createWebSocketAdapter } from '../services/websocketAdapter.js'; 


/**
 * Sets up WebSocket handlers for the matchmaking service
 * @param {WebSocketAdapter} wsAdapter - The WebSocket adapter instance
 * @param {FastifyInstance} fastify - The Fastify instance
 */
export function setupWebSocketHandlers(wsAdapter, fastify) {
  // Initialize the WebSocket adapter with our connection handler
  wsAdapter.initialize(async (socket, request) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      console.log(`WebSocket connection URL: ${url}`);
      
      const userId = url.searchParams.get('userId');
          
      if (!userId) {
        fastify.log.error('WebSocket connection attempt without userId');
        socket.close(1008, "Missing user identification");
        return;
      }
      
      // Use the actual user ID directly
      const clientId = userId;
      
      // Make sure user exists in the database
      try {
        await matchmakingService.getUserWithElo(clientId);
      } catch (error) {
        fastify.log.error(`Error getting user data: ${error.message}`);
        socket.close(1011, "Error retrieving user data");
        return;
      }
      
      // Register the new client with user data
      wsAdapter.registerClient(clientId, socket, { userId });
      
      fastify.log.info(`New WebSocket connection from user: ${clientId}`);
      
      // Set up message handler for this socket
      socket.on('message', async (rawMessage) => {
        // console.log(`Received message from ${clientId}: ${rawMessage}`);
        
        try {
          // Parse the message
          let data;
          if (typeof rawMessage === 'string') {
            data = JSON.parse(rawMessage);
          } else {
            // If it's a Buffer, convert to string first
            data = JSON.parse(rawMessage.toString());
          }
          
          // Check if data has the expected format
          if (!data || !data.type) {
            console.error(`Invalid message format from ${clientId}: ${rawMessage}`);
            wsAdapter.sendToClient(clientId, 'error', { 
              message: 'Invalid message format: missing type' 
            });
            return;
          }
          
          // console.log(`Processing message type: ${data.type}`);
          
          // Let the adapter try to process the message with registered handlers
          const handled = await wsAdapter.processMessage(clientId, data);
          
          // If not handled by a registered handler, process it here
          if (!handled) {
            console.log(`No handler for message type: ${data.type}`);
            wsAdapter.sendToClient(clientId, 'error', { 
              message: `Unsupported message type: ${data.type}` 
            });
          }
        } catch (error) {
          console.error(`Error processing message: ${error.message}`);
          wsAdapter.sendToClient(clientId, 'error', { 
            message: `Error processing message: ${error.message}` 
          });
        }
      });
      
      // Handle disconnection
      socket.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        
        // Remove from matchmaking queue if present
        matchmakingService.removeFromQueue(clientId);
        
        // Remove client from adapter
        wsAdapter.removeClient(clientId);
      });
      
      // Handle socket errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
      
      // Send welcome message
      wsAdapter.sendToClient(clientId, 'welcome', {
        message: 'Connected to matchmaking service',
        userId: clientId
      });
    } catch (error) {
      fastify.log.error(`Error in WebSocket connection handler: ${error.message}`);
      socket.close(1011, "Internal server error");
    }
  });
  
  // Register message handlers
  registerMessageHandlers(wsAdapter);
}

/**
 * Register all message type handlers with the WebSocket adapter
 * @param {WebSocketAdapter} wsAdapter - The WebSocket adapter instance
 */
function registerMessageHandlers(wsAdapter) {
  // Find match handler
  wsAdapter.registerMessageHandler('find_match', async (clientId, payload) => {
    console.log(`Processing find_match request from ${clientId}`);
    const match = await matchmakingService.addToQueue(clientId);
    console.log(`FIND_MATCH result:`, match);
    
    if (match) {
      const p1 = wsAdapter.sendToClient(match.player1.id, 'match_found', {
        matchId: match.matchId,
        opponent: {
          id: match.player2.id,
          elo: match.player2.elo_score
        },
        isPlayer1: true
      });

      const p2 = wsAdapter.sendToClient(match.player2.id, 'match_found', {
        matchId: match.matchId,
        opponent: {
          id: match.player1.id,
          elo: match.player1.elo_score
        },
        isPlayer1: false
      });
      if (!p1 || !p2) {
        console.error(`Failed to send match_found message to one of the players`);
        wsAdapter.sendToClient(clientId, 'error', { 
          message: 'Failed to notify opponent about the match' 
        });
        return;
      }
      
      setTimeout(() => {
        wsAdapter.sendToClient(match.player1.id, 'game_start', { matchId: match.matchId });
        wsAdapter.sendToClient(match.player2.id, 'game_start', { matchId: match.matchId });
      }, 3000);
      console.log(`The game will start in 3 seconds between ${match.player1.id} and ${match.player2.id}`);
    } else {
      wsAdapter.sendToClient(clientId, 'waiting_for_match', { 
        position: matchmakingService.getQueuePosition(clientId) 
      });
    }
  });
  
  // Cancel matchmaking handler
  wsAdapter.registerMessageHandler('cancel_matchmaking', async (clientId, payload) => {
    matchmakingService.removeFromQueue(clientId);
    wsAdapter.sendToClient(clientId, 'matchmaking_cancelled', {});
  });
  
  // Friend match request handler
  wsAdapter.registerMessageHandler('friend_match_request', async (clientId, payload) => {
    const { friendId } = payload;
    
    const inviteSent = wsAdapter.sendToClient(friendId, 'friend_match_invite', {
      fromId: clientId
    });
    
    if (inviteSent) {
      wsAdapter.sendToClient(clientId, 'friend_invite_sent', { friendId });
    } else {
      wsAdapter.sendToClient(clientId, 'friend_invite_failed', { 
        friendId, 
        reason: 'Friend is offline' 
      });
    }
  });
  
  // Friend match accept handler
  wsAdapter.registerMessageHandler('friend_match_accept', async (clientId, payload) => {
    const { fromId } = payload;
    
    const friendMatch = await matchmakingService.createMatch(
      fromId, 
      clientId, 
      'friendly'
    );
    
    if (friendMatch) {
      wsAdapter.sendToClient(fromId, 'friend_match_created', {
        matchId: friendMatch.matchId,
        opponent: {
          id: clientId,
          elo: friendMatch.player2.elo_score
        }
      });
      
      wsAdapter.sendToClient(clientId, 'friend_match_created', {
        matchId: friendMatch.matchId,
        opponent: {
          id: fromId,
          elo: friendMatch.player1.elo_score
        }
      });
      
      setTimeout(() => {
        wsAdapter.sendToClient(fromId, 'game_start', { matchId: friendMatch.matchId });
        wsAdapter.sendToClient(clientId, 'game_start', { matchId: friendMatch.matchId });
      }, 3000);
    }
  });
  
  // Paddle move handler
  wsAdapter.registerMessageHandler('paddle_move', async (clientId, payload) => {
    const { matchId, position } = payload;
    const opponentId = await matchmakingService.getOpponentId(clientId, matchId);
    
    if (opponentId) {
      wsAdapter.sendToClient(opponentId, 'opponent_paddle_move', {
        position
      });
    }
  });
  
  // Ball update handler
  wsAdapter.registerMessageHandler('ball_update', async (clientId, payload) => {
    const { matchId, position, velocity, scores } = payload;
    const opponentId = await matchmakingService.getOpponentId(clientId, matchId);
    
    if (opponentId) {
      wsAdapter.sendToClient(opponentId, 'ball_update', {
        position,
        velocity,
        scores
      });
    }
  });
  
  // Game score update handler
  wsAdapter.registerMessageHandler('score_update', async (clientId, payload) => {
    const { matchId, player1Score, player2Score } = payload;
    const opponentId = await matchmakingService.getOpponentId(clientId, matchId);
    
    if (opponentId) {
      wsAdapter.sendToClient(opponentId, 'score_update', {
        player1Score,
        player2Score
      });
    }
  });
  
    // Game end handler
    // Game end handler
    wsAdapter.registerMessageHandler('game_end', async (clientId, payload) => {
      const { matchId, winner, player1Goals, player2Goals } = payload;
      
      try {
        // Get match details
        const match = await matchmakingService.getMatchById(matchId);
        if (!match) {
          throw new Error(`Match with ID ${matchId} not found`);
        }
        console.log("Match found:", match);
        
        // Get players for this match from match_players table
        const matchPlayers = await matchmakingService.getMatchPlayers(matchId);
        console.log("matchPlayers: ", matchPlayers);
        if (!matchPlayers || matchPlayers.length < 2) {
          throw new Error(`Could not find players for match ${matchId}`);
        }
        
        // Determine which player is which (we need to know player1 and player2)
        const player1Id = matchPlayers[0].player_id;
        const player2Id = matchPlayers[1].player_id;
        console.log(`Player 1: ${player1Id}, Player 2: ${player2Id}`);
        
        // Make sure winner is a number
        const winnerId = Number(winner);
        console.log(`Winner ID (converted to number): ${winnerId}`);
        
        // Get current ELO ratings for both players
        const player1 = await matchmakingService.getUserWithElo(player1Id);
        const player2 = await matchmakingService.getUserWithElo(player2Id);
        
        const player1OldElo = player1?.elo_score || 1000;
        const player2OldElo = player2?.elo_score || 1000;
        
        // Determine match result (1 = win, 0.5 = draw, 0 = loss)
        const player1Result = winnerId === player1Id ? 1 : 0;
        const player2Result = winnerId === player2Id ? 1 : 0;
        console.log(`Match result: Player 1 ${player1Result}, Player 2 ${player2Result}`);
        
        // Calculate new ELO ratings
        const player1NewElo = await matchmakingService.calculateNewElo(
          player1OldElo, 
          player2OldElo, 
          player1Result
        );
        
        const player2NewElo = await matchmakingService.calculateNewElo(
          player2OldElo, 
          player1OldElo, 
          player2Result
        );
        
        console.log(`ELO changes: Player 1 ${player1OldElo} -> ${player1NewElo}, Player 2 ${player2OldElo} -> ${player2NewElo}`);
        
        // Update player ELO ratings in database
        await matchmakingService.updateUserElo(player1Id, player1NewElo);
        await matchmakingService.updateUserElo(player2Id, player2NewElo);
        
        // Update match result in database with ELO information
        const result = await matchmakingService.updateMatchResult(
          matchId,
          winnerId,
          player1Id,
          player2Id,
          player1Goals,
          player2Goals,
          {
            player1OldElo,
            player1NewElo,
            player2OldElo,
            player2NewElo
          }
        );
        
        // Add ELO changes to the result object
        result.eloChanges = {
          [player1Id]: player1NewElo - player1OldElo,
          [player2Id]: player2NewElo - player2OldElo
        };
        
        // Notify both players about the result
        wsAdapter.sendToClient(player1Id, 'game_result', {
          ...result,
          winner: winnerId,
          finalScore: {
            player1: player1Goals,
            player2: player2Goals
          }
        });
        
        wsAdapter.sendToClient(player2Id, 'game_result', {
          ...result,
          winner: winnerId,
          finalScore: {
            player1: player1Goals,
            player2: player2Goals
          }
        });
        
        console.log(`Match ${matchId} completed. Winner: ${winnerId}. ELO updates: P1 ${player1OldElo}->${player1NewElo}, P2 ${player2OldElo}->${player2NewElo}`);
      } catch (error) {
        console.error(`Error processing game end for match ${matchId}:`, error);
        wsAdapter.sendToClient(clientId, 'error', {
          message: 'Failed to process game end',
          details: error.message
        });
      }
    });
}

// Export a function to initialize the WebSocket controller
export function initializeWebSocketController(server, fastify) {
  const wsAdapter = createWebSocketAdapter(server);
  setupWebSocketHandlers(wsAdapter, fastify);
  return wsAdapter;
}