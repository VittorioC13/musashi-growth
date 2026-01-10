/**
 * REAL-TIME UPDATES ROUTES
 *
 * Server-Sent Events (SSE) endpoint for pushing live market updates to clients.
 * Clients can listen for price changes in real-time.
 */

import { Router } from 'express';
import { marketUpdates } from '../services/simulationService.js';
import db from '../database.js';

const router = Router();

/**
 * GET /api/realtime/updates
 *
 * Server-Sent Events stream for market updates.
 * Clients receive events whenever prices change.
 *
 * Event format:
 * {
 *   ticker: "BTC-100K-JAN25",
 *   marketId: 1,
 *   price: 65,
 *   timestamp: "2025-01-01T12:00:00.000Z"
 * }
 */
router.get('/updates', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Send current prices for all markets immediately
  const markets = db.prepare(`
    SELECT
      m.id,
      m.ticker,
      m.title,
      COALESCE(
        (SELECT price FROM fills WHERE market_id = m.id ORDER BY created_at DESC LIMIT 1),
        50
      ) as price
    FROM markets m
    WHERE m.status = 'open'
  `).all();

  res.write(`data: ${JSON.stringify({
    type: 'snapshot',
    markets: markets.map(m => ({
      ticker: m.ticker,
      marketId: m.id,
      price: m.price,
      timestamp: new Date().toISOString(),
    })),
  })}\n\n`);

  // Listen for price updates
  const updateHandler = (update) => {
    res.write(`data: ${JSON.stringify({
      type: 'update',
      ...update,
    })}\n\n`);
  };

  marketUpdates.on('priceUpdate', updateHandler);

  // Send heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // Cleanup on close
  req.on('close', () => {
    marketUpdates.off('priceUpdate', updateHandler);
    clearInterval(heartbeat);
    res.end();
  });
});

/**
 * GET /api/realtime/history/:ticker
 *
 * Get price history for a specific market (for charts).
 *
 * Query params:
 * - hours: Number of hours of history (default: 24)
 */
router.get('/history/:ticker', (req, res) => {
  try {
    const { ticker } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    const market = db.prepare('SELECT id FROM markets WHERE ticker = ?').get(ticker);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // Get price history for the specified time period
    const history = db.prepare(`
      SELECT price, timestamp
      FROM price_history
      WHERE market_id = ?
        AND timestamp >= datetime('now', '-${hours} hours')
      ORDER BY timestamp ASC
    `).all(market.id);

    res.json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
