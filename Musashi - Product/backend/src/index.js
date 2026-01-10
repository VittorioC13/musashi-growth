/**
 * MUSASHI PREDICTION MARKET - MAIN SERVER
 *
 * This is the entry point for the backend API.
 * It sets up Express, connects routes, and starts the server.
 */

import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import marketRoutes from './routes/markets.js';
import orderRoutes from './routes/orders.js';
import portfolioRoutes from './routes/portfolio.js';
import realtimeRoutes from './routes/realtime.js';

// Import database to ensure tables are created
import './database.js';

// Import auto-seed function
import { autoSeedIfEmpty } from './autoSeed.js';

// Import simulation service
import { startSimulation, initializePriceHistory } from './services/simulationService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow frontend domain
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions)); // Allow requests from frontend
app.use(express.json()); // Parse JSON request bodies

// Request logging (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/realtime', realtimeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎯 MUSASHI PREDICTION MARKET                            ║
║                                                           ║
║   Server running on http://localhost:${PORT}               ║
║                                                           ║
║   API Endpoints:                                          ║
║   • POST /api/auth/register    - Create account           ║
║   • POST /api/auth/login       - Log in                   ║
║   • GET  /api/markets          - List markets             ║
║   • GET  /api/markets/:id      - Market details           ║
║   • POST /api/orders           - Place order              ║
║   • GET  /api/portfolio        - View positions           ║
║   • GET  /api/realtime/updates - Live price updates (SSE) ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Auto-seed database if empty
  autoSeedIfEmpty();

  // Initialize price history and start simulation
  console.log('📊 Initializing price history...');
  initializePriceHistory();

  console.log('🤖 Starting market simulation (fake trades every 3s)...');
  startSimulation(3000); // Trade every 3 seconds
});
