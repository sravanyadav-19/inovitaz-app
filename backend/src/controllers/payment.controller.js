const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../utils/logger');
const { secureCompare } = require('../utils/secureCompare');
const { resolveValidCoupon } = require('../services/couponService');

/**
 * Razorpay keys are optional in development/test (mock payment mode).
 * Instantiate lazily so an empty config does NOT crash the process at
 * module load (this previously prevented the entire app — and test
 * suite — from loading).
 */
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const isMockMode = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;

const razorpay =
  !isMockMode && RAZORPAY_KEY_ID
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

const createOrder = async (req, res) => {
  try {
    // Accept both projectId (frontend contract) and project_id (legacy).
    const projectId = req.body.projectId ?? req.body.project_id;
    const couponCode = req.body.couponCode ?? null;
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    // AUTHORITATIVE server-side price. Never trust client-supplied amounts.
    const projectRows = await db.query('SELECT id, price FROM projects WHERE id = $1', [projectId]);
    if (projectRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const originalAmount = projectRows[0].price; // paise
    let finalAmount = originalAmount;
    let discountAmount = 0;
    let coupon = null;

    // If a coupon is supplied, RE-VALIDATE and RECOMPUTE server-side.
    // On any failure we reject hard — never silently fall back to full price.
    if (couponCode && String(couponCode).trim()) {
      const result = await resolveValidCoupon(couponCode, originalAmount, userId);
      if (!result.ok) {
        return res.status(result.status || 400).json({
          success: false,
          message: result.reason,
        });
      }
      coupon = result.coupon;
      discountAmount = result.discountAmount;
      finalAmount = result.finalAmount;
    }

    // Create the Razorpay order (or a mock order) BEFORE the DB transaction,
    // so the (network-bound) external call does not hold a DB connection.
    let orderId;
    let currency = 'INR';

    if (isMockMode) {
      orderId = `order_mock_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    } else {
      const razorpayOrder = await razorpay.orders.create({
        amount: finalAmount,
        currency,
        receipt: `receipt_${Date.now()}`,
      });
      orderId = razorpayOrder.id;
      currency = razorpayOrder.currency || currency;
    }

    // Persist order (and coupon usage) atomically.
    const orderRow = await db.transaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO orders
           (user_id, project_id, razorpay_order_id, amount,
            original_amount, discount_amount, coupon_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'created')
         RETURNING id`,
        [
          userId,
          projectId,
          orderId,
          finalAmount,
          originalAmount,
          discountAmount,
          coupon ? coupon.code : null,
        ]
      );

      const newOrderId = inserted.rows[0].id;

      // Record coupon usage in the SAME transaction so there are no orphaned
      // rows: either the order + usage commit together, or neither does.
      if (coupon) {
        await client.query(
          `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount)
           VALUES ($1, $2, $3, $4)`,
          [coupon.id, userId, newOrderId, discountAmount]
        );
      }

      return { id: newOrderId };
    });

    logger.payment('ORDER_CREATED', orderId, finalAmount, 'created');

    return res.json({
      success: true,
      data: {
        orderId,
        amount: finalAmount,
        originalAmount,
        discountAmount,
        currency,
        keyId: isMockMode ? null : RAZORPAY_KEY_ID,
        isMockPayment: isMockMode,
        internalOrderId: orderRow.id,
      },
    });
  } catch (error) {
    logger.error('Create order error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    // Signature verification (skipped only in mock/dev mode where there is no gateway).
    if (!isMockMode) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (!secureCompare(expectedSignature, razorpay_signature)) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    // Idempotency check.
    const existingPayment = await db.query(
      'SELECT id FROM orders WHERE razorpay_payment_id = $1',
      [razorpay_payment_id]
    );

    if (existingPayment.length > 0) {
      return res.json({ success: true, message: 'Payment already processed' });
    }

    await db.query(
      `UPDATE orders
       SET razorpay_payment_id = $1,
           razorpay_signature = $2,
           status = 'paid',
           paid_at = NOW()
       WHERE razorpay_order_id = $3 AND user_id = $4`,
      [razorpay_payment_id, razorpay_signature || null, razorpay_order_id, userId]
    );

    logger.payment('PAYMENT_VERIFIED', razorpay_payment_id, null, 'paid');

    return res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    logger.error('Verify payment error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const rawBody = req.rawBody;
    const payload = req.body;

    if (!signature || !rawBody || !secret) {
      logger.payment('WEBHOOK_FAILED', null, null, 'missing_signature_or_body');
      return res.status(400).json({ success: false, message: 'Missing signature or raw body' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Timing-safe comparison.
    if (!secureCompare(expectedSignature, signature)) {
      logger.payment('WEBHOOK_FAILED', null, null, 'invalid_signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    if (event === 'payment.captured') {
      const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (!razorpayOrderId || !razorpayPaymentId) {
        logger.payment('WEBHOOK_FAILED', razorpayOrderId, null, 'missing_entity_data');
        return res.status(400).json({ success: false, message: 'Missing order or payment data' });
      }

      const order = await db.query(
        'SELECT status FROM orders WHERE razorpay_order_id = $1',
        [razorpayOrderId]
      );

      if (order.length === 0) {
        logger.payment('WEBHOOK_FAILED', razorpayOrderId, null, 'order_not_found');
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order[0].status === 'paid') {
        logger.payment('WEBHOOK_DUPLICATE', razorpayOrderId, null, 'already_paid');
        return res.json({ success: true, message: 'Order already processed' });
      }

      await db.query(
        `UPDATE orders
         SET razorpay_payment_id = $1,
             status = 'paid',
             paid_at = NOW()
         WHERE razorpay_order_id = $2`,
        [razorpayPaymentId, razorpayOrderId]
      );

      logger.payment('WEBHOOK_SUCCESS', razorpayOrderId, null, 'paid');
      return res.json({ success: true, message: 'Payment captured successfully' });
    }

    logger.payment('WEBHOOK_IGNORED', null, null, event);
    return res.json({ success: true, message: `Event ${event} ignored` });
  } catch (error) {
    logger.error('Webhook error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/payment/status/:id
 * Returns the current payment/order status for the requesting owner (or admin).
 *   - 404 when the order does not exist
 *   - 403 when the order exists but belongs to another (non-admin) user
 *   - 200 with status/metadata otherwise
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const found = await db.query(
      `SELECT o.id, o.user_id, o.amount, o.original_amount, o.discount_amount,
              o.coupon_code, o.currency, o.status, o.created_at, o.paid_at,
              p.id AS project_id, p.title AS project_title
       FROM orders o
       JOIN projects p ON o.project_id = p.id
       WHERE o.id = $1
       LIMIT 1`,
      [id]
    );

    if (found.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = found[0];

    if (!isAdmin && Number(order.user_id) !== Number(userId)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this order' });
    }

    // Drop user_id from the payload.
    const { user_id, ...safeOrder } = order;

    return res.json({ success: true, data: { order: safeOrder } });
  } catch (error) {
    logger.error('Get payment status error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch payment status' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
};
