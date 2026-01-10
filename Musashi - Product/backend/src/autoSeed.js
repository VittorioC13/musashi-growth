/**
 * AUTO-SEED ON STARTUP
 *
 * Automatically seeds the database with initial markets if it's empty.
 * This ensures production deployments work without manual seeding.
 */

import db from './database.js';
import bcrypt from 'bcryptjs';

export function autoSeedIfEmpty() {
  // Check if markets already exist
  const marketCount = db.prepare('SELECT COUNT(*) as count FROM markets').get();

  if (marketCount.count > 0) {
    console.log(`📊 Database already has ${marketCount.count} markets - skipping auto-seed`);
    return;
  }

  console.log('🌱 Auto-seeding database with initial markets...\n');

  // Create test users
  console.log('📦 Creating test users...');
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
    console.log(`  ✓ Created user: ${user.email}`);
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
  }

  console.log(`\n✅ Auto-seed complete! ${markets.length} markets created.\n`);
}
