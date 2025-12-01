const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authRequired } = require('../middlewares/auth.middleware');

// All payment routes require authentication
router.use(authRequired);

// Create order
router.post(
  '/create-order',
  [
    body('projectId')
      .notEmpty()
      .isInt()
      .withMessage('Valid project ID is required')
  ],
  paymentController.createOrder
);

// Verify payment
router.post(
  '/verify-payment',
  [
    body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Signature is required')
  ],
  paymentController.verifyPayment
);

// Get payment status
router.get('/status/:orderId', paymentController.getPaymentStatus);

module.exports = router;