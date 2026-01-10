/**
 * PORTFOLIO ROUTES
 *
 * Handles user's positions and trade history.
 *
 * GET /api/portfolio - Get user's positions
 * GET /api/portfolio/history - Get user's trade history
 */

import { Router } from 'express';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All portfolio routes require authentication
router.use(authMiddleware);

/**
 * GET /api/portfolio
 *
 * Get current user's positions (what they own in each market).
 *
 * Response includes:
 * - Current positions with quantity and average price
 * - Current market price for P&L calculation
 * - Unrealized profit/loss
 */
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's balance
    const user = db
      .prepare('SELECT balance FROM users WHERE id = ?')
      .get(userId);

    // Get all positions with market info
    const positions = db
      .prepare(
        `SELECT
           p.*,
           m.ticker as market_ticker,
           m.title as market_title,
           m.status as market_status,
           m.resolved_outcome
         FROM positions p
         JOIN markets m ON p.market_id = m.id
         WHERE p.user_id = ? AND p.quantity > 0`
      )
      .all(userId);

    // Calculate P&L for each position
    const enrichedPositions = positions.map((position) => {
      // Get current market price (from last trade or best bid)
      const lastTrade = db
        .prepare(
          `SELECT price FROM fills WHERE market_id = ? ORDER BY created_at DESC LIMIT 1`
        )
        .get(position.market_id);

      let currentPrice;
      if (position.market_status === 'settled') {
        // If settled, the "price" is either 100 (winner) or 0 (loser)
        currentPrice = position.side === position.resolved_outcome ? 100 : 0;
      } else {
        // Use last trade price, or 50 if no trades
        currentPrice = lastTrade?.price || 50;
        // Adjust for NO side (if YES price is X, NO price is 100-X)
        if (position.side === 'no') {
          currentPrice = 100 - currentPrice;
        }
      }

      // Calculate unrealized P&L
      // Cost = avg_price * quantity
      // Current value = current_price * quantity
      // P&L = current_value - cost
      const cost = position.avg_price * position.quantity;
      const currentValue = currentPrice * position.quantity;
      const unrealizedPnL = currentValue - cost;

      return {
        ...position,
        current_price: currentPrice,
        cost_basis: cost,
        current_value: currentValue,
        unrealized_pnl: unrealizedPnL,
        pnl_percent:
          cost > 0 ? Math.round((unrealizedPnL / cost) * 100 * 100) / 100 : 0,
      };
    });

    // Calculate totals
    const totalCost = enrichedPositions.reduce((sum, p) => sum + p.cost_basis, 0);
    const totalValue = enrichedPositions.reduce(
      (sum, p) => sum + p.current_value,
      0
    );
    const totalUnrealizedPnL = enrichedPositions.reduce(
      (sum, p) => sum + p.unrealized_pnl,
      0
    );

    res.json({
      balance: user.balance,
      positions: enrichedPositions,
      summary: {
        total_cost: totalCost,
        total_value: totalValue,
        total_unrealized_pnl: totalUnrealizedPnL,
        portfolio_value: user.balance + totalValue,
      },
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/portfolio/history
 *
 * Get user's trade history (all fills they were part of).
 */
router.get('/history', (req, res) => {
  try {
    const userId = req.user.id;

    // Get all fills where user was the YES or NO side
    const trades = db
      .prepare(
        `SELECT
           f.*,
           m.ticker as market_ticker,
           m.title as market_title,
           o_yes.user_id as yes_user_id,
           o_no.user_id as no_user_id
         FROM fills f
         JOIN markets m ON f.market_id = m.id
         JOIN orders o_yes ON f.yes_order_id = o_yes.id
         JOIN orders o_no ON f.no_order_id = o_no.id
         WHERE o_yes.user_id = ? OR o_no.user_id = ?
         ORDER BY f.created_at DESC
         LIMIT 100`
      )
      .all(userId, userId);

    // Format trades to show user's perspective
    const formattedTrades = trades.map((trade) => {
      const userSide = trade.yes_user_id === userId ? 'yes' : 'no';
      const userPrice = userSide === 'yes' ? trade.price : 100 - trade.price;
      const cost = userPrice * trade.quantity;

      return {
        id: trade.id,
        market_ticker: trade.market_ticker,
        market_title: trade.market_title,
        side: userSide,
        price: userPrice,
        quantity: trade.quantity,
        cost: cost,
        created_at: trade.created_at,
      };
    });

    res.json({ trades: formattedTrades });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
