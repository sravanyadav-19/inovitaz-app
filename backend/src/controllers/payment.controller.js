/**
 * Payment Controller
 * Handles Razorpay order creation and verification
 */

const crypto = require('crypto');
const db = require('../config/db');
const razorpay = require('../services/razorpay');
const logger = require('../utils/logger');

/**
 * Create Razorpay Order
 * POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { projectId, couponCode } = req.body;
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required' 
      });
    }

    // Get project price
    const projects = await db.query(
      'SELECT id, price, title FROM projects WHERE id = ? LIMIT 1',
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    const project = projects[0];
    let originalAmount = Number(project.price);
    let discountAmount = 0;
    let appliedCouponCode = null;

    // Validate and apply coupon if provided
    if (couponCode) {
      const couponResult = await validateCouponInternal(
        couponCode, 
        userId, 
        originalAmount
      );

      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        appliedCouponCode = couponResult.code;
      }
      // If coupon is invalid, we proceed without discount (don't fail the order)
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const amountInPaise = Math.round(finalAmount * 100);

    // Create Razorpay order
    const order = await razorpay.createOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${projectId}_${userId}_${Date.now()}`,
      notes: {
        projectId: projectId.toString(),
        userId: userId.toString(),
        couponCode: appliedCouponCode || ''
      }
    });

    logger.payment('Order created', order.id, amountInPaise, 'created');

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpay.getPublicKey(),
        originalAmount,
        discountAmount,
        couponCode: appliedCouponCode,
        isMockPayment: razorpay.isMock()
      }
    });

  } catch (error) {
    logger.error('Create order error', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

/**
 * Verify Payment
 * POST /api/payment/verify
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      projectId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      couponCode,
      discountAmount: clientDiscount
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!projectId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required payment fields' 
      });
    }

    // CRITICAL: Verify signature
    const isValid = razorpay.verifyPaymentSignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      logger.payment('Verification failed', razorpay_order_id, null, 'invalid_signature');
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed - invalid signature' 
      });
    }

    // Get project details
    const projects = await db.query(
      'SELECT price, title FROM projects WHERE id = ? LIMIT 1',
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    const originalAmount = Number(projects[0].price);
    
    // Re-validate coupon server-side (don't trust client discount)
    let discountAmount = 0;
    let validCouponCode = null;

    if (couponCode) {
      const couponResult = await validateCouponInternal(couponCode, userId, originalAmount);
      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        validCouponCode = couponResult.code;
      }
    }

    const finalAmount = originalAmount - discountAmount;

    // Save order
    const orderResult = await db.query(
      `INSERT INTO orders 
       (user_id, project_id, razorpay_order_id, razorpay_payment_id, 
        amount, original_amount, discount_amount, coupon_code, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', NOW())`,
      [
        userId,
        projectId,
        razorpay_order_id,
        razorpay_payment_id,
        finalAmount,
        originalAmount,
        discountAmount,
        validCouponCode
      ]
    );

    const orderId = orderResult.insertId;

    // Record coupon usage
    if (validCouponCode) {
      const coupons = await db.query(
        'SELECT id FROM coupons WHERE code = ?',
        [validCouponCode]
      );

      if (coupons.length > 0) {
        await db.query(
          `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [coupons[0].id, userId, orderId, Math.round(discountAmount * 100)]
        );

        // Increment used_count
        await db.query(
          'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
          [coupons[0].id]
        );
      }
    }

    // Create download log (6 months expiry, 5 downloads max)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    await db.query(
      `INSERT INTO download_logs 
       (user_id, project_id, order_id, download_count, max_downloads, expiry_date, created_at)
       VALUES (?, ?, ?, 0, 5, ?, NOW())`,
      [userId, projectId, orderId, expiryDate]
    );

    logger.payment('Payment verified', razorpay_order_id, finalAmount, 'paid');

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { orderId }
    });

  } catch (error) {
    logger.error('Verify payment error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
};

/**
 * Internal coupon validation helper
 */
async function validateCouponInternal(code, userId, amount) {
  try {
    const couponCode = code.trim().toUpperCase();

    const coupons = await db.query(
      `SELECT * FROM coupons 
       WHERE code = ? AND is_active = TRUE`,
      [couponCode]
    );

    if (coupons.length === 0) {
      return { valid: false, reason: 'Invalid code' };
    }

    const coupon = coupons[0];

    // Check expiry
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { valid: false, reason: 'Expired' };
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, reason: 'Usage limit reached' };
    }

    // Check min purchase (stored in paise)
    const amountInPaise = Math.round(amount * 100);
    if (coupon.min_purchase_amount && amountInPaise < coupon.min_purchase_amount) {
      return { valid: false, reason: 'Min purchase not met' };
    }

    // Check user usage
    const usage = await db.query(
      'SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
      [coupon.id, userId]
    );

    if (usage.length > 0) {
      return { valid: false, reason: 'Already used' };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (amount * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }

    // Apply max discount
    if (coupon.max_discount_amount) {
      const maxDiscount = coupon.max_discount_amount / 100;
      discountAmount = Math.min(discountAmount, maxDiscount);
    }

    discountAmount = Math.min(discountAmount, amount);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      code: coupon.code,
      discountAmount
    };

  } catch (error) {
    logger.error('Internal coupon validation error', { error: error.message });
    return { valid: false, reason: 'Validation error' };
  }
}