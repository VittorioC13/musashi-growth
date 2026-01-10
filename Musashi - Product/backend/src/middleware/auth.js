/**
 * AUTHENTICATION MIDDLEWARE
 *
 * Middleware = code that runs BEFORE your route handler
 * Think of it as a security guard checking IDs at the door.
 *
 * We use JWT (JSON Web Tokens) for authentication:
 * 1. User logs in with email/password
 * 2. Server gives them a JWT (like a wristband at a concert)
 * 3. User includes JWT in every request
 * 4. Server verifies JWT is valid before allowing access
 */

import jwt from 'jsonwebtoken';

// Secret key for signing JWTs - in production, use environment variable!
const JWT_SECRET = 'musashi-secret-key-change-in-production';

/**
 * Middleware to verify JWT token
 *
 * Usage in routes:
 *   app.get('/protected-route', authMiddleware, (req, res) => {
 *     // req.user contains the decoded user info
 *   })
 */
export function authMiddleware(req, res, next) {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Header format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token format invalid' });
  }

  const token = parts[1];

  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next(); // Continue to the actual route handler
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Generate a JWT for a user
 *
 * @param {Object} user - User object with id and email
 * @returns {string} JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
}

export { JWT_SECRET };
