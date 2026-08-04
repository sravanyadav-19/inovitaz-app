const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authRequired, adminOnly } = require('../middlewares/auth.middleware');
const { couponValidation } = require('../utils/validationSchemas');
const { validate } = require('../middlewares/validate.middleware');

// Any authenticated user can validate a coupon at checkout (preview only;
// the final amount is always recomputed server-side in payment.createOrder).
router.post('/validate', authRequired, couponController.validateCoupon);

// Admin only
router.post('/', authRequired, adminOnly, couponValidation, validate, couponController.createCoupon);
router.get('/', authRequired, adminOnly, couponController.getAllCoupons);
router.patch('/:id/toggle', authRequired, adminOnly, couponController.toggleCoupon);
router.delete('/:id', authRequired, adminOnly, couponController.deleteCoupon);

module.exports = router;