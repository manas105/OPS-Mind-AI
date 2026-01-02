import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user from localStorage on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set the authorization header using the api client
          api.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const userData = await api.get('/auth/me');
          setUser(userData.data.user);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        // Clear invalid token
        localStorage.removeItem('token');
        if (api.client.defaults.headers.common['Authorization']) {
          delete api.client.defaults.headers.common['Authorization'];
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      console.log('🔐 Attempting login with:', { email, password: '***' });
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response:', response);
      console.log('📊 Response data:', response.data);
      console.log('🔍 Response data keys:', Object.keys(response.data || {}));
      
      const { token, user } = response.data;
      console.log('🔑 Extracted token:', !!token);
      console.log('👤 Extracted user:', !!user);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set default auth header
      api.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update user state
      setUser(user);
      return user;
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('🔥 Error response:', err.response);
      console.error('📊 Error status:', err.response?.status);
      console.error('📄 Error data:', err.response?.data);
      console.error('💬 Error message:', err.message);
      
      // Show detailed validation errors
      if (err.response?.data?.errors) {
        console.error('🚨 Validation errors:', err.response.data.errors);
      }
      
      // Handle network errors
      if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        const errorMessage = 'Network error. Please check your connection and try again.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Handle CORS errors
      if (err.message.includes('CORS')) {
        const errorMessage = 'CORS error. Please contact support.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Extract specific error message
      let errorMessage = 'Login failed. Please try again.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.errors?.length > 0) {
        errorMessage = err.response.data.errors.map(e => e.msg || e.message).join(', ');
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      setError(null);
      console.log('📝 Attempting registration with:', { name, email, password: '***' });
      const response = await api.post('/auth/register', { name, email, password });
      console.log('✅ Registration response:', response);
      console.log('📊 Response data:', response.data);
      console.log('🔍 Response data keys:', Object.keys(response.data || {}));
      
      const { token, user } = response.data;
      console.log('🔑 Extracted token:', !!token);
      console.log('👤 Extracted user:', !!user);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set default auth header
      api.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update user state
      setUser(user);
      return user;
    } catch (err) {
      console.error('❌ Register error:', err);
      console.error('🔥 Error response:', err.response);
      console.error('📊 Error status:', err.response?.status);
      console.error('📄 Error data:', err.response?.data);
      console.error('💬 Error message:', err.message);
      console.error('🔍 Full error object:', err);
      
      // Show detailed validation errors
      if (err.response?.data?.errors) {
        console.error('🚨 Validation errors:', err.response.data.errors);
      }
      
      // Handle network errors
      if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        const errorMessage = 'Network error. Please check your connection and try again.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Handle CORS errors
      if (err.message.includes('CORS')) {
        const errorMessage = 'CORS error. Please contact support.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Extract specific error message
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.errors?.length > 0) {
        errorMessage = err.response.data.errors.map(e => e.msg || e.message).join(', ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = useCallback(() => {
    // Clear token from storage
    localStorage.removeItem('token');
    
    // Remove auth header
    delete api.client.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
    
    // Navigate to login
    navigate('/login');
  }, [navigate]);

  // Update user function
  const updateUser = (userData) => {
    setUser(prev => ({
      ...prev,
      ...userData
    }));
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role || user?.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        hasRole,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
