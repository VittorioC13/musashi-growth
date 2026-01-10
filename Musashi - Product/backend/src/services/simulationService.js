/**
 * SIMULATION SERVICE
 *
 * Creates fake trading activity to simulate a live prediction market.
 * - Generates random bot trades
 * - Updates prices realistically
 * - Tracks price history for charts
 * - Broadcasts updates to connected clients
 */

import db from '../database.js';
import { EventEmitter } from 'events';

// Event emitter for real-time updates
export const marketUpdates = new EventEmitter();

// Bot user IDs (we'll create these if they don't exist)
const BOT_USERS = ['bot1@musashi.com', 'bot2@musashi.com', 'bot3@musashi.com'];

// Initialize bot users
function initBotUsers() {
  for (const email of BOT_USERS) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!existing) {
      db.prepare(
        'INSERT INTO users (email, password_hash, balance) VALUES (?, ?, ?)'
      ).run(email, 'bot', 1000000); // Bots have unlimited balance
    }
  }
}

// Get a random bot user ID
function getRandomBotId() {
  const email = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)];
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  return user.id;
}

// Generate random price movement (tends to mean-revert around current price)
function generatePriceChange(currentPrice) {
  // Random walk with mean reversion
  const drift = (50 - currentPrice) * 0.05; // Pull toward 50
  const randomChange = (Math.random() - 0.5) * 8; // Random ±4
  const newPrice = Math.round(currentPrice + drift + randomChange);

  // Clamp between 1 and 99
  return Math.max(1, Math.min(99, newPrice));
}

// Create a simulated trade
function simulateTrade(marketId, currentPrice) {
  try {
    const botId = getRandomBotId();
    const newPrice = generatePriceChange(currentPrice);
    const side = Math.random() > 0.5 ? 'yes' : 'no';
    const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 contracts

    // Create order
    const order = db.prepare(
      `INSERT INTO orders (user_id, market_id, side, price, quantity, filled_quantity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(botId, marketId, side, newPrice, quantity, quantity, 'filled');

    // Record the fill (simulated instant match)
    const yesOrderId = side === 'yes' ? order.lastInsertRowid : order.lastInsertRowid + 1;
    const noOrderId = side === 'no' ? order.lastInsertRowid : order.lastInsertRowid + 1;

    db.prepare(
      `INSERT INTO fills (market_id, yes_order_id, no_order_id, price, quantity)
       VALUES (?, ?, ?, ?, ?)`
    ).run(marketId, yesOrderId, noOrderId, newPrice, quantity);

    // Record price history
    db.prepare(
      `INSERT INTO price_history (market_id, price, timestamp)
       VALUES (?, ?, datetime('now'))`
    ).run(marketId, newPrice);

    return newPrice;
  } catch (error) {
    console.error('Simulation error:', error);
    return currentPrice;
  }
}

// Get current price for a market
function getCurrentPrice(marketId) {
  const lastFill = db.prepare(
    `SELECT price FROM fills WHERE market_id = ? ORDER BY created_at DESC LIMIT 1`
  ).get(marketId);

  return lastFill?.price || 50;
}

// Simulate activity for all open markets
function simulateMarketActivity() {
  const markets = db.prepare(
    `SELECT id, ticker FROM markets WHERE status = 'open'`
  ).all();

  for (const market of markets) {
    // 30% chance of trade per interval
    if (Math.random() < 0.3) {
      const currentPrice = getCurrentPrice(market.id);
      const newPrice = simulateTrade(market.id, currentPrice);

      // Emit update event
      marketUpdates.emit('priceUpdate', {
        ticker: market.ticker,
        marketId: market.id,
        price: newPrice,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Start the simulation
let simulationInterval = null;

export function startSimulation(intervalMs = 3000) {
  if (simulationInterval) {
    console.log('Simulation already running');
    return;
  }

  console.log('🤖 Starting market simulation...');
  initBotUsers();

  // Run immediately
  simulateMarketActivity();

  // Then run on interval
  simulationInterval = setInterval(() => {
    simulateMarketActivity();
  }, intervalMs);
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('🛑 Stopped market simulation');
  }
}

// Initialize price history for existing markets (backfill)
export function initializePriceHistory() {
  const markets = db.prepare('SELECT id FROM markets').all();

  for (const market of markets) {
    const existingHistory = db.prepare(
      'SELECT COUNT(*) as count FROM price_history WHERE market_id = ?'
    ).get(market.id);

    if (existingHistory.count === 0) {
      // Create initial price history (past 7 days)
      const now = new Date();
      let price = 50;

      for (let i = 168; i >= 0; i--) { // 168 hours = 7 days
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

        // Random walk
        price = generatePriceChange(price);

        db.prepare(
          `INSERT INTO price_history (market_id, price, timestamp)
           VALUES (?, ?, ?)`
        ).run(market.id, price, timestamp.toISOString());
      }

      console.log(`📊 Initialized price history for market ${market.id}`);
    }
  }
}
