const request = require('supertest');
const app = require('../server');
const db = require('../src/config/db');

describe('Phase 2 order read API', () => {
  let authToken = '';
  let adminUserId;
  let orderId;
  let projectOneId;
  let projectTwoId;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@inovitaz.com', password: 'admin123' });
    authToken = loginRes.body.data.token;

    const adminRows = await db.query('SELECT id FROM users WHERE email = $1', ['admin@inovitaz.com']);
    adminUserId = adminRows[0].id;

    const projects = await db.query(
      `INSERT INTO projects (title, price, category, difficulty)
       VALUES
        ($1, 29900, 'IoT', 'Beginner'),
        ($2, 39900, 'Robotics', 'Intermediate')
       RETURNING id`,
      [`Order API One ${Date.now()}`, `Order API Two ${Date.now()}`]
    );
    projectOneId = projects[0].id;
    projectTwoId = projects[1].id;

    const orders = await db.query(
      `INSERT INTO orders
        (user_id, project_id, razorpay_order_id, amount, original_amount, status, paid_at)
       VALUES ($1, NULL, $2, 69800, 69800, 'paid', NOW())
       RETURNING id`,
      [adminUserId, `order_read_${Date.now()}`]
    );
    orderId = orders[0].id;

    await db.query(
      `INSERT INTO order_items
        (order_id, project_id, unit_price, original_amount, discount_amount, final_amount)
       VALUES
        ($1, $2, 29900, 29900, 0, 29900),
        ($1, $3, 39900, 39900, 0, 39900)`,
      [orderId, projectOneId, projectTwoId]
    );
  });

  afterAll(async () => {
    await db.query('DELETE FROM orders WHERE id = $1', [orderId]);
    await db.query('DELETE FROM projects WHERE id = ANY($1::int[])', [[projectOneId, projectTwoId]]);
  });

  it('lists one order header with all of its item rows', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    const order = res.body.data.orders.find((item) => item.id === orderId);
    expect(order).toBeDefined();
    expect(order.item_count).toBe(2);
    expect(order.items).toHaveLength(2);
    expect(order.items.map((item) => item.project_id)).toEqual([projectOneId, projectTwoId]);
  });

  it('returns one owner-safe order detail with its items', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.order.id).toBe(orderId);
    expect(res.body.data.order.items).toHaveLength(2);
  });

  it('lists each paid order item in My Downloads', async () => {
    const res = await request(app)
      .get('/api/orders/purchased')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    const orderDownloads = res.body.data.downloads.filter((item) => item.order_id === orderId);
    expect(orderDownloads).toHaveLength(2);
    expect(orderDownloads.map((item) => item.id)).toEqual([projectOneId, projectTwoId]);
  });

  it('requires authentication for order reads', async () => {
    const res = await request(app).get(`/api/orders/${orderId}`);
    expect(res.statusCode).toBe(401);
  });
});
