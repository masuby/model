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
  // Development mode: auto-login. Set DEV_ROLE to switch the auto-login
  // identity without touching the login form. Real credentials are still
  // available via the login screen when DEV_MODE = false.
  //
  //   ADMIN credentials (for login form when DEV_MODE = false):
  //     admin@pmo.go.tz / Inform@Admin2025
  //   Other built-ins listed in src/services/authService.js MOCK_USERS.
  const DEV_MODE = true;
  const DEV_ROLE = 'admin';   // 'admin' | 'pmo_officer' | 'regional_committee' | etc.

  const DEV_USER_PRESETS = {
    admin: {
      id: 'dev-admin-001',
      name: 'System Administrator (Dev)',
      email: 'admin@pmo.go.tz',
      role: 'admin',
      department: 'IT Department',
      institution: 'PMO-DMD',
      permissions: ['*'],
      avatar: '🛡️'
    },
    pmo_officer: {
      id: 'dev-pmo-001',
      name: 'PMO Officer (Dev)',
      email: 'pmo@inform.tz',
      role: 'pmo_officer',
      department: 'Disaster Management Department',
      institution: 'PMO-DMD',
      permissions: ['canValidateData', 'canIssueWarnings', 'canViewAllData'],
      avatar: '🏛️'
    },
    regional_committee: {
      id: 'dev-user-001',
      name: 'Arusha Regional Committee',
      email: 'arusha@committee.tz',
      role: 'regional_committee',
      region: 'Arusha',
      institution: null,
      permissions: ['canSubmitCommitteeData', 'canViewOwnCommitteeData', 'canAccessCommitteeModule'],
      avatar: '👤'
    }
  };
  const DEV_USER = DEV_MODE ? (DEV_USER_PRESETS[DEV_ROLE] ?? DEV_USER_PRESETS.admin) : null;

  const [user, setUser] = useState(DEV_USER);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const currentUser = DEV_MODE ? DEV_USER : authService.getCurrentUser();
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
