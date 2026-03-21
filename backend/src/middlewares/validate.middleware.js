/**
 * Input Validation Middleware
 * Centralized validation for all API endpoints
 */

const { body, param, query, validationResult } = require('express-validator');

// Helper to run validations
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// ==========================================
// VALIDATION RULES
// ==========================================

const projectValidation = {
  create: validate([
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
    body('description')
      .notEmpty().withMessage('Description is required'),
    body('price')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category')
      .optional()
      .isIn(['IoT', 'Arduino', 'ESP32', 'Raspberry Pi', 'Robotics', 'Embedded', 'Automation'])
      .withMessage('Invalid category'),
    body('difficulty')
      .optional()
      .isIn(['Beginner', 'Intermediate', 'Advanced'])
      .withMessage('Invalid difficulty level'),
    body('thumbnail')
      .optional()
      .isURL().withMessage('Thumbnail must be a valid URL'),
    body('content_url')
      .optional()
      .isURL().withMessage('Content URL must be a valid URL'),
  ]),

  update: validate([
    param('id').isInt().withMessage('Invalid project ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ])
};

const couponValidation = {
  create: validate([
    body('code')
      .trim()
      .notEmpty().withMessage('Coupon code is required')
      .isLength({ min: 3, max: 50 }).withMessage('Code must be 3-50 characters')
      .matches(/^[A-Z0-9]+$/).withMessage('Code must be uppercase alphanumeric'),
    body('discount_type')
      .isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
    body('discount_value')
      .isFloat({ min: 0.01 }).withMessage('Discount value must be positive'),
    body('min_purchase_amount')
      .optional()
      .isInt({ min: 0 }).withMessage('Min purchase must be non-negative'),
    body('max_discount_amount')
      .optional()
      .isInt({ min: 0 }).withMessage('Max discount must be non-negative'),
    body('usage_limit')
      .optional()
      .isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
  ]),

  validate: validate([
    body('code')
      .trim()
      .notEmpty().withMessage('Coupon code is required'),
    body('amount')
      .isFloat({ min: 0 }).withMessage('Amount is required'),
  ])
};

const paymentValidation = {
  createOrder: validate([
    body('projectId')
      .isInt({ min: 1 }).withMessage('Valid project ID is required'),
    body('couponCode')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 }).withMessage('Invalid coupon code'),
  ]),

  verify: validate([
    body('projectId')
      .isInt({ min: 1 }).withMessage('Valid project ID is required'),
    body('razorpay_order_id')
      .notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id')
      .notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpay_signature')
      .notEmpty().withMessage('Razorpay signature is required'),
  ])
};

const reviewValidation = {
  create: validate([
    body('project_id')
      .isInt({ min: 1 }).withMessage('Valid project ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Comment must be under 1000 characters'),
  ])
};

const authValidation = {
  register: validate([
    body('email')
      .isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  ]),

  login: validate([
    body('email')
      .isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ])
};

module.exports = {
  validate,
  projectValidation,
  couponValidation,
  paymentValidation,
  reviewValidation,
  authValidation
};