const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authRequired } = require('../middlewares/auth.middleware');
const { reviewValidation } = require('../utils/validationSchemas');
const { validate } = require('../middlewares/validate.middleware');

// Create Review
router.post('/:projectId', authRequired, reviewValidation, validate, reviewController.submitReview);

// Get Reviews
router.get('/:projectId', reviewController.getProjectReviews);

// Delete Review
router.delete('/:id', authRequired, reviewController.deleteReview);

module.exports = router;