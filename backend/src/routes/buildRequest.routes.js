/**
 * Build-request routes — /api/build-requests
 * Buyer: submit intake, track own requests, pay the 40% advance.
 * Admin: review, quote, and move requests through the build pipeline.
 */
const express = require('express');
const router = express.Router();
const buildRequestController = require('../controllers/buildRequest.controller');
const { authRequired, adminOnly } = require('../middlewares/auth.middleware');

// Buyer
router.post('/', authRequired, buildRequestController.createRequest);
router.get('/mine', authRequired, buildRequestController.getMyRequests);
router.post('/:id/pay-advance', authRequired, buildRequestController.payAdvance);
router.get('/:id/payment-status', authRequired, buildRequestController.getPaymentStatus);

// Admin
router.get('/', authRequired, adminOnly, buildRequestController.getAllRequests);
router.patch('/:id', authRequired, adminOnly, buildRequestController.updateRequest);

module.exports = router;
