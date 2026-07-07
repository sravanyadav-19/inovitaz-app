const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authRequired, authOptional, adminOnly } = require('../middlewares/auth.middleware');
const { projectValidation } = require('../utils/validationSchemas');
const { validate } = require('../middlewares/validate.middleware');

// Public Routes
router.get('/', authOptional, projectController.getAllProjects);
router.get('/categories', projectController.getCategories);
router.get('/:id', authOptional, projectController.getProjectById);

// File Delivery (Public - validated via signed token)
router.get('/stream/:token', projectController.streamProjectFile);

// Protected Routes
router.get('/:id/download', authRequired, projectController.downloadProject);

// Admin Routes
router.post('/', authRequired, adminOnly, projectValidation, validate, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
router.put('/:id', authRequired, adminOnly, projectValidation, validate, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
router.delete('/:id', authRequired, adminOnly, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

module.exports = router;