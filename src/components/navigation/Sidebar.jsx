/**
 * MODERN SIDEBAR NAVIGATION
 * Professional navigation with visual module cards and progress tracking
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  USER_ROLES,
  getAccessibleModules,
  getAccessibleDataViews,
  getAccessibleTools
} from '../../services/authService';
import { useLanguage, LanguageSwitcher } from '../../contexts/LanguageContext';
import './Sidebar.css';

const Sidebar = ({ currentView, onNavigate, user: propUser }) => {
  const { user: authUser, logout } = useAuth();
  const user = propUser || authUser;
  // Start collapsed on mobile, expanded on desktop
  const [isExpanded, setIsExpanded] = useState(() => {
    return window.innerWidth > 1024;
  });
  const [hoveredModule, setHoveredModule] = useState(null);

  // Get accessible items based on user role
  const accessibleModuleIds = useMemo(() => {
    return user?.role ? getAccessibleModules(user.role) : ['module01'];
  }, [user?.role]);

  const accessibleDataViewIds = useMemo(() => {
    return user?.role ? getAccessibleDataViews(user.role) : [];
  }, [user?.role]);

  const accessibleToolIds = useMemo(() => {
    return user?.role ? getAccessibleTools(user.role) : ['dashboard'];
  }, [user?.role]);

  // Initialize body class on mount
  React.useEffect(() => {
    // Set initial state based on current expansion
    if (isExpanded) {
      document.body.classList.add('sidebar-expanded');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-expanded');
    }

    return () => {
      // Cleanup on unmount
      document.body.classList.remove('sidebar-expanded');
      document.body.classList.remove('sidebar-collapsed');
    };
  }, []);

  // Update body class when sidebar state changes
  React.useEffect(() => {
    if (isExpanded) {
      document.body.classList.add('sidebar-expanded');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-expanded');
    }
  }, [isExpanded]);

  const modules = [
    {
      id: 'module01',
      number: '01',
      name: 'EDUCATION',
      shortName: 'Education',
      icon: '📚',
      color: '#673AB7',
      description: 'Understanding INFORM concepts and methodology',
      status: 'completed'
    },
    {
      id: 'module02',
      number: '02',
      name: 'RISK',
      shortName: 'Risk',
      icon: '⚠️',
      color: '#F44336',
      description: 'Disaster risk assessment and analysis',
      status: 'active'
    },
    {
      id: 'module03',
      number: '03',
      name: 'WARNING',
      shortName: 'Warning',
      icon: '📢',
      color: '#FF9800',
      description: 'Impact-based early warning and alerts',
      status: 'available'
    },
    {
      id: 'module04',
      number: '04',
      name: 'SEVERITY',
      shortName: 'Severity',
      icon: '📊',
      color: '#2196F3',
      description: 'Impact measurement and learning loop',
      status: 'available'
    },
    {
      id: 'module05',
      number: '05',
      name: 'CLIMATE CHANGE',
      shortName: 'Climate',
      icon: '🌍',
      color: '#4CAF50',
      description: 'Long-term climate risk and adaptation',
      status: 'available'
    },
    {
      id: 'warning',
      number: '🚨',
      name: 'WARNING SYSTEM',
      shortName: 'Warning',
      icon: '🚨',
      color: '#FF5722',
      description: 'Regional hazard input and PMO validation',
      status: 'available'
    }
  ];

  const dataCategories = [
    { id: 'risk', name: 'Risk Data', icon: '📈' },
    { id: 'warning', name: 'Warning Data', icon: '⚡' },
    { id: 'severity', name: 'Severity Data', icon: '📉' },
    { id: 'climate', name: 'Climate Data', icon: '🌤️' }
  ];

  // Flood & Drought removed - integrated into Module02 (INFORM Risk) and Module03 (Warning System)
  const toolsItems = [
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'maps', name: 'Maps Explorer', icon: '🗺️' },
    { id: 'indicator-catalog', name: 'Indicator Guide', icon: '📖' },
    { id: 'database', name: 'Data Hub', icon: '📦' },
    { id: 'data-entry', name: 'Data Entry', icon: '📝' },
    { id: 'data-sources', name: 'Data Sources', icon: '🔗' }
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-flag">🇹🇿</span>
            {isExpanded && (
              <div className="logo-text">
                <div className="logo-title">INFORM</div>
                <div className="logo-subtitle">Tanzania</div>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        </div>

        {/* Modules Section - filtered by role */}
        <div className="sidebar-section">
          {isExpanded && <div className="section-title">MODULES</div>}
          <div className="sidebar-modules">
            {modules.filter(m => accessibleModuleIds.includes(m.id)).map((module) => (
              <div
                key={module.id}
                className={`sidebar-module ${currentView === module.id ? 'active' : ''} ${module.status}`}
                onClick={() => onNavigate(module.id)}
                onMouseEnter={() => setHoveredModule(module.id)}
                onMouseLeave={() => setHoveredModule(null)}
                style={{ borderLeftColor: currentView === module.id ? module.color : 'transparent' }}
              >
                <div className="module-icon" style={{ backgroundColor: `${module.color}20`, color: module.color }}>
                  {module.icon}
                </div>
                {isExpanded && (
                  <div className="module-content">
                    <div className="module-header">
                      <span className="module-number">{module.number}</span>
                      {module.status === 'completed' && <span className="status-badge completed">✓</span>}
                      {module.status === 'active' && <span className="status-badge active">●</span>}
                    </div>
                    <div className="module-name">{module.name}</div>
                  </div>
                )}

                {/* Hover Tooltip for collapsed state */}
                {!isExpanded && hoveredModule === module.id && (
                  <div className="module-tooltip">
                    <div className="tooltip-title">{module.number}</div>
                    <div className="tooltip-name">{module.name}</div>
                    <div className="tooltip-desc">{module.description}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data Section - filtered by role */}
        {accessibleDataViewIds.length > 0 && (
        <div className="sidebar-section">
          {isExpanded && <div className="section-title">DATA VIEWS</div>}
          <div className="sidebar-data">
            {dataCategories.filter(c => accessibleDataViewIds.includes(c.id)).map((category) => (
              <div
                key={category.id}
                className={`sidebar-data-item ${currentView === category.id ? 'active' : ''}`}
                onClick={() => onNavigate(category.id)}
              >
                <span className="data-icon">{category.icon}</span>
                {isExpanded && <span className="data-name">{category.name}</span>}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Tools Section - filtered by role */}
        {accessibleToolIds.length > 0 && (
        <div className="sidebar-section">
          {isExpanded && <div className="section-title">TOOLS</div>}
          <div className="sidebar-data">
            {toolsItems.filter(t => accessibleToolIds.includes(t.id)).map((tool) => (
              <div
                key={tool.id}
                className={`sidebar-data-item ${currentView === tool.id ? 'active' : ''}`}
                onClick={() => onNavigate(tool.id)}
              >
                <span className="data-icon">{tool.icon}</span>
                {isExpanded && <span className="data-name">{tool.name}</span>}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Language Switcher */}
        <div className="sidebar-section">
          {isExpanded && <div className="section-title">LANGUAGE</div>}
          <div className="sidebar-language">
            {isExpanded ? (
              <LanguageSwitcher style={{ width: '100%', justifyContent: 'center' }} />
            ) : (
              <LanguageSwitcher style={{ padding: '8px', fontSize: '12px' }} />
            )}
          </div>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              {isExpanded ? (
                <>
                  <div className="user-info-expanded">
                    <div className="user-avatar">
                      {user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.name || 'User'}</div>
                      <div className="user-role">
                        {user.role === USER_ROLES.ADMIN && '👨‍💼 Administrator'}
                        {user.role === USER_ROLES.PMO_OFFICER && '🏛️ PMO Officer'}
                        {user.role === USER_ROLES.REGIONAL_OFFICER && '📍 Regional Officer'}
                        {user.role === USER_ROLES.INSTITUTION_USER && '🏢 Institution User'}
                        {user.role === USER_ROLES.REGIONAL_COMMITTEE && '🏛️ Regional Committee'}
                        {user.role === USER_ROLES.WARD_COMMITTEE && '🏘️ District Committee'}
                        {user.role === USER_ROLES.VIEWER && '👁️ Viewer'}
                        {user.role === USER_ROLES.PUBLIC_USER && '👤 Public User'}
                      </div>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button
                      className="user-action-btn"
                      onClick={() => onNavigate('profile')}
                      title="View Profile"
                    >
                      👤 Profile
                    </button>
                    <button
                      className="user-action-btn logout-btn"
                      onClick={logout}
                      title="Logout"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="user-avatar-collapsed"
                  onClick={() => onNavigate('profile')}
                  title={`${user.name} - Click for profile`}
                >
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isExpanded && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsExpanded(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
