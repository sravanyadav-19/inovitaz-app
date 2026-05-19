const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authRequired } = require("../middlewares/auth.middleware");

// ---------------------------
// GET USER ORDERS
// ---------------------------
router.get("/", authRequired, async (req, res) => {
  try {
    const orders = await db.query(
      `SELECT
          o.id,
          o.project_id,
          o.razorpay_order_id,
          o.razorpay_payment_id,
          o.amount,
          o.original_amount,
          o.discount_amount,
          o.coupon_code,
          o.currency,
          o.status,
          o.created_at,
          p.title AS project_title,
          p.thumbnail AS project_thumbnail,
          p.category AS project_category
       FROM orders o
       JOIN projects p ON o.project_id = p.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: { orders },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load orders",
    });
  }
});

// ---------------------------
// GET USER DOWNLOADABLE PROJECTS
// ---------------------------
router.get("/purchased", authRequired, async (req, res) => {
  try {
    const downloads = await db.query(
      `SELECT
          o.id AS order_id,
          p.id,
          p.title,
          p.thumbnail,
          p.content_url,
          p.category,
          o.amount,
          o.created_at AS purchased_at,
          COALESCE(dl.download_count, 0) AS download_count,
          COALESCE(dl.max_downloads, 5) AS max_downloads,
          GREATEST(COALESCE(dl.max_downloads, 5) - COALESCE(dl.download_count, 0), 0) AS downloads_remaining,
          COALESCE(dl.expiry_date, o.created_at + INTERVAL '180 days') AS expiry_date,
          dl.last_downloaded_at
       FROM orders o
       JOIN projects p ON o.project_id = p.id
       LEFT JOIN download_logs dl ON dl.order_id = o.id
       WHERE o.user_id = $1
         AND o.status = 'paid'
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: { downloads },
    });
  } catch (error) {
    console.error("Get purchased downloads error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load downloads",
    });
  }
});

module.exports = router;