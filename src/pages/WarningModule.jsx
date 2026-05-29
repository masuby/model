/**
 * REGIONAL WARNING MODULE
 * Dedicated warning system for regional committees and institutions
 * Combines hazard input (Layer 1) with PMO validation (Layer 4)
 */

import React, { useState, useCallback } from 'react';
import Layer1HazardInput from '../components/warning/layers/Layer1HazardInput';
import Layer4PMODashboard from '../components/warning/layers/Layer4PMODashboard';
import '../components/warning/Module03WarningSystem.css';

const WarningModule = ({ onNavigate }) => {
  const [currentTab, setCurrentTab] = useState('hazard'); // 'hazard' or 'pmo'
  const [activeHazards, setActiveHazards] = useState([]);
  const [activeWarnings, setActiveWarnings] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [simulationMode, setSimulationMode] = useState(false);

  // Handle hazard submission from Layer 1
  const handleHazardSubmit = useCallback((hazardData) => {
    console.log('📥 Hazard submitted:', hazardData);

    const newHazard = {
      id: `HAZARD-${Date.now()}`,
      ...hazardData,
      timestamp: new Date(),
      status: 'pending'
    };

    setActiveHazards(prev => [...prev, newHazard]);
    alert(`✅ Hazard submitted successfully!\n\nSwitch to PMO Dashboard to review and issue warning.`);
  }, []);

  // Handle warning approval from Layer 4
  const handleApproveWarning = useCallback((warningData) => {
    console.log('✅ Warning approved:', warningData);

    const newWarning = {
      id: `WARNING-${Date.now()}`,
      ...warningData,
      timestamp: new Date(),
      status: 'active'
    };

    setActiveWarnings(prev => [...prev, newWarning]);
    setActiveHazards(prev =>
      prev.filter(h => h.id !== warningData.hazardId)
    );
    alert('✅ Warning issued successfully!');
  }, []);

  // Handle hazard rollback
  const handleRollbackHazard = useCallback((hazardId, reason) => {
    console.log('🔄 Hazard rolled back:', { hazardId, reason });
    setActiveHazards(prev =>
      prev.map(h => h.id === hazardId ? { ...h, status: 'revision_requested', rollbackReason: reason } : h)
    );
    alert('🔄 Revision requested from institution');
  }, []);

  return (
    <div className="module-container warning-module">
      {/* Header */}
      <div className="module-header">
        <div className="header-content">
          <h1>🚨 Regional Warning System</h1>
          <p>Hazard Input & PMO Validation Dashboard</p>
        </div>

        {/* Stats */}
        <div className="module-stats">
          <div className="stat-item">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{activeHazards.length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Active Warnings</div>
            <div className="stat-value">{activeWarnings.length}</div>
          </div>
          <div className="stat-item">
            <label className="simulation-toggle">
              <input
                type="checkbox"
                checked={simulationMode}
                onChange={(e) => setSimulationMode(e.target.checked)}
              />
              🎯 Simulation Mode
            </label>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${currentTab === 'hazard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('hazard')}
        >
          📥 Hazard Input
        </button>
        <button
          className={`tab-button ${currentTab === 'pmo' ? 'active' : ''}`}
          onClick={() => setCurrentTab('pmo')}
        >
          🏛️ PMO Dashboard
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {currentTab === 'hazard' && (
          <div className="tab-pane active">
            <Layer1HazardInput
              onHazardSubmit={handleHazardSubmit}
              simulationMode={simulationMode}
              riskData={riskData}
            />
          </div>
        )}

        {currentTab === 'pmo' && (
          <div className="tab-pane active">
            <Layer4PMODashboard
              activeHazards={activeHazards}
              activeWarnings={activeWarnings}
              riskData={riskData}
              onApproveWarning={handleApproveWarning}
              onRollbackHazard={handleRollbackHazard}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WarningModule;
