/**
 * SEED SCRIPT
 *
 * Populates the database with sample crypto markets and test users.
 * Run with: npm run seed
 */

import db from './database.js';
import bcrypt from 'bcryptjs';

console.log('🌱 Seeding database...\n');

// Clear existing data (for fresh start)
db.exec('DELETE FROM fills');
db.exec('DELETE FROM positions');
db.exec('DELETE FROM orders');
db.exec('DELETE FROM markets');
db.exec('DELETE FROM users');

// Reset auto-increment counters
db.exec('DELETE FROM sqlite_sequence');

console.log('📦 Creating test users...');

// Create test users
const password_hash = bcrypt.hashSync('password123', 10);

const users = [
  { email: 'alice@test.com', password_hash },
  { email: 'bob@test.com', password_hash },
  { email: 'charlie@test.com', password_hash },
];

for (const user of users) {
  db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(
    user.email,
    user.password_hash
  );
  console.log(`  ✓ Created user: ${user.email} (password: password123)`);
}

console.log('\n📊 Creating crypto markets...\n');

// Create crypto prediction markets
const markets = [
  {
    ticker: 'BTC-100K-JAN25',
    title: 'Will Bitcoin be above $100,000 on January 31, 2025?',
    description:
      'This market resolves YES if the price of BTC/USD on Coinbase is above $100,000.00 at 11:59 PM ET on January 31, 2025. Otherwise resolves NO.',
    category: 'crypto',
    settlement_date: '2025-01-31',
  },
  {
    ticker: 'BTC-150K-MAR25',
    title: 'Will Bitcoin hit $150,000 by March 31, 2025?',
    description:
      'This market resolves YES if BTC/USD reaches $150,000.00 or higher on any major exchange (Coinbase, Binance, Kraken) at any point before March 31, 2025 11:59 PM ET. Otherwise resolves NO.',
    category: 'crypto',
    settlement_date: '2025-03-31',
  },
  {
    ticker: 'ETH-5K-FEB25',
    title: 'Will Ethereum be above $5,000 on February 28, 2025?',
    description:
      'This market resolves YES if the price of ETH/USD on Coinbase is above $5,000.00 at 11:59 PM ET on February 28, 2025. Otherwise resolves NO.',
    category: 'crypto',
    settlement_date: '2025-02-28',
  },
  {
    ticker: 'ETH-10K-2025',
    title: 'Will Ethereum hit $10,000 in 2025?',
    description:
      'This market resolves YES if ETH/USD reaches $10,000.00 or higher at any point during 2025. Otherwise resolves NO on December 31, 2025.',
    category: 'crypto',
    settlement_date: '2025-12-31',
  },
  {
    ticker: 'SOL-500-MAR25',
    title: 'Will Solana be above $500 on March 31, 2025?',
    description:
      'This market resolves YES if the price of SOL/USD is above $500.00 at 11:59 PM ET on March 31, 2025. Otherwise resolves NO.',
    category: 'crypto',
    settlement_date: '2025-03-31',
  },
  {
    ticker: 'DOGE-1-2025',
    title: 'Will Dogecoin reach $1 in 2025?',
    description:
      'This market resolves YES if DOGE/USD reaches $1.00 or higher at any point during 2025. Otherwise resolves NO.',
    category: 'crypto',
    settlement_date: '2025-12-31',
  },
  {
    ticker: 'BTC-GOLD-FEB25',
    title: 'Will Bitcoin outperform Gold in January 2025?',
    description:
      'This market resolves YES if Bitcoin (BTC/USD) has a higher percentage return than Gold (XAU/USD) from January 1, 2025 to January 31, 2025. Otherwise resolves NO.',
    category: 'crypto',
    settlement_date: '2025-02-01',
  },
  {
    ticker: 'ETH-BTC-FLIP',
    title: 'Will Ethereum market cap exceed Bitcoin in 2025?',
    description:
      'This market resolves YES if at any point in 2025, the total market capitalization of Ethereum exceeds that of Bitcoin (the "flippening"). Otherwise resolves NO.',
    category: 'crypto',
    settlement_date: '2025-12-31',
  },
];

for (const market of markets) {
  db.prepare(
    `INSERT INTO markets (ticker, title, description, category, settlement_date)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    market.ticker,
    market.title,
    market.description,
    market.category,
    market.settlement_date
  );
  console.log(`  ✓ ${market.ticker}`);
  console.log(`    "${market.title}"`);
  console.log('');
}

console.log('📈 Adding some initial orders to create liquidity...\n');

// Add some initial orders to create a market
// This simulates having some traders already
const alice = db.prepare('SELECT id FROM users WHERE email = ?').get('alice@test.com');
const bob = db.prepare('SELECT id FROM users WHERE email = ?').get('bob@test.com');
const btc100k = db.prepare('SELECT id FROM markets WHERE ticker = ?').get('BTC-100K-JAN25');

// Alice thinks BTC will hit 100k (bids on YES)
const aliceOrders = [
  { side: 'yes', price: 65, quantity: 10 },
  { side: 'yes', price: 60, quantity: 20 },
  { side: 'yes', price: 55, quantity: 30 },
];

for (const order of aliceOrders) {
  db.prepare(
    'INSERT INTO orders (user_id, market_id, side, price, quantity) VALUES (?, ?, ?, ?, ?)'
  ).run(alice.id, btc100k.id, order.side, order.price, order.quantity);
  console.log(`  Alice: BUY ${order.quantity} YES @ ${order.price}¢`);
}

// Bob is skeptical (bids on NO)
const bobOrders = [
  { side: 'no', price: 40, quantity: 10 },
  { side: 'no', price: 35, quantity: 25 },
  { side: 'no', price: 30, quantity: 50 },
];

for (const order of bobOrders) {
  db.prepare(
    'INSERT INTO orders (user_id, market_id, side, price, quantity) VALUES (?, ?, ?, ?, ?)'
  ).run(bob.id, btc100k.id, order.side, order.price, order.quantity);
  console.log(`  Bob:   BUY ${order.quantity} NO @ ${order.price}¢`);
}

console.log(`
╔═══════════════════════════════════════════════════════════╗
║  ✅ Database seeded successfully!                         ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Test Accounts (password: password123):                   ║
║  • alice@test.com - Has some YES orders                   ║
║  • bob@test.com   - Has some NO orders                    ║
║  • charlie@test.com - Fresh account                       ║
║                                                           ║
║  ${markets.length} crypto markets created                            ║
║                                                           ║
║  Run the server: npm run dev                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
