/**
 * Coupon Controller
 * Handles all coupon validation and management
 */

const db = require('../config/db');
const logger = require('../utils/logger');

const couponController = {
  /**
   * Validate and calculate coupon discount
   * POST /api/coupons/validate
   */
  validateCoupon: async (req, res) => {
    try {
      const { code, project_id, amount } = req.body;
      const userId = req.user.id;

      if (!code || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code and amount are required'
        });
      }

      const couponCode = code.trim().toUpperCase();

      // Get coupon from database
      const coupons = await db.query(
        `SELECT * FROM coupons 
         WHERE code = ? 
         AND is_active = TRUE`,
        [couponCode]
      );

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invalid coupon code'
        });
      }

      const coupon = coupons[0];

      // Check expiry
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has expired'
        });
      }

      // Check usage limit
      if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has reached its usage limit'
        });
      }

      // Check minimum purchase amount (stored in paise)
      const amountInPaise = Math.round(amount * 100);
      if (coupon.min_purchase_amount && amountInPaise < coupon.min_purchase_amount) {
        const minInRupees = coupon.min_purchase_amount / 100;
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount is ₹${minInRupees}`
        });
      }

      // Check if user already used this coupon
      const usage = await db.query(
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
        // Fixed amount discount (stored as rupees in DB)
        discountAmount = coupon.discount_value;
      }

      // Apply max discount limit (stored in paise, convert to rupees)
      if (coupon.max_discount_amount) {
        const maxDiscountRupees = coupon.max_discount_amount / 100;
        discountAmount = Math.min(discountAmount, maxDiscountRupees);
      }

      // Ensure discount doesn't exceed amount
      discountAmount = Math.min(discountAmount, amount);
      discountAmount = Math.round(discountAmount * 100) / 100; // Round to 2 decimals

      const finalAmount = Math.round((amount - discountAmount) * 100) / 100;

      logger.info('Coupon validated', {
        code: couponCode,
        userId,
        originalAmount: amount,
        discount: discountAmount,
        finalAmount
      });

      res.json({
        success: true,
        data: {
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          original_amount: amount
        }
      });

    } catch (error) {
      logger.error('Coupon validation error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to validate coupon'
      });
    }
  },

  /**
   * Get all coupons (admin)
   * GET /api/coupons
   */
  getAllCoupons: async (req, res) => {
    try {
      const coupons = await db.query(
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
      logger.error('Get coupons error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coupons'
      });
    }
  },

  /**
   * Create coupon (admin)
   * POST /api/coupons
   */
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

      const result = await db.query(
        `INSERT INTO coupons 
         (code, description, discount_type, discount_value, 
          min_purchase_amount, max_discount_amount, usage_limit, valid_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code.toUpperCase(),
          description || null,
          discount_type,
          discount_value,
          min_purchase_amount || 0,
          max_discount_amount || null,
          usage_limit || null,
          valid_until || null
        ]
      );

      logger.admin('Coupon created', req.user.id, 'coupon', result.insertId);

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
      logger.error('Create coupon error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create coupon'
      });
    }
  },

  /**
   * Toggle coupon status (admin)
   * PATCH /api/coupons/:id/toggle
   */
  toggleCoupon: async (req, res) => {
    try {
      const { id } = req.params;

      await db.query(
        'UPDATE coupons SET is_active = NOT is_active WHERE id = ?',
        [id]
      );

      logger.admin('Coupon toggled', req.user.id, 'coupon', id);

      res.json({
        success: true,
        message: 'Coupon status updated'
      });
    } catch (error) {
      logger.error('Toggle coupon error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to update coupon'
      });
    }
  },

  /**
   * Delete coupon (admin)
   * DELETE /api/coupons/:id
   */
  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;

      await db.query('DELETE FROM coupons WHERE id = ?', [id]);

      logger.admin('Coupon deleted', req.user.id, 'coupon', id);

      res.json({
        success: true,
        message: 'Coupon deleted successfully'
      });
    } catch (error) {
      logger.error('Delete coupon error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to delete coupon'
      });
    }
  }
};

module.exports = couponController;