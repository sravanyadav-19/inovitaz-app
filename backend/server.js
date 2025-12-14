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

// Helper: Get network IP (Only used for local development)
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

// Middleware - CORS Configuration
// This is critical for connecting your Frontend to this Backend
const allowedOrigins = [
  'http://localhost:5173',      // Vite Localhost
  'http://127.0.0.1:5173',      // IP Localhost
  process.env.FRONTEND_URL      // Your Render Frontend URL (e.g., https://inovitaz.onrender.com)
];

// Add local network IP only if we are NOT in production
if (process.env.NODE_ENV !== 'production') {
  const networkIP = getNetworkIP();
  allowedOrigins.push(`http://${networkIP}:5173`);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV) {
      // !process.env.NODE_ENV means "if development, allow everything"
      return callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin); // Log blocked attempts for debugging
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (Note: On Render Free Tier, these files disappear after restart)
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
  console.error('SERVER ERROR:', err); // Better logging for cloud
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