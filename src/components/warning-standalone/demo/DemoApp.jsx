/**
 * DEMO APPLICATION
 * Local testing environment for Hazard & PMO Standalone System
 */

import React from 'react';
import HazardAndPMOSystem from '../HazardAndPMOSystem';
import './DemoApp.css';

const DemoApp = () => {
  const [demoMode, setDemoMode] = React.useState('live');

  return (
    <div className="demo-app">
      {/* Demo Header */}
      <div className="demo-header">
        <div className="demo-banner">
          <h1>🧪 HAZARD & PMO STANDALONE SYSTEM - LOCAL DEMO</h1>
          <p>Testing & Development Environment</p>
        </div>
        <div className="demo-info">
          <div className="info-box">
            <strong>Version:</strong> 1.0.0
          </div>
          <div className="info-box">
            <strong>Environment:</strong> LOCAL DEVELOPMENT
          </div>
          <div className="info-box">
            <strong>Status:</strong> <span style={{ color: '#4CAF50' }}>✓ Ready</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="demo-instructions">
        <h2>📋 Testing Instructions</h2>
        <div className="instructions-grid">
          <div className="instruction-card">
            <h3>🟡 Hazard Input (Institutional Users)</h3>
            <ol>
              <li>Click "Hazard Input" tab</li>
              <li>Select an institution (TMA, MOW, MOH, MOA, GST)</li>
              <li>Choose a hazard type from the dropdown</li>
              <li>Click 5+ districts on the map to select them</li>
              <li>Set a warning level (Advisory/Warning/Major)</li>
              <li>Click "Submit Warning" to send to PMO queue</li>
            </ol>
            <div className="test-scenario">
              <strong>Quick Test:</strong> TMA Heavy Rainfall in Dar es Salaam, Morogoro
            </div>
          </div>

          <div className="instruction-card">
            <h3>🏛️ PMO Dashboard (National Level)</h3>
            <ol>
              <li>Click "PMO Dashboard" tab</li>
              <li>Select any hazard from "Pending Hazard Reviews"</li>
              <li>Review the risk assessment and map preview</li>
              <li>Set Impact Level (Low → Critical)</li>
              <li>Select responsible actors (health, water, agriculture, etc.)</li>
              <li>Click "Issue Warning" to create formal warning</li>
            </ol>
            <div className="test-scenario">
              <strong>Or:</strong> Click "Request Revision" to send back for clarification
            </div>
          </div>

          <div className="instruction-card">
            <h3>🎯 Simulation Mode Testing</h3>
            <ol>
              <li>Toggle "Simulation Mode" in the top-right header</li>
              <li>Submit multiple test scenarios</li>
              <li>No audit logging occurs (safe for testing)</li>
              <li>All submitted data is preserved</li>
              <li>Perfect for user training and UAT</li>
            </ol>
            <div className="test-scenario">
              <strong>Advantage:</strong> Test without affecting production data
            </div>
          </div>

          <div className="instruction-card">
            <h3>📊 Data Flow Verification</h3>
            <ol>
              <li>Open Browser DevTools (F12)</li>
              <li>Go to Console tab</li>
              <li>Submit a hazard - watch console logs</li>
              <li>See: Institution, Hazard, Districts, Warning Level logged</li>
              <li>Switch to PMO tab - hazard appears in pending queue</li>
              <li>Issue warning - see final warning logged</li>
            </ol>
            <div className="test-scenario">
              <strong>Console Output:</strong> All events logged with timestamps
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Widget */}
      <div className="demo-stats">
        <h3>📈 System Statistics (Real-Time)</h3>
        <p className="stats-note">These reset on page reload</p>
        <div className="stats-hint">
          Statistics are tracked within the component state. Submit hazards and validate they appear in PMO queue.
        </div>
      </div>

      {/* System Component */}
      <div className="demo-system-container">
        <HazardAndPMOSystem riskDataUrl="/data/tanzania-inform-risk.xlsx" />
      </div>

      {/* Footer */}
      <div className="demo-footer">
        <div className="footer-section">
          <h4>🔧 Development Notes</h4>
          <ul>
            <li>All data is stored in component state (resets on refresh)</li>
            <li>Open DevTools Console (F12) to see detailed logs</li>
            <li>Mock risk data is loaded if Excel file not available</li>
            <li>Audit logging integration works with auditService</li>
            <li>System is fully responsive (test on mobile too)</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>📝 Test Scenarios</h4>
          <ul>
            <li><strong>Scenario 1:</strong> TMA submits heavy rainfall warning for coastal districts</li>
            <li><strong>Scenario 2:</strong> MOH submits disease outbreak in multiple regions</li>
            <li><strong>Scenario 3:</strong> MOA submits drought alert for agricultural zones</li>
            <li><strong>Scenario 4:</strong> PMO issues Major Warning with all actors notified</li>
            <li><strong>Scenario 5:</strong> PMO requests revision for incomplete data</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>🐛 Debugging Tips</h4>
          <ul>
            <li>Check Console (F12) for all system events</li>
            <li>Network tab shows any API/file loading errors</li>
            <li>Use Simulation Mode to test without side effects</li>
            <li>Responsive Design: Test at 320px, 768px, 1024px widths</li>
            <li>Test both Chrome and Firefox for compatibility</li>
          </ul>
        </div>

        <div className="footer-info">
          <p>
            <strong>Ready to Deploy?</strong> Copy this system to your production environment.
            All styling and functionality is self-contained. No build process needed.
          </p>
          <p className="footer-note">
            Local Demo | Not for Production | Test Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoApp;
