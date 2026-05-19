/**
 * Payment API
 * Handles order creation and verification
 */

import api from "./axios";

export const paymentsAPI = {
  /**
   * Create Razorpay/mock order
   */
  createOrder: async (projectId, couponCode = null) => {
    const payload = {
      projectId: Number(projectId),
    };

    if (couponCode && String(couponCode).trim()) {
      payload.couponCode = String(couponCode).trim().toUpperCase();
    }

    const response = await api.post("/payment/create-order", payload);
    return response.data;
  },

  /**
   * Verify payment after Razorpay/mock callback
   */
  verifyPayment: async (data) => {
    const response = await api.post("/payment/verify", data);
    return response.data;
  },
};

export const ordersAPI = {
  /**
   * Get current user's orders
   */
  getMyOrders: async () => {
    const response = await api.get("/orders");
    return response.data;
  },

  /**
   * Get purchased/downloadable projects
   */
  getPurchased: async () => {
    const response = await api.get("/orders/purchased");
    return response.data;
  },
};

export const couponsAPI = {
  /**
   * Validate coupon code
   */
  validate: async (code, projectId, amount) => {
    const response = await api.post("/coupons/validate", {
      code,
      project_id: projectId,
      amount,
    });

    return response.data;
  },
};