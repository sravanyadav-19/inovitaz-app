// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (formData) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || 'Login failed');
    }

    const u = json.data.user;
    const t = json.data.token;

    setUser(u);
    setToken(t);

    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));

    return json;
  };

  const register = async (formData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || 'Registration failed');
    }

    const u = json.data.user;
    const t = json.data.token;

    setUser(u);
    setToken(t);

    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));

    return json;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
