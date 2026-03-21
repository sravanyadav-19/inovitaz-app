/**
 * Centralized API Client
 * Single axios instance with interceptors for auth and error handling
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    const { status, data } = error.response;

    // Unauthorized - clear auth and redirect
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error(data?.message || 'Session expired. Please login again.'));
    }

    // Forbidden
    if (status === 403) {
      return Promise.reject(new Error(data?.message || 'Access denied.'));
    }

    // Rate limited
    if (status === 429) {
      return Promise.reject(new Error('Too many requests. Please wait and try again.'));
    }

    // Server error
    if (status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    // Other errors
    return Promise.reject(new Error(data?.message || 'Something went wrong.'));
  }
);

/**
 * API helper methods
 */
export const apiClient = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

export default api;