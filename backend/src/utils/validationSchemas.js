const { body, param } = require('express-validator');

// ==================== PROJECT VALIDATION ====================
const projectValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('difficulty')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Difficulty must be Beginner, Intermediate, or Advanced'),
];

// ==================== REVIEW VALIDATION ====================
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Comment must be between 5 and 1000 characters'),
  param('projectId')
    .isInt()
    .withMessage('Invalid project ID'),
];

// ==================== COUPON VALIDATION ====================
const couponValidation = [
  body('code')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Coupon code must be between 4 and 20 characters'),
  body('discount_percent')
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100'),
  body('expires_at')
    .isISO8601()
    .withMessage('Invalid expiry date'),
];

// ==================== WISHLIST VALIDATION ====================
const wishlistValidation = [
  body('project_id')
    .isInt()
    .withMessage('Invalid project ID'),
];

// ==================== ORDER VALIDATION ====================
const orderValidation = [
  body('project_id')
    .isInt()
    .withMessage('Invalid project ID'),
];

module.exports = {
  projectValidation,
  reviewValidation,
  couponValidation,
  wishlistValidation,
  orderValidation,
};