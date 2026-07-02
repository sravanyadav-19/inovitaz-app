const request = require('supertest');
const app = require('../server');
const db = require('../src/config/db');
const crypto = require('crypto');

describe('Payment Webhook - Integration', () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';
  let testUserId;
  let testProjectId;
  let testOrderId = 'order_123';
  
  const generateSignature = (payload) => {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  };

  const validPayload = (projectId) => ({
    event: 'payment.captured',
    payload: {
      payment: { entity: { id: 'pay_123', order_id: 'order_123' } },
      order: { entity: { id: 'order_123' } },
    },
  });

  beforeAll(async () => {
    // 1. Create a unique test project to avoid FK constraints
    const projectResult = await db.query(
      `INSERT INTO projects (title, price, category, difficulty) 
       VALUES ('Webhook Test Project', 49900, 'IoT', 'Beginner') 
       RETURNING id`
    );
    testProjectId = projectResult[0].id;

    // 2. Create a test user
    const userResult = await db.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ('test_webhook@example.com', 'hashed_pw', 'Webhook Test', 'user') 
       RETURNING id`
    );
    testUserId = userResult[0].id;

    // 3. Create the test order linked to the new project
    await db.query(
      `INSERT INTO orders (user_id, project_id, razorpay_order_id, amount, status) 
       VALUES ($1, $2, $3, 49900, 'created')`,
      [testUserId, testProjectId, testOrderId]
    );
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    await db.query('DELETE FROM orders WHERE razorpay_order_id = $1', [testOrderId]);
    await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await db.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
  });

  it('should return 400 when signature is missing', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .send(validPayload(testProjectId));
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Missing signature or raw body');
  });

  it('should return 400 when signature is invalid', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .set('x-razorpay-signature', 'invalid_sig')
      .send(validPayload(testProjectId));
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid signature');
  });

  it('should return 404 when order does not exist', async () => {
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: { entity: { id: 'pay_999', order_id: 'order_999' } },
        order: { entity: { id: 'order_999' } },
      },
    };
    const res = await request(app)
      .post('/api/payment/webhook')
      .set('x-razorpay-signature', generateSignature(payload))
      .send(payload);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('should return 200 and mark order as paid for valid webhook', async () => {
    const payload = validPayload(testProjectId);
    const res = await request(app)
      .post('/api/payment/webhook')
      .set('x-razorpay-signature', generateSignature(payload))
      .send(payload);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Payment captured successfully');

    // Verify database update
    const order = await db.query('SELECT status FROM orders WHERE razorpay_order_id = $1', [testOrderId]);
    expect(order[0].status).toBe('paid');
  });

  it('should be idempotent when receiving duplicate successful webhooks', async () => {
    const payload = validPayload(testProjectId);
    const res = await request(app)
      .post('/api/payment/webhook')
      .set('x-razorpay-signature', generateSignature(payload))
      .send(payload);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Order already processed');
  });
});