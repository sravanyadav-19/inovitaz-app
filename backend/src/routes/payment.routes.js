const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authRequired } = require('../middlewares/auth.middleware');

// Create Order
router.post('/create-order', authRequired, paymentController.createOrder);

// Verify Payment
router.post('/verify', authRequired, paymentController.verifyPayment);

// Get Payment Status
router.get('/status/:orderId', authRequired, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

module.exports = router;