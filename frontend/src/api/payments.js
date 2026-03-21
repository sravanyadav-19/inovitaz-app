/**
 * Payment API
 * Handles order creation and verification
 */

import api from './axios';

export const paymentsAPI = {
  /**
   * Create Razorpay order
   * @param {number} projectId - Project to purchase
   * @param {string} couponCode - Optional coupon code
   */
  createOrder: async (projectId, couponCode = null) => {
    const response = await api.post('/payment/create-order', {
      projectId,
      couponCode
    });
    return response.data;
  },

  /**
   * Verify payment after Razorpay callback
   */
  verifyPayment: async (data) => {
    const response = await api.post('/payment/verify', data);
    return response.data;
  },
};

export const ordersAPI = {
  /**
   * Get current user's orders
   */
  getMyOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  /**
   * Get purchased/downloadable projects
   */
  getPurchased: async () => {
    const response = await api.get('/orders/purchased');
    return response.data;
  },
};

export const couponsAPI = {
  /**
   * Validate coupon code
   * @param {string} code - Coupon code
   * @param {number} projectId - Project ID
   * @param {number} amount - Original amount
   */
  validate: async (code, projectId, amount) => {
    const response = await api.post('/coupons/validate', {
      code,
      project_id: projectId,
      amount
    });
    return response.data;
  },
};