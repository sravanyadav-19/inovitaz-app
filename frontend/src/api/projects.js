/**
 * Projects API
 * Handles all project-related API calls
 */

import api from './axios';

export const projectsAPI = {
  /**
   * Get all projects with optional filters
   */
  getAll: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/projects?${query}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { success: false, message: error.response?.data?.message || error.message, data: { projects: [], pagination: {} } };
    }
  },

  /**
   * Get single project by ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return {
        success: response.data.success,
        data: response.data.data?.project || response.data.data || null
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      return { success: false, message: error.response?.data?.message || error.message, data: null };
    }
  },

  /**
   * Get project categories with counts
   */
  getCategories: async () => {
    try {
      const response = await api.get('/projects/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { 
        success: true, 
        data: [
          { category: 'IoT', count: 0 },
          { category: 'Arduino', count: 0 },
          { category: 'ESP32', count: 0 },
          { category: 'Raspberry Pi', count: 0 },
          { category: 'Robotics', count: 0 }
        ] 
      };
    }
  },

  /**
   * Get download URL for purchased project
   */
  download: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/download`);
      return response.data;
    } catch (error) {
      console.error('Download request failed:', error);
      return { success: false, message: error.message || 'Download failed' };
    }
  },
};

/**
 * Wishlist API - Backend enabled
 */
export const wishlistAPI = {
  /**
   * Get user's wishlist
   */
  getAll: async () => {
    try {
      const response = await api.get('/wishlist');
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { success: false, message: error.response?.data?.message || error.message, data: [] };
    }
  },

  /**
   * Add project to wishlist
   */
  add: async (projectId) => {
    try {
      const response = await api.post('/wishlist', { project_id: projectId });
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Remove project from wishlist
   */
  remove: async (projectId) => {
    try {
      const response = await api.delete(`/wishlist/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, message: error.message };
    }
  },
};

/**
 * Admin Projects API
 */
export const adminProjectsAPI = {
  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /**
   * Create new project
   */
  create: async (data) => {
    const response = await api.post('/admin/projects', data);
    return response.data;
  },

  /**
   * Update project
   */
  update: async (id, data) => {
    const response = await api.put(`/admin/projects/${id}`, data);
    return response.data;
  },

  /**
   * Delete project
   */
  delete: async (id) => {
    const response = await api.delete(`/admin/projects/${id}`);
    return response.data;
  },

  /**
   * Get all orders
   */
  getAllOrders: async () => {
    const response = await api.get('/admin/orders');
    return response.data;
  },

  /**
   * Get all users
   */
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  /**
   * Get all coupons
   */
  getAllCoupons: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },

  /**
   * Create coupon
   */
  createCoupon: async (data) => {
    const response = await api.post('/coupons', data);
    return response.data;
  },

  /**
   * Toggle coupon status
   */
  toggleCoupon: async (id) => {
    const response = await api.patch(`/coupons/${id}/toggle`);
    return response.data;
  },

  /**
   * Delete coupon
   */
  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },
};