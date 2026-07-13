/**
 * Projects API - PostgreSQL version
 */

import api from "./axios";

export const projectsAPI = {
  getAll: async (params = {}) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, value]) => value !== undefined && value !== null && value !== ""
        )
      );

      const query = new URLSearchParams(cleanParams).toString();
      const url = query ? `/projects?${query}` : "/projects";

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: { projects: [], pagination: {} },
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);

      return {
        success: response.data.success,
        data: response.data.data?.project || response.data.data || null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  getCategories: async () => {
    try {
      const response = await api.get("/projects/categories");
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: [
          { category: "IoT", count: 0 },
          { category: "Arduino", count: 0 },
          { category: "ESP32", count: 0 },
          { category: "Raspberry Pi", count: 0 },
          { category: "Robotics", count: 0 },
        ],
      };
    }
  },

  getReviews: async (projectId) => {
    try {
      // FIX: Changed from /projects/${projectId}/reviews to /reviews/${projectId}
      // to match the actual backend route definition in review.routes.js
      const response = await api.get(`/reviews/${projectId}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: { reviews: [] },
      };
    }
  },

  submitReview: async ({ project_id, rating, comment }) => {
    try {
      const response = await api.post("/reviews", {
        project_id,
        rating,
        comment,
      });

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  download: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/download`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Download failed",
      };
    }
  },

  addToWishlist: async (projectId) => {
    try {
      const response = await api.post("/wishlist", {
        project_id: projectId,
      });

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  removeFromWishlist: async (projectId) => {
    try {
      const response = await api.delete(`/wishlist/${projectId}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};

export const wishlistAPI = {
  getAll: async () => {
    try {
      const response = await api.get("/wishlist");
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  },

  add: async (projectId) => {
    try {
      const response = await api.post("/wishlist", {
        project_id: projectId,
      });

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  remove: async (projectId) => {
    try {
      const response = await api.delete(`/wishlist/${projectId}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};

export const adminProjectsAPI = {
  getStats: async () => {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/admin/projects", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/admin/projects/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/projects/${id}`);
    return response.data;
  },

  getAllOrders: async () => {
    const response = await api.get("/admin/orders");
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },

  getAllCoupons: async () => {
    const response = await api.get("/coupons");
    return response.data;
  },

  createCoupon: async (data) => {
    const response = await api.post("/coupons", data);
    return response.data;
  },

  toggleCoupon: async (id) => {
    const response = await api.patch(`/coupons/${id}/toggle`);
    return response.data;
  },

  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },
};
export const downloadProject = (projectId) => {
  return api.get(`/projects/${projectId}/download`);
};