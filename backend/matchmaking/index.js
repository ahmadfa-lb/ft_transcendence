// 'use strict';
// import Fastify from 'fastify';
// import websocket from '@fastify/websocket';
// import cors from '@fastify/cors';
// import dotenv from 'dotenv';
// import database from './src/config/db.js';
// import { registerWebSocketAdapter } from './src/services/websocketAdapter.js';
// import { setupWebSocketHandlers } from './src/controllers/websocketController.js';

// dotenv.config();

// const fastify = Fastify({ 
//   logger: true,
// });

// fastify.register(cors, {
//   origin: true,
//   credentials: true
// });

// fastify.get("/", async (request, reply) => {
//   return { status: "Chat microservice running" };
// });

// const start = async () => {
//   try {
//     database.initializeTables();

//     await fastify.listen({ port: 3001, host: "::" });

//     const wsAdapter = registerWebSocketAdapter(fastify);
//     setupWebSocketHandlers(wsAdapter, fastify);

//     fastify.log.info("MatchMaking Server started successfully");
//   } catch (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }
// };

// // Handle server shutdown
// const closeGracefully = async (signal) => {
//   fastify.log.info(`Received ${signal}, closing HTTP server and database connection`);
  
//   await fastify.close();
//   await closeDatabase();
  
//   process.exit(0);
// };

// // Listen for shutdown signals
// process.on('SIGINT', () => closeGracefully('SIGINT'));
// process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// start();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createWebSocketAdapter } from './src/services/websocketAdapter.js';
import { setupWebSocketHandlers } from './src/controllers/websocketController.js';
import matchmakingRoutes from './src/routes/matches.js'; // Updated to match your actual file name
import matchmakingService from './src/services/matchmaking.js';
import tournamentService from './src/services/tournament.js';
import database from './src/config/db.js';

// Create Fastify instance
const fastify = Fastify({
  logger: true
});

// Register CORS
fastify.register(cors, {
  origin: true,
  credentials: true
});

// Register the matchmaking service as a decorator
fastify.decorate('matchmakingService', matchmakingService);
fastify.decorate('tournamentService', tournamentService);

// Initialize WebSocket adapter before server starts
const wsAdapter = createWebSocketAdapter(fastify.server);
// Store the WebSocket adapter in Fastify for use in routes
fastify.decorate('wsAdapter', wsAdapter);

// Register routes
fastify.register(matchmakingRoutes);

// Basic health check route
fastify.get('/', async (request, reply) => {
  return { status: 'Matchmaking service running' };
});

// Initialize database
await database.initializeTables();

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    
    // Setup WebSocket handlers after server is started
    setupWebSocketHandlers(wsAdapter, fastify);
    
    fastify.log.info('MatchMaking Server started successfully');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const closeGracefully = async (signal) => {
  fastify.log.info(`Received ${signal}, closing HTTP server and database connection`);
  
  await fastify.close();
  
  process.exit(0);
};

// Listen for shutdown signals
process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

start();