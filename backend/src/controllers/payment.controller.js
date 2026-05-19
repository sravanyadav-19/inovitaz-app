const db = require("../config/db");
const razorpay = require("../services/razorpay");
const logger = require("../utils/logger");

/**
 * Payment controller
 *
 * MONEY STANDARD:
 * - projects.price is PAISE
 * - orders.amount is PAISE
 * - orders.original_amount is PAISE
 * - orders.discount_amount is PAISE
 * - coupons fixed discount_value is PAISE
 * - coupons min/max amounts are PAISE
 * - Razorpay expects PAISE
 *
 * Therefore: DO NOT multiply project price/finalAmount by 100 here.
 */

exports.createOrder = async (req, res) => {
  try {
    const { projectId, couponCode } = req.body;
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const projects = await db.query(
      `SELECT id, price, title
       FROM projects
       WHERE id = $1
       LIMIT 1`,
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projects[0];

    const existingPaidOrders = await db.query(
      `SELECT id
       FROM orders
       WHERE user_id = $1
         AND project_id = $2
         AND status = 'paid'
       LIMIT 1`,
      [userId, projectId]
    );

    if (existingPaidOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already purchased this project",
      });
    }

    const originalAmount = Math.round(Number(project.price || 0)); // already paise
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (couponCode && String(couponCode).trim()) {
      const couponResult = await validateCouponInternal(
        couponCode,
        userId,
        originalAmount
      );

      if (!couponResult.valid) {
        return res.status(400).json({
          success: false,
          message: couponResult.message || "Invalid coupon",
        });
      }

      discountAmount = couponResult.discountAmount;
      appliedCouponCode = couponResult.code;
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount); // already paise

    const order = await razorpay.createOrder({
      amount: finalAmount, // ✅ already paise
      currency: "INR",
      receipt: `order_${projectId}_${userId}_${Date.now()}`,
      notes: {
        projectId: String(projectId),
        userId: String(userId),
        couponCode: appliedCouponCode || "",
      },
    });

    /**
     * Store created order immediately.
     * verifyPayment will update this order to paid.
     */
    await db.query(
      `INSERT INTO orders
        (
          user_id,
          project_id,
          razorpay_order_id,
          amount,
          original_amount,
          discount_amount,
          coupon_code,
          currency,
          status,
          created_at,
          updated_at
        )
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, 'created', NOW(), NOW())`,
      [
        userId,
        projectId,
        order.id,
        finalAmount,
        originalAmount,
        discountAmount,
        appliedCouponCode,
        order.currency || "INR",
      ]
    );

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: finalAmount, // ✅ already paise
        currency: order.currency || "INR",
        keyId: razorpay.getPublicKey(),
        originalAmount,
        discountAmount,
        couponCode: appliedCouponCode,
        isMockPayment: razorpay.isMock(),
      },
    });
  } catch (error) {
    logger.error("Create order error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      projectId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = req.user.id;

    if (
      !projectId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment fields",
      });
    }

    const isValid = razorpay.verifyPaymentSignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const orderRows = await db.query(
      `SELECT *
       FROM orders
       WHERE razorpay_order_id = $1
         AND user_id = $2
         AND project_id = $3
       LIMIT 1`,
      [razorpay_order_id, userId, projectId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const existingOrder = orderRows[0];

    if (existingOrder.status === "paid") {
      return res.json({
        success: true,
        message: "Payment already verified",
        data: { orderId: existingOrder.id },
      });
    }

    const updatedOrders = await db.query(
      `UPDATE orders
       SET razorpay_payment_id = $1,
           status = 'paid',
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, coupon_code, discount_amount`,
      [razorpay_payment_id, existingOrder.id]
    );

    const paidOrder = updatedOrders[0];
    const orderId = paidOrder.id;

    if (paidOrder.coupon_code) {
      const coupons = await db.query(
        `SELECT id
         FROM coupons
         WHERE code = $1
         LIMIT 1`,
        [paidOrder.coupon_code]
      );

      if (coupons.length > 0) {
        const existingUsage = await db.query(
          `SELECT id
           FROM coupon_usage
           WHERE coupon_id = $1
             AND user_id = $2
             AND order_id = $3
           LIMIT 1`,
          [coupons[0].id, userId, orderId]
        );

        if (existingUsage.length === 0) {
          await db.query(
            `INSERT INTO coupon_usage
              (coupon_id, user_id, order_id, discount_amount)
             VALUES
              ($1, $2, $3, $4)`,
            [
              coupons[0].id,
              userId,
              orderId,
              Math.round(Number(paidOrder.discount_amount || 0)), // already paise
            ]
          );
        }
      }
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    const existingDownloadLog = await db.query(
      `SELECT id
       FROM download_logs
       WHERE user_id = $1
         AND project_id = $2
         AND order_id = $3
       LIMIT 1`,
      [userId, projectId, orderId]
    );

    if (existingDownloadLog.length === 0) {
      await db.query(
        `INSERT INTO download_logs
          (
            user_id,
            project_id,
            order_id,
            download_count,
            max_downloads,
            expiry_date
          )
         VALUES
          ($1, $2, $3, 0, 5, $4)`,
        [userId, projectId, orderId, expiryDate]
      );
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
      data: { orderId },
    });
  } catch (error) {
    logger.error("Verify payment error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

async function validateCouponInternal(code, userId, amount) {
  try {
    const couponCode = String(code || "").trim().toUpperCase();

    if (!couponCode) {
      return {
        valid: false,
        message: "Coupon code is required",
      };
    }

    const coupons = await db.query(
      `SELECT *
       FROM coupons
       WHERE code = $1
         AND is_active = TRUE
       LIMIT 1`,
      [couponCode]
    );

    if (coupons.length === 0) {
      return {
        valid: false,
        message: "Invalid coupon",
      };
    }

    const coupon = coupons[0];

    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      return {
        valid: false,
        message: "Coupon is not active yet",
      };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return {
        valid: false,
        message: "Coupon has expired",
      };
    }

    if (
      coupon.usage_limit !== null &&
      Number(coupon.used_count || 0) >= Number(coupon.usage_limit)
    ) {
      return {
        valid: false,
        message: "Coupon usage limit reached",
      };
    }

    const purchaseAmount = Math.round(Number(amount || 0)); // already paise

    if (
      coupon.min_purchase_amount &&
      purchaseAmount < Number(coupon.min_purchase_amount)
    ) {
      return {
        valid: false,
        message: `Minimum purchase amount is ₹${Math.round(
          Number(coupon.min_purchase_amount || 0) / 100
        )}`,
      };
    }

    const usage = await db.query(
      `SELECT id
       FROM coupon_usage
       WHERE coupon_id = $1
         AND user_id = $2
       LIMIT 1`,
      [coupon.id, userId]
    );

    if (usage.length > 0) {
      return {
        valid: false,
        message: "You have already used this coupon",
      };
    }

    let discountAmount = 0;

    if (coupon.discount_type === "percentage") {
      discountAmount = Math.floor(
        (purchaseAmount * Number(coupon.discount_value || 0)) / 100
      );
    } else {
      /**
       * Fixed discount_value is already paise.
       * Example: ₹50 => 5000
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

    return {
      valid: true,
      code: coupon.code,
      discountAmount,
    };
  } catch (error) {
    logger.error("Internal coupon validation error", { error: error.message });

    return {
      valid: false,
      message: "Coupon validation failed",
    };
  }
}