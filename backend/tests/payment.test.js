const request = require('supertest');
const app = require('../server');

describe('Payment API', () => {
  let authToken = '';

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@inovitaz.com',
        password: 'admin123'
      });
    authToken = loginRes.body.data.token;
  });

  it('should return 501 for create-order (not implemented)', async () => {
    const res = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        project_id: 1,
        amount: 29900
      });

    expect(res.statusCode).toBe(501);
  });

  it('should return 501 for payment verification (not implemented)', async () => {
    const res = await request(app)
      .post('/api/payment/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123'
      });

    expect(res.statusCode).toBe(501);
  });
});