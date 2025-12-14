// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * authOptional - Allows anonymous browsing but attaches req.user if token valid
 */
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
      
      // FIXED: No array destructuring
      const users = await db.query(
        'SELECT id, email, name, role FROM users WHERE id = ?',
        [decoded.id]
      );
      
      if (users && users.length > 0) {
        req.user = users[0];
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * authRequired - Blocks access unless a valid JWT is provided
 */
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
      
      // FIXED: No array destructuring
      const users = await db.query(
        'SELECT id, email, name, role FROM users WHERE id = ?',
        [decoded.id]
      );
      
      if (!users || users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found or has been deactivated.'
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

/**
 * adminOnly - Only admin users can access these routes
 */
const adminOnly = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 [ADMIN CHECK] Authorization Header:', authHeader ? 'Present ✓' : 'Missing ✗');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 [ADMIN CHECK] Failed: No Bearer token');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('🔐 [ADMIN CHECK] Token:', token.substring(0, 30) + '...');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔐 [ADMIN CHECK] Decoded:', decoded);
      
      // FIXED: No array destructuring
      const users = await db.query(
        'SELECT id, email, name, role FROM users WHERE id = ?',
        [decoded.id]
      );
      
      console.log('🔐 [ADMIN CHECK] Query result:', users);
      
      if (!users || users.length === 0) {
        console.log('🔐 [ADMIN CHECK] Failed: User not found in DB');
        return res.status(401).json({
          success: false,
          message: 'User not found.'
        });
      }
      
      const user = users[0];
      console.log('🔐 [ADMIN CHECK] User from DB:', user);
      
      if (user.role !== 'admin') {
        console.log('🔐 [ADMIN CHECK] Failed: User role is', user.role, 'not admin');
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
      
      console.log('🔐 [ADMIN CHECK] Success! User is admin ✓');
      req.user = user;
      next();
    } catch (jwtError) {
      console.log('🔐 [ADMIN CHECK] JWT Error:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
  } catch (error) {
    console.error('🔐 [ADMIN CHECK] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error.'
    });
  }
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authOptional,
  authRequired,
  adminOnly,
  generateToken
};