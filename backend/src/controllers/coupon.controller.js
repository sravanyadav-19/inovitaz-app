// src/controllers/coupon.controller.js
const db = require('../config/db');

const couponController = {
  // Validate and apply coupon
  validateCoupon: async (req, res) => {
    try {
      const { code, project_id, amount } = req.body;
      const userId = req.user.id;

      if (!code || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code and amount are required'
        });
      }

      // Get coupon details
      const [coupons] = await db.query(
        `SELECT * FROM coupons 
         WHERE code = ? 
         AND is_active = TRUE 
         AND (valid_until IS NULL OR valid_until > NOW())`,
        [code.trim().toUpperCase()]
      );

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired coupon code'
        });
      }

      const coupon = coupons[0];

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has reached its usage limit'
        });
      }

      // Check minimum purchase amount (convert to paise)
      const amountInPaise = amount * 100;
      if (amountInPaise < coupon.min_purchase_amount) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount is ₹${coupon.min_purchase_amount / 100}`
        });
      }

      // Check if user already used this coupon
      const [usage] = await db.query(
        'SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
        [coupon.id, userId]
      );

      if (usage.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this coupon'
        });
      }

      // Calculate discount (in rupees)
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (amount * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }

      // Apply max discount limit (convert from paise to rupees)
      if (coupon.max_discount_amount) {
        const maxDiscountRupees = coupon.max_discount_amount / 100;
        discountAmount = Math.min(discountAmount, maxDiscountRupees);
      }

      // Ensure discount doesn't exceed amount
      discountAmount = Math.min(discountAmount, amount);

      const finalAmount = amount - discountAmount;

      res.json({
        success: true,
        data: {
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_amount: Math.round(discountAmount),
          final_amount: Math.round(finalAmount),
          original_amount: amount
        }
      });

    } catch (error) {
      console.error('Coupon validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate coupon'
      });
    }
  },

  // Get all active coupons (admin)
  getAllCoupons: async (req, res) => {
    try {
      const [coupons] = await db.query(
        `SELECT 
          id, code, description, discount_type, discount_value,
          min_purchase_amount, max_discount_amount, usage_limit,
          used_count, valid_from, valid_until, is_active, created_at
         FROM coupons 
         ORDER BY created_at DESC`
      );

      res.json({
        success: true,
        data: coupons
      });
    } catch (error) {
      console.error('Get coupons error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coupons'
      });
    }
  },

  // Create coupon (admin)
  createCoupon: async (req, res) => {
    try {
      const {
        code,
        description,
        discount_type,
        discount_value,
        min_purchase_amount,
        max_discount_amount,
        usage_limit,
        valid_until
      } = req.body;

      const [result] = await db.query(
        `INSERT INTO coupons 
         (code, description, discount_type, discount_value, 
          min_purchase_amount, max_discount_amount, usage_limit, valid_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code.toUpperCase(),
          description,
          discount_type,
          discount_value,
          min_purchase_amount || 0,
          max_discount_amount,
          usage_limit,
          valid_until
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: { id: result.insertId }
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
      console.error('Create coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create coupon'
      });
    }
  }
};

module.exports = couponController;