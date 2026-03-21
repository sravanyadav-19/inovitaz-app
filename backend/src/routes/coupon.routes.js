/**
 * Coupon Routes
 * Handles coupon validation and admin management
 */

const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authRequired, adminOnly } = require('../middlewares/auth.middleware');
const { couponValidation } = require('../middlewares/validate.middleware');

// User routes
router.post('/validate', authRequired, couponValidation.validate, couponController.validateCoupon);

// Admin routes
router.get('/', adminOnly, couponController.getAllCoupons);
router.post('/', adminOnly, couponValidation.create, couponController.createCoupon);
router.patch('/:id/toggle', adminOnly, couponController.toggleCoupon);
router.delete('/:id', adminOnly, couponController.deleteCoupon);

module.exports = router;