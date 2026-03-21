/**
 * Razorpay Service
 * Production-grade payment integration
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

class RazorpayService {
  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // In production, Razorpay keys are REQUIRED
    if (isProduction && (!keyId || !keySecret)) {
      throw new Error(
        'FATAL: Razorpay credentials not configured for production. ' +
        'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
      );
    }

    this.isMockMode = !keyId || !keySecret;

    if (this.isMockMode) {
      logger.warn('⚠️ Razorpay running in MOCK mode - payments will be simulated');
    } else {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      logger.info('💳 Razorpay initialized in LIVE mode');
    }
  }

  /**
   * Create a new order
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    // Mock mode only allowed in development
    if (this.isMockMode) {
      if (isProduction) {
        throw new Error('Payment system not configured');
      }
      
      logger.debug('Creating mock order', { amount, receipt });
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
      
      logger.payment('Order created', order.id, amount, 'created');
      return order;
    } catch (error) {
      logger.error('Razorpay create order error', { error: error.message });
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify payment signature - MANDATORY in production
   */
  verifyPaymentSignature({ order_id, payment_id, signature }) {
    // Mock mode - only in development
    if (this.isMockMode) {
      if (isProduction) {
        throw new Error('Payment verification not available');
      }
      logger.warn('Mock payment verification - accepting without signature');
      return true;
    }

    // Real signature verification
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === signature;
    
    logger.payment(
      'Signature verification', 
      order_id, 
      null, 
      isValid ? 'verified' : 'failed'
    );

    return isValid;
  }

  /**
   * Fetch order details
   */
  async fetchOrder(orderId) {
    if (this.isMockMode) {
      return { id: orderId, status: 'paid' };
    }

    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      logger.error('Razorpay fetch order error', { error: error.message });
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Check if running in mock mode
   */
  isMock() {
    return this.isMockMode;
  }

  /**
   * Get public key for frontend
   */
  getPublicKey() {
    return process.env.RAZORPAY_KEY_ID || 'mock_key';
  }
}

// Singleton instance
let instance = null;

const getInstance = () => {
  if (!instance) {
    instance = new RazorpayService();
  }
  return instance;
};

module.exports = getInstance();