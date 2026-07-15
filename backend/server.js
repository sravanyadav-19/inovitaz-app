/**
 * INOVITAZ Backend Server
 * Day 4: Admin Audit Logging + IP Restrictions
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./src/utils/logger');
const { validateEnv } = require('./src/utils/validateEnv');

validateEnv();

const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 15;

// Routes
const authRoutes = require('./src/routes/auth.routes');
const projectRoutes = require('./src/routes/project.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const adminRoutes = require('./src/routes/admin.routes');
const orderRoutes = require('./src/routes/order.routes');
const couponRoutes = require('./src/routes/coupon.routes');
const reviewRoutes = require('./src/routes/review.routes');
const wishlistRoutes = require('./src/routes/wishlist.routes');

const db = require('./src/config/db');

// === DAY 4: Import Admin Audit Middleware ===
const { adminAuditLogger } = require('./src/middlewares/adminAudit.middleware');

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// ==========================================
// RATE LIMITING
// ==========================================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Combine IP + email to scope rate limiting per-account
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const email = req.body?.email?.toLowerCase() || 'no-email';
    return `${ip}:${email}`;
  },
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many payment requests.' },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many requests on this endpoint.' },
});

// ==========================================
// SECURE CORS
// ==========================================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) ||
      (!isProduction && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')));
    if (isAllowed) {
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

// === FIX: Capture Raw Body for Webhook Signature Verification ===
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path !== '/api/health') {
      logger.info(`${req.method} ${req.path} ${res.statusCode}`, { duration: Date.now() - start });
    }
  });
  next();
});

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/payment', paymentLimiter);
app.use('/api/reviews', strictLimiter);
app.use('/api/wishlist', strictLimiter);
app.use('/api/coupons', strictLimiter);

// Secure static files
app.use('/uploads', (req, res, next) => {
  if (isProduction) {
    return res.status(403).json({ success: false, message: 'Direct access disabled.' });
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payment', paymentRoutes);

// === DAY 4: Apply Admin Audit Logging to Admin Routes ===
app.use('/api/admin', adminAuditLogger('ADMIN_ACCESS'), adminRoutes);

app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);

// 404 + Error handlers
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use((err, req, res, next) => {
  logger.error('Server Error', { message: err.message, path: req.path });
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Cross-origin request blocked' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message
  });
});

// ==========================================
// START SERVER (only if not in test mode)
// ==========================================
const startServer = async () => {
  try {
    await db.testConnection();
    logger.info('✅ Database connected');

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`🚀 Server started on port ${PORT}`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

startServer();

module.exports = app;