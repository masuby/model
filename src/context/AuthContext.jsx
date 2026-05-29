/**
 * AUTHENTICATION CONTEXT
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

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

  // Load user on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false, institution = null) => {
    const result = await authService.login(email, password, rememberMe, institution);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  // Refresh session on user activity
  const refreshSession = () => {
    authService.refreshSession();
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (userId, updates) => {
    const result = await authService.updateProfile(userId, updates);
    if (result.success && user?.id === userId) {
      setUser(result.user);
    }
    return result;
  };

  // Listen for session timeout events
  useEffect(() => {
    const handleSessionTimeout = () => {
      setUser(null);
      // Alert can be handled by UI component
      window.location.href = '/login?session_expired=true';
    };

    window.addEventListener('sessionTimeout', handleSessionTimeout);
    return () => window.removeEventListener('sessionTimeout', handleSessionTimeout);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshSession,
    isAuthenticated: () => authService.isAuthenticated(),
    hasRole: (role) => authService.hasRole(role),
    hasPermission: (permission) => authService.hasPermission(permission),
    canAccessModule: (moduleId) => authService.canAccessModule(moduleId)
  };

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🇹🇿</div>
          <h2 style={{ margin: '0 0 10px 0' }}>INFORM Tanzania</h2>
          <p style={{ opacity: 0.8 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
