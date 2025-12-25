// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

// ==========================================
// 🔐 CORS CONFIGURATION (THE FIX)
// ==========================================
app.use(cors({
  origin: [
    "http://localhost:5173",                    // Local development
    "http://127.0.0.1:5173",                    // Local IP
    "https://inovitaz-app.onrender.com",        // 👈 MATCHES YOUR ERROR LOG
    "https://inovitaz-frontend.onrender.com",   // Alternate URL
    process.env.FRONTEND_URL                    // Environment variable fallback
  ].filter(Boolean),                            // Removes undefined values to prevent crashes
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Inovitaz API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test Database Connection
    await db.testConnection();
    console.log('✅ Database connected successfully');
    
    // Bind to 0.0.0.0 is REQUIRED for Render
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Inovitaz Backend Server Started`);
      console.log(`➜  Port: ${PORT}`);
      console.log(`➜  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;