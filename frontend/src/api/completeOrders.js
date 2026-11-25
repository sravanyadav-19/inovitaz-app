/**
 * Complete Orders API — order.inovitaz.in v2 (40/30/30 builds)
 */

import api from "./axios";

export const completeOrdersAPI = {
  getDeliveryAddresses: async () => {
    const response = await api.get("/complete-orders/delivery-addresses");
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/complete-orders", payload);
    return response.data;
  },

  getMine: async () => {
    const response = await api.get("/complete-orders/mine");
    return response.data;
  },

  payInstallment: async (orderId, installmentNumber) => {
    const response = await api.post(`/complete-orders/${orderId}/pay`, {
      installmentNumber,
    });
    return response.data;
  },

  // Admin
  getAll: async () => {
    const response = await api.get("/complete-orders");
    return response.data;
  },

  update: async (orderId, payload) => {
    const response = await api.patch(`/complete-orders/${orderId}`, payload);
    return response.data;
  },
};
