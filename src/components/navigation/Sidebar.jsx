/**
 * MODERN SIDEBAR NAVIGATION
 * Professional navigation with visual module cards and progress tracking
 */

import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ currentView, onNavigate }) => {
  // Start collapsed on mobile, expanded on desktop
  const [isExpanded, setIsExpanded] = useState(() => {
    return window.innerWidth > 1024;
  });
  const [hoveredModule, setHoveredModule] = useState(null);

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
      name: 'INFORM Education',
      shortName: 'Education',
      icon: '📚',
      color: '#673AB7',
      description: 'Understanding INFORM concepts and methodology',
      status: 'completed'
    },
    {
      id: 'module02',
      number: '02',
      name: 'INFORM Risk',
      shortName: 'Risk',
      icon: '⚠️',
      color: '#F44336',
      description: 'Disaster risk assessment and analysis',
      status: 'active'
    },
    {
      id: 'module03',
      number: '03',
      name: 'Early Warning System',
      shortName: 'Warning',
      icon: '📢',
      color: '#FF9800',
      description: 'Impact-based early warning and alerts',
      status: 'available'
    },
    {
      id: 'module04',
      number: '04',
      name: 'INFORM Severity',
      shortName: 'Severity',
      icon: '📊',
      color: '#2196F3',
      description: 'Impact measurement and learning loop',
      status: 'available'
    },
    {
      id: 'module05',
      number: '05',
      name: 'Climate Change',
      shortName: 'Climate',
      icon: '🌍',
      color: '#4CAF50',
      description: 'Long-term climate risk and adaptation',
      status: 'available'
    }
  ];

  const dataCategories = [
    { id: 'risk', name: 'Risk Data', icon: '📈' },
    { id: 'warning', name: 'Warning Data', icon: '⚡' },
    { id: 'severity', name: 'Severity Data', icon: '📉' },
    { id: 'climate', name: 'Climate Data', icon: '🌤️' }
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

        {/* Modules Section */}
        <div className="sidebar-section">
          {isExpanded && <div className="section-title">MODULES</div>}
          <div className="sidebar-modules">
            {modules.map((module) => (
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
                      <span className="module-number">MODULE {module.number}</span>
                      {module.status === 'completed' && <span className="status-badge completed">✓</span>}
                      {module.status === 'active' && <span className="status-badge active">●</span>}
                    </div>
                    <div className="module-name">{module.shortName}</div>
                  </div>
                )}

                {/* Hover Tooltip for collapsed state */}
                {!isExpanded && hoveredModule === module.id && (
                  <div className="module-tooltip">
                    <div className="tooltip-title">MODULE {module.number}</div>
                    <div className="tooltip-name">{module.name}</div>
                    <div className="tooltip-desc">{module.description}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data Section */}
        <div className="sidebar-section">
          {isExpanded && <div className="section-title">DATA VIEWS</div>}
          <div className="sidebar-data">
            {dataCategories.map((category) => (
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

        {/* Progress Indicator */}
        {isExpanded && (
          <div className="sidebar-footer">
            <div className="progress-section">
              <div className="progress-title">System Progress</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: '60%', background: 'linear-gradient(90deg, #4CAF50, #2196F3)' }}
                ></div>
              </div>
              <div className="progress-text">3 of 5 modules explored</div>
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
