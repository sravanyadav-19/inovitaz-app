// src/routes/coupon.routes.js
const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authRequired, adminOnly } = require('../middlewares/auth.middleware');

// User routes
router.post('/validate', authRequired, couponController.validateCoupon);

// Admin routes
router.get('/', adminOnly, couponController.getAllCoupons);
router.post('/', adminOnly, couponController.createCoupon);

module.exports = router;