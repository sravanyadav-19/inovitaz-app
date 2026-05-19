const jwt = require('jsonwebtoken');
const db = require('../config/db');

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
      const users = await db.query(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [decoded.id]
      );
      req.user = users.length > 0 ? users[0] : null;
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
      const users = await db.query(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [decoded.id]
      );

      if (!users || users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found or deactivated.'
        });
      }

      req.user = users[0];
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
      const users = await db.query(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [decoded.id]
      );

      if (!users || users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found.'
        });
      }

      const user = users[0];
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
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { authOptional, authRequired, adminOnly, generateToken };
