/**
 * Complete-build order routes — /api/complete-orders
 */
const express = require('express');
const router = express.Router();
const controller = require('../controllers/completeOrder.controller');
const { authRequired, adminOnly } = require('../middlewares/auth.middleware');

// Public
router.get('/delivery-addresses', controller.getDeliveryAddresses);

// Buyer
router.post('/', authRequired, controller.createOrder);
router.get('/mine', authRequired, controller.getMyOrders);
router.post('/:id/pay', authRequired, controller.payInstallment);

// Admin
router.get('/', authRequired, adminOnly, controller.getAllOrders);
router.patch('/:id', authRequired, adminOnly, controller.updateOrder);

module.exports = router;
