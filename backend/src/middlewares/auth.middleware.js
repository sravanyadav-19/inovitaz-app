const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Load the user for a decoded JWT and enforce token_version, so that bumping
 * token_version (e.g. on password reset) invalidates all previously-issued tokens.
 *
 * @returns {Promise<object|null>} the user row (with token_version) or null
 */
const loadUserForToken = async (decoded) => {
  if (!decoded || !decoded.id) return null;

  const users = await db.query(
    'SELECT id, email, name, role, token_version FROM users WHERE id = $1',
    [decoded.id]
  );

  if (!users || users.length === 0) return null;

  // Session-invalidation check.
  if (decoded.token_version !== undefined && Number(decoded.token_version) !== Number(users[0].token_version)) {
    return null;
  }

  return users[0];
};

const authOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await loadUserForToken(decoded);
    } catch {
      req.user = null;
    }
    next();
  } catch {
    req.user = null;
    next();
  }
};

const authRequired = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await loadUserForToken(decoded);

      if (!user) {
        // Either the user no longer exists, or token_version changed (session reset).
        return res.status(401).json({
          success: false,
          message: 'Session expired or invalidated. Please login again.'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

const adminOnly = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await loadUserForToken(decoded);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.'
        });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error.'
    });
  }
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, token_version: user.token_version ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { authOptional, authRequired, adminOnly, generateToken };
