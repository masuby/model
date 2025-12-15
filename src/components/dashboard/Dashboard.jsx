/**
 * DASHBOARD - MODULE OVERVIEW
 * Visual card-based navigation and system overview
 */

import React from 'react';
import './Dashboard.css';

const Dashboard = ({ onNavigate }) => {
  const modules = [
    {
      id: 'module01',
      number: '01',
      title: 'INFORM Education',
      description: 'Understanding disaster risk concepts, INFORM methodology, and the complete framework',
      icon: '📚',
      color: '#673AB7',
      features: ['Interactive learning', 'Concept explanations', 'Framework overview', 'Quiz assessment'],
      status: 'Ready',
      statusColor: '#4CAF50'
    },
    {
      id: 'module02',
      number: '02',
      title: 'INFORM Risk',
      description: 'Comprehensive disaster risk assessment with hazard, vulnerability, and coping capacity analysis',
      icon: '⚠️',
      color: '#F44336',
      features: ['Risk calculation', 'District analysis', 'Interactive maps', 'Data visualization'],
      status: 'Ready',
      statusColor: '#4CAF50'
    },
    {
      id: 'module03',
      number: '03',
      title: 'Early Warning System',
      description: 'Impact-based early warning with multi-institutional coordination and public advisories',
      icon: '📢',
      color: '#FF9800',
      features: ['Hazard input', 'Risk integration', 'Warning classification', 'PMO dashboard'],
      status: 'Ready',
      statusColor: '#4CAF50'
    },
    {
      id: 'module04',
      number: '04',
      title: 'INFORM Severity',
      description: 'Measuring realized impact and closing the risk-action loop through evidence-based analysis',
      icon: '📊',
      color: '#2196F3',
      features: ['Event registration', 'Impact collection', 'Severity scoring', 'Validation & feedback'],
      status: 'Ready',
      statusColor: '#4CAF50'
    },
    {
      id: 'module05',
      number: '05',
      title: 'Climate Change',
      description: 'Long-term climate risk projections and adaptation planning with INFORM integration',
      icon: '🌍',
      color: '#4CAF50',
      features: ['Historical trends', 'Climate projections', 'Future risk scenarios', 'Adaptation measures'],
      status: 'Ready',
      statusColor: '#4CAF50'
    }
  ];

  const systemStats = [
    { label: 'Total Modules', value: '5', icon: '📦', color: '#2196F3' },
    { label: 'Districts Covered', value: '184', icon: '📍', color: '#FF9800' },
    { label: 'Risk Indicators', value: '53', icon: '📊', color: '#F44336' },
    { label: 'Data Sources', value: '18', icon: '🗄️', color: '#4CAF50' }
  ];

  const systemFlow = [
    { module: 'Education', arrow: '→', description: 'Learn concepts' },
    { module: 'Risk', arrow: '→', description: 'Assess potential' },
    { module: 'Warning', arrow: '→', description: 'Anticipate impact' },
    { module: 'Severity', arrow: '→', description: 'Measure realized' },
    { module: 'Climate', arrow: '↻', description: 'Plan future' }
  ];

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🇹🇿</span>
            <span className="badge-text">National Platform</span>
          </div>
          <h1 className="hero-title">INFORM Tanzania</h1>
          <p className="hero-subtitle">
            Integrated Disaster Risk Management Platform
          </p>
          <p className="hero-description">
            A comprehensive system for disaster risk assessment, early warning, impact analysis,
            and climate adaptation planning using the INFORM methodology
          </p>
        </div>

        {/* System Stats */}
        <div className="system-stats">
          {systemStats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* System Flow */}
      <div className="system-flow-section">
        <h2 className="section-title">System Flow</h2>
        <div className="flow-diagram">
          {systemFlow.map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="flow-step">
                <div className="step-module">{item.module}</div>
                <div className="step-description">{item.description}</div>
              </div>
              {idx < systemFlow.length - 1 && (
                <div className="flow-arrow">{item.arrow}</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div className="modules-section">
        <h2 className="section-title">Explore Modules</h2>
        <div className="modules-grid">
          {modules.map((module) => (
            <div
              key={module.id}
              className="module-card"
              onClick={() => onNavigate(module.id)}
              style={{ borderTopColor: module.color }}
            >
              <div className="module-card-header">
                <div className="module-card-icon" style={{ backgroundColor: `${module.color}20`, color: module.color }}>
                  {module.icon}
                </div>
                <div className="module-card-meta">
                  <span className="module-card-number">MODULE {module.number}</span>
                  <span className="module-card-status" style={{ color: module.statusColor }}>
                    ● {module.status}
                  </span>
                </div>
              </div>

              <h3 className="module-card-title">{module.title}</h3>
              <p className="module-card-description">{module.description}</p>

              <div className="module-card-features">
                <div className="features-label">Key Features:</div>
                <div className="features-list">
                  {module.features.map((feature, idx) => (
                    <span key={idx} className="feature-tag">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <button className="module-card-button" style={{ backgroundColor: module.color }}>
                <span>Launch Module</span>
                <span className="button-arrow">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links-section">
        <h2 className="section-title">Quick Access</h2>
        <div className="quick-links-grid">
          <div className="quick-link" onClick={() => onNavigate('risk')}>
            <span className="link-icon">📈</span>
            <span className="link-text">Risk Data Explorer</span>
          </div>
          <div className="quick-link" onClick={() => onNavigate('warning')}>
            <span className="link-icon">⚡</span>
            <span className="link-text">Active Warnings</span>
          </div>
          <div className="quick-link" onClick={() => onNavigate('severity')}>
            <span className="link-icon">📉</span>
            <span className="link-text">Impact Reports</span>
          </div>
          <div className="quick-link" onClick={() => onNavigate('climate')}>
            <span className="link-icon">🌤️</span>
            <span className="link-text">Climate Projections</span>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="about-section">
        <div className="about-content">
          <h3>About INFORM</h3>
          <p>
            INFORM (Index for Risk Management) is a global, open-source risk assessment framework
            for humanitarian crises and disasters. This platform adapts INFORM for Tanzania,
            integrating national data sources, early warning systems, and climate projections.
          </p>
          <div className="about-links">
            <a href="https://drmkc.jrc.ec.europa.eu/inform-index" target="_blank" rel="noopener noreferrer" className="about-link">
              Learn More About INFORM
            </a>
            <a href="#" className="about-link">
              Platform Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
