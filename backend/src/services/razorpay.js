const Razorpay = require('razorpay');

/**
 * Razorpay Service
 * Supports both real Razorpay and mock payment modes
 */
class RazorpayService {
  constructor() {
    this.isMockMode = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;
    
    if (!this.isMockMode) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('💳 Razorpay initialized in LIVE mode');
    } else {
      console.log('💳 Razorpay initialized in MOCK mode');
    }
  }

  /**
   * Create a new order
   * @param {Object} options - Order options
   * @param {number} options.amount - Amount in paise
   * @param {string} options.currency - Currency code (INR)
   * @param {string} options.receipt - Receipt ID
   * @param {Object} options.notes - Additional notes
   * @returns {Promise<Object>} Order object
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (this.isMockMode) {
      // Return mock order
      return {
        id: `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entity: 'order',
        amount: amount,
        amount_paid: 0,
        amount_due: amount,
        currency: currency,
        receipt: receipt,
        status: 'created',
        notes: notes,
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    try {
      const order = await this.razorpay.orders.create({
        amount,
        currency,
        receipt,
        notes
      });
      return order;
    } catch (error) {
      console.error('Razorpay create order error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Fetch order details
   * @param {string} orderId - Razorpay order ID
   * @returns {Promise<Object>} Order details
   */
  async fetchOrder(orderId) {
    if (this.isMockMode) {
      return {
        id: orderId,
        status: 'paid',
        amount: 0,
        currency: 'INR'
      };
    }

    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      console.error('Razorpay fetch order error:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Fetch payment details
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async fetchPayment(paymentId) {
    if (this.isMockMode) {
      return {
        id: paymentId,
        status: 'captured',
        amount: 0,
        currency: 'INR'
      };
    }

    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Razorpay fetch payment error:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Verify payment signature
   * @param {Object} params - Verification parameters
   * @param {string} params.order_id - Razorpay order ID
   * @param {string} params.payment_id - Razorpay payment ID
   * @param {string} params.signature - Payment signature
   * @returns {boolean} Whether signature is valid
   */
  verifyPaymentSignature({ order_id, payment_id, signature }) {
    if (this.isMockMode) {
      return true;
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Check if running in mock mode
   * @returns {boolean}
   */
  isMock() {
    return this.isMockMode;
  }
}

module.exports = new RazorpayService();