/**
 * MARKETS ROUTES
 *
 * Handles market listing, creation, and viewing.
 *
 * GET /api/markets - List all markets
 * GET /api/markets/:ticker - Get single market with orderbook
 * POST /api/markets - Create new market (admin only for now)
 */

import { Router } from 'express';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/markets
 *
 * List all markets, optionally filtered by category or status.
 *
 * Query params:
 * - category: Filter by category (e.g., "crypto")
 * - status: Filter by status (e.g., "open")
 *
 * Response includes computed fields:
 * - last_price: Most recent trade price
 * - yes_bid: Best (highest) YES bid
 * - no_bid: Best (highest) NO bid
 */
router.get('/', (req, res) => {
  try {
    const { category, status } = req.query;

    let query = 'SELECT * FROM markets WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const markets = db.prepare(query).all(...params);

    // Add computed fields for each market
    const enrichedMarkets = markets.map((market) => {
      // Get last trade price
      const lastFill = db
        .prepare(
          `SELECT price FROM fills WHERE market_id = ? ORDER BY created_at DESC LIMIT 1`
        )
        .get(market.id);

      // Get best YES bid (highest price someone will pay for YES)
      const bestYesBid = db
        .prepare(
          `SELECT MAX(price) as price FROM orders
           WHERE market_id = ? AND side = 'yes' AND status = 'open'`
        )
        .get(market.id);

      // Get best NO bid (highest price someone will pay for NO)
      const bestNoBid = db
        .prepare(
          `SELECT MAX(price) as price FROM orders
           WHERE market_id = ? AND side = 'no' AND status = 'open'`
        )
        .get(market.id);

      // Calculate volume (total contracts traded)
      const volume = db
        .prepare(
          `SELECT COALESCE(SUM(quantity), 0) as total FROM fills WHERE market_id = ?`
        )
        .get(market.id);

      return {
        ...market,
        last_price: lastFill?.price || 50, // Default to 50 if no trades
        yes_bid: bestYesBid?.price || null,
        no_bid: bestNoBid?.price || null,
        // Implied prices (what you'd pay to buy immediately)
        yes_ask: bestNoBid?.price ? 100 - bestNoBid.price : null,
        no_ask: bestYesBid?.price ? 100 - bestYesBid.price : null,
        volume: volume?.total || 0,
      };
    });

    res.json({ markets: enrichedMarkets });
  } catch (error) {
    console.error('List markets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/markets/:ticker
 *
 * Get a single market with its full orderbook.
 *
 * The orderbook shows all open orders grouped by price level.
 */
router.get('/:ticker', (req, res) => {
  try {
    const { ticker } = req.params;

    const market = db
      .prepare('SELECT * FROM markets WHERE ticker = ?')
      .get(ticker);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // Get orderbook - grouped by price level
    // This shows how many contracts are available at each price
    const yesBids = db
      .prepare(
        `SELECT price, SUM(quantity - filled_quantity) as quantity
         FROM orders
         WHERE market_id = ? AND side = 'yes' AND status IN ('open', 'partial')
         GROUP BY price
         ORDER BY price ASC`
      )
      .all(market.id);

    const noBids = db
      .prepare(
        `SELECT price, SUM(quantity - filled_quantity) as quantity
         FROM orders
         WHERE market_id = ? AND side = 'no' AND status IN ('open', 'partial')
         GROUP BY price
         ORDER BY price ASC`
      )
      .all(market.id);

    // Get recent trades
    const recentTrades = db
      .prepare(
        `SELECT price, quantity, created_at
         FROM fills
         WHERE market_id = ?
         ORDER BY created_at DESC
         LIMIT 20`
      )
      .all(market.id);

    // Calculate stats
    const stats = db
      .prepare(
        `SELECT
           COALESCE(SUM(quantity), 0) as volume,
           COUNT(*) as trade_count
         FROM fills WHERE market_id = ?`
      )
      .get(market.id);

    res.json({
      market,
      orderbook: {
        yes: yesBids, // Array of {price, quantity}
        no: noBids,
      },
      recent_trades: recentTrades,
      stats: {
        volume: stats.volume,
        trade_count: stats.trade_count,
      },
    });
  } catch (error) {
    console.error('Get market error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/markets
 *
 * Create a new market.
 * Requires authentication.
 *
 * Request body:
 * {
 *   "ticker": "BTC-150K-MAR25",
 *   "title": "Will Bitcoin hit $150,000 by March 31, 2025?",
 *   "description": "Resolves YES if BTC/USD reaches $150,000...",
 *   "category": "crypto",
 *   "settlement_date": "2025-03-31"
 * }
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const { ticker, title, description, category, settlement_date } = req.body;

    if (!ticker || !title) {
      return res.status(400).json({ error: 'Ticker and title required' });
    }

    // Check if ticker already exists
    const existing = db
      .prepare('SELECT id FROM markets WHERE ticker = ?')
      .get(ticker);
    if (existing) {
      return res.status(400).json({ error: 'Ticker already exists' });
    }

    const result = db
      .prepare(
        `INSERT INTO markets (ticker, title, description, category, settlement_date)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(ticker, title, description || '', category || 'general', settlement_date);

    const market = db
      .prepare('SELECT * FROM markets WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({ market });
  } catch (error) {
    console.error('Create market error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
