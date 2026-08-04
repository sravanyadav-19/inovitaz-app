/**
 * Coupon service — single source of truth for coupon validation & discount math.
 *
 * Shared by:
 *   - coupon.controller.validateCoupon (preview / "You saved ₹X")
 *   - payment.controller.createOrder   (authoritative, server-side recomputation)
 *
 * MONEY STANDARD (paise):
 *   amount / min_purchase_amount / max_discount_amount / fixed discount_value = PAISE
 *   percentage discount_value = normal percent (e.g. 10 = 10%)
 */
const db = require('../config/db');

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const isCouponExpired = (coupon) => {
  if (!coupon.valid_until) return false;
  return new Date(coupon.valid_until) < new Date();
};

const isCouponNotStarted = (coupon) => {
  if (!coupon.valid_from) return false;
  return new Date(coupon.valid_from) > new Date();
};

const formatINRFromPaise = (paise) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(paise || 0) / 100);

/**
 * Pure discount calculation. Identical inputs => identical output.
 * @returns {{ discountAmount: number, finalAmount: number }}
 */
const calculateDiscount = (coupon, amount) => {
  const purchaseAmount = Number(amount || 0);
  let discountAmount = 0;

  if (coupon.discount_type === 'percentage') {
    discountAmount = Math.floor(
      (purchaseAmount * Number(coupon.discount_value || 0)) / 100
    );
  } else {
    // fixed discount_value stored in PAISE
    discountAmount = Math.floor(Number(coupon.discount_value || 0));
  }

  if (coupon.max_discount_amount) {
    discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
  }

  // Never discount more than the purchase amount itself.
  discountAmount = Math.max(0, Math.min(discountAmount, purchaseAmount));
  const finalAmount = Math.max(0, purchaseAmount - discountAmount);

  return { discountAmount, finalAmount };
};

/**
 * Resolve + fully validate a coupon against an amount and (optionally) a user.
 *
 * @param {string} code     Raw coupon code
 * @param {number} amount   Purchase amount in PAISE (the AUTHORITATIVE server-side price)
 * @param {number|null} userId  When provided, blocks reuse by the same user
 * @returns {Promise<object>} { ok, coupon?, discountAmount?, finalAmount?, reason?, status? }
 */
const resolveValidCoupon = async (code, amount, userId = null) => {
  const normalized = normalizeCode(code);

  if (!normalized) {
    return { ok: false, reason: 'Coupon code is required', status: 400 };
  }

  if (!amount || amount < 0) {
    return { ok: false, reason: 'Valid amount is required', status: 400 };
  }

  const coupons = await db.query(
    `SELECT * FROM coupons WHERE code = $1 LIMIT 1`,
    [normalized]
  );

  if (coupons.length === 0) {
    return { ok: false, reason: 'Invalid coupon code', status: 404 };
  }

  const coupon = coupons[0];

  if (!coupon.is_active) {
    return { ok: false, reason: 'Coupon is inactive', status: 400 };
  }

  if (isCouponNotStarted(coupon)) {
    return { ok: false, reason: 'Coupon is not active yet', status: 400 };
  }

  if (isCouponExpired(coupon)) {
    return { ok: false, reason: 'Coupon has expired', status: 400 };
  }

  if (
    coupon.usage_limit !== null &&
    Number(coupon.used_count || 0) >= Number(coupon.usage_limit)
  ) {
    return { ok: false, reason: 'Coupon usage limit reached', status: 400 };
  }

  if (Number(coupon.min_purchase_amount || 0) > amount) {
    return {
      ok: false,
      reason: `Minimum purchase amount is ₹${Math.round(
        Number(coupon.min_purchase_amount || 0) / 100
      )}`,
      status: 400,
    };
  }

  // Block reuse by the same user (single-use-per-user).
  if (userId) {
    const usageRows = await db.query(
      `SELECT cu.id
       FROM coupon_usage cu
       WHERE cu.coupon_id = $1 AND cu.user_id = $2
       LIMIT 1`,
      [coupon.id, userId]
    );

    if (usageRows.length > 0) {
      return { ok: false, reason: 'You have already used this coupon', status: 400 };
    }
  }

  const { discountAmount, finalAmount } = calculateDiscount(coupon, amount);

  return { ok: true, coupon, discountAmount, finalAmount };
};

module.exports = {
  normalizeCode,
  isCouponExpired,
  isCouponNotStarted,
  formatINRFromPaise,
  calculateDiscount,
  resolveValidCoupon,
};
