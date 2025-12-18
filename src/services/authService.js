/**
 * AUTHENTICATION SERVICE
 * Handles user authentication, authorization, and session management
 * Supports role-based access control for INFORM Tanzania Platform
 */

// User roles in the system
export const USER_ROLES = {
  ADMIN: 'admin',
  PMO_OFFICER: 'pmo_officer',
  REGIONAL_OFFICER: 'regional_officer',
  INSTITUTION_USER: 'institution_user',
  PUBLIC_USER: 'public_user'
};

// Institutions that provide hazard data
export const INSTITUTIONS = {
  TMA: { id: 'tma', name: 'Tanzania Meteorological Authority', shortName: 'TMA', icon: '🌦️', hazardTypes: ['flood', 'drought', 'cyclone', 'heavy_rain', 'strong_wind'] },
  MOW: { id: 'mow', name: 'Ministry of Water', shortName: 'MoW', icon: '💧', hazardTypes: ['flood', 'drought', 'water_shortage'] },
  MOH: { id: 'moh', name: 'Ministry of Health', shortName: 'MoH', icon: '🏥', hazardTypes: ['disease_outbreak', 'epidemic', 'health_emergency'] },
  MOA: { id: 'moa', name: 'Ministry of Agriculture', shortName: 'MoA', icon: '🌾', hazardTypes: ['drought', 'pest_outbreak', 'crop_disease', 'food_security'] },
  GST: { id: 'gst', name: 'Geological Survey of Tanzania', shortName: 'GST', icon: '🌍', hazardTypes: ['earthquake', 'landslide', 'volcanic_activity'] },
  PMO_DMD: { id: 'pmo_dmd', name: 'PMO - Disaster Management Department', shortName: 'PMO-DMD', icon: '🏛️', hazardTypes: ['all'] }
};

// Session timeout in milliseconds (30 minutes)
export const SESSION_TIMEOUT = 30 * 60 * 1000;

// Tanzania Regions for Regional Officer selection
export const REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera',
  'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara',
  'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pemba North',
  'Pemba South', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu',
  'Singida', 'Songwe', 'Tabora', 'Tanga', 'Unguja North', 'Unguja South'
];

// Role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    canManageUsers: true,
    canIssueWarnings: true,
    canViewAllData: true,
    canExportReports: true,
    canEditSystemSettings: true,
    canAccessAllModules: true
  },
  [USER_ROLES.PMO_OFFICER]: {
    canManageUsers: false,
    canIssueWarnings: true,
    canViewAllData: true,
    canExportReports: true,
    canEditSystemSettings: false,
    canAccessAllModules: true
  },
  [USER_ROLES.REGIONAL_OFFICER]: {
    canManageUsers: false,
    canIssueWarnings: false,
    canViewAllData: false, // Only their region
    canExportReports: true,
    canEditSystemSettings: false,
    canAccessAllModules: false
  },
  [USER_ROLES.INSTITUTION_USER]: {
    canManageUsers: false,
    canIssueWarnings: false,
    canSubmitHazardInput: true, // Can submit hazard data
    canViewAllData: false, // Only their institution's data
    canExportReports: true,
    canEditSystemSettings: false,
    canAccessAllModules: false,
    canReceivePMORequests: true, // Can receive requests from PMO-DMD
    canHandleRollbacks: true // Can process rollback requests
  },
  [USER_ROLES.PUBLIC_USER]: {
    canManageUsers: false,
    canIssueWarnings: false,
    canViewAllData: false, // Read-only public data
    canExportReports: false,
    canEditSystemSettings: false,
    canAccessAllModules: false
  }
};

/**
 * Mock user database (will be replaced with real backend)
 * In production, this should connect to a secure backend API
 */
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@pmo.go.tz',
    password: 'Inform@Admin2025', // In production: hashed password
    name: 'System Administrator',
    role: USER_ROLES.ADMIN,
    department: 'IT Department',
    phone: '+255 26 2322480',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    email: 'emmanuel.lymo@pmo.go.tz',
    password: 'Inform@PMO2025',
    name: 'Emmanuel Lymo',
    role: USER_ROLES.PMO_OFFICER,
    department: 'Disaster Management Department',
    phone: '+255 26 2322481',
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    email: 'regional@dodoma.go.tz',
    password: 'Inform@Regional2025',
    name: 'Regional Officer',
    role: USER_ROLES.REGIONAL_OFFICER,
    department: 'Regional Disaster Management Office',
    region: 'Dodoma',
    phone: '+255 26 2322482',
    createdAt: '2024-02-01'
  },
  // Institution Users
  {
    id: '5',
    email: 'tma@tma.go.tz',
    password: 'Inform@TMA2025',
    name: 'TMA',
    role: USER_ROLES.INSTITUTION_USER,
    institution: 'TMA',
    institutionName: 'Tanzania Meteorological Authority',
    department: 'Central Forecasting Office (CFO)',
    phone: '+255 22 2460706',
    createdAt: '2024-01-10'
  },
  {
    id: '6',
    email: 'mow@mow.go.tz',
    password: 'Inform@MOW2025',
    name: 'MoW',
    role: USER_ROLES.INSTITUTION_USER,
    institution: 'MOW',
    institutionName: 'Ministry of Water',
    department: 'Water Resources Management',
    phone: '+255 22 2451448',
    createdAt: '2024-01-12'
  },
  {
    id: '7',
    email: 'moh@moh.go.tz',
    password: 'Inform@MOH2025',
    name: 'MoH',
    role: USER_ROLES.INSTITUTION_USER,
    institution: 'MOH',
    institutionName: 'Ministry of Health',
    department: 'Disease Surveillance Unit',
    phone: '+255 22 2120261',
    createdAt: '2024-01-15'
  },
  {
    id: '8',
    email: 'moa@moa.go.tz',
    password: 'Inform@MOA2025',
    name: 'MoA',
    role: USER_ROLES.INSTITUTION_USER,
    institution: 'MOA',
    institutionName: 'Ministry of Agriculture',
    department: 'Crop Monitoring Division',
    phone: '+255 22 2862480',
    createdAt: '2024-01-18'
  },
  {
    id: '9',
    email: 'gst@gst.go.tz',
    password: 'Inform@GST2025',
    name: 'GST',
    role: USER_ROLES.INSTITUTION_USER,
    institution: 'GST',
    institutionName: 'Geological Survey of Tanzania',
    department: 'Seismology Division',
    phone: '+255 22 2650745',
    createdAt: '2024-01-20'
  }
];

/**
 * Authentication Service Class
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.sessionStartTime = null;
    this.sessionTimeoutId = null;
    this.loadUserFromStorage();
  }

  /**
   * Load user from localStorage on initialization
   */
  loadUserFromStorage() {
    try {
      const storedUser = localStorage.getItem('inform_user');
      const storedSession = localStorage.getItem('inform_session');
      const rememberMe = localStorage.getItem('inform_remember_me') === 'true';

      if (storedUser && storedSession) {
        const sessionData = JSON.parse(storedSession);
        const sessionAge = Date.now() - sessionData.startTime;

        // Check if session has expired (skip if remember me is enabled)
        if (!rememberMe && sessionAge > SESSION_TIMEOUT) {
          console.log('⏰ Session expired, logging out...');
          this.clearSession();
          return;
        }

        this.currentUser = JSON.parse(storedUser);
        this.sessionStartTime = sessionData.startTime;
        console.log('✅ User loaded from storage:', this.currentUser.email);

        // Start session timeout monitoring (only if not remember me)
        if (!rememberMe) {
          this.startSessionTimeout();
        }
      }
    } catch (error) {
      console.error('❌ Error loading user from storage:', error);
      this.clearSession();
    }
  }

  /**
   * Clear all session data
   */
  clearSession() {
    localStorage.removeItem('inform_user');
    localStorage.removeItem('inform_session');
    // Note: Don't remove remember_me here, only on explicit logout
    this.currentUser = null;
    this.sessionStartTime = null;
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  /**
   * Start session timeout monitoring
   */
  startSessionTimeout() {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }

    const remainingTime = SESSION_TIMEOUT - (Date.now() - this.sessionStartTime);

    if (remainingTime > 0) {
      this.sessionTimeoutId = setTimeout(() => {
        console.log('⏰ Session timeout reached, logging out...');
        this.logout();
        // Dispatch event for UI to handle
        window.dispatchEvent(new CustomEvent('sessionTimeout'));
      }, remainingTime);
    }
  }

  /**
   * Refresh session (call on user activity)
   */
  refreshSession() {
    const rememberMe = localStorage.getItem('inform_remember_me') === 'true';
    if (this.currentUser && !rememberMe) {
      this.sessionStartTime = Date.now();
      localStorage.setItem('inform_session', JSON.stringify({ startTime: this.sessionStartTime }));
      this.startSessionTimeout();
    }
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Whether to remember the user
   * @param {string} institution - Selected institution (optional)
   * @returns {Promise<object>} User object or error
   */
  async login(email, password, rememberMe = false, institution = null) {
    try {
      console.log('🔐 Attempting login for:', email, institution ? `(${institution})` : '');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find user in mock database
      let user = MOCK_USERS.find(u => u.email === email);

      // If institution is specified, verify user belongs to that institution
      if (institution && user && user.institution && user.institution !== institution) {
        throw new Error('You are not registered with the selected institution.');
      }

      if (!user) {
        throw new Error('User not found. Please check your email.');
      }

      if (user.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      // Store user in memory and localStorage
      this.currentUser = userWithoutPassword;
      this.sessionStartTime = Date.now();

      localStorage.setItem('inform_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('inform_session', JSON.stringify({ startTime: this.sessionStartTime }));
      localStorage.setItem('inform_remember_me', rememberMe.toString());

      // Start session timeout if not remember me
      if (!rememberMe) {
        this.startSessionTimeout();
      }

      console.log('✅ Login successful:', user.email, `(${user.role})`, rememberMe ? '(remembered)' : '');

      return {
        success: true,
        user: userWithoutPassword,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Register new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Result object
   */
  async register(userData) {
    try {
      console.log('📝 Registering new user:', userData.email);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user already exists
      const existingUser = MOCK_USERS.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('Email already registered. Please login instead.');
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        password: userData.password, // In production: hash this
        name: userData.name,
        role: userData.role || USER_ROLES.PUBLIC_USER,
        department: userData.department || null,
        region: userData.region || null,
        phone: userData.phone || null,
        createdAt: new Date().toISOString()
      };

      // Add to mock database
      MOCK_USERS.push(newUser);

      console.log('✅ Registration successful:', newUser.email);

      return {
        success: true,
        message: 'Registration successful. Please login.'
      };

    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Logout current user
   */
  logout() {
    console.log('🚪 Logging out:', this.currentUser?.email);
    this.clearSession();
    localStorage.removeItem('inform_remember_me');
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Get current logged-in user
   * @returns {object|null} Current user object
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is logged in
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole(role) {
    return this.currentUser?.role === role;
  }

  /**
   * Check if user has permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has the permission
   */
  hasPermission(permission) {
    if (!this.currentUser) return false;
    const permissions = ROLE_PERMISSIONS[this.currentUser.role];
    return permissions?.[permission] || false;
  }

  /**
   * Check if user can access a module
   * @param {string} moduleId - Module ID to check
   * @returns {boolean} True if user can access the module
   */
  canAccessModule(moduleId) {
    if (!this.currentUser) return false;

    // Admin and PMO officers can access all modules
    if (this.hasPermission('canAccessAllModules')) {
      return true;
    }

    // Regional officers can access educational and risk modules
    if (this.hasRole(USER_ROLES.REGIONAL_OFFICER)) {
      return ['01', '02'].includes(moduleId); // Education and Risk modules
    }

    // Public users can only access educational module
    if (this.hasRole(USER_ROLES.PUBLIC_USER)) {
      return moduleId === '01';
    }

    return false;
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<Array>} List of users
   */
  async getAllUsers() {
    if (!this.hasPermission('canManageUsers')) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Remove passwords from response
    return MOCK_USERS.map(({ password, ...user }) => user);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {object} updates - Profile updates
   * @returns {Promise<object>} Updated user object
   */
  async updateProfile(userId, updates) {
    try {
      // Find user
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Update user (except password and role - those require special handling)
      const { password, role, ...allowedUpdates } = updates;
      MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...allowedUpdates };

      // Update current user if it's the logged-in user
      if (this.currentUser?.id === userId) {
        const { password: _, ...updatedUser } = MOCK_USERS[userIndex];
        this.currentUser = updatedUser;
        localStorage.setItem('inform_user', JSON.stringify(updatedUser));
      }

      console.log('✅ Profile updated for user:', userId);
      return { success: true, user: MOCK_USERS[userIndex] };

    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Result object
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = MOCK_USERS.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.password !== oldPassword) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
      console.log('✅ Password changed for user:', userId);

      return { success: true, message: 'Password changed successfully' };

    } catch (error) {
      console.error('❌ Password change failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
