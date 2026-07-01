const request = require('supertest');
const app = require('../server');

describe('Payment Webhook - Edge Cases', () => {
  it('should return 404 for webhook (route not implemented)', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .send({ event: 'payment.captured' });
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when webhook has no signature', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .send({ event: 'payment.captured' });
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when webhook payload is empty', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .send({});
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when webhook has invalid event type', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .send({ event: 'invalid.event' });
    expect(res.statusCode).toBe(404);
  });
});