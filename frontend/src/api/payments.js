import api from './auth';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export const paymentsAPI = {
  createOrder: async (projectId, couponCode = null) => {
    const response = await api.post('/payment/create-order', { 
      projectId,
      couponCode 
    });
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
  getMyOrders: async () => {
    const res = await fetch(`${API_URL}/orders`, {  // ✅ FIXED: consistent API_URL
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return res.json();
  },

  getPurchased: async () => {
    const res = await fetch(`${API_URL}/orders/purchased`, {  // ✅ FIXED: changed from /downloads
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    
    // Map response to expected format
    return {
      success: data.success,
      data: {
        downloads: data.data || []
      }
    };
  },
};