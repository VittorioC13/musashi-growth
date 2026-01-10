/**
 * DATABASE SCHEMA FOR MUSASHI PREDICTION MARKET
 *
 * This file sets up our SQLite database with all the tables we need.
 * Using sql.js which is a pure JavaScript SQLite implementation (no native compilation needed).
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../musashi.db');

// Initialize SQL.js
const SQL = await initSqlJs();

// Load existing database or create new one
let db;
if (existsSync(DB_PATH)) {
  const buffer = readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

// Save database to file
function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

// Auto-save every 5 seconds
setInterval(saveDatabase, 5000);

// Save on exit
process.on('exit', saveDatabase);
process.on('SIGINT', () => {
  saveDatabase();
  process.exit();
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

/**
 * TABLE: users
 */
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    balance INTEGER DEFAULT 100000,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

/**
 * TABLE: markets
 */
db.run(`
  CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'settled')),
    settlement_date TEXT,
    resolved_outcome TEXT CHECK(resolved_outcome IN ('yes', 'no') OR resolved_outcome IS NULL),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

/**
 * TABLE: orders
 */
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    market_id INTEGER NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('yes', 'no')),
    price INTEGER NOT NULL CHECK(price >= 1 AND price <= 99),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    filled_quantity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'filled', 'partial', 'cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (market_id) REFERENCES markets(id)
  )
`);

/**
 * TABLE: fills
 */
db.run(`
  CREATE TABLE IF NOT EXISTS fills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER NOT NULL,
    yes_order_id INTEGER NOT NULL,
    no_order_id INTEGER NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES markets(id),
    FOREIGN KEY (yes_order_id) REFERENCES orders(id),
    FOREIGN KEY (no_order_id) REFERENCES orders(id)
  )
`);

/**
 * TABLE: positions
 */
db.run(`
  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    market_id INTEGER NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('yes', 'no')),
    quantity INTEGER DEFAULT 0,
    avg_price INTEGER DEFAULT 0,
    UNIQUE(user_id, market_id, side),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (market_id) REFERENCES markets(id)
  )
`);

/**
 * TABLE: price_history
 *
 * Tracks price changes over time for charts
 */
db.run(`
  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER NOT NULL,
    price INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES markets(id)
  )
`);

// Create indexes
db.run('CREATE INDEX IF NOT EXISTS idx_orders_market_status ON orders(market_id, status)');
db.run('CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)');
db.run('CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id)');
db.run('CREATE INDEX IF NOT EXISTS idx_fills_market ON fills(market_id)');
db.run('CREATE INDEX IF NOT EXISTS idx_price_history_market ON price_history(market_id, timestamp)');

saveDatabase();

/**
 * Helper to get last insert rowid
 */
function getLastInsertRowId() {
  const result = db.exec("SELECT last_insert_rowid()");
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0];
  }
  return 0;
}

/**
 * Helper wrapper to provide better-sqlite3 like API
 */
const dbWrapper = {
  prepare(sql) {
    return {
      get(...params) {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        } catch (e) {
          console.error('SQL error (get):', e.message, '\nSQL:', sql, '\nParams:', params);
          throw e;
        }
      },
      all(...params) {
        try {
          const results = [];
          const stmt = db.prepare(sql);
          stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (e) {
          console.error('SQL error (all):', e.message, '\nSQL:', sql, '\nParams:', params);
          throw e;
        }
      },
      run(...params) {
        try {
          db.run(sql, params);
          const lastId = getLastInsertRowId();
          const changes = db.getRowsModified();
          saveDatabase();
          return { lastInsertRowid: lastId, changes };
        } catch (e) {
          console.error('SQL error (run):', e.message, '\nSQL:', sql, '\nParams:', params);
          throw e;
        }
      },
    };
  },

  exec(sql) {
    try {
      db.run(sql);
      saveDatabase();
    } catch (e) {
      console.error('SQL error (exec):', e.message, '\nSQL:', sql);
      throw e;
    }
  },

  transaction(fn) {
    return () => {
      db.run('BEGIN TRANSACTION');
      try {
        fn();
        db.run('COMMIT');
        saveDatabase();
      } catch (e) {
        db.run('ROLLBACK');
        console.error('Transaction error:', e.message);
        throw e;
      }
    };
  },

  pragma(sql) {
    db.run(`PRAGMA ${sql}`);
  },

  // Direct access for debugging
  raw: db,
};

export default dbWrapper;
