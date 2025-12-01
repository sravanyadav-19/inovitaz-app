const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { adminOnly } = require('../middlewares/auth.middleware');

// All admin routes require admin authentication
router.use(adminOnly);

// Project management
router.post(
  '/projects',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('thumbnail').optional().isURL().withMessage('Valid thumbnail URL is required'),
    body('content_url').optional().isURL().withMessage('Valid content URL is required')
  ],
  adminController.createProject
);

router.put('/projects/:id', adminController.updateProject);
router.delete('/projects/:id', adminController.deleteProject);

// Order management
router.get('/orders', adminController.getAllOrders);

// User management
router.get('/users', adminController.getAllUsers);

// Dashboard
router.get('/stats', adminController.getDashboardStats);

module.exports = router;