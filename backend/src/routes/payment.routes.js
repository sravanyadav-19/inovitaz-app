const express = require("express");
const router = express.Router();
const { authRequired } = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

// All payment routes require authentication
router.use(authRequired);

// Create order
router.post("/create-order", paymentController.createOrder);

// Verify payment
router.post("/verify", paymentController.verifyPayment);

module.exports = router;
