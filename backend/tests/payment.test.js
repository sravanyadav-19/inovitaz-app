const request = require('supertest');
const app = require('../server');
const db = require('../src/config/db');

/**
 * Payment API
 *
 * Covers Fix 3 (server-side coupon recompute, mock-payment mode) and
 * Fix 7 (GET /payment/status/:id).
 */
describe('Payment API', () => {
  let authToken = '';
  const couponCode = `SAVE10_${Date.now()}`;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@inovitaz.com', password: 'admin123' });
    authToken = loginRes.body.data.token;

    // Seed an active 10% coupon for the coupon tests.
    await db.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, is_active)
       VALUES ($1, 'Test 10% off', 'percentage', 10, TRUE)`,
      [couponCode]
    );
  });

  afterAll(async () => {
    await db.query(
      'DELETE FROM coupon_usage WHERE coupon_id IN (SELECT id FROM coupons WHERE code = $1)',
      [couponCode]
    );
    await db.query("DELETE FROM orders WHERE razorpay_order_id LIKE 'order_mock_%'");
    await db.query('DELETE FROM coupons WHERE code = $1', [couponCode]);
  });

  it('creates an order in mock mode and verifies the payment (full price)', async () => {
    const orderRes = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ projectId: 1 });

    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.amount).toBe(49900); // project price (paise)
    expect(orderRes.body.data.originalAmount).toBe(49900);
    expect(orderRes.body.data.isMockPayment).toBe(true);

    const res = await request(app)
      .post('/api/payment/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        razorpay_order_id: orderRes.body.data.orderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('applies a coupon and charges the server-recomputed discounted amount', async () => {
    const res = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ projectId: 1, couponCode });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.originalAmount).toBe(49900);
    expect(res.body.data.discountAmount).toBe(4990); // 10%
    expect(res.body.data.amount).toBe(44910); // 49900 - 4990
  });

  it('rejects reusing the same coupon for the same user', async () => {
    const res = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ projectId: 1, couponCode });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid coupon instead of silently falling back to full price', async () => {
    const res = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ projectId: 1, couponCode: 'DOES_NOT_EXIST' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Payment status API (Fix 7)', () => {
  let adminToken = '';
  let otherToken = '';
  let adminOwnedOrderId;
  const otherEmail = `other_${Date.now()}@example.com`;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@inovitaz.com', password: 'admin123' });
    adminToken = adminLogin.body.data.token;

    // Create + verify a second (non-admin) user.
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: otherEmail, password: 'Other@1234' });
    const u = await db.query('SELECT id FROM users WHERE email = $1', [otherEmail]);
    await db.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1', [u[0].id]);
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: otherEmail, password: 'Other@1234' });
    otherToken = otherLogin.body.data.token;

    // Insert an order owned by admin directly (avoids the payment rate limiter).
    const ins = await db.query(
      `INSERT INTO orders (user_id, project_id, razorpay_order_id, amount, status)
       VALUES (1, 1, $1, 49900, 'created') RETURNING id`,
      [`order_status_${Date.now()}`]
    );
    adminOwnedOrderId = ins[0].id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM orders WHERE id = $1', [adminOwnedOrderId]);
    await db.query('DELETE FROM users WHERE email = $1', [otherEmail]);
  });

  it('returns order status for the owning admin', async () => {
    const res = await request(app)
      .get(`/api/payment/status/${adminOwnedOrderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.id).toBe(adminOwnedOrderId);
    expect(res.body.data.order.status).toBe('created');
  });

  it('returns 403 when another user queries the order', async () => {
    const res = await request(app)
      .get(`/api/payment/status/${adminOwnedOrderId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for a nonexistent order', async () => {
    const res = await request(app)
      .get('/api/payment/status/9999999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});
