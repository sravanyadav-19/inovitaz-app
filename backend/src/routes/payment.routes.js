const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authRequired } = require('../middlewares/auth.middleware');

// Create Order
router.post('/create-order', authRequired, paymentController.createOrder);

// Verify Payment
router.post('/verify', authRequired, paymentController.verifyPayment);

// Webhook (Public - No authRequired)
router.post('/webhook', paymentController.handleWebhook);

// Get Payment Status (owner or admin)
router.get('/status/:id', authRequired, paymentController.getPaymentStatus);

module.exports = router;