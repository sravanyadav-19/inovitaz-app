const crypto = require('crypto');
const db = require('../config/db');
const razorpayService = require('../services/razorpay');

/**
 * Create payment order
 * POST /api/payment/create-order
 */
const createOrder = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user.id;

    // Get project details
    const projects = await db.query(
      'SELECT id, title, price FROM projects WHERE id = ?',
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Check if already purchased
    const existingOrders = await db.query(
      `SELECT id FROM orders 
       WHERE user_id = ? AND project_id = ? AND status = 'paid'`,
      [userId, projectId]
    );

    if (existingOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this project'
      });
    }

    // Create Razorpay order (or mock order)
    const amount = Math.round(project.price * 100); // Convert to paise
    const razorpayOrder = await razorpayService.createOrder({
      amount,
      currency: 'INR',
      receipt: `order_${userId}_${projectId}_${Date.now()}`,
      notes: {
        projectId: projectId.toString(),
        userId: userId.toString(),
        projectTitle: project.title
      }
    });

    // Save order to database
    const result = await db.query(
      `INSERT INTO orders 
       (user_id, project_id, razorpay_order_id, amount, status, created_at) 
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [userId, projectId, razorpayOrder.id, project.price]
    );

    res.json({
      success: true,
      data: {
        orderId: result.insertId,
        razorpayOrderId: razorpayOrder.id,
        amount: amount,
        currency: 'INR',
        projectTitle: project.title,
        keyId: process.env.RAZORPAY_KEY_ID || 'mock_key',
        isMockPayment: !process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};

/**
 * Verify payment
 * POST /api/payment/verify-payment
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Find the order
    const orders = await db.query(
      'SELECT * FROM orders WHERE razorpay_order_id = ?',
      [razorpay_order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Verify signature (skip for mock payments)
    const isMockPayment = razorpay_order_id.startsWith('order_mock_');
    
    if (!isMockPayment && process.env.RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        // Update order status to failed
        await db.query(
          `UPDATE orders SET status = 'failed' WHERE id = ?`,
          [order.id]
        );

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed'
        });
      }
    }

    // Update order status to paid
    await db.query(
      `UPDATE orders 
       SET razorpay_payment_id = ?, status = 'paid', updated_at = NOW() 
       WHERE id = ?`,
      [razorpay_payment_id, order.id]
    );

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: order.id,
        projectId: order.project_id
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
};

/**
 * Get payment status
 * GET /api/payment/status/:orderId
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const orders = await db.query(
      `SELECT o.*, p.title as project_title 
       FROM orders o 
       JOIN projects p ON o.project_id = p.id 
       WHERE o.razorpay_order_id = ? AND o.user_id = ?`,
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: orders[0]
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status'
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentStatus
};