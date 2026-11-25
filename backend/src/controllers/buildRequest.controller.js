/**
 * Custom-build controller — backs order.inovitaz.in ("We build it for you").
 *
 * Flow: intake questionnaire -> admin review/quote -> 40% advance payment
 * (reuses the Razorpay orders table + the existing verify/webhook pipeline)
 * -> build -> ship -> balance.
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../utils/logger');
const { resolveValidCoupon } = require('../services/couponService');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const isMockMode = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;

const razorpay =
  !isMockMode && RAZORPAY_KEY_ID
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

const ADVANCE_RATE = 0.4;
const BUILD_STATUSES = [
  'submitted',
  'under_review',
  'quoted',
  'advance_paid',
  'in_progress',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'rejected',
];
const PURPOSES = ['college', 'personal', 'gift', 'business', 'other'];

// Keep request statuses aligned with the migration CHECK constraint.
const ALLOWED_TRANSITIONS = {
  submitted: ['under_review', 'quoted', 'rejected', 'cancelled'],
  under_review: ['quoted', 'rejected', 'cancelled'],
  quoted: ['advance_paid', 'rejected', 'cancelled'], // advance_paid is set by payment verify
  advance_paid: ['in_progress', 'cancelled'],
  in_progress: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
  rejected: [],
};

const rupeesToPaise = (value) => Math.round(Number(value) * 100);
const computeAdvance = (totalPaise) => Math.round(totalPaise * ADVANCE_RATE);

const toClient = (row) => ({
  id: row.id,
  projectId: row.project_id,
  projectTitle: row.project_title || undefined,
  projectThumbnail: row.project_thumbnail || undefined,
  purpose: row.purpose,
  purposeOther: row.purpose_other || undefined,
  requirements: row.requirements,
  deadline: row.deadline,
  componentsOwned: row.components_owned || undefined,
  fullName: row.full_name,
  phone: row.phone,
  addressLine: row.address_line,
  city: row.city,
  state: row.state,
  pincode: row.pincode,
  notes: row.notes || undefined,
  status: row.status,
  quotedPrice: row.quoted_price,
  advanceAmount: row.advance_amount,
  expectedDelivery: row.expected_delivery,
  clarificationThread: row.clarification_thread || [],
  advanceOrderId: row.advance_order_id,
  userEmail: row.user_email || undefined,
  userName: row.user_name || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * POST /api/build-requests — submit the intake questionnaire.
 * No payment here: the admin reviews first, then quotes.
 */
const createRequest = async (req, res) => {
  try {
    const b = req.body || {};
    const projectId = Number(b.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'A valid project is required' });
    }

    const required = [
      ['purpose', b.purpose],
      ['requirements', b.requirements],
      ['deadline', b.deadline],
      ['fullName', b.fullName],
      ['phone', b.phone],
      ['addressLine', b.addressLine],
      ['city', b.city],
      ['state', b.state],
      ['pincode', b.pincode],
    ];
    for (const [field, value] of required) {
      if (!value || !String(value).trim()) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    const purpose = String(b.purpose).trim().toLowerCase();
    if (!PURPOSES.includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Invalid purpose' });
    }
    if (purpose === 'other' && (!b.purposeOther || !String(b.purposeOther).trim())) {
      return res
        .status(400)
        .json({ success: false, message: 'Please describe the purpose when selecting "other"' });
    }

    const requirements = String(b.requirements).trim();
    if (requirements.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Tell us a little more about your requirements (at least 20 characters)',
      });
    }

    const deadlineDate = new Date(b.deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ success: false, message: 'A valid deadline date is required' });
    }
    const minDeadline = new Date();
    minDeadline.setDate(minDeadline.getDate() + 5);
    if (deadlineDate < minDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be at least 5 days away — good builds take time',
      });
    }

    const phone = String(b.phone).replace(/[\s-]/g, '');
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid phone number' });
    }
    const pincode = String(b.pincode).trim();
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 6-digit pincode' });
    }

    const projectResult = await db.query(
      'SELECT id, title FROM projects WHERE id = $1',
      [projectId]
    );
    if (projectResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const insert = await db.query(
      `INSERT INTO build_requests
        (user_id, project_id, purpose, purpose_other, requirements, deadline,
         components_owned, full_name, phone, address_line, city, state, pincode, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        req.user.id,
        projectId,
        purpose,
        purpose === 'other' ? String(b.purposeOther).trim() : null,
        requirements,
        b.deadline,
        b.componentsOwned ? String(b.componentsOwned).trim() : null,
        String(b.fullName).trim(),
        phone,
        String(b.addressLine).trim(),
        String(b.city).trim(),
        String(b.state).trim(),
        pincode,
        b.notes ? String(b.notes).trim() : null,
      ]
    );

    logger.info('BUILD_REQUEST_SUBMITTED', {
      requestId: insert[0].id,
      userId: req.user.id,
      projectId,
    });

    return res.status(201).json({ success: true, data: toClient(insert[0]) });
  } catch (error) {
    logger.error('Build request create error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to submit build request' });
  }
};

/** GET /api/build-requests/mine — the logged-in buyer's requests. */
const getMyRequests = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT br.*, p.title AS project_title, p.thumbnail AS project_thumbnail
       FROM build_requests br
       JOIN projects p ON p.id = br.project_id
       WHERE br.user_id = $1
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.map(toClient) });
  } catch (error) {
    logger.error('Build request list error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load your build requests' });
  }
};

/** GET /api/build-requests — admin: every request, newest first. */
const getAllRequests = async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const params = [];
    let where = '';
    if (statusFilter && BUILD_STATUSES.includes(statusFilter)) {
      params.push(statusFilter);
      where = 'WHERE br.status = $1';
    }
    const result = await db.query(
      `SELECT br.*, p.title AS project_title, p.thumbnail AS project_thumbnail,
              u.email AS user_email, u.name AS user_name
       FROM build_requests br
       JOIN projects p ON p.id = br.project_id
       JOIN users u ON u.id = br.user_id
       ${where}
       ORDER BY br.created_at DESC
       LIMIT 500`,
      params
    );
    return res.json({ success: true, data: result.map(toClient) });
  } catch (error) {
    logger.error('Build request admin list error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load build requests' });
  }
};

/** PATCH /api/build-requests/:id — admin: review / quote / status transitions. */
const updateRequest = async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid request id' });
    }

    const currentResult = await db.query('SELECT * FROM build_requests WHERE id = $1', [requestId]);
    if (currentResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }
    const current = currentResult[0];

    const updates = [];
    const params = [];
    const push = (column, value) => {
      params.push(value);
      updates.push(`${column} = $${params.length}`);
    };

    // --- Quote (rupees in, paise stored) ---
    if (req.body.quotedPriceRupees !== undefined && req.body.quotedPriceRupees !== null) {
      const quoted = rupeesToPaise(req.body.quotedPriceRupees);
      if (!Number.isFinite(quoted) || quoted < 100) {
        return res
          .status(400)
          .json({ success: false, message: 'Quoted price must be at least ₹1' });
      }
      push('quoted_price', quoted);
      push('advance_amount', computeAdvance(quoted));
    }

    if (req.body.expectedDelivery) {
      const delivery = new Date(req.body.expectedDelivery);
      if (Number.isNaN(delivery.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid delivery date' });
      }
      push('expected_delivery', req.body.expectedDelivery);
    }

    if (req.body.adminNotes !== undefined) {
      push('admin_notes', req.body.adminNotes ? String(req.body.adminNotes) : null);
    }

    if (req.body.message && String(req.body.message).trim()) {
      const entry = {
        from: 'admin',
        message: String(req.body.message).trim().slice(0, 2000),
        at: new Date().toISOString(),
      };
      params.push(JSON.stringify([entry]));
      updates.push(
        `clarification_thread = COALESCE(clarification_thread, '[]'::jsonb) || $${params.length}::jsonb`
      );
    }

    // --- Status transition ---
    if (req.body.status) {
      const next = String(req.body.status);
      if (!BUILD_STATUSES.includes(next)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      const allowed = ALLOWED_TRANSITIONS[current.status] || [];
      if (!allowed.includes(next)) {
        return res.status(400).json({
          success: false,
          message: `Cannot move from "${current.status}" to "${next}"`,
        });
      }
      if (next === 'quoted') {
        const effectiveQuote = updates.some((u) => u.startsWith('quoted_price'))
          ? true
          : current.quoted_price;
        if (!effectiveQuote) {
          return res.status(400).json({
            success: false,
            message: 'Set a quoted price before marking the request as quoted',
          });
        }
      }
      push('status', next);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    params.push(requestId);
    const result = await db.query(
      `UPDATE build_requests
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );

    logger.info('BUILD_REQUEST_UPDATED', {
      requestId,
      adminId: req.user.id,
      status: result[0].status,
    });

    return res.json({ success: true, data: toClient(result[0]) });
  } catch (error) {
    logger.error('Build request update error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to update build request' });
  }
};

/**
 * POST /api/build-requests/:id/pay-advance — create the Razorpay order for
 * the 40% advance. Reuses the SAME orders table as docs purchases; payment
 * verification then flows through the existing /api/payment/verify +
 * webhook pipeline (which matches razorpay_order_id and marks it paid).
 */
const payAdvance = async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid request id' });
    }

    const requestResult = await db.query(
      `SELECT br.*, p.title AS project_title
       FROM build_requests br JOIN projects p ON p.id = br.project_id
       WHERE br.id = $1`,
      [requestId]
    );
    if (requestResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }
    const buildRequest = requestResult[0];

    if (buildRequest.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This is not your build request' });
    }
    if (buildRequest.status !== 'quoted') {
      return res.status(400).json({
        success: false,
        message: 'The advance can be paid once your quote is ready',
      });
    }
    if (!buildRequest.advance_amount || buildRequest.advance_amount < 100) {
      return res.status(400).json({ success: false, message: 'Quote is not finalized yet' });
    }

    // Idempotency: reuse the open advance order if one exists.
    if (buildRequest.advance_order_id) {
      const existing = await db.query(
        `SELECT id, razorpay_order_id, amount, currency, status
         FROM orders WHERE id = $1`,
        [buildRequest.advance_order_id]
      );
      if (existing.length && existing[0].status === 'created') {
        const row = existing[0];
        return res.json({
          success: true,
          data: {
            orderId: row.razorpay_order_id,
            internalOrderId: row.id,
            amount: row.amount,
            currency: row.currency,
            keyId: isMockMode ? null : RAZORPAY_KEY_ID,
            isMockPayment: isMockMode,
            buildRequestId: requestId,
            description: `Build advance (40%) — ${buildRequest.project_title}`,
          },
        });
      }
      if (existing.length && existing[0].status === 'paid') {
        return res
          .status(400)
          .json({ success: false, message: 'The advance for this build is already paid' });
      }
    }

    let razorpayOrderId;
    let currency = 'INR';
    if (isMockMode) {
      razorpayOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    } else {
      const razorpayOrder = await razorpay.orders.create({
        amount: buildRequest.advance_amount,
        currency,
        receipt: `build_${requestId}_${Date.now()}`,
        notes: { type: 'build_advance', build_request_id: String(requestId) },
      });
      razorpayOrderId = razorpayOrder.id;
      currency = razorpayOrder.currency || currency;
    }

    const orderRow = await db.transaction(async (client) => {
      const header = await client.query(
        `INSERT INTO orders
          (user_id, project_id, razorpay_order_id, amount, original_amount,
           discount_amount, coupon_code, currency, status)
         VALUES ($1, $2, $3, $4, $5, 0, NULL, $6, 'created')
         RETURNING id`,
        [
          buildRequest.user_id,
          buildRequest.project_id,
          razorpayOrderId,
          buildRequest.advance_amount,
          buildRequest.advance_amount,
          currency,
        ]
      );
      const internalOrderId = header.rows[0].id;
      await client.query(
        `INSERT INTO order_items
          (order_id, project_id, quantity, unit_price, original_amount,
           discount_amount, final_amount)
         VALUES ($1, $2, 1, $3, $3, 0, $3)`,
        [internalOrderId, buildRequest.project_id, buildRequest.advance_amount]
      );
      await client.query(
        `UPDATE build_requests
         SET advance_order_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [internalOrderId, requestId]
      );
      return { id: internalOrderId };
    });

    logger.payment('BUILD_ADVANCE_ORDER_CREATED', razorpayOrderId, buildRequest.advance_amount, 'created');

    return res.json({
      success: true,
      data: {
        orderId: razorpayOrderId,
        internalOrderId: orderRow.id,
        amount: buildRequest.advance_amount,
        currency,
        keyId: isMockMode ? null : RAZORPAY_KEY_ID,
        isMockPayment: isMockMode,
        buildRequestId: requestId,
        description: `Build advance (40%) — ${buildRequest.project_title}`,
      },
    });
  } catch (error) {
    logger.error('Build advance order error', { error: error.message });
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Failed to create advance payment order',
    });
  }
};

/**
 * GET /api/build-requests/:id/payment-status — after checkout, poll until the
 * advance order flips to paid (webhook may land before/after /verify).
 */
const getPaymentStatus = async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const result = await db.query(
      `SELECT br.status, br.advance_order_id, o.status AS order_status
       FROM build_requests br
       LEFT JOIN orders o ON o.id = br.advance_order_id
       WHERE br.id = $1 AND br.user_id = $2`,
      [requestId, req.user.id]
    );
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }
    const row = result[0];
    return res.json({
      success: true,
      data: {
        requestStatus: row.status,
        paymentStatus: row.order_status || null,
        advancePaid: row.order_status === 'paid',
      },
    });
  } catch (error) {
    logger.error('Build payment status error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to check payment status' });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequest,
  payAdvance,
  getPaymentStatus,
  // exported for payment.controller post-payment hooks + tests
  _internals: { computeAdvance, BUILD_STATUSES },
};
