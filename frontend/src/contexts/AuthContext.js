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

  // Configure axios to include credentials and JWT token
  axios.defaults.withCredentials = true;

  // Add JWT token to requests if available
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const checkAuth = async () => {
    try {
      // First check if we have a token in localStorage
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // Set user from localStorage immediately for better UX
        setUser(JSON.parse(storedUser));
        
        // Then verify with server
        const response = await axios.get(`${config.API_BASE_URL}/api/auth/me`);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // If Google OAuth redirected with a token in hash, capture it once
        const hash = window.location.hash;
        if (hash && hash.includes('token=')) {
          const t = new URLSearchParams(hash.substring(1)).get('token');
          if (t) {
            localStorage.setItem('token', t);
            window.location.hash = '';
          }
        }
        const response = await axios.get(`${config.API_BASE_URL}/api/auth/me`);
        setUser(response.data.user);
      }
    } catch (error) {
      // Clear invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Call logout endpoint (for session-based auth)
      await axios.get(`${config.API_BASE_URL}/api/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 