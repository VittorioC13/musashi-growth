/**
 * AUTHENTICATION ROUTES
 *
 * Handles user registration and login.
 *
 * POST /api/auth/register - Create new account
 * POST /api/auth/login - Log in and get token
 * GET /api/auth/me - Get current user info (requires auth)
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 *
 * Create a new user account.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword"
 * }
 *
 * Response:
 * {
 *   "user": { id, email, balance },
 *   "token": "jwt-token-here"
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password (NEVER store plain text passwords!)
    // bcrypt adds "salt" - random data that makes the hash unique
    // even if two users have the same password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user (starts with $1000 play money = 100000 cents)
    const result = db.prepare(`
      INSERT INTO users (email, password_hash) VALUES (?, ?)
    `).run(email, password_hash);

    const user = {
      id: result.lastInsertRowid,
      email,
      balance: 100000, // $1000 in cents
    };

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 *
 * Authenticate user and return token.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword"
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password with hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/auth/me
 *
 * Get current authenticated user's info.
 * Requires valid JWT token in Authorization header.
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, balance, created_at FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
