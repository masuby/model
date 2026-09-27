# INFORM Tanzania - Authentication System

## Overview

The INFORM Tanzania platform now includes a comprehensive user authentication and authorization system with role-based access control (RBAC). This system ensures secure access to platform features based on user roles and permissions.

## Features

### 1. **User Roles**

The system supports four distinct user roles:

- **Administrator** (`admin`)
  - Full system access
  - User management capabilities
  - Can issue warnings
  - Access all modules
  - Export all reports
  - Edit system settings

- **PMO Officer** (`pmo_officer`)
  - Issue national warnings
  - View all district data
  - Export reports
  - Access all modules
  - Cannot manage users or edit system settings

- **Regional Officer** (`regional_officer`)
  - View regional data only
  - Export reports for their region
  - Access educational and risk modules
  - Cannot issue warnings
  - Limited to assigned region

- **Public User** (`public_user`)
  - Read-only access to public data
  - Access educational module only
  - Cannot export reports
  - Cannot issue warnings
  - Basic information viewing

### 2. **Authentication Features**

- **Secure Login/Logout**: Email and password-based authentication
- **Session Management**: Persistent sessions using localStorage
- **Protected Routes**: Route-level access control
- **Permission-Based Access**: Granular permission checking
- **User Profile Management**: Update personal information
- **Password Management**: Change password functionality

### 3. **Security Features**

- Role-based access control (RBAC)
- Protected routes with automatic redirects
- Permission validation at component level
- Session persistence across page reloads
- Secure logout functionality

## Technical Implementation

### File Structure

```
src/
├── services/
│   └── authService.js              # Authentication logic and user management
├── context/
│   └── AuthContext.jsx             # React context for auth state
├── components/
│   └── auth/
│       ├── Login.jsx               # Login interface
│       ├── UserProfile.jsx         # User profile management
│       ├── ProtectedRoute.jsx      # Route protection component
│       └── Auth.css                # Authentication styles
└── App.jsx                         # Updated with Router and Auth Provider
```

### Core Components

#### 1. Authentication Service
**File**: [authService.js](src/services/authService.js)

```javascript
import authService from './services/authService';

// Login
const result = await authService.login(email, password);

// Logout
authService.logout();

// Check authentication
const isAuth = authService.isAuthenticated();

// Check permissions
const canIssue = authService.hasPermission('canIssueWarnings');

// Check role
const isAdmin = authService.hasRole('admin');
```

#### 2. Authentication Context
**File**: [AuthContext.jsx](src/context/AuthContext.jsx)

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout, hasPermission } = useAuth();

  return (
    <div>
      {user && <p>Welcome, {user.name}!</p>}
    </div>
  );
}
```

#### 3. Protected Routes
**File**: [ProtectedRoute.jsx](src/components/auth/ProtectedRoute.jsx)

```javascript
import ProtectedRoute from './components/auth/ProtectedRoute';

// Require authentication only
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Require specific role
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Require specific permission
<ProtectedRoute requiredPermission="canIssueWarnings">
  <WarningModule />
</ProtectedRoute>
```

## Usage

### For Users

#### Logging In

1. Navigate to http://localhost:5173/login
2. Enter your email and password
3. Click "Sign In"

**Demo Accounts** (for testing):

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@pmo.go.tz | admin123 |
| PMO Officer | officer@pmo.go.tz | officer123 |
| Regional Officer | regional@dodoma.go.tz | regional123 |
| Public User | public@example.com | public123 |

#### Accessing Your Profile

1. Click on your avatar in the sidebar (bottom)
2. Click "👤 Profile" button
3. View or edit your information
4. Click "Edit Profile" to modify details

#### Logging Out

- Click "🚪 Logout" button in the sidebar
- Or click "Logout" in your profile page

### For Developers

#### Adding Authentication to a Component

```javascript
import { useAuth } from '../../context/AuthContext';

function MyComponent() {
  const { user, hasPermission } = useAuth();

  if (!hasPermission('canExportReports')) {
    return <div>You don't have permission to export reports.</div>;
  }

  return <div>Export content here...</div>;
}
```

#### Creating Protected Routes

```javascript
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

#### Checking Permissions

```javascript
const { hasPermission, hasRole } = useAuth();

// Check permission
if (hasPermission('canIssueWarnings')) {
  // Show warning button
}

// Check role
if (hasRole('admin')) {
  // Show admin panel
}
```

## Permissions Matrix

| Permission | Admin | PMO Officer | Regional Officer | Public User |
|-----------|-------|-------------|------------------|-------------|
| canManageUsers | ✅ | ❌ | ❌ | ❌ |
| canIssueWarnings | ✅ | ✅ | ❌ | ❌ |
| canViewAllData | ✅ | ✅ | ❌ | ❌ |
| canExportReports | ✅ | ✅ | ✅ | ❌ |
| canEditSystemSettings | ✅ | ❌ | ❌ | ❌ |
| canAccessAllModules | ✅ | ✅ | ❌ | ❌ |

## Module Access Control

| Module | Admin | PMO Officer | Regional Officer | Public User |
|--------|-------|-------------|------------------|-------------|
| 01 - Education | ✅ | ✅ | ✅ | ✅ |
| 02 - Risk | ✅ | ✅ | ✅ | ❌ |
| 03 - Warning | ✅ | ✅ | ❌ | ❌ |
| 04 - Severity | ✅ | ✅ | ❌ | ❌ |
| 05 - Climate | ✅ | ✅ | ❌ | ❌ |

## Data Storage

Currently using **localStorage** for session persistence. In production:

### Recommended: Migrate to Backend API

```javascript
// Example backend integration
class AuthService {
  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      return { success: true, user: data.user };
    }

    return { success: false, error: data.message };
  }
}
```

## Security Best Practices

### Current Implementation
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Permission validation
- ✅ Session management
- ⚠️ Mock user database (for development)
- ⚠️ Plaintext passwords (for development)

### Production Requirements
- [ ] Backend API integration
- [ ] Password hashing (bcrypt/argon2)
- [ ] JWT or session tokens
- [ ] HTTPS enforcement
- [ ] Rate limiting
- [ ] Password strength requirements
- [ ] Account lockout after failed attempts
- [ ] Email verification
- [ ] Two-factor authentication (optional)

## Customization

### Adding New Roles

```javascript
// In authService.js
export const USER_ROLES = {
  ADMIN: 'admin',
  PMO_OFFICER: 'pmo_officer',
  REGIONAL_OFFICER: 'regional_officer',
  PUBLIC_USER: 'public_user',
  CUSTOM_ROLE: 'custom_role'  // Add new role
};

export const ROLE_PERMISSIONS = {
  custom_role: {
    canManageUsers: false,
    canIssueWarnings: true,
    // ... define permissions
  }
};
```

### Adding New Permissions

```javascript
// Add to ROLE_PERMISSIONS
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    canManageUsers: true,
    canCustomAction: true,  // New permission
    // ... other permissions
  }
};
```

## Troubleshooting

### Issue: "Not authenticated" error on page refresh
**Solution**: User data is stored in localStorage and loaded automatically on app mount.

### Issue: Can't access a module
**Solution**: Check your user role and permissions. Contact administrator if you need access.

### Issue: Login button doesn't work
**Solution**: Check browser console for errors. Ensure dev server is running.

### Issue: Logout doesn't work
**Solution**: Clear browser localStorage manually: `localStorage.clear()` in console.

## Future Enhancements

- [ ] OAuth integration (Google, Microsoft)
- [ ] LDAP/Active Directory support
- [ ] Audit logging
- [ ] Session timeout
- [ ] Remember me functionality
- [ ] Password reset via email
- [ ] User registration workflow
- [ ] Account activation
- [ ] Role assignment by administrators
- [ ] Permission editor UI

## API Reference

### AuthService Methods

```javascript
// Login user
authService.login(email, password)
  .then(result => {
    if (result.success) {
      console.log('Logged in:', result.user);
    }
  });

// Logout user
authService.logout();

// Get current user
const user = authService.getCurrentUser();

// Check authentication
const isAuth = authService.isAuthenticated();

// Check role
const hasRole = authService.hasRole('admin');

// Check permission
const hasPerm = authService.hasPermission('canIssueWarnings');

// Check module access
const canAccess = authService.canAccessModule('03');

// Update profile
authService.updateProfile(userId, { name: 'New Name' });

// Change password
authService.changePassword(userId, oldPassword, newPassword);
```

## Support

For issues related to authentication:
1. Check browser console for errors
2. Verify localStorage is enabled
3. Clear cache and try again
4. Contact: info@pmo.go.tz

---

**Implemented with INFORM Tanzania Platform**
*Prime Minister's Office - Disaster Management Department*
