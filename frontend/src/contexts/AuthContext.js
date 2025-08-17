import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios to include credentials; stop using Authorization header
  axios.defaults.withCredentials = true;

  // Add CSRF header from cookie for state-changing requests
  axios.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const match = document.cookie.match(/(?:^|; )csrf=([^;]+)/);
      const token = match ? decodeURIComponent(match[1]) : '';
      if (token) {
        config.headers['X-CSRF-Token'] = token;
      }
    }
    return config;
  });

  const checkAuth = async () => {
    try {
      // Server will read auth from HttpOnly cookie; no local token handling
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
      const response = await axios.get(`${config.API_BASE_URL}/api/auth/me`);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      // Clear invalid local user cache
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookie
      await axios.get(`${config.API_BASE_URL}/api/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(updates || {}) };
      try {
        localStorage.setItem('user', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    logout,
    checkAuth,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 