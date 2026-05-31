/**
 * HAZARD INPUT & PMO DASHBOARD STANDALONE SYSTEM
 *
 * Combines Layer 1 (Hazard Input) and Layer 4 (PMO Dashboard) into a single,
 * focused early warning system for institutional hazard input and PMO validation.
 *
 * This is a simplified, standalone version designed for:
 * - Independent deployment
 * - Direct hazard-to-PMO workflow
 * - Minimal external dependencies
 */

import React, { useState, useEffect } from 'react';
import './HazardAndPMOSystem.css';
import HazardInputPanel from './layers/HazardInputPanel';
import PMOValidationPanel from './layers/PMOValidationPanel';
import { initializeSystem, loadRiskData } from './services/systemService';

const HazardAndPMOSystem = ({ riskDataUrl = '/data/tanzania-inform-risk.xlsx' }) => {
  const [currentView, setCurrentView] = useState('hazard'); // 'hazard' or 'pmo'
  const [activeHazards, setActiveHazards] = useState([]); // Submitted hazards pending PMO review
  const [validatedWarnings, setValidatedWarnings] = useState([]); // PMO-approved warnings
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);
  const [systemStats, setSystemStats] = useState({
    hazardsSubmitted: 0,
    warningsIssued: 0,
    institutionsReporting: 0
  });

  // Initialize system and load risk data
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Initializing Hazard & PMO System...');
        setLoading(true);

        // Load risk data from Module 02
        const data = await loadRiskData(riskDataUrl);
        setRiskData(data);

        console.log('✅ System initialized successfully');
        setLoading(false);
      } catch (error) {
        console.error('❌ Error initializing system:', error);
        setLoading(false);
      }
    };

    init();
  }, [riskDataUrl]);

  // Update system statistics
  useEffect(() => {
    setSystemStats({
      hazardsSubmitted: activeHazards.length,
      warningsIssued: validatedWarnings.length,
      institutionsReporting: new Set(activeHazards.map(h => h.institution)).size
    });
  }, [activeHazards, validatedWarnings]);

  // Handle hazard submission from institution
  const handleHazardSubmit = (hazardData) => {
    const newHazard = {
      id: `HAZARD-${Date.now()}`,
      ...hazardData,
      status: 'PENDING_PMO_REVIEW',
      submittedAt: new Date().toISOString()
    };

    setActiveHazards([...activeHazards, newHazard]);
    console.log('📥 Hazard submitted for PMO review:', newHazard);

    // In real app, might notify PMO here
    alert(`✅ Hazard submitted!\n\nThe PMO-DMD will now review and validate this ${newHazard.hazardType} warning.`);
  };

  // Handle PMO approval and warning issuance
  const handleWarningIssued = (warningData) => {
    const newWarning = {
      id: `WARNING-${Date.now()}`,
      ...warningData,
      status: 'ISSUED',
      issuedAt: new Date().toISOString()
    };

    setValidatedWarnings([...validatedWarnings, newWarning]);

    // Remove from pending hazards
    const hazardId = warningData.hazardId;
    setActiveHazards(activeHazards.filter(h => h.id !== hazardId));

    console.log('📢 Warning issued by PMO:', newWarning);
  };

  // Handle hazard rollback/revision request
  const handleHazardRollback = (hazardId, reason) => {
    setActiveHazards(activeHazards.filter(h => h.id !== hazardId));
    console.log(`🔄 Hazard ${hazardId} rolled back: ${reason}`);
    alert(`Hazard request sent back to institution for revision.\nReason: ${reason}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="standalone-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          border: '8px solid #f3f3f3',
          borderTop: '8px solid #FF9800',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '30px'
        }}></div>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Initializing Warning System</h2>
        <p style={{ color: '#666' }}>Loading risk data and system components...</p>
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
    <div className="standalone-container">
      {/* Header */}
      <header className="standalone-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">🚨</div>
            <div className="header-text">
              <h1>Hazard Input & PMO Dashboard</h1>
              <p className="header-subtitle">Early Warning System | Tanzania</p>
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
        <div className="status-info">
          {riskData && `Risk Context: ${riskData.subnational?.adm2?.length || 0} Districts Loaded`}
        </div>
      </div>

      {/* Quick Statistics */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-value">{systemStats.hazardsSubmitted}</div>
            <div className="stat-label">Hazards Pending</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">📢</div>
          <div className="stat-content">
            <div className="stat-value">{systemStats.warningsIssued}</div>
            <div className="stat-label">Warnings Issued</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <div className="stat-value">{systemStats.institutionsReporting}</div>
            <div className="stat-label">Institutions Reporting</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="standalone-nav">
        <button
          className={`nav-tab ${currentView === 'hazard' ? 'active' : ''}`}
          onClick={() => setCurrentView('hazard')}
        >
          <span className="tab-icon">📥</span>
          Hazard Input
          {activeHazards.length > 0 && <span className="badge">{activeHazards.length}</span>}
        </button>
        <button
          className={`nav-tab ${currentView === 'pmo' ? 'active' : ''}`}
          onClick={() => setCurrentView('pmo')}
        >
          <span className="tab-icon">🏛️</span>
          PMO Dashboard
          {activeHazards.length > 0 && <span className="badge pending">{activeHazards.length}</span>}
        </button>
      </div>

      {/* Main Content */}
      <main className="standalone-main">
        {currentView === 'hazard' && (
          <HazardInputPanel
            onHazardSubmit={handleHazardSubmit}
            simulationMode={simulationMode}
            riskData={riskData}
          />
        )}

        {currentView === 'pmo' && (
          <PMOValidationPanel
            activeHazards={activeHazards}
            validatedWarnings={validatedWarnings}
            riskData={riskData}
            onWarningIssued={handleWarningIssued}
            onHazardRollback={handleHazardRollback}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="standalone-footer">
        <div className="footer-content">
          <p>INFORM Early Warning System | Ministry of State (PMO-DMD) | Tanzania</p>
          <p className="footer-note">This system integrates institutional hazard monitoring with INFORM Risk context.</p>
        </div>
      </footer>
    </div>
  );
};

export default HazardAndPMOSystem;
