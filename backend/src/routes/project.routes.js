const express = require('express');
const router = express.Router();

const projectController = require('../controllers/project.controller');
const { authRequired } = require('../middlewares/auth.middleware');
const authOptional = require('../middlewares/authOptional');

// Public routes
router.get('/', authOptional, projectController.getAllProjects);
router.get('/categories', projectController.getCategories);
router.get('/:id', authOptional, projectController.getProjectById);


// Protected route (download only for paid users or admin)
router.get('/:id/download', authRequired, projectController.downloadProject);

module.exports = router;
