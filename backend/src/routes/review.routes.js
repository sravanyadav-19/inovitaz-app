const express = require('express');
const router = express.Router();
const { authRequired } = require('../middlewares/auth.middleware');
const { reviewValidation } = require('../utils/validationSchemas');
const { validate } = require('../middlewares/validate.middleware');

// Create Review (placeholder)
router.post('/:projectId', authRequired, reviewValidation, validate, (req, res) => {
  res.status(501).json({ success: false, message: 'Create review not implemented yet' });
});

// Get Reviews (placeholder)
router.get('/:projectId', (req, res) => {
  res.status(501).json({ success: false, message: 'Get reviews not implemented yet' });
});

// Delete Review (placeholder)
router.delete('/:id', authRequired, (req, res) => {
  res.status(501).json({ success: false, message: 'Delete review not implemented yet' });
});

module.exports = router;