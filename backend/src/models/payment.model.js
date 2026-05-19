/* payment.model.js - PostgreSQL wrapper using orders table */

const db = require("../config/db");

module.exports = {
  createOrderRecord: async ({
    user_id,
    project_id,
    razorpay_order_id,
    amount,
    original_amount = null,
    discount_amount = 0,
    coupon_code = null,
    currency = "INR",
    status = "created",
  }) => {
    const rows = await db.query(
      `INSERT INTO orders
        (
          user_id,
          project_id,
          razorpay_order_id,
          amount,
          original_amount,
          discount_amount,
          coupon_code,
          currency,
          status
        )
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        user_id,
        project_id,
        razorpay_order_id,
        amount,
        original_amount,
        discount_amount,
        coupon_code,
        currency,
        status,
      ]
    );

    return rows[0];
  },

  findByRazorpayOrderId: async (razorpay_order_id) => {
    const rows = await db.query(
      `SELECT *
       FROM orders
       WHERE razorpay_order_id = $1`,
      [razorpay_order_id]
    );

    return rows[0] || null;
  },

  markOrderPaid: async ({ razorpay_order_id, razorpay_payment_id }) => {
    const rows = await db.query(
      `UPDATE orders
       SET status = 'paid',
           razorpay_payment_id = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE razorpay_order_id = $2
       RETURNING *`,
      [razorpay_payment_id, razorpay_order_id]
    );

    return rows[0] || null;
  },

  markOrderFailed: async ({ razorpay_order_id }) => {
    const rows = await db.query(
      `UPDATE orders
       SET status = 'failed',
           updated_at = CURRENT_TIMESTAMP
       WHERE razorpay_order_id = $1
       RETURNING *`,
      [razorpay_order_id]
    );

    return rows[0] || null;
  },
};