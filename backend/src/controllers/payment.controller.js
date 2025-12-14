const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../config/db");

// ------------------------------
// Initialize Razorpay
// ------------------------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ------------------------------
// CREATE ORDER
// ------------------------------
exports.createOrder = async (req, res) => {
  try {
    const { projectId, couponCode } = req.body;  // ✅ Added couponCode support

    if (!projectId) {
      return res.json({ success: false, message: "projectId is required" });
    }

    // 1. Get project price from DB
    const rows = await db.query(
      "SELECT id, price FROM projects WHERE id = ? LIMIT 1",
      [projectId]
    );

    if (!rows.length) {
      return res.json({ success: false, message: "Project not found" });
    }

    let originalAmount = Number(rows[0].price);
    let discountAmount = 0;
    let finalAmount = originalAmount;

    // ✅ Apply coupon if provided
    if (couponCode) {
      const coupons = await db.query(
        `SELECT * FROM coupons 
         WHERE code = ? AND is_active = TRUE 
         AND (valid_until IS NULL OR valid_until > NOW())`,
        [couponCode.toUpperCase()]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        
        // Check usage limit
        if (!coupon.usage_limit || coupon.used_count < coupon.usage_limit) {
          // Check if user already used this coupon
          const userUsage = await db.query(
            'SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
            [coupon.id, req.user.id]
          );

          if (userUsage.length === 0) {
            // Calculate discount (values in DB are in paise for fixed, percentage for %)
            if (coupon.discount_type === 'percentage') {
              discountAmount = (originalAmount * coupon.discount_value) / 100;
            } else {
              discountAmount = coupon.discount_value; // Fixed amount in rupees
            }

            // Apply max discount limit (stored in paise, convert to rupees)
            if (coupon.max_discount_amount) {
              const maxDiscount = coupon.max_discount_amount / 100;
              discountAmount = Math.min(discountAmount, maxDiscount);
            }

            // Ensure discount doesn't exceed price
            discountAmount = Math.min(discountAmount, originalAmount);
            finalAmount = originalAmount - discountAmount;
            finalAmount = Math.max(0, finalAmount);
          }
        }
      }
    }

    const amountInPaise = Math.round(finalAmount * 100);

    // 2. Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${projectId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      originalAmount,
      discountAmount,
      couponCode: couponCode || null
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.json({
      success: false,
      message: "Failed to create order",
    });
  }
};

// ------------------------------
// VERIFY PAYMENT
// ------------------------------
exports.verifyPayment = async (req, res) => {
  try {
    const {
      projectId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      couponCode,
      discountAmount
    } = req.body;

    if (!projectId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.json({ success: false, message: "Missing payment fields" });
    }

    // 1. Verify signature
    const signData = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signData)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, message: "Invalid signature" });
    }

    // 2. Get project price
    const rows = await db.query(
      "SELECT price FROM projects WHERE id = ? LIMIT 1",
      [projectId]
    );

    if (!rows.length) {
      return res.json({ success: false, message: "Project not found" });
    }

    const originalAmount = Number(rows[0].price);
    const discount = discountAmount || 0;
    const finalAmount = originalAmount - discount;

    // 3. Save order with coupon info
    const result = await db.query(
      `INSERT INTO orders (user_id, project_id, razorpay_order_id, razorpay_payment_id, 
                           amount, original_amount, discount_amount, coupon_code, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', NOW())`,
      [
        req.user.id, 
        projectId, 
        razorpay_order_id,
        razorpay_payment_id, 
        finalAmount,
        originalAmount,
        discount,
        couponCode || null
      ]
    );

    const orderId = result.insertId;

    // 4. If coupon used, log it and increment usage
    if (couponCode) {
      const coupons = await db.query(
        'SELECT id FROM coupons WHERE code = ?',
        [couponCode.toUpperCase()]
      );
      
      if (coupons.length > 0) {
        const couponId = coupons[0].id;
        
        // Log coupon usage
        await db.query(
          `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [couponId, req.user.id, orderId, Math.round(discount * 100)]
        );
      }
    }

    // 5. Create download log (6 months expiry, 5 downloads max)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    await db.query(
      `INSERT INTO download_logs (user_id, project_id, order_id, download_count, max_downloads, expiry_date, created_at)
       VALUES (?, ?, ?, 0, 5, ?, NOW())`,
      [req.user.id, projectId, orderId, expiryDate]
    );

    // ✅ REMOVED: purchases table insert (table doesn't exist)

    return res.json({ 
      success: true,
      message: "Payment verified successfully",
      orderId 
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.json({
      success: false,
      message: "Payment verification failed",
    });
  }
};