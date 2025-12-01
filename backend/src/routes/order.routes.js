const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authRequired } = require('../middlewares/auth.middleware');

// All order routes require authentication
router.use(authRequired);

router.get('/my', orderController.getMyOrders);
router.get('/purchased', orderController.getPurchasedProjects);
router.get('/:id', orderController.getOrderById);

module.exports = router;