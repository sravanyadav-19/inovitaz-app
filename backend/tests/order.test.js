const request = require('supertest');
const app = require('../server');

describe('Order API - Edge Cases', () => {
  let authToken = '';

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@inovitaz.com', password: 'admin123' });
    authToken = loginRes.body.data.token;
  });

  it('should return 404 when creating order (route not implemented)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ project_id: 1, amount: 29900 });
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when creating order without token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ project_id: 1, amount: 29900 });
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when applying coupon (route not implemented)', async () => {
    const res = await request(app)
      .post('/api/orders/apply-coupon')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ order_id: 1, coupon_code: 'TEST10' });
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when applying coupon without token', async () => {
    const res = await request(app)
      .post('/api/orders/apply-coupon')
      .send({ order_id: 1, coupon_code: 'TEST10' });
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when sending invalid coupon data', async () => {
    const res = await request(app)
      .post('/api/orders/apply-coupon')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ order_id: 'abc', coupon_code: '' });
    expect(res.statusCode).toBe(404);
  });
});