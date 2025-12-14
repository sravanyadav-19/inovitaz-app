// src/routes/review.routes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authRequired } = require('../middlewares/auth.middleware');
const authOptional = require('../middlewares/authOptional');

// Public routes (optional auth)
router.get('/:projectId', authOptional, reviewController.getProjectReviews);

// Protected routes
router.post('/', authRequired, reviewController.submitReview);
router.delete('/:id', authRequired, reviewController.deleteReview);

module.exports = router;