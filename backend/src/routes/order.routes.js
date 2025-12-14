const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authRequired } = require("../middlewares/auth.middleware");

// ---------------------------
// GET USER ORDERS (Orders Tab)
// ---------------------------
router.get("/", authRequired, async (req, res) => {
  try {
    const orders = await db.query(
      `SELECT o.id, o.project_id, o.amount, o.status, o.created_at,
              p.title AS project_title, p.thumbnail AS project_thumbnail,
              p.category AS project_category
       FROM orders o
       JOIN projects p ON o.project_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    return res.json({ success: true, data: { orders } });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.json({ success: false, message: "Failed to load orders" });
  }
});

// ---------------------------
// GET USER DOWNLOADABLE PROJECTS (Downloads Tab)
// ---------------------------
// ---------------------------
// GET USER DOWNLOADABLE PROJECTS (Downloads Tab)
// ---------------------------
// 👇 CHANGED FROM "/downloads" TO "/purchased"
router.get("/purchased", authRequired, async (req, res) => {
  try {
    const downloads = await db.query(
      `SELECT p.id, p.title, p.thumbnail, p.content_url, o.created_at AS purchased_at
       FROM orders o
       JOIN projects p ON o.project_id = p.id
       WHERE o.user_id = ? AND o.status = 'paid'
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    return res.json({ success: true, data: { downloads } });
  } catch (error) {
    console.error("Get downloads error:", error);
    return res.json({ success: false, message: "Failed to load downloads" });
  }
});

module.exports = router;
