/**
 * COMMITTEE VERIFIED DATA PANEL
 *
 * Next-generation visualization for committee-verified risk data
 * Features:
 * - Real-time data pulse visualization
 * - Animated 3D-style risk indicators
 * - Interactive dimension breakdown
 * - Smart AI-powered insights
 * - Data quality scoring with visual feedback
 * - Audit trail timeline
 * - Comparison tools
 *
 * Designed to be beyond 2050 imagination
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  getApprovedRiskData,
  DIMENSION_STRUCTURE,
  RISK_CLASSIFICATION,
  classifyRisk
} from '../../services/informCalculationService';
import AnalyticsEngine from '../../services/INFORMAnalyticsEngine';
import './CommitteeVerifiedDataPanel.css';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CommitteeVerifiedDataPanel = ({ nationalData, onSelectRegion }) => {
  const [approvedData, setApprovedData] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnimating, setIsAnimating] = useState(true);
  const pulseRef = useRef(null);

  // Load approved data
  useEffect(() => {
    const loadData = () => {
      const data = getApprovedRiskData();
      setApprovedData(data);
    };

    loadData();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate analytics
  const analytics = useMemo(() => {
    if (!approvedData.length) return null;

    return {
      insights: AnalyticsEngine.generateSmartInsights(approvedData, nationalData),
      hotspots: AnalyticsEngine.identifyHotspots(approvedData),
      evolution: AnalyticsEngine.trackRiskEvolution(approvedData),
      outliers: AnalyticsEngine.detectRegionalOutliers(approvedData)
    };
  }, [approvedData, nationalData]);

  // Data quality scores
  const qualityScores = useMemo(() => {
    return approvedData.map(d => ({
      ...d,
      quality: AnalyticsEngine.calculateDataQualityScore(d)
    }));
  }, [approvedData]);

  if (!approvedData.length) {
    return <EmptyStatePanel />;
  }

  return (
    <div className="cvd-panel">
      {/* Header with Pulse Animation */}
      <header className="cvd-header">
        <div className="cvd-header-content">
          <div className="cvd-title-section">
            <div className="cvd-pulse-indicator" ref={pulseRef}>
              <div className="pulse-ring pulse-ring-1" />
              <div className="pulse-ring pulse-ring-2" />
              <div className="pulse-ring pulse-ring-3" />
              <div className="pulse-core">
                <span className="pulse-count">{approvedData.length}</span>
              </div>
            </div>
            <div className="cvd-title-text">
              <h2>Committee Verified Data</h2>
              <p className="cvd-subtitle">
                Real-time INFORM Risk Assessment Intelligence
              </p>
            </div>
          </div>

          <div className="cvd-header-stats">
            <StatCard
              icon="🎯"
              value={analytics?.hotspots?.criticalCount || 0}
              label="Critical"
              color="#ef4444"
            />
            <StatCard
              icon="📊"
              value={(AnalyticsEngine.mean(approvedData.map(d => d.calculated?.riskScore)) || 0).toFixed(1)}
              label="Avg Risk"
              color="#f97316"
            />
            <StatCard
              icon="🌍"
              value={[...new Set(approvedData.map(d => d.adm1Name))].length}
              label="Regions"
              color="#22c55e"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="cvd-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: '🔮' },
            { id: 'insights', label: 'AI Insights', icon: '🧠' },
            { id: 'areas', label: 'Verified Areas', icon: '📍' },
            { id: 'timeline', label: 'Timeline', icon: '📅' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`cvd-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="cvd-content">
        {activeTab === 'overview' && (
          <OverviewPanel
            approvedData={approvedData}
            analytics={analytics}
            nationalData={nationalData}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsPanel insights={analytics?.insights || []} />
        )}

        {activeTab === 'areas' && (
          <VerifiedAreasPanel
            areas={qualityScores}
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelinePanel evolution={analytics?.evolution} approvedData={approvedData} />
        )}
      </main>
    </div>
  );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({ icon, value, label, color }) => (
  <div className="cvd-stat-card" style={{ '--stat-color': color }}>
    <span className="stat-icon">{icon}</span>
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

// ============================================================================
// EMPTY STATE PANEL
// ============================================================================

const EmptyStatePanel = () => (
  <div className="cvd-empty-state">
    <div className="empty-visual">
      <div className="empty-orb">
        <div className="orb-ring orb-ring-1" />
        <div className="orb-ring orb-ring-2" />
        <div className="orb-core">📊</div>
      </div>
    </div>
    <h3>No Committee Verified Data Yet</h3>
    <p>
      When committee submissions are approved by PMO, they appear here with
      system-calculated INFORM risk scores integrated into the national profile.
    </p>
    <div className="empty-flow">
      <div className="flow-step">
        <span className="step-icon">📝</span>
        <span className="step-text">Committee submits data</span>
      </div>
      <div className="flow-arrow">→</div>
      <div className="flow-step">
        <span className="step-icon">✅</span>
        <span className="step-text">PMO reviews & approves</span>
      </div>
      <div className="flow-arrow">→</div>
      <div className="flow-step">
        <span className="step-icon">🔮</span>
        <span className="step-text">Data integrates here</span>
      </div>
    </div>
  </div>
);

// ============================================================================
// OVERVIEW PANEL
// ============================================================================

const OverviewPanel = ({ approvedData, analytics, nationalData }) => {
  // Calculate dimension averages
  const dimensionAverages = useMemo(() => ({
    hazard: AnalyticsEngine.mean(approvedData.map(d => d.calculated?.hazardScore)),
    vulnerability: AnalyticsEngine.mean(approvedData.map(d => d.calculated?.vulnerabilityScore)),
    coping: AnalyticsEngine.mean(approvedData.map(d => d.calculated?.lackOfCopingScore))
  }), [approvedData]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    const distribution = RISK_CLASSIFICATION.map(level => ({
      ...level,
      count: approvedData.filter(d => {
        const score = d.calculated?.riskScore;
        return score >= level.min && score < level.max;
      }).length
    }));
    return distribution;
  }, [approvedData]);

  return (
    <div className="cvd-overview">
      {/* 3D-style Risk Gauge */}
      <section className="overview-gauge-section">
        <RiskGauge3D
          value={AnalyticsEngine.mean(approvedData.map(d => d.calculated?.riskScore)) || 0}
          label="Average Verified Risk"
          subtitle={`Based on ${approvedData.length} verified submissions`}
        />
      </section>

      {/* Dimension Breakdown */}
      <section className="overview-dimensions">
        <h3>Dimension Analysis</h3>
        <div className="dimension-cards">
          {Object.entries(DIMENSION_STRUCTURE).map(([key, dim]) => {
            const score = key === 'HAZARD' ? dimensionAverages.hazard :
                          key === 'VULNERABILITY' ? dimensionAverages.vulnerability :
                          dimensionAverages.coping;
            return (
              <DimensionCard
                key={key}
                dimension={dim}
                score={score}
                nationalScore={
                  key === 'HAZARD' ? nationalData?.hazardExposure :
                  key === 'VULNERABILITY' ? nationalData?.vulnerability :
                  nationalData?.lackCopingCapacity
                }
              />
            );
          })}
        </div>
      </section>

      {/* Risk Distribution */}
      <section className="overview-distribution">
        <h3>Risk Level Distribution</h3>
        <div className="distribution-bars">
          {riskDistribution.map(level => (
            <div key={level.label} className="distribution-bar-item">
              <div className="bar-label">
                <span className="level-dot" style={{ backgroundColor: level.color }} />
                <span>{level.label}</span>
              </div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(level.count / approvedData.length) * 100}%`,
                    backgroundColor: level.color
                  }}
                />
              </div>
              <span className="bar-count">{level.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Hotspots Alert */}
      {analytics?.hotspots?.criticalCount > 0 && (
        <section className="overview-hotspots">
          <div className="hotspot-alert">
            <div className="alert-icon">🚨</div>
            <div className="alert-content">
              <h4>{analytics.hotspots.criticalCount} Critical Hotspot(s) Detected</h4>
              <p>
                {analytics.hotspots.hotspots.slice(0, 3).map(h => h.region).join(', ')}
                {analytics.hotspots.hotspots.length > 3 && ` +${analytics.hotspots.hotspots.length - 3} more`}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================================================
// 3D-STYLE RISK GAUGE
// ============================================================================

const RiskGauge3D = ({ value, label, subtitle }) => {
  const classification = classifyRisk(value);
  const percentage = (value / 10) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className="risk-gauge-3d">
      <svg viewBox="0 0 280 200" className="gauge-svg">
        {/* Background arc */}
        <path
          d="M 20 180 A 120 120 0 0 1 260 180"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="24"
          strokeLinecap="round"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="35%" stopColor="#fbbf24" />
            <stop offset="65%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Progress arc */}
        <path
          d="M 20 180 A 120 120 0 0 1 260 180"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="24"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75}`}
          strokeDashoffset={strokeDashoffset}
          filter="url(#glow)"
          className="gauge-progress"
        />

        {/* Center display */}
        <text x="140" y="130" textAnchor="middle" className="gauge-value" fill={classification?.color || '#fff'}>
          {value?.toFixed(1) || '0.0'}
        </text>
        <text x="140" y="155" textAnchor="middle" className="gauge-classification" fill={classification?.color || '#fff'}>
          {classification?.label || 'Unknown'}
        </text>
      </svg>

      <div className="gauge-labels">
        <span className="gauge-label">{label}</span>
        <span className="gauge-subtitle">{subtitle}</span>
      </div>

      {/* Scale markers */}
      <div className="gauge-scale">
        <span>0</span>
        <span>2.5</span>
        <span>5</span>
        <span>7.5</span>
        <span>10</span>
      </div>
    </div>
  );
};

// ============================================================================
// DIMENSION CARD
// ============================================================================

const DimensionCard = ({ dimension, score, nationalScore }) => {
  const comparison = nationalScore ? ((score - nationalScore) / nationalScore * 100).toFixed(1) : null;
  const isAbove = comparison > 0;

  return (
    <div className="dimension-card" style={{ '--dim-color': dimension.color }}>
      <div className="dim-card-header">
        <span className="dim-card-code">{dimension.code}</span>
        <span className="dim-card-name">{dimension.name}</span>
      </div>

      <div className="dim-card-score">
        <span className="score-value" style={{ color: dimension.color }}>
          {score?.toFixed(2) || 'N/A'}
        </span>
        <span className="score-max">/10</span>
      </div>

      <div className="dim-card-bar">
        <div
          className="bar-fill"
          style={{
            width: `${((score || 0) / 10) * 100}%`,
            backgroundColor: dimension.color
          }}
        />
      </div>

      {comparison !== null && (
        <div className={`dim-card-comparison ${isAbove ? 'above' : 'below'}`}>
          <span className="comparison-arrow">{isAbove ? '↑' : '↓'}</span>
          <span className="comparison-value">{Math.abs(comparison)}%</span>
          <span className="comparison-label">vs national</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INSIGHTS PANEL
// ============================================================================

const InsightsPanel = ({ insights }) => {
  const priorityIcons = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  };

  const typeStyles = {
    warning: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444' },
    metric: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
    insight: { bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7' },
    comparison: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e' },
    coverage: { bg: 'rgba(249, 115, 22, 0.1)', border: '#f97316' },
    activity: { bg: 'rgba(236, 72, 153, 0.1)', border: '#ec4899' },
    info: { bg: 'rgba(148, 163, 184, 0.1)', border: '#94a3b8' }
  };

  return (
    <div className="cvd-insights">
      <div className="insights-header">
        <h3>🧠 AI-Powered Insights</h3>
        <p>Intelligent analysis of your verified risk data</p>
      </div>

      <div className="insights-grid">
        {insights.map((insight, idx) => {
          const style = typeStyles[insight.type] || typeStyles.info;
          return (
            <div
              key={idx}
              className="insight-card"
              style={{
                backgroundColor: style.bg,
                borderLeftColor: style.border
              }}
            >
              <div className="insight-header">
                <span className="insight-icon">{insight.icon}</span>
                <span className="insight-priority">{priorityIcons[insight.priority]}</span>
              </div>

              <h4 className="insight-title">{insight.title}</h4>
              <p className="insight-message">{insight.message}</p>

              {insight.metric && (
                <div className="insight-metric">
                  <span className="metric-value">{insight.metric.value}</span>
                  <span className="metric-unit">{insight.metric.unit}</span>
                  <span className="metric-label">{insight.metric.label}</span>
                </div>
              )}

              {insight.recommendation && (
                <div className="insight-recommendation">
                  <span className="rec-icon">💡</span>
                  <span className="rec-text">{insight.recommendation}</span>
                </div>
              )}

              {insight.data && (
                <div className="insight-data">
                  {insight.data.gap && (
                    <span className="data-gap">Gap: {insight.data.gap} points</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// VERIFIED AREAS PANEL
// ============================================================================

const VerifiedAreasPanel = ({ areas, selectedArea, onSelectArea }) => {
  const [sortBy, setSortBy] = useState('risk');
  const [filterLevel, setFilterLevel] = useState('all');

  const sortedAreas = useMemo(() => {
    let filtered = [...areas];

    if (filterLevel !== 'all') {
      filtered = filtered.filter(a => {
        const riskClass = a.calculated?.riskClass?.toLowerCase().replace(' ', '-');
        return riskClass === filterLevel;
      });
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'risk') {
        return (b.calculated?.riskScore || 0) - (a.calculated?.riskScore || 0);
      }
      if (sortBy === 'quality') {
        return (b.quality?.overall || 0) - (a.quality?.overall || 0);
      }
      if (sortBy === 'date') {
        return new Date(b.approvedAt) - new Date(a.approvedAt);
      }
      return 0;
    });
  }, [areas, sortBy, filterLevel]);

  return (
    <div className="cvd-areas">
      <div className="areas-controls">
        <div className="control-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="risk">Risk Score</option>
            <option value="quality">Data Quality</option>
            <option value="date">Approval Date</option>
          </select>
        </div>

        <div className="control-group">
          <label>Filter:</label>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="very-high">Very High</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="very-low">Very Low</option>
          </select>
        </div>

        <span className="areas-count">{sortedAreas.length} verified areas</span>
      </div>

      <div className="areas-grid">
        {sortedAreas.map((area, idx) => (
          <AreaCard
            key={area.id || idx}
            area={area}
            isSelected={selectedArea?.id === area.id}
            onClick={() => onSelectArea(area)}
          />
        ))}
      </div>

      {selectedArea && (
        <AreaDetailModal area={selectedArea} onClose={() => onSelectArea(null)} />
      )}
    </div>
  );
};

// ============================================================================
// AREA CARD
// ============================================================================

const AreaCard = ({ area, isSelected, onClick }) => {
  const classification = classifyRisk(area.calculated?.riskScore);
  const quality = area.quality;

  return (
    <div
      className={`area-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ '--risk-color': classification?.color || '#666' }}
    >
      <div className="area-header">
        <div className="area-badge" style={{ backgroundColor: classification?.color }}>
          {classification?.label?.[0] || '?'}
        </div>
        <div className="area-location">
          <span className="area-region">{area.adm1Name}</span>
          {area.adm2Name && area.adm2Name !== area.adm1Name && (
            <span className="area-district">{area.adm2Name}</span>
          )}
        </div>
      </div>

      <div className="area-risk">
        <span className="risk-score" style={{ color: classification?.color }}>
          {area.calculated?.riskScore?.toFixed(2) || 'N/A'}
        </span>
        <span className="risk-class">{classification?.label}</span>
      </div>

      <div className="area-dimensions">
        <div className="mini-dim">
          <span className="mini-icon">⚠️</span>
          <span>{area.calculated?.hazardScore?.toFixed(1) || '-'}</span>
        </div>
        <div className="mini-dim">
          <span className="mini-icon">🛡️</span>
          <span>{area.calculated?.vulnerabilityScore?.toFixed(1) || '-'}</span>
        </div>
        <div className="mini-dim">
          <span className="mini-icon">🏛️</span>
          <span>{area.calculated?.lackOfCopingScore?.toFixed(1) || '-'}</span>
        </div>
      </div>

      <div className="area-footer">
        <div className="quality-indicator">
          <div
            className="quality-bar"
            style={{ width: `${quality?.overall || 0}%` }}
          />
          <span className="quality-grade">{quality?.grade || '?'}</span>
        </div>
        <span className="verified-badge">✓ Verified</span>
      </div>
    </div>
  );
};

// ============================================================================
// AREA DETAIL MODAL
// ============================================================================

const AreaDetailModal = ({ area, onClose }) => {
  const classification = classifyRisk(area.calculated?.riskScore);

  return (
    <div className="area-modal-overlay" onClick={onClose}>
      <div className="area-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <header className="modal-header" style={{ borderColor: classification?.color }}>
          <h3>{area.adm1Name}</h3>
          {area.adm2Name && <span className="modal-district">{area.adm2Name}</span>}
        </header>

        <div className="modal-content">
          {/* Risk Score Display */}
          <div className="modal-risk-display">
            <div className="risk-circle" style={{ borderColor: classification?.color }}>
              <span className="risk-value" style={{ color: classification?.color }}>
                {area.calculated?.riskScore?.toFixed(2)}
              </span>
              <span className="risk-label">{classification?.label}</span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="modal-dimensions">
            <h4>Dimension Breakdown</h4>
            <div className="modal-dim-grid">
              {Object.entries(DIMENSION_STRUCTURE).map(([key, dim]) => {
                const score = key === 'HAZARD' ? area.calculated?.hazardScore :
                              key === 'VULNERABILITY' ? area.calculated?.vulnerabilityScore :
                              area.calculated?.lackOfCopingScore;
                return (
                  <div key={key} className="modal-dim-card">
                    <div className="dim-header" style={{ color: dim.color }}>
                      {dim.name}
                    </div>
                    <div className="dim-score">{score?.toFixed(2) || 'N/A'}</div>
                    <div className="dim-bar">
                      <div
                        className="dim-fill"
                        style={{
                          width: `${((score || 0) / 10) * 100}%`,
                          backgroundColor: dim.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata */}
          <div className="modal-metadata">
            <h4>Verification Details</h4>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="meta-label">Committee</span>
                <span className="meta-value">{area.committeeName}</span>
              </div>
              <div className="metadata-item">
                <span className="meta-label">Submitted</span>
                <span className="meta-value">
                  {new Date(area.submittedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="metadata-item">
                <span className="meta-label">Approved By</span>
                <span className="meta-value">{area.approvedBy}</span>
              </div>
              <div className="metadata-item">
                <span className="meta-label">Approved</span>
                <span className="meta-value">
                  {new Date(area.approvedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="metadata-item">
                <span className="meta-label">Methodology</span>
                <span className="meta-value">{area.methodology}</span>
              </div>
              <div className="metadata-item">
                <span className="meta-label">Data Quality</span>
                <span className="meta-value quality-value">
                  Grade {area.quality?.grade} ({area.quality?.overall}%)
                </span>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="modal-formula">
            <span className="formula-label">INFORM Formula:</span>
            <span className="formula-equation">
              Risk = ({area.calculated?.hazardScore?.toFixed(2)} ×{' '}
              {area.calculated?.vulnerabilityScore?.toFixed(2)} ×{' '}
              {area.calculated?.lackOfCopingScore?.toFixed(2)})<sup>1/3</sup> ={' '}
              <strong style={{ color: classification?.color }}>
                {area.calculated?.riskScore?.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TIMELINE PANEL
// ============================================================================

const TimelinePanel = ({ evolution, approvedData }) => {
  if (!evolution?.timeline?.length) {
    return (
      <div className="cvd-timeline-empty">
        <p>Timeline will populate as more data is approved over time</p>
      </div>
    );
  }

  return (
    <div className="cvd-timeline">
      <div className="timeline-header">
        <h3>📅 Verification Timeline</h3>
        <p>Track the evolution of verified risk data over time</p>
      </div>

      {/* Trend Summary */}
      <div className="timeline-trend">
        <div className="trend-indicator">
          <span className="trend-arrow">
            {evolution.trend?.trend === 'increasing' ? '📈' :
             evolution.trend?.trend === 'decreasing' ? '📉' : '➡️'}
          </span>
          <span className="trend-label">
            Risk is {evolution.trend?.trend || 'stable'}
            {evolution.trend?.strength && ` (${evolution.trend.strength})`}
          </span>
        </div>
        <span className="trend-confidence">
          Confidence: {evolution.trend?.confidence || 'low'}
        </span>
      </div>

      {/* Timeline Events */}
      <div className="timeline-events">
        {approvedData
          .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))
          .slice(0, 10)
          .map((item, idx) => {
            const classification = classifyRisk(item.calculated?.riskScore);
            return (
              <div key={item.id || idx} className="timeline-event">
                <div className="event-dot" style={{ backgroundColor: classification?.color }} />
                <div className="event-content">
                  <div className="event-header">
                    <span className="event-location">{item.adm1Name}</span>
                    <span className="event-risk" style={{ color: classification?.color }}>
                      {item.calculated?.riskScore?.toFixed(2)} - {classification?.label}
                    </span>
                  </div>
                  <div className="event-meta">
                    <span>Approved by {item.approvedBy}</span>
                    <span>•</span>
                    <span>{new Date(item.approvedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Summary Stats */}
      <div className="timeline-summary">
        <div className="summary-item">
          <span className="summary-value">{evolution.summary?.totalMonths || 0}</span>
          <span className="summary-label">Months of Data</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{evolution.summary?.totalSubmissions || 0}</span>
          <span className="summary-label">Total Submissions</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">
            {evolution.summary?.latestAvgRisk?.toFixed(2) || 'N/A'}
          </span>
          <span className="summary-label">Latest Avg Risk</span>
        </div>
      </div>
    </div>
  );
};

export default CommitteeVerifiedDataPanel;
