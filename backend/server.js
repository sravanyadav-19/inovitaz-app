/**
 * INOVITAZ Backend Server
 * Production-grade Express.js application
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import utilities
const logger = require('./src/utils/logger');
const { validateEnv } = require('./src/utils/validateEnv');

// Validate required environment variables on startup
validateEnv();

// Fix MaxListeners warning
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 15;

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const projectRoutes = require('./src/routes/project.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const adminRoutes = require('./src/routes/admin.routes');
const orderRoutes = require('./src/routes/order.routes');
const couponRoutes = require('./src/routes/coupon.routes');
const reviewRoutes = require('./src/routes/review.routes');
const wishlistRoutes = require('./src/routes/wishlist.routes');

// Import database connection
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// ==========================================
// RATE LIMITING
// ==========================================

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.'
  },
});

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Apply general rate limit to all API routes
app.use('/api/', generalLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    message: 'Inovitaz API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// API ROUTES
// ==========================================

// Apply auth rate limiter to login/register
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Apply payment rate limiter
app.use('/api/payment', paymentLimiter, paymentRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Server Error: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method 
  });
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request blocked'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const startServer = async () => {
  try {
    // Test Database Connection
    await db.testConnection();
    logger.info('✅ Database connected successfully');
    
    // Start server (bind to 0.0.0.0 for container environments)
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Inovitaz Backend Server Started`);
      logger.info(`➜  Port: ${PORT}`);
      logger.info(`➜  Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`➜  Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;