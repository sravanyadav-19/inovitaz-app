import api from './auth';

export const paymentsAPI = {
  createOrder: async (projectId) => {
    const response = await api.post('/payment/create-order', { projectId });
    return response.data;
  },

  verifyPayment: async (data) => {
    const response = await api.post('/payment/verify-payment', data);
    return response.data;
  },

  getStatus: async (orderId) => {
    const response = await api.get(`/payment/status/${orderId}`);
    return response.data;
  },
};

export const ordersAPI = {
  getMyOrders: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/orders/my?${queryParams.toString()}`);
    return response.data;
  },

  getPurchased: async () => {
    const response = await api.get('/orders/purchased');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};