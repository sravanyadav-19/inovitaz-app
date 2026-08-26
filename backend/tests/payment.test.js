const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../server');
const db = require('../src/config/db');

describe('Phase 2 multi-item payment API', () => {
  let adminToken = '';
  let adminUserId;
  let projectOneId;
  let projectTwoId;
  let statusOrderId;
  let otherToken = '';
  const couponCode = `SAVE10_${Date.now()}`;
  const otherEmail = `phase2_other_${Date.now()}@example.com`;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@inovitaz.com', password: 'admin123' });
    adminToken = loginRes.body.data.token;

    const adminRows = await db.query('SELECT id FROM users WHERE email = $1', ['admin@inovitaz.com']);
    adminUserId = adminRows[0].id;

    const createdProjects = await db.query(
      `INSERT INTO projects (title, price, category, difficulty)
       VALUES
         ($1, $2, 'IoT', 'Beginner'),
         ($3, $4, 'Robotics', 'Intermediate')
       RETURNING id, price`,
      [
        `Phase 2 ESP32 ${Date.now()}`,
        49900,
        `Phase 2 Robot ${Date.now()}`,
        69900,
      ]
    );
    projectOneId = createdProjects[0].id;
    projectTwoId = createdProjects[1].id;

    await db.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, is_active)
       VALUES ($1, 'Test 10% off', 'percentage', 10, TRUE)`,
      [couponCode]
    );

    // Insert a verified test user directly so this suite never sends SMTP email.
    const otherPassword = await bcrypt.hash('Other@1234', 10);
    await db.query(
      `INSERT INTO users (email, password, name, role, is_verified)
       VALUES ($1, $2, $3, 'user', TRUE)`,
      [otherEmail, otherPassword, 'Phase Two Other User']
    );
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: otherEmail, password: 'Other@1234' });
    otherToken = otherLogin.body.data.token;
  });

  afterAll(async () => {
    await db.query(
      `DELETE FROM orders
       WHERE id IN (
         SELECT order_id FROM order_items WHERE project_id = ANY($1::int[])
       )`,
      [[projectOneId, projectTwoId]]
    );
    await db.query('DELETE FROM coupons WHERE code = $1', [couponCode]);
    await db.query('DELETE FROM projects WHERE id = ANY($1::int[])', [[projectOneId, projectTwoId]]);
    await db.query('DELETE FROM users WHERE email = $1', [otherEmail]);
  });

  it('creates one order header with two order items and verifies it in mock mode', async () => {
    const orderRes = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectIds: [projectOneId, projectTwoId] });

    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.itemCount).toBe(2);
    expect(orderRes.body.data.originalAmount).toBe(119800);
    expect(orderRes.body.data.discountAmount).toBe(0);
    expect(orderRes.body.data.amount).toBe(119800);
    expect(orderRes.body.data.items.map((item) => item.projectId)).toEqual([projectOneId, projectTwoId]);

    const persistedItems = await db.query(
      `SELECT project_id, original_amount, final_amount
       FROM order_items
       WHERE order_id = $1
       ORDER BY id`,
      [orderRes.body.data.internalOrderId]
    );
    expect(persistedItems).toHaveLength(2);
    expect(persistedItems.map((item) => item.project_id)).toEqual([projectOneId, projectTwoId]);

    const verifyRes = await request(app)
      .post('/api/payment/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        razorpay_order_id: orderRes.body.data.orderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature',
      });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.success).toBe(true);
  });

  it('preserves single-project coupon behavior until eligible-item coupons are added', async () => {
    const res = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectId: projectOneId, couponCode });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.itemCount).toBe(1);
    expect(res.body.data.originalAmount).toBe(49900);
    expect(res.body.data.discountAmount).toBe(4990);
    expect(res.body.data.amount).toBe(44910);
  });

  it('rejects a coupon on a multi-project order until Phase 3 eligibility exists', async () => {
    const res = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectIds: [projectOneId, projectTwoId], couponCode: 'ANYCODE' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/multi-project checkout/i);
  });

  it('rejects duplicate project IDs instead of creating duplicate line items', async () => {
    const res = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectIds: [projectOneId, projectOneId] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/only once/i);
  });

  it('returns multi-item payment status only to an owner or admin', async () => {
    const insertedOrder = await db.query(
      `INSERT INTO orders
        (user_id, project_id, razorpay_order_id, amount, original_amount, status)
       VALUES ($1, NULL, $2, 119800, 119800, 'created')
       RETURNING id`,
      [adminUserId, `order_status_${Date.now()}`]
    );
    statusOrderId = insertedOrder[0].id;

    await db.query(
      `INSERT INTO order_items
        (order_id, project_id, unit_price, original_amount, discount_amount, final_amount)
       VALUES
        ($1, $2, 49900, 49900, 0, 49900),
        ($1, $3, 69900, 69900, 0, 69900)`,
      [statusOrderId, projectOneId, projectTwoId]
    );

    const ownerRes = await request(app)
      .get(`/api/payment/status/${statusOrderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ownerRes.statusCode).toBe(200);
    expect(ownerRes.body.data.order.items).toHaveLength(2);

    const otherRes = await request(app)
      .get(`/api/payment/status/${statusOrderId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(otherRes.statusCode).toBe(403);
  });
});
