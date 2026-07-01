const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    // Check if project exists
    const project = await db.query('SELECT id, price FROM projects WHERE id = $1', [projectId]);
    if (project.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const amount = project[0].price;

    // Create Razorpay Order
    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save order in database
    await db.query(
      `INSERT INTO orders (user_id, project_id, razorpay_order_id, amount, status) 
       VALUES ($1, $2, $3, $4, 'created')`,
      [userId, projectId, razorpayOrder.id, amount]
    );

    logger.payment('ORDER_CREATED', razorpayOrder.id, amount, 'created');

    return res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    logger.error('Create order error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, projectId } = req.body;
    const userId = req.user.id;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // === IDEMPOTENCY CHECK ===
    const existingPayment = await db.query(
      'SELECT id FROM orders WHERE razorpay_payment_id = $1',
      [razorpay_payment_id]
    );

    if (existingPayment.length > 0) {
      return res.json({ success: true, message: 'Payment already processed' });
    }

    // Update order
    await db.query(
      `UPDATE orders 
       SET razorpay_payment_id = $1, 
           razorpay_signature = $2, 
           status = 'paid', 
           paid_at = NOW() 
       WHERE razorpay_order_id = $3 AND user_id = $4`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id, userId]
    );

    logger.payment('PAYMENT_VERIFIED', razorpay_payment_id, null, 'paid');

    return res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    logger.error('Verify payment error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};