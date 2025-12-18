/**
 * MODULE 03: RISK-INFORMED EARLY WARNING SYSTEM
 *
 * "From Risk Knowledge to Early Action"
 *
 * Integrates institutional hazard monitoring (TMA, MoW, MoH, MoA)
 * with INFORM Risk context from Module 02 to produce
 * impact-based, risk-conditioned warnings.
 *
 * CRITICAL: This is not a replacement for institutional early warning systems.
 * This is risk-informed decision support that makes warnings actionable.
 */

import React, { useState, useEffect } from 'react';
import './Module03WarningSystem.css';

// Layer components
import Layer1HazardInput from './layers/Layer1HazardInput';
import Layer2RiskAnalysis from './layers/Layer2RiskAnalysis';
import Layer3WarningLogic from './layers/Layer3WarningLogic';
import Layer4PMODashboard from './layers/Layer4PMODashboard';

// Services
import { calculateWarningScore, classifyWarningLevel } from './services/warningLogic';
import { assessImpact } from './services/impactAssessment';

const Module03WarningSystem = ({ onNavigate }) => {
  const [currentView, setCurrentView] = useState('overview'); // overview, input, simulation, pmo
  const [activeHazards, setActiveHazards] = useState([]);
  const [activeWarnings, setActiveWarnings] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);
  const [currentDay, setCurrentDay] = useState(1); // Day 1-5 progression
  const [forecastDays, setForecastDays] = useState([]); // Track days with forecasts
  const [dayForecasts, setDayForecasts] = useState({}); // Store forecasts per day

  // Debug: Track view changes
  useEffect(() => {
    console.log('📍 Current view changed to:', currentView);
  }, [currentView]);

  // Helper function to get date for forecast day
  const getForecastDate = (dayOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + (dayOffset - 1));
    return date;
  };

  // Helper function to format date
  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Helper function to get day name
  const getDayName = (dayNumber) => {
    if (dayNumber === 1) return 'Today';
    if (dayNumber === 2) return 'Tomorrow';
    return `Day ${dayNumber}`;
  };

  // Day structure for hazard forecasting
  const dayStructure = [
    {
      day: 1,
      title: getDayName(1),
      subtitle: formatDate(getForecastDate(1)),
      icon: '📅',
      color: '#FF9800',
      description: 'Current day hazard forecast and warnings',
      view: 'input'
    },
    {
      day: 2,
      title: getDayName(2),
      subtitle: formatDate(getForecastDate(2)),
      icon: '📅',
      color: '#F57C00',
      description: 'Next day hazard forecast',
      view: 'input'
    },
    {
      day: 3,
      title: getDayName(3),
      subtitle: formatDate(getForecastDate(3)),
      icon: '📅',
      color: '#E65100',
      description: '2-day ahead forecast',
      view: 'input'
    },
    {
      day: 4,
      title: getDayName(4),
      subtitle: formatDate(getForecastDate(4)),
      icon: '📅',
      color: '#D84315',
      description: '3-day ahead forecast',
      view: 'input'
    },
    {
      day: 5,
      title: getDayName(5),
      subtitle: formatDate(getForecastDate(5)),
      icon: '📅',
      color: '#BF360C',
      description: '4-day ahead forecast',
      view: 'input'
    }
  ];

  const handleForecastSubmit = (day, forecastData) => {
    // Mark day as having a forecast
    if (!forecastDays.includes(day)) {
      setForecastDays([...forecastDays, day]);
    }
    // Store the forecast for this day
    setDayForecasts({
      ...dayForecasts,
      [day]: forecastData
    });
    console.log(`✅ Forecast saved for Day ${day} (${getDayName(day)})`);
  };

  const handleDayChange = (day) => {
    setCurrentDay(day);
    const dayInfo = dayStructure.find(d => d.day === day);
    if (dayInfo) {
      setCurrentView(dayInfo.view);
    }
  };

  // Load risk data from Module 02
  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    try {
      console.log('🔄 Loading risk data...');
      setLoading(true);
      // Import Module 02 data service
      const { parseInformRiskData } = await import('../../services/informRiskDataService');
      const excelUrl = '/data/tanzania-inform-risk.xlsx';
      console.log('📥 Fetching:', excelUrl);
      const riskData = await parseInformRiskData(excelUrl);
      setRiskData(riskData);
      console.log('✅ Risk context loaded from Module 02');
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading risk context:', error);
      setLoading(false);
    }
  };

  // Handle hazard input from institutions
  const handleHazardInput = (hazardData) => {
    if (simulationMode) {
      // In simulation mode, process immediately
      processHazard(hazardData);
    } else {
      // In live mode, add to queue for PMO review
      setActiveHazards([...activeHazards, hazardData]);
    }
  };

  // Process hazard and generate warnings
  const processHazard = (hazardData) => {
    if (!riskData) {
      console.error('Risk data not loaded');
      return;
    }

    // Get affected districts
    const affectedDistricts = hazardData.spatialExtent;

    // Generate warnings for each affected district
    const warnings = affectedDistricts.map(districtName => {
      // Find district risk profile
      const districtRisk = riskData.subnational.adm2.find(
        d => d.admin.adm2Name === districtName
      );

      if (!districtRisk) {
        console.warn(`District not found: ${districtName}`);
        return null;
      }

      // Calculate warning score
      const warningScore = calculateWarningScore(hazardData, districtRisk);

      // Assess impact
      const impact = assessImpact(hazardData, [districtRisk], riskData);

      return {
        id: `WARN-${Date.now()}-${districtName}`,
        district: districtName,
        hazard: hazardData,
        riskProfile: districtRisk,
        warningScore: warningScore.score,
        warningLevel: warningScore.level,
        impact: impact,
        issuedAt: new Date().toISOString(),
        status: 'active'
      };
    }).filter(w => w !== null);

    setActiveWarnings([...activeWarnings, ...warnings]);
    console.log(`✅ Generated ${warnings.length} warnings`);
  };

  // Calculate overall statistics
  const stats = {
    activeWarnings: activeWarnings.filter(w => w.status === 'active').length,
    majorWarnings: activeWarnings.filter(w => w.warningLevel === 'Major Warning').length,
    totalPopulationAtRisk: activeWarnings.reduce((sum, w) => sum + (w.impact?.totalPopulation || 0), 0),
    districtsCovered: new Set(activeWarnings.map(w => w.district)).size
  };

  // Show loading state
  if (loading) {
    return (
      <div className="module03-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: '8px solid #f3f3f3',
          borderTop: '8px solid #FF9800',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <h2 style={{ marginTop: '30px', color: '#333' }}>Loading Early Warning System...</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>Loading risk data and initializing system components</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="module03-container">
      {/* Header */}
      <header className="module03-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">🚨</div>
            <div className="header-text">
              <h1>INFORM Early Warning System</h1>
              <p className="header-subtitle">Risk-Informed Decision Support | Tanzania</p>
            </div>
          </div>
          <div className="header-right">
            <div className="mode-toggle">
              <button
                className={`mode-btn ${!simulationMode ? 'active' : ''}`}
                onClick={() => setSimulationMode(false)}
              >
                🔴 Live Mode
              </button>
              <button
                className={`mode-btn ${simulationMode ? 'active' : ''}`}
                onClick={() => setSimulationMode(true)}
              >
                🎯 Simulation
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* System Status */}
      <div className="system-status">
        <div className="status-badge operational">
          <span className="status-icon">●</span>
          <span className="status-text">System Operational</span>
        </div>
        {riskData && (
          <div className="status-info">
            Risk Context: {riskData.subnational.adm2.length} Districts Loaded
          </div>
        )}
      </div>

      {/* Day Progression Navigator */}
      <div className="day-progression-container">
        <div className="day-progression-header">
          <h2>5-Day Hazard Forecast</h2>
          <div className="progress-tracker">
            <span className="progress-text">{forecastDays.length} of 5 days with forecasts</span>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${(forecastDays.length / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="days-grid">
          {dayStructure.map((day) => (
            <div
              key={day.day}
              className={`day-card ${currentDay === day.day ? 'active' : ''} ${
                forecastDays.includes(day.day) ? 'completed' : ''
              }`}
              onClick={() => handleDayChange(day.day)}
              style={{ borderTopColor: day.color }}
            >
              <div className="day-icon" style={{ backgroundColor: `${day.color}20`, color: day.color }}>
                {day.icon}
              </div>
              <div className="day-number">{day.title.toUpperCase()}</div>
              <div className="day-title">{day.subtitle}</div>
              <div className="day-subtitle">
                {forecastDays.includes(day.day)
                  ? `Forecast entered`
                  : 'No forecast yet'}
              </div>
              <div className="day-description">{day.description}</div>
              {forecastDays.includes(day.day) && (
                <div className="day-completed-badge">✓ Forecast Entered</div>
              )}
            </div>
          ))}
        </div>

        {dayStructure.find(d => d.day === currentDay) && (
          <div className="current-day-banner" style={{
            background: `linear-gradient(135deg, ${dayStructure.find(d => d.day === currentDay).color}20, ${dayStructure.find(d => d.day === currentDay).color}10)`,
            borderColor: dayStructure.find(d => d.day === currentDay).color
          }}>
            <div className="banner-icon" style={{ color: dayStructure.find(d => d.day === currentDay).color }}>
              {dayStructure.find(d => d.day === currentDay).icon}
            </div>
            <div className="banner-content">
              <div className="banner-label">Forecast Day {currentDay}</div>
              <div className="banner-title">{dayStructure.find(d => d.day === currentDay).title}</div>
              <div className="banner-subtitle">{dayStructure.find(d => d.day === currentDay).subtitle}</div>
            </div>
            {forecastDays.includes(currentDay) && (
              <div className="forecast-status" style={{ color: dayStructure.find(d => d.day === currentDay).color }}>
                ✓ Forecast Entered
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeWarnings}</div>
            <div className="stat-label">Active Warnings</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-value">{stats.majorWarnings}</div>
            <div className="stat-label">Major Warnings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{(stats.totalPopulationAtRisk / 1000).toFixed(0)}K</div>
            <div className="stat-label">Population at Risk</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <div className="stat-value">{stats.districtsCovered}</div>
            <div className="stat-label">Districts Affected</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="module03-nav">
        <button
          className={`nav-tab ${currentView === 'overview' ? 'active' : ''}`}
          onClick={() => setCurrentView('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button
          className={`nav-tab ${currentView === 'input' ? 'active' : ''}`}
          onClick={() => setCurrentView('input')}
        >
          <span className="tab-icon">📥</span>
          Hazard Input
        </button>
        <button
          className={`nav-tab ${currentView === 'riskanalysis' ? 'active' : ''}`}
          onClick={() => setCurrentView('riskanalysis')}
        >
          <span className="tab-icon">📐</span>
          Risk Analysis
        </button>
        <button
          className={`nav-tab ${currentView === 'pmo' ? 'active' : ''}`}
          onClick={() => {
            console.log('🏛️ PMO-DMD Dashboard tab clicked!');
            setCurrentView('pmo');
            console.log('  View set to: pmo');
          }}
        >
          <span className="tab-icon">🏛️</span>
          PMO-DMD Dashboard
        </button>
        <button
          className={`nav-tab ${currentView === 'warnings' ? 'active' : ''}`}
          onClick={() => setCurrentView('warnings')}
        >
          <span className="tab-icon">⚠️</span>
          Active Warnings
        </button>
      </div>

      {/* Main Content */}
      <main className="module03-main">
        {console.log('🎬 ========== RENDERING MAIN CONTENT ==========')}
        {console.log('   Current View:', currentView)}
        {console.log('   Available Views: overview, input, riskanalysis, warnings, pmo')}
        {console.log('   Checking conditions...')}
        {console.log('   - overview?', currentView === 'overview')}
        {console.log('   - input?', currentView === 'input')}
        {console.log('   - riskanalysis?', currentView === 'riskanalysis')}
        {console.log('   - warnings?', currentView === 'warnings')}
        {console.log('   - pmo?', currentView === 'pmo')}

        {currentView === 'overview' && (
          <>
            {console.log('✅ Rendering Overview Section')}
            <OverviewSection
              stats={stats}
              activeWarnings={activeWarnings}
              riskData={riskData}
              onNavigate={setCurrentView}
            />
          </>
        )}

        {currentView === 'input' && (
          <>
            {console.log('✅ Rendering Hazard Input')}
            <Layer1HazardInput
              onHazardSubmit={handleHazardInput}
              simulationMode={simulationMode}
              riskData={riskData}
              forecastDay={currentDay}
              forecastDate={getForecastDate(currentDay)}
              onForecastSubmit={handleForecastSubmit}
            />
          </>
        )}

        {currentView === 'riskanalysis' && (
          <>
            {console.log('✅ Rendering Risk Analysis')}
            <Layer2RiskAnalysis
              riskData={riskData}
              activeWarnings={activeWarnings}
              activeHazards={activeHazards}
            />
          </>
        )}

        {currentView === 'warnings' && (
          <>
            {console.log('✅ Rendering Warning Logic')}
            <Layer3WarningLogic
              activeWarnings={activeWarnings}
              riskData={riskData}
            />
          </>
        )}

        {currentView === 'pmo' && (
          <>
            {console.log('✅ ===== RENDERING PMO DASHBOARD =====')}
            {console.log('   Passing props:')}
            {console.log('   - activeWarnings:', activeWarnings)}
            {console.log('   - activeHazards:', activeHazards)}
            {console.log('   - riskData:', riskData)}
            <Layer4PMODashboard
              activeWarnings={activeWarnings}
              activeHazards={activeHazards}
              riskData={riskData}
              onApproveWarning={(warning) => {
                console.log('Warning approved:', warning);
              }}
            />
          </>
        )}
      </main>

    </div>
  );
};

/**
 * Overview Section Component
 */
const OverviewSection = ({ stats, activeWarnings, riskData, onNavigate }) => {
  return (
    <div className="overview-section">
      <h2>System Overview</h2>
      <p className="section-intro">
        Welcome to Tanzania's Risk-Informed Early Warning System. This platform integrates
        institutional hazard monitoring with INFORM Risk context to produce impact-based warnings.
      </p>

      <div className="system-layers">
        <div className="layer-card">
          <div className="layer-number">1</div>
          <div className="layer-content">
            <h3>Hazard Monitoring</h3>
            <p>Institutional input from TMA, MoW, MoH, MoA, GST</p>
            <ul>
              <li>🌧️ Weather (TMA)</li>
              <li>🌊 Floods (MoW)</li>
              <li>🏥 Disease (MoH)</li>
              <li>🌾 Drought (MoA)</li>
              <li>🏔️ Seismic (GST)</li>
            </ul>
            <button className="layer-btn" onClick={() => onNavigate('input')}>
              Input Hazard →
            </button>
          </div>
        </div>

        <div className="layer-card">
          <div className="layer-number">2</div>
          <div className="layer-content">
            <h3>Risk Context</h3>
            <p>Baseline vulnerability and coping capacity from Module 02</p>
            <ul>
              <li>📊 {riskData?.subnational?.adm2?.length || 0} Districts</li>
              <li>🛡️ Vulnerability Scores</li>
              <li>🏥 Coping Capacity</li>
              <li>🗺️ Risk Maps</li>
            </ul>
            <button className="layer-btn" onClick={() => onNavigate('riskanalysis')}>
              View Risk Analysis →
            </button>
          </div>
        </div>

        <div className="layer-card">
          <div className="layer-number">3</div>
          <div className="layer-content">
            <h3>Warning Classification</h3>
            <p>Impact-based warning levels</p>
            <ul>
              <li>🟡 Advisory</li>
              <li>🟠 Warning</li>
              <li>🔴 Major Warning</li>
              <li>🔴 Emergency</li>
            </ul>
            <button className="layer-btn" onClick={() => onNavigate('warnings')}>
              View Warnings →
            </button>
          </div>
        </div>

        <div className="layer-card">
          <div className="layer-number">4</div>
          <div className="layer-content">
            <h3>PMO-DMD Consolidation</h3>
            <p>National coordination and decision support</p>
            <ul>
              <li>📋 Review and Validate</li>
              <li>📊 Impact Assessment</li>
              <li>📢 Dissemination</li>
              <li>📈 Response Tracking</li>
            </ul>
            <button className="layer-btn" onClick={() => onNavigate('pmo')}>
              PMO Dashboard →
            </button>
          </div>
        </div>
      </div>

      {activeWarnings.length > 0 && (
        <div className="recent-warnings">
          <h3>Recent Warnings</h3>
          <div className="warnings-list">
            {activeWarnings.slice(0, 5).map(warning => (
              <div key={warning.id} className={`warning-item ${warning.warningLevel.toLowerCase().replace(' ', '-')}`}>
                <div className="warning-header">
                  <span className="warning-level">{warning.warningLevel}</span>
                  <span className="warning-district">{warning.district}</span>
                </div>
                <div className="warning-details">
                  <span className="warning-hazard">{warning.hazard.hazardType}</span>
                  <span className="warning-time">
                    {new Date(warning.issuedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Module03WarningSystem;
