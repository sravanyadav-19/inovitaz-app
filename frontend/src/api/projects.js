// src/api/projects.js
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Read token from localStorage
const getToken = () => localStorage.getItem('token');

// PUBLIC PROJECT APIs
export const projectsAPI = {
  getAll: async (params = {}) => {
    try {
      const q = new URLSearchParams(params).toString();
      const res = await fetch(`${API_URL}/projects?${q}`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching projects:', err);
      return { success: false, data: { projects: [] } };
    }
  },

  getById: async (id) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/projects/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    const res = await response.json();

    // Normalize backend structure for frontend
    return {
      success: res.success,
      data: res.data?.project || res.data || null
    };
  },

  getByCategory: async (category) => {
    try {
      const res = await fetch(`${API_URL}/projects?category=${category}`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching projects:', err);
      return { success: false, data: { projects: [] } };
    }
  },

  // ✅ ADDED: Get categories function
  getCategories: async () => {
    try {
      const res = await fetch(`${API_URL}/projects/categories`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback to hardcoded categories if API not ready
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

  // ⚠️ MODIFIED: Wishlist functions (disabled until backend ready)
  getWishlist: async () => {
    // Return empty wishlist until backend is ready
    return { success: true, data: [] };
    
    /* UNCOMMENT WHEN BACKEND IS READY:
    try {
      const token = getToken();
      if (!token) return { success: false, data: [] };

      const res = await fetch(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      return { success: false, data: [] };
    }
    */
  },

  addToWishlist: async (projectId) => {
    // Temporarily use localStorage until backend ready
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (!wishlist.includes(projectId)) {
      wishlist.push(projectId);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    return { success: true, message: 'Added to wishlist (local)' };
    
    /* UNCOMMENT WHEN BACKEND IS READY:
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ project_id: projectId })
      });
      return await res.json();
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      return { success: false, message: err.message };
    }
    */
  },

  removeFromWishlist: async (projectId) => {
    // Temporarily use localStorage until backend ready
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    wishlist = wishlist.filter(id => id !== projectId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    return { success: true, message: 'Removed from wishlist (local)' };
    
    /* UNCOMMENT WHEN BACKEND IS READY:
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/wishlist/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      return { success: false, message: err.message };
    }
    */
  },

  download: async (projectId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/projects/${projectId}/download`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      return await response.json();
    } catch (error) {
      console.error("Download request failed:", error);
      return { success: false, message: "Download failed" };
    }
  },
};


// FIXED ADMIN FETCH (with Bearer auth)
const adminFetch = async (url, options = {}) => {
  const token = getToken();

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  return await res.json();
};

// ADMIN APIs
export const adminProjectsAPI = {
  getStats: async () => {
    return await adminFetch(`${API_URL}/admin/stats`);
  },

  create: async (data) => {
    return await adminFetch(`${API_URL}/admin/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return await adminFetch(`${API_URL}/admin/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return await adminFetch(`${API_URL}/admin/projects/${id}`, {
      method: 'DELETE',
    });
  },

  getAllOrders: async () => {
    return await adminFetch(`${API_URL}/admin/orders`);
  },

  getAllUsers: async () => {
    return await adminFetch(`${API_URL}/admin/users`);
  },
};