/**
 * Complete-build orders — order.inovitaz.in v2.
 *
 * Flow: pick project -> details + VIT-AP delivery -> pay 40% now
 *       -> 30% within 7 days -> build -> "ready" -> 30% on completion.
 *
 * Every installment pays through the SAME `orders` table + Razorpay
 * verify/webhook pipeline as regular purchases. The installment number is
 * stashed in the Razorpay order receipt (`co_<order>_<inst>_<ts>`) so the
 * post-payment hook can flip the right row.
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const isMockMode = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;

const razorpay =
  !isMockMode && RAZORPAY_KEY_ID
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

const BUILD_DAYS = 25;         // requirement: deadline = order date + 25 days
const SECOND_DUE_DAYS = 7;     // requirement: 30% due within 7 days
const SHARES = { 1: 0.4, 2: 0.3, 3: 0.3 };

const formatINR = (paise) =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format((paise || 0) / 100)}`;

const computeInstallments = (totalPaise, orderDate) => {
  const d1 = new Date(orderDate);
  const d2 = new Date(orderDate);
  d2.setDate(d2.getDate() + SECOND_DUE_DAYS);
  const d3 = new Date(orderDate);
  d3.setDate(d3.getDate() + BUILD_DAYS);

  const a1 = Math.round(totalPaise * SHARES[1]);
  const a2 = Math.round(totalPaise * SHARES[2]);
  const a3 = totalPaise - a1 - a2; // remainder absorbs rounding

  return [
    { installment_number: 1, label: 'Advance (40%) — starts your build', amount: a1, due_date: d1 },
    { installment_number: 2, label: 'Second (30%) — within 7 days', amount: a2, due_date: d2 },
    { installment_number: 3, label: 'Final (30%) — on completion', amount: a3, due_date: d3 },
  ];
};

const toClient = (row) => ({
  id: row.id,
  projectId: row.project_id,
  projectTitle: row.project_title || undefined,
  projectThumbnail: row.project_thumbnail || undefined,
  fullName: row.full_name,
  phone: row.phone,
  email: row.email,
  deliveryAddressId: row.delivery_address_id,
  deliveryLabel: row.delivery_label || undefined,
  deliveryRoom: row.delivery_room || undefined,
  totalAmount: row.total_amount,
  currency: row.currency,
  deadline: row.deadline,
  status: row.status,
  notes: row.notes || undefined,
  createdAt: row.created_at,
});

const installmentToClient = (row) => ({
  id: row.id,
  installmentNumber: row.installment_number,
  label: row.label,
  amount: row.amount,
  dueDate: row.due_date,
  status: row.status,
  paidAt: row.paid_at,
});

const remainingBalance = (installments) =>
  installments
    .filter((i) => i.status === 'due' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

/* ------------------------------------------------------------------ */
/* Public: delivery address list                                       */
/* ------------------------------------------------------------------ */
const getDeliveryAddresses = async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id, label, line1, line2, city, state, pincode, is_active FROM delivery_addresses ORDER BY sort_order, id'
    );
    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        label: r.label,
        line1: r.line1,
        line2: r.line2,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        isActive: r.is_active,
      })),
    });
  } catch (error) {
    logger.error('Delivery addresses error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load delivery addresses' });
  }
};

/* ------------------------------------------------------------------ */
/* Buyer: create the order (details + delivery, then pay installment 1) */
/* ------------------------------------------------------------------ */
const createOrder = async (req, res) => {
  try {
    const b = req.body || {};
    const projectId = Number(b.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'A valid project is required' });
    }

    for (const [field, value] of [
      ['fullName', b.fullName],
      ['phone', b.phone],
      ['email', b.email],
      ['deliveryAddressId', b.deliveryAddressId],
    ]) {
      if (!value || !String(value).trim()) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    const phone = String(b.phone).replace(/[\s-]/g, '');
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid phone number' });
    }
    const email = String(b.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }

    const projectResult = await db.query(
      'SELECT id, title, build_price FROM projects WHERE id = $1',
      [projectId]
    );
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const project = projectResult.rows[0];
    if (!project.build_price || project.build_price < 100) {
      return res.status(400).json({
        success: false,
        message: 'This project is not available for complete builds yet',
      });
    }

    const addressResult = await db.query(
      'SELECT id, is_active FROM delivery_addresses WHERE id = $1',
      [Number(b.deliveryAddressId)]
    );
    if (addressResult.rows.length === 0 || !addressResult.rows[0].is_active) {
      return res.status(400).json({
        success: false,
        message: 'Please select the VIT-AP University delivery address',
      });
    }

    const totalAmount = project.build_price;
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + BUILD_DAYS);
    const installments = computeInstallments(totalAmount, now);

    const created = await db.transaction(async (client) => {
      const orderRow = await client.query(
        `INSERT INTO complete_orders
          (user_id, project_id, full_name, phone, email,
           delivery_address_id, delivery_room, total_amount, deadline, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          req.user.id,
          projectId,
          String(b.fullName).trim(),
          phone,
          email,
          Number(b.deliveryAddressId),
          b.deliveryRoom ? String(b.deliveryRoom).trim() : null,
          totalAmount,
          deadline.toISOString().split('T')[0],
          b.notes ? String(b.notes).trim() : null,
        ]
      );
      const orderId = orderRow.rows[0].id;
      for (const inst of installments) {
        await client.query(
          `INSERT INTO order_installments (order_id, installment_number, label, amount, due_date)
           VALUES ($1,$2,$3,$4,$5)`,
          [orderId, inst.installment_number, inst.label, inst.amount, inst.due_date]
        );
      }
      return orderRow.rows[0];
    });

    logger.info('COMPLETE_ORDER_CREATED', {
      orderId: created.id,
      userId: req.user.id,
      projectId,
      totalAmount,
    });

    return res.status(201).json({
      success: true,
      data: {
        order: toClient({ ...created, project_title: project.title }),
        installments: installments.map((i) => ({
          installmentNumber: i.installment_number,
          label: i.label,
          amount: i.amount,
          dueDate: i.due_date,
          status: 'due',
        })),
      },
    });
  } catch (error) {
    logger.error('Complete order create error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to create your order' });
  }
};

/* ------------------------------------------------------------------ */
/* Buyer: my orders + installments                                     */
/* ------------------------------------------------------------------ */
const getMyOrders = async (req, res) => {
  try {
    const ordersResult = await db.query(
      `SELECT co.*, p.title AS project_title, p.thumbnail AS project_thumbnail,
              da.label AS delivery_label
       FROM complete_orders co
       JOIN projects p ON p.id = co.project_id
       JOIN delivery_addresses da ON da.id = co.delivery_address_id
       WHERE co.user_id = $1
       ORDER BY co.created_at DESC`,
      [req.user.id]
    );

    const orderIds = ordersResult.rows.map((o) => o.id);
    let installments = [];
    if (orderIds.length > 0) {
      const instResult = await db.query(
        `SELECT * FROM order_installments WHERE order_id = ANY($1::int[])
         ORDER BY order_id, installment_number`,
        [orderIds]
      );
      installments = instResult.rows;
    }

    const data = ordersResult.rows.map((order) => {
      const insts = installments
        .filter((i) => i.order_id === order.id)
        .map(installmentToClient);
      return {
        ...toClient(order),
        installments: insts,
        remainingBalance: remainingBalance(insts),
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Complete order list error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load your orders' });
  }
};

/* ------------------------------------------------------------------ */
/* Buyer: pay an installment (creates a Razorpay order on the shared   */
/* `orders` table; receipt encodes complete-order + installment).      */
/* ------------------------------------------------------------------ */
const payInstallment = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const installmentNumber = Number(req.body.installmentNumber);

    const orderResult = await db.query(
      `SELECT co.*, p.title AS project_title
       FROM complete_orders co JOIN projects p ON p.id = co.project_id
       WHERE co.id = $1`,
      [orderId]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderResult.rows[0];
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This is not your order' });
    }
    if (order.status === 'cancelled' || order.status === 'completed') {
      return res.status(400).json({ success: false, message: `This order is ${order.status}` });
    }

    const instResult = await db.query(
      `SELECT * FROM order_installments WHERE order_id = $1 AND installment_number = $2`,
      [orderId, installmentNumber]
    );
    if (instResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }
    const installment = instResult.rows[0];
    if (installment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This installment is already paid' });
    }

    // Sequential rule: installment N can't be paid before N-1 is paid.
    if (installmentNumber > 1) {
      const prev = await db.query(
        `SELECT status FROM order_installments WHERE order_id = $1 AND installment_number = $2`,
        [orderId, installmentNumber - 1]
      );
      if (prev.rows.length && prev.rows[0].status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: `Please pay installment ${installmentNumber - 1} first`,
        });
      }
    }

    // Installment 3 unlocks only when the build is ready.
    if (installmentNumber === 3 && order.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'The final payment unlocks when your build is marked ready',
      });
    }

    // Reuse an open Razorpay order if one exists.
    if (installment.razorpay_order_id) {
      const existing = await db.query(
        `SELECT id, razorpay_order_id, amount, currency, status FROM orders WHERE id = $1`,
        [installment.razorpay_order_id]
      );
      if (existing.rows.length && existing.rows[0].status === 'created') {
        const row = existing.rows[0];
        return res.json({
          success: true,
          data: {
            orderId: row.razorpay_order_id,
            internalOrderId: row.id,
            amount: row.amount,
            currency: row.currency,
            keyId: isMockMode ? null : RAZORPAY_KEY_ID,
            isMockPayment: isMockMode,
            description: `${installment.label} — ${order.project_title}`,
          },
        });
      }
    }

    let razorpayOrderId;
    let currency = 'INR';
    if (isMockMode) {
      razorpayOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    } else {
      const razorpayOrder = await razorpay.orders.create({
        amount: installment.amount,
        currency,
        receipt: `co_${orderId}_${installmentNumber}_${Date.now()}`,
        notes: {
          type: 'complete_order_installment',
          complete_order_id: String(orderId),
          installment: String(installmentNumber),
        },
      });
      razorpayOrderId = razorpayOrder.id;
      currency = razorpayOrder.currency || currency;
    }

    await db.transaction(async (client) => {
      const header = await client.query(
        `INSERT INTO orders
          (user_id, project_id, razorpay_order_id, amount, original_amount,
           discount_amount, coupon_code, currency, status)
         VALUES ($1,$2,$3,$4,$5,0,NULL,$6,'created')
         RETURNING id`,
        [order.user_id, order.project_id, razorpayOrderId, installment.amount, installment.amount, currency]
      );
      await client.query(
        `INSERT INTO order_items
          (order_id, project_id, quantity, unit_price, original_amount, discount_amount, final_amount)
         VALUES ($1,$2,1,$3,$3,0,$3)`,
        [header.rows[0].id, order.project_id, installment.amount]
      );
      await client.query(
        `UPDATE order_installments SET razorpay_order_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [header.rows[0].id, installment.id]
      );
    });

    logger.payment('COMPLETE_INSTALLMENT_ORDER_CREATED', razorpayOrderId, installment.amount, 'created');

    return res.json({
      success: true,
      data: {
        orderId: razorpayOrderId,
        amount: installment.amount,
        currency,
        keyId: isMockMode ? null : RAZORPAY_KEY_ID,
        isMockPayment: isMockMode,
        description: `${installment.label} — ${order.project_title}`,
      },
    });
  } catch (error) {
    logger.error('Pay installment error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to start installment payment' });
  }
};

/* ------------------------------------------------------------------ */
/* Admin: list + update                                                */
/* ------------------------------------------------------------------ */
const getAllOrders = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT co.*, p.title AS project_title, u.email AS user_email,
              da.label AS delivery_label
       FROM complete_orders co
       JOIN projects p ON p.id = co.project_id
       JOIN users u ON u.id = co.user_id
       JOIN delivery_addresses da ON da.id = co.delivery_address_id
       ORDER BY co.created_at DESC
       LIMIT 500`
    );
    const orderIds = result.rows.map((o) => o.id);
    let installments = [];
    if (orderIds.length > 0) {
      const inst = await db.query(
        `SELECT * FROM order_installments WHERE order_id = ANY($1::int[]) ORDER BY order_id, installment_number`,
        [orderIds]
      );
      installments = inst.rows;
    }
    const data = result.rows.map((order) => {
      const insts = installments.filter((i) => i.order_id === order.id).map(installmentToClient);
      return {
        ...toClient(order),
        userEmail: order.user_email,
        installments: insts,
        paidAmount: insts.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
        remainingBalance: remainingBalance(insts),
      };
    });
    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Admin complete orders error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
};

const updateOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const allowed = ['active', 'paused', 'ready', 'completed', 'cancelled'];
    const updates = [];
    const params = [];

    if (req.body.status) {
      if (!allowed.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      params.push(req.body.status);
      updates.push(`status = $${params.length}`);
    }
    if (req.body.adminNotes !== undefined) {
      params.push(req.body.adminNotes ? String(req.body.adminNotes) : null);
      updates.push(`admin_notes = $${params.length}`);
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    params.push(orderId);
    const result = await db.query(
      `UPDATE complete_orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, data: toClient(result.rows[0]) });
  } catch (error) {
    logger.error('Update complete order error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to update order' });
  }
};

/* ------------------------------------------------------------------ */
/* Confirmation email (fires after installment 1 is paid)              */
/* ------------------------------------------------------------------ */
const sendOrderConfirmation = async (orderId) => {
  try {
    const result = await db.query(
      `SELECT co.*, p.title AS project_title, da.label AS delivery_label, da.line1 AS delivery_line1,
              da.city AS delivery_city, da.state AS delivery_state, da.pincode AS delivery_pincode
       FROM complete_orders co
       JOIN projects p ON p.id = co.project_id
       JOIN delivery_addresses da ON da.id = co.delivery_address_id
       WHERE co.id = $1`,
      [orderId]
    );
    if (result.rows.length === 0) return;
    const order = result.rows[0];

    const instResult = await db.query(
      `SELECT * FROM order_installments WHERE order_id = $1 ORDER BY installment_number`,
      [orderId]
    );
    const rows = instResult.rows
      .map(
        (i) => `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${i.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatINR(i.amount)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${new Date(i.due_date).toLocaleDateString('en-IN')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${i.status === 'paid' ? '✅ Paid' : 'Due'}</td>
        </tr>`
      )
      .join('');

    await sendEmail({
      to: order.email,
      subject: `Order confirmed — ${order.project_title} (Build #${order.id})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
          <h2 style="color:#2563eb;">Your build is confirmed 🎉</h2>
          <p>Hi ${order.full_name},</p>
          <p>We've received your order and your first payment. Our workbench starts on it today.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
            <tr><td style="padding:6px 0;color:#6b7280;">Project</td><td style="padding:6px 0;font-weight:600;">${order.project_title}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Total</td><td style="padding:6px 0;font-weight:600;">${formatINR(order.total_amount)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Delivery</td><td style="padding:6px 0;">${order.delivery_label}${order.delivery_room ? `, ${order.delivery_room}` : ''}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Deadline</td><td style="padding:6px 0;font-weight:600;">${new Date(order.deadline).toLocaleDateString('en-IN')} (25 days)</td></tr>
          </table>
          <h3 style="margin:20px 0 8px;">Payment schedule</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;">
            <tr style="background:#f9fafb;">
              <th style="padding:8px 12px;text-align:left;">Installment</th>
              <th style="padding:8px 12px;text-align:right;">Amount</th>
              <th style="padding:8px 12px;text-align:left;">Due</th>
              <th style="padding:8px 12px;text-align:left;">Status</th>
            </tr>
            ${rows}
          </table>
          <p style="margin-top:20px;">Track everything on your
            <a href="https://order.inovitaz.in/track" style="color:#2563eb;">order page</a>.
            Questions? Just reply to this email.</p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px;">— Team InovitaZ</p>
        </div>`,
      replyTo: 'support@inovitaz.in',
      devLogLabel: 'complete-order-confirmation',
    });
  } catch (error) {
    // Email must never break the payment flow.
    logger.error('Order confirmation email failed', { orderId, error: error.message });
  }
};

/* ------------------------------------------------------------------ */
/* Post-payment hook — called from payment.controller after verify/    */
/* webhook marks an `orders` row paid. Matches the receipt pattern.    */
/* ------------------------------------------------------------------ */
const handleInstallmentPaid = async (internalOrderId, razorpayOrderId) => {
  try {
    // Find the installment linked to this payment.
    const instResult = await db.query(
      `SELECT * FROM order_installments WHERE razorpay_order_id = $1`,
      [internalOrderId]
    );
    if (instResult.rows.length === 0) return; // not a complete-order installment
    const installment = instResult.rows[0];

    await db.query(
      `UPDATE order_installments
       SET status = 'paid', paid_at = NOW(), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [installment.id]
    );

    // If installment 1 -> send confirmation email. If all paid -> completed.
    const all = await db.query(
      `SELECT status FROM order_installments WHERE order_id = $1 ORDER BY installment_number`,
      [installment.order_id]
    );
    if (installment.installment_number === 1) {
      await sendOrderConfirmation(installment.order_id);
    }
    if (all.rows.every((r) => r.status === 'paid')) {
      await db.query(
        `UPDATE complete_orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [installment.order_id]
      );
    } else {
      // A paid installment un-pauses the build if it was paused for overdue.
      await db.query(
        `UPDATE complete_orders SET status = 'active', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'paused'`,
        [installment.order_id]
      );
    }
  } catch (error) {
    logger.error('Installment paid hook failed', { error: error.message, internalOrderId });
  }
};

/* ------------------------------------------------------------------ */
/* Overdue sweep — call daily (cron / scheduled job / manual).         */
/* ------------------------------------------------------------------ */
const markOverdue = async () => {
  const result = await db.query(
    `UPDATE order_installments
     SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'due' AND due_date < CURRENT_DATE
     RETURNING order_id`
  );
  const orderIds = [...new Set(result.rows.map((r) => r.order_id))];
  for (const oid of orderIds) {
    await db.query(
      `UPDATE complete_orders SET status = 'paused', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'active'`,
      [oid]
    );
  }
  return orderIds.length;
};

module.exports = {
  getDeliveryAddresses,
  createOrder,
  getMyOrders,
  payInstallment,
  getAllOrders,
  updateOrder,
  handleInstallmentPaid,
  sendOrderConfirmation,
  markOverdue,
  _internals: { computeInstallments, BUILD_DAYS, SECOND_DUE_DAYS },
};
