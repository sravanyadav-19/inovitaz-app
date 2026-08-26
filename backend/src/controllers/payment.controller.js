const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../utils/logger');
const { secureCompare } = require('../utils/secureCompare');
const { resolveValidCoupon } = require('../services/couponService');

/**
 * Razorpay keys are optional in development/test (mock payment mode).
 */
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const isMockMode = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;

const razorpay =
  !isMockMode && RAZORPAY_KEY_ID
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

const parseProjectIds = (body = {}) => {
  const supplied = body.projectIds ?? body.projectId ?? body.project_id;
  const rawIds = Array.isArray(supplied) ? supplied : [supplied];

  if (rawIds.length === 0 || rawIds.some((id) => id === undefined || id === null || id === '')) {
    return { error: 'At least one project is required' };
  }

  if (rawIds.length > 20) {
    return { error: 'A maximum of 20 projects can be purchased at once' };
  }

  const projectIds = rawIds.map((id) => Number(id));
  if (projectIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    return { error: 'Every project ID must be a positive integer' };
  }

  if (new Set(projectIds).size !== projectIds.length) {
    return { error: 'Each project can appear only once in an order' };
  }

  return { projectIds };
};

const loadOrderItems = async (projectIds) => {
  const rows = await db.query(
    'SELECT id, title, price FROM projects WHERE id = ANY($1::int[])',
    [projectIds]
  );

  if (rows.length !== projectIds.length) {
    const foundIds = new Set(rows.map((row) => Number(row.id)));
    const missingIds = projectIds.filter((id) => !foundIds.has(id));
    const error = new Error(`Project not found: ${missingIds.join(', ')}`);
    error.status = 404;
    throw error;
  }

  const byId = new Map(rows.map((row) => [Number(row.id), row]));
  return projectIds.map((projectId) => {
    const project = byId.get(projectId);
    const price = Number(project.price);
    return {
      projectId,
      title: project.title,
      quantity: 1,
      unitPrice: price,
      originalAmount: price,
      discountAmount: 0,
      finalAmount: price,
    };
  });
};

const calculateTotals = (items) => items.reduce(
  (totals, item) => ({
    originalAmount: totals.originalAmount + item.originalAmount,
    discountAmount: totals.discountAmount + item.discountAmount,
    finalAmount: totals.finalAmount + item.finalAmount,
  }),
  { originalAmount: 0, discountAmount: 0, finalAmount: 0 }
);

const createOrder = async (req, res) => {
  try {
    const parsedIds = parseProjectIds(req.body);
    if (parsedIds.error) {
      return res.status(400).json({ success: false, message: parsedIds.error });
    }

    const { projectIds } = parsedIds;
    const couponCode = req.body.couponCode ?? null;
    const userId = req.user.id;
    const items = await loadOrderItems(projectIds);
    let coupon = null;

    // Phase 3 adds per-item eligibility. Until then, preserve the existing
    // single-project coupon contract instead of applying a misleading cart-wide discount.
    if (couponCode && String(couponCode).trim()) {
      if (items.length !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Coupons for multi-project checkout will be available after eligible-item rules are added.',
        });
      }

      const result = await resolveValidCoupon(couponCode, items[0].originalAmount, userId);
      if (!result.ok) {
        return res.status(result.status || 400).json({
          success: false,
          message: result.reason,
        });
      }

      coupon = result.coupon;
      items[0].discountAmount = result.discountAmount;
      items[0].finalAmount = result.finalAmount;
    }

    const totals = calculateTotals(items);
    let razorpayOrderId;
    let currency = 'INR';

    // Do the external payment-order call before opening a DB transaction.
    if (isMockMode) {
      razorpayOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    } else {
      const razorpayOrder = await razorpay.orders.create({
        amount: totals.finalAmount,
        currency,
        receipt: `receipt_${Date.now()}`,
      });
      razorpayOrderId = razorpayOrder.id;
      currency = razorpayOrder.currency || currency;
    }

    const orderRow = await db.transaction(async (client) => {
      const header = await client.query(
        `INSERT INTO orders
          (user_id, project_id, razorpay_order_id, amount, original_amount,
           discount_amount, coupon_code, currency, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'created')
         RETURNING id`,
        [
          userId,
          items.length === 1 ? items[0].projectId : null,
          razorpayOrderId,
          totals.finalAmount,
          totals.originalAmount,
          totals.discountAmount,
          coupon ? coupon.code : null,
          currency,
        ]
      );

      const internalOrderId = header.rows[0].id;

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items
            (order_id, project_id, quantity, unit_price, original_amount,
             discount_amount, final_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            internalOrderId,
            item.projectId,
            item.quantity,
            item.unitPrice,
            item.originalAmount,
            item.discountAmount,
            item.finalAmount,
          ]
        );
      }

      // Preserve the pre-Phase-3 single-item coupon behavior. Phase 3 moves
      // coupon consumption to the paid transition and adds eligibility rules.
      if (coupon) {
        await client.query(
          `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount)
           VALUES ($1, $2, $3, $4)`,
          [coupon.id, userId, internalOrderId, totals.discountAmount]
        );
      }

      return { id: internalOrderId };
    });

    logger.payment('ORDER_CREATED', razorpayOrderId, totals.finalAmount, 'created');

    return res.json({
      success: true,
      data: {
        orderId: razorpayOrderId,
        internalOrderId: orderRow.id,
        amount: totals.finalAmount,
        originalAmount: totals.originalAmount,
        discountAmount: totals.discountAmount,
        currency,
        keyId: isMockMode ? null : RAZORPAY_KEY_ID,
        isMockPayment: isMockMode,
        itemCount: items.length,
        items: items.map((item) => ({
          projectId: item.projectId,
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          originalAmount: item.originalAmount,
          discountAmount: item.discountAmount,
          amount: item.finalAmount,
        })),
      },
    });
  } catch (error) {
    logger.error('Create order error', { error: error.message });
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Failed to create payment order',
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Payment order and payment IDs are required' });
    }

    if (!isMockMode) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (!secureCompare(expectedSignature, razorpay_signature)) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    const result = await db.transaction(async (client) => {
      const orderResult = await client.query(
        `SELECT id, status, razorpay_payment_id
         FROM orders
         WHERE razorpay_order_id = $1 AND user_id = $2
         FOR UPDATE`,
        [razorpay_order_id, userId]
      );

      if (orderResult.rows.length === 0) {
        const error = new Error('Order not found');
        error.status = 404;
        throw error;
      }

      const order = orderResult.rows[0];
      if (order.status === 'paid') {
        return { alreadyProcessed: true, internalOrderId: order.id };
      }

      const duplicatePayment = await client.query(
        'SELECT id FROM orders WHERE razorpay_payment_id = $1 AND id != $2 LIMIT 1',
        [razorpay_payment_id, order.id]
      );
      if (duplicatePayment.rows.length > 0) {
        const error = new Error('Payment has already been applied to another order');
        error.status = 409;
        throw error;
      }

      await client.query(
        `UPDATE orders
         SET razorpay_payment_id = $1,
             razorpay_signature = $2,
             status = 'paid',
             paid_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [razorpay_payment_id, razorpay_signature || null, order.id]
      );

      return { alreadyProcessed: false, internalOrderId: order.id };
    });

    logger.payment(
      result.alreadyProcessed ? 'PAYMENT_DUPLICATE' : 'PAYMENT_VERIFIED',
      razorpay_payment_id,
      null,
      'paid'
    );

    return res.json({
      success: true,
      message: result.alreadyProcessed ? 'Payment already processed' : 'Payment verified successfully',
      data: { internalOrderId: result.internalOrderId },
    });
  } catch (error) {
    logger.error('Verify payment error', { error: error.message });
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Payment verification failed',
    });
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

    if (!secureCompare(expectedSignature, signature)) {
      logger.payment('WEBHOOK_FAILED', null, null, 'invalid_signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    if (event !== 'payment.captured') {
      logger.payment('WEBHOOK_IGNORED', null, null, event);
      return res.json({ success: true, message: `Event ${event} ignored` });
    }

    const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
      logger.payment('WEBHOOK_FAILED', razorpayOrderId, null, 'missing_entity_data');
      return res.status(400).json({ success: false, message: 'Missing order or payment data' });
    }

    const order = await db.query(
      'SELECT id, status FROM orders WHERE razorpay_order_id = $1',
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
           paid_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [razorpayPaymentId, order[0].id]
    );

    logger.payment('WEBHOOK_SUCCESS', razorpayOrderId, null, 'paid');
    return res.json({ success: true, message: 'Payment captured successfully' });
  } catch (error) {
    logger.error('Webhook error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const found = await db.query(
      `SELECT id, user_id, amount, original_amount, discount_amount,
              coupon_code, currency, status, created_at, paid_at
       FROM orders
       WHERE id = $1
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

    const items = await db.query(
      `SELECT oi.project_id, oi.quantity, oi.unit_price, oi.original_amount,
              oi.discount_amount, oi.final_amount,
              p.title AS project_title, p.thumbnail AS project_thumbnail,
              p.category AS project_category
       FROM order_items oi
       JOIN projects p ON p.id = oi.project_id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [order.id]
    );

    const { user_id, ...safeOrder } = order;
    return res.json({ success: true, data: { order: { ...safeOrder, items } } });
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
