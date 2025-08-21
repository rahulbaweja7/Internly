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
      // 1) Hydrate from cache immediately so Protected routes can render without blocking
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch (_) { /* ignore */ }
        // Do not block UI if we already have a cached user; refresh in background
        setLoading(false);
      }

      // 2) Refresh user from server (cookie-auth) in the background
      const response = await axios.get(`${config.API_BASE_URL}/api/auth/me`);
      setUser(response.data.user);
      try { localStorage.setItem('user', JSON.stringify(response.data.user)); } catch (_) {}
    } catch (error) {
      // Clear invalid local user cache if server says unauthenticated
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      // If there was no cached user, we were blocking; release now
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