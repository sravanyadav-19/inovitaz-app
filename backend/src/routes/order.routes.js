const express = require('express');
const { authRequired } = require('../middlewares/auth.middleware');
const {
  getMyOrders,
  getPurchasedProjects,
  getOrderById,
} = require('../controllers/order.controller');

const router = express.Router();

// Keep the static route before /:id so "purchased" is never parsed as an ID.
router.get('/', authRequired, getMyOrders);
router.get('/purchased', authRequired, getPurchasedProjects);
router.get('/:id', authRequired, getOrderById);

module.exports = router;
