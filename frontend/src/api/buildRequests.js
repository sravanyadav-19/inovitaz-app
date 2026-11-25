/**
 * Build Requests API — backs order.inovitaz.in
 */

import api from "./axios";

export const buildRequestsAPI = {
  create: async (payload) => {
    const response = await api.post("/build-requests", payload);
    return response.data;
  },

  getMine: async () => {
    const response = await api.get("/build-requests/mine");
    return response.data;
  },

  payAdvance: async (requestId) => {
    const response = await api.post(`/build-requests/${requestId}/pay-advance`);
    return response.data;
  },

  getPaymentStatus: async (requestId) => {
    const response = await api.get(`/build-requests/${requestId}/payment-status`);
    return response.data;
  },

  // Admin
  getAll: async (status = null) => {
    const response = await api.get("/build-requests", {
      params: status ? { status } : {},
    });
    return response.data;
  },

  update: async (requestId, payload) => {
    const response = await api.patch(`/build-requests/${requestId}`, payload);
    return response.data;
  },
};
