const db = require("../config/db");
const logger = require("../utils/logger");

/**
 * Coupon controller
 *
 * MONEY STANDARD:
 * - amount is PAISE
 * - min_purchase_amount is PAISE
 * - max_discount_amount is PAISE
 * - fixed discount_value is PAISE
 * - percentage discount_value is normal percent, e.g. 10 = 10%
 */

const normalizeCode = (code) => String(code || "").trim().toUpperCase();

const isCouponExpired = (coupon) => {
  if (!coupon.valid_until) return false;
  return new Date(coupon.valid_until) < new Date();
};

const formatINRFromPaise = (paise) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(paise || 0) / 100);
};

const isCouponNotStarted = (coupon) => {
  if (!coupon.valid_from) return false;
  return new Date(coupon.valid_from) > new Date();
};

const calculateDiscount = (coupon, amount) => {
  const purchaseAmount = Number(amount || 0);
  let discountAmount = 0;

  if (coupon.discount_type === "percentage") {
    discountAmount = Math.floor(
      (purchaseAmount * Number(coupon.discount_value || 0)) / 100
    );
  } else {
    /**
     * Fixed discount_value is stored in PAISE.
     * Example:
     * ₹50 discount => 5000
     */
    discountAmount = Math.floor(Number(coupon.discount_value || 0));
  }

  if (coupon.max_discount_amount) {
    discountAmount = Math.min(
      discountAmount,
      Number(coupon.max_discount_amount)
    );
  }

  discountAmount = Math.max(0, Math.min(discountAmount, purchaseAmount));
  const finalAmount = Math.max(0, purchaseAmount - discountAmount);

  return {
    discountAmount,
    finalAmount,
  };
};

const validateCoupon = async (req, res) => {
  try {
    const code = normalizeCode(req.body.code);
    const projectId = req.body.project_id || req.body.projectId || null;
    const amount = Number(req.body.amount || 0);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!amount || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const coupons = await db.query(
      `SELECT *
       FROM coupons
       WHERE code = $1
       LIMIT 1`,
      [code]
    );

    if (coupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const coupon = coupons[0];

    if (!coupon.is_active) {
      return res.status(400).json({
        success: false,
        message: "Coupon is inactive",
      });
    }

    if (isCouponNotStarted(coupon)) {
      return res.status(400).json({
        success: false,
        message: "Coupon is not active yet",
      });
    }

    if (isCouponExpired(coupon)) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    if (
      coupon.usage_limit !== null &&
      Number(coupon.used_count || 0) >= Number(coupon.usage_limit)
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    if (Number(coupon.min_purchase_amount || 0) > amount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount is ₹${Math.round(
          Number(coupon.min_purchase_amount || 0) / 100
        )}`,
      });
    }

    /**
     * Optional: prevent same user using coupon multiple times.
     * This only works reliably after order/coupon_usage is inserted.
     */
    if (req.user?.id) {
      const usageRows = await db.query(
        `SELECT cu.id
         FROM coupon_usage cu
         WHERE cu.coupon_id = $1
           AND cu.user_id = $2
         LIMIT 1`,
        [coupon.id, req.user.id]
      );

      if (usageRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon",
        });
      }
    }

    const { discountAmount, finalAmount } = calculateDiscount(coupon, amount);

    return res.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discount_amount: discountAmount,
        final_amount: finalAmount,
        original_amount: amount,
        savings_text: `You saved ${formatINRFromPaise(discountAmount)}`,
        project_id: projectId,
      },
    });
  } catch (error) {
    logger.error("Validate coupon error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
    });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await db.query(
      `SELECT
          id,
          code,
          description,
          discount_type,
          discount_value,
          min_purchase_amount,
          max_discount_amount,
          usage_limit,
          used_count,
          valid_from,
          valid_until,
          is_active,
          created_at,
          updated_at
       FROM coupons
       ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    logger.error("Get coupons error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
    });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description = null,
      discount_type,
      discount_value,
      min_purchase_amount = 0,
      max_discount_amount = null,
      usage_limit = null,
      valid_until = null,
    } = req.body;

    const normalizedCode = normalizeCode(code);

    if (!normalizedCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!["percentage", "fixed"].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    const parsedDiscountValue = Number(discount_value);

    if (!parsedDiscountValue || parsedDiscountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be positive",
      });
    }

    if (discount_type === "percentage" && parsedDiscountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    /**
     * IMPORTANT:
     * Frontend should already convert rupee inputs to paise for:
     * - fixed discount_value
     * - min_purchase_amount
     * - max_discount_amount
     *
     * Percentage discount_value remains percent.
     */
    const rows = await db.query(
      `INSERT INTO coupons
        (
          code,
          description,
          discount_type,
          discount_value,
          min_purchase_amount,
          max_discount_amount,
          usage_limit,
          valid_until,
          is_active
        )
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING *`,
      [
        normalizedCode,
        description,
        discount_type,
        parsedDiscountValue,
        Number(min_purchase_amount || 0),
        max_discount_amount === null || max_discount_amount === ""
          ? null
          : Number(max_discount_amount),
        usage_limit === null || usage_limit === ""
          ? null
          : Number(usage_limit),
        valid_until || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: rows[0],
    });
  } catch (error) {
    logger.error("Create coupon error", { error: error.message });

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
    });
  }
};

const toggleCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await db.query(
      `UPDATE coupons
       SET is_active = NOT is_active,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.json({
      success: true,
      message: `Coupon ${
        rows[0].is_active ? "activated" : "deactivated"
      } successfully`,
      data: rows[0],
    });
  } catch (error) {
    logger.error("Toggle coupon error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await db.query(
      `DELETE FROM coupons
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    logger.error("Delete coupon error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};

module.exports = {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  toggleCoupon,
  deleteCoupon,
};