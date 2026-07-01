const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authRequired, adminOnly } = require('../middlewares/auth.middleware');
const { couponValidation } = require('../utils/validationSchemas');
const { validate } = require('../middlewares/validate.middleware');

// Admin only
router.post('/', authRequired, adminOnly, couponValidation, validate, couponController.createCoupon);
router.get('/', authRequired, adminOnly, couponController.getAllCoupons);
router.delete('/:id', authRequired, adminOnly, couponController.deleteCoupon);

module.exports = router;