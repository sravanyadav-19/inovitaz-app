/* payment.model.js - simple wrapper */
const pool = require("../config/db");

module.exports = {
  create: async ({ user_id, order_id, payment_id, signature, status }) => {
    const [result] = await pool.query("INSERT INTO payments (user_id, order_id, payment_id, signature, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())", [user_id, order_id, payment_id, signature, status]);
    return result.insertId;
  }
};
