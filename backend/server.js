// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
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

// Get network IP
const getNetworkIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const networkIP = getNetworkIP();

// Middleware - CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    `http://${networkIP}:5173`,
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    await db.testConnection();
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log('\n🚀 Inovitaz Backend Server Started\n');
      console.log(`  ➜  Local:   http://localhost:${PORT}/`);
      console.log(`  ➜  Network: http://${networkIP}:${PORT}/\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;