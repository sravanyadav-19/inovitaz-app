const request = require('supertest');
const app = require('../server');

describe('Auth API', () => {
  let authToken = '';

  it('should register a new user', async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: uniqueEmail,
        password: 'Test@1234'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should login with valid admin credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@inovitaz.com',
        password: 'admin123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    authToken = res.body.data.token;
  });

  it('should return user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('email');
  });

  it('should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@inovitaz.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});