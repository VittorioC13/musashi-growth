/**
 * ORDERS ROUTES
 *
 * Handles order placement, viewing, and cancellation.
 *
 * POST /api/orders - Place a new order
 * GET /api/orders - Get user's orders
 * DELETE /api/orders/:id - Cancel an order
 */

import { Router } from 'express';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import { matchOrder } from '../services/matchingEngine.js';

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

/**
 * POST /api/orders
 *
 * Place a new order.
 *
 * Request body:
 * {
 *   "market_ticker": "BTC-150K-MAR25",
 *   "side": "yes",         // 'yes' or 'no'
 *   "price": 45,           // Price in cents (1-99)
 *   "quantity": 10         // Number of contracts
 * }
 *
 * Response:
 * {
 *   "order": { ... },
 *   "fills": [ ... ],      // Any immediate matches
 *   "message": "Order placed. 5 contracts filled, 5 remaining in book."
 * }
 */
router.post('/', (req, res) => {
  try {
    const { market_ticker, side, price, quantity } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!market_ticker || !side || !price || !quantity) {
      return res.status(400).json({
        error: 'Missing required fields: market_ticker, side, price, quantity',
      });
    }

    if (side !== 'yes' && side !== 'no') {
      return res.status(400).json({ error: 'Side must be "yes" or "no"' });
    }

    if (price < 1 || price > 99 || !Number.isInteger(price)) {
      return res
        .status(400)
        .json({ error: 'Price must be an integer between 1 and 99' });
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res
        .status(400)
        .json({ error: 'Quantity must be a positive integer' });
    }

    // Get market
    const market = db
      .prepare('SELECT * FROM markets WHERE ticker = ?')
      .get(market_ticker);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    if (market.status !== 'open') {
      return res
        .status(400)
        .json({ error: 'Market is not open for trading' });
    }

    // Check user balance
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    const maxCost = price * quantity; // Worst case cost

    if (user.balance < maxCost) {
      return res.status(400).json({
        error: `Insufficient balance. Need ${maxCost}¢, have ${user.balance}¢`,
      });
    }

    // Create the order
    const result = db
      .prepare(
        `INSERT INTO orders (user_id, market_id, side, price, quantity)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(userId, market.id, side, price, quantity);

    const order = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(result.lastInsertRowid);

    // Try to match the order
    const matchResult = matchOrder(order);

    // Reload order to get updated status
    const updatedOrder = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(order.id);

    // Build response message
    let message;
    if (matchResult.filled_quantity === 0) {
      message = `Order placed. Waiting for matches at ${price}¢.`;
    } else if (matchResult.remaining_quantity === 0) {
      message = `Order fully filled! ${matchResult.filled_quantity} contracts at ~${price}¢.`;
    } else {
      message = `Order partially filled. ${matchResult.filled_quantity} filled, ${matchResult.remaining_quantity} remaining.`;
    }

    res.status(201).json({
      order: updatedOrder,
      fills: matchResult.fills,
      message,
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/orders
 *
 * Get current user's orders.
 *
 * Query params:
 * - market_ticker: Filter by market
 * - status: Filter by status ('open', 'filled', 'partial', 'cancelled')
 */
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { market_ticker, status } = req.query;

    let query = `
      SELECT o.*, m.ticker as market_ticker, m.title as market_title
      FROM orders o
      JOIN markets m ON o.market_id = m.id
      WHERE o.user_id = ?
    `;
    const params = [userId];

    if (market_ticker) {
      query += ' AND m.ticker = ?';
      params.push(market_ticker);
    }

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/orders/:id
 *
 * Cancel an open order.
 * Only the order owner can cancel.
 */
router.delete('/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this order' });
    }

    if (order.status === 'filled' || order.status === 'cancelled') {
      return res
        .status(400)
        .json({ error: `Cannot cancel ${order.status} order` });
    }

    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(
      orderId
    );

    res.json({ message: 'Order cancelled', order_id: orderId });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
