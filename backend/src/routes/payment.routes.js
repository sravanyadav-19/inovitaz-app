const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authRequired } = require('../middlewares/auth.middleware');

// Create Order (placeholder)
router.post('/create-order', authRequired, (req, res) => {
  res.status(501).json({ success: false, message: 'Payment create-order not implemented yet' });
});

// Verify Payment (placeholder)
router.post('/verify', authRequired, (req, res) => {
  res.status(501).json({ success: false, message: 'Payment verification not implemented yet' });
});

// Get Payment Status
router.get('/status/:orderId', authRequired, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

module.exports = router;