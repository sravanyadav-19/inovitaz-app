// src/api/projects.js
const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

// Public (non-admin) endpoints
export const projectsAPI = {
  // Get all projects
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/projects?${queryString}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { success: false, data: { projects: [] } };
    }
  },

  // Get single project by ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching project:', error);
      return { success: false, data: null };
    }
  },

  // Get projects by category
  getByCategory: async (category) => {
    try {
      const response = await fetch(
        `${API_URL}/projects?category=${encodeURIComponent(category)}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { success: false, data: { projects: [] } };
    }
  },

  // Categories list (used in Projects.jsx)
  getCategories: async () => {
    try {
      const response = await fetch(`${API_URL}/projects/categories`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { success: false, data: [] };
    }
  },

  // Prepare download URL (used in Dashboard.jsx)
  download: async (projectId) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_URL}/projects/${projectId}/download`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        credentials: 'include',
      });
      return await response.json();
    } catch (error) {
      console.error('Error preparing download:', error);
      return { success: false, data: null };
    }
  },
};

// Helper for authenticated admin requests
const adminFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token') || '';

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined,
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  return await response.json();
};

// Admin endpoints used in AdminDashboard.jsx
export const adminProjectsAPI = {
  getStats: async () => {
    try {
      return await adminFetch(`${API_URL}/admin/stats`);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return { success: false, data: null };
    }
  },

  create: async (projectData) => {
    try {
      return await adminFetch(`${API_URL}/admin/projects`, {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false };
    }
  },

  update: async (id, projectData) => {
    try {
      return await adminFetch(`${API_URL}/admin/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      });
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false };
    }
  },

  delete: async (id) => {
    try {
      return await adminFetch(`${API_URL}/admin/projects/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false };
    }
  },

  getAllOrders: async () => {
    try {
      return await adminFetch(`${API_URL}/admin/orders`);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { success: false, data: { orders: [] } };
    }
  },

  getAllUsers: async () => {
    try {
      return await adminFetch(`${API_URL}/admin/users`);
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, data: { users: [] } };
    }
  },
};