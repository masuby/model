/**
 * PROTECTED ROUTE COMPONENT
 * Wraps routes that require authentication
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null, requiredModule = null }) => {
  const { user, hasRole, hasPermission, canAccessModule } = useAuth();

  // Check if user is authenticated
  if (!user) {
    console.log('🔒 Not authenticated, redirecting to login...');
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    console.log(`🚫 Access denied: User role "${user.role}" does not match required role "${requiredRole}"`);
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ color: '#F44336', marginBottom: '15px' }}>Access Denied</h2>
        <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
          You do not have permission to access this page. This page requires <strong>{requiredRole}</strong> role.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '25px',
            padding: '12px 30px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log(`🚫 Access denied: Missing permission "${requiredPermission}"`);
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>⛔</div>
        <h2 style={{ color: '#F44336', marginBottom: '15px' }}>Insufficient Permissions</h2>
        <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
          You do not have the required permissions to access this feature.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '25px',
            padding: '12px 30px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Check module access requirement
  if (requiredModule && !canAccessModule(requiredModule)) {
    console.log(`🚫 Access denied: Cannot access module "${requiredModule}"`);
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>📦</div>
        <h2 style={{ color: '#F44336', marginBottom: '15px' }}>Module Access Denied</h2>
        <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
          Your account does not have access to this module. Please contact your administrator if you need access.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '25px',
            padding: '12px 30px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // All checks passed, render children
  return children;
};

export default ProtectedRoute;
