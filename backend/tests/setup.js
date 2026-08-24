/*
 * Shared Jest test environment.
 *
 * It runs before every test file imports the Express app, forcing deterministic
 * mock payment/email behavior while keeping DB credentials supplied by the
 * local shell or CI environment.
 */

process.env.NODE_ENV = 'test';
process.env.RAZORPAY_KEY_ID = '';
process.env.RAZORPAY_KEY_SECRET = '';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.BREVO_API_KEY = '';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

const { pool } = require('../src/config/db');

afterAll(async () => {
  await pool.end();
});
