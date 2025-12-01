const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authOptional, authRequired } = require('../middlewares/auth.middleware');

// Public routes
router.get('/', authOptional, projectController.getAllProjects);
router.get('/categories', projectController.getCategories);
router.get('/:id', authOptional, projectController.getProjectById);

// Protected routes
router.get('/:id/download', authRequired, projectController.downloadProject);

module.exports = router;