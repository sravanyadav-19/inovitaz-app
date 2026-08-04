const request = require('supertest');
const app = require('../server');
const db = require('../src/config/db');
const crypto = require('crypto');

describe('Auth API', () => {
  let authToken = '';

  it('should register a new user (verification required — no token returned)', async () => {
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
    expect(res.body.data.user).toHaveProperty('email', uniqueEmail);
    // Email verification is required before login, so no token is issued at registration.
    expect(res.body.data).not.toHaveProperty('token');
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

/**
 * Password reset flow (Fix 6).
 */
describe('Password reset flow', () => {
  it('forgot-password responds generically for an unknown email (anti-enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: `nope_${Date.now()}@example.com` });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('resets password with a valid token and rejects token reuse', async () => {
    const email = `reset_${Date.now()}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Reset', email, password: 'Old@1234' });

    const u = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [token, new Date(Date.now() + 60 * 60 * 1000), u[0].id]
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'New@1234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Reusing the same token must be rejected.
    const res2 = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'Another@1234' });
    expect(res2.statusCode).toBe(400);

    await db.query('DELETE FROM users WHERE id = $1', [u[0].id]);
  });

  it('rejects an expired reset token', async () => {
    const email = `exp_${Date.now()}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Expired', email, password: 'Old@1234' });

    const u = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [token, new Date(Date.now() - 60 * 60 * 1000), u[0].id]
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'New@1234' });
    expect(res.statusCode).toBe(400);

    await db.query('DELETE FROM users WHERE id = $1', [u[0].id]);
  });

  it('invalidates existing sessions after a password reset', async () => {
    const email = `sess_${Date.now()}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Session', email, password: 'Old@1234' });

    const u = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    // Verify the user so they can log in.
    await db.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
      [u[0].id]
    );

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'Old@1234' });
    expect(loginRes.statusCode).toBe(200);
    const oldToken = loginRes.body.data.token;

    // Token works before reset.
    const me1 = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(me1.statusCode).toBe(200);

    // Perform a password reset.
    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [token, new Date(Date.now() + 60 * 60 * 1000), u[0].id]
    );
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'New@1234' });
    expect(resetRes.statusCode).toBe(200);

    // The pre-reset token is now rejected (token_version bumped).
    const me2 = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(me2.statusCode).toBe(401);

    await db.query('DELETE FROM users WHERE id = $1', [u[0].id]);
  });
});
