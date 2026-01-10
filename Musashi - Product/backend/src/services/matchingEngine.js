/**
 * ORDER MATCHING ENGINE
 *
 * This is the BRAIN of the prediction market.
 * Matches buyers and sellers to create trades.
 */

import db from '../database.js';

/**
 * Attempt to match a new order against existing orders
 */
export function matchOrder(newOrder) {
  const fills = [];
  let remainingQty = newOrder.quantity;

  // Calculate the minimum price the opposite side must have bid
  const opposingSide = newOrder.side === 'yes' ? 'no' : 'yes';
  const minOpposingPrice = 100 - newOrder.price;

  // Find matching orders on the opposite side
  const matchingOrders = db
    .prepare(
      `SELECT *, (quantity - filled_quantity) as available
       FROM orders
       WHERE market_id = ?
         AND side = ?
         AND status IN ('open', 'partial')
         AND price >= ?
         AND user_id != ?
       ORDER BY price DESC, created_at ASC`
    )
    .all(newOrder.market_id, opposingSide, minOpposingPrice, newOrder.user_id);

  // Process each matching order
  for (const matchingOrder of matchingOrders) {
    if (remainingQty <= 0) break;

    const fillQty = Math.min(remainingQty, matchingOrder.available);

    // Determine trade prices
    let yesPrice, noPrice;
    if (newOrder.side === 'yes') {
      yesPrice = 100 - matchingOrder.price;
      noPrice = matchingOrder.price;
    } else {
      yesPrice = matchingOrder.price;
      noPrice = 100 - matchingOrder.price;
    }

    const yesCost = yesPrice * fillQty;
    const noCost = noPrice * fillQty;

    const yesUserId = newOrder.side === 'yes' ? newOrder.user_id : matchingOrder.user_id;
    const noUserId = newOrder.side === 'no' ? newOrder.user_id : matchingOrder.user_id;
    const yesOrderId = newOrder.side === 'yes' ? newOrder.id : matchingOrder.id;
    const noOrderId = newOrder.side === 'no' ? newOrder.id : matchingOrder.id;

    try {
      // 1. Deduct money from both users
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(yesCost, yesUserId);
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(noCost, noUserId);

      // 2. Create fill record
      const fillResult = db.prepare(
        `INSERT INTO fills (market_id, yes_order_id, no_order_id, price, quantity)
         VALUES (?, ?, ?, ?, ?)`
      ).run(newOrder.market_id, yesOrderId, noOrderId, yesPrice, fillQty);

      // 3. Update or create YES position
      const existingYesPos = db.prepare(
        'SELECT * FROM positions WHERE user_id = ? AND market_id = ? AND side = ?'
      ).get(yesUserId, newOrder.market_id, 'yes');

      if (existingYesPos) {
        const newQty = existingYesPos.quantity + fillQty;
        const newAvg = Math.round(
          (existingYesPos.avg_price * existingYesPos.quantity + yesPrice * fillQty) / newQty
        );
        db.prepare(
          'UPDATE positions SET quantity = ?, avg_price = ? WHERE id = ?'
        ).run(newQty, newAvg, existingYesPos.id);
      } else {
        db.prepare(
          'INSERT INTO positions (user_id, market_id, side, quantity, avg_price) VALUES (?, ?, ?, ?, ?)'
        ).run(yesUserId, newOrder.market_id, 'yes', fillQty, yesPrice);
      }

      // 4. Update or create NO position
      const existingNoPos = db.prepare(
        'SELECT * FROM positions WHERE user_id = ? AND market_id = ? AND side = ?'
      ).get(noUserId, newOrder.market_id, 'no');

      if (existingNoPos) {
        const newQty = existingNoPos.quantity + fillQty;
        const newAvg = Math.round(
          (existingNoPos.avg_price * existingNoPos.quantity + noPrice * fillQty) / newQty
        );
        db.prepare(
          'UPDATE positions SET quantity = ?, avg_price = ? WHERE id = ?'
        ).run(newQty, newAvg, existingNoPos.id);
      } else {
        db.prepare(
          'INSERT INTO positions (user_id, market_id, side, quantity, avg_price) VALUES (?, ?, ?, ?, ?)'
        ).run(noUserId, newOrder.market_id, 'no', fillQty, noPrice);
      }

      // 5. Update matching order's filled quantity
      const newFilledQty = matchingOrder.filled_quantity + fillQty;
      const newStatus = newFilledQty >= matchingOrder.quantity ? 'filled' : 'partial';
      db.prepare(
        'UPDATE orders SET filled_quantity = ?, status = ? WHERE id = ?'
      ).run(newFilledQty, newStatus, matchingOrder.id);

      fills.push({
        fill_id: fillResult.lastInsertRowid,
        price: yesPrice,
        quantity: fillQty,
        matched_order_id: matchingOrder.id,
      });

      remainingQty -= fillQty;
    } catch (e) {
      console.error('Error processing match:', e);
      // Continue to next match
    }
  }

  // Update the new order's status
  const filledQty = newOrder.quantity - remainingQty;
  if (filledQty > 0) {
    const status = remainingQty === 0 ? 'filled' : 'partial';
    db.prepare(
      'UPDATE orders SET filled_quantity = ?, status = ? WHERE id = ?'
    ).run(filledQty, status, newOrder.id);
  }

  return {
    fills,
    filled_quantity: filledQty,
    remaining_quantity: remainingQty,
  };
}

/**
 * Settle a market - pay out winners
 */
export function settleMarket(marketId, outcome) {
  if (outcome !== 'yes' && outcome !== 'no') {
    throw new Error('Outcome must be "yes" or "no"');
  }

  // Update market status
  db.prepare(
    `UPDATE markets SET status = 'settled', resolved_outcome = ? WHERE id = ?`
  ).run(outcome, marketId);

  // Get all positions in this market
  const positions = db
    .prepare('SELECT * FROM positions WHERE market_id = ?')
    .all(marketId);

  // Pay out winners ($1 = 100 cents per contract)
  for (const position of positions) {
    if (position.side === outcome && position.quantity > 0) {
      const payout = position.quantity * 100;
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(
        payout,
        position.user_id
      );
    }
  }

  // Cancel all open orders in this market
  db.prepare(
    `UPDATE orders SET status = 'cancelled' WHERE market_id = ? AND status IN ('open', 'partial')`
  ).run(marketId);
}
