/**
 * MODULE 04: INFORM SEVERITY
 * "Measuring Realized Impact and Closing the Risk–Action Loop"
 *
 * Purpose: Operationalizes INFORM's requirement for impact validation
 * Links observed impacts back to risk estimates and warnings
 */

import React, { useState, useEffect } from 'react';
import './Module04Severity.css';
import Layer1EventRegistration from './layers/Layer1EventRegistration';
import Layer2ImpactCollection from './layers/Layer2ImpactCollection';
import Layer3SeverityAssessment from './layers/Layer3SeverityAssessment';

const Module04Severity = ({ activeWarnings, riskData }) => {
  const [activeTab, setActiveTab] = useState('event-registration');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [impactReports, setImpactReports] = useState([]);

  // Load sample events (in production, this would come from database)
  useEffect(() => {
    // Sample event data
    const sampleEvents = [
      {
        id: 'EVT-2025-001',
        eventName: 'Dar es Salaam Heavy Rainfall',
        hazardType: 'Heavy Rainfall',
        affectedRegions: ['Dar es Salaam', 'Pwani'],
        affectedDistricts: ['Kinondoni', 'Ilala', 'Temeke', 'Kibaha', 'Bagamoyo'],
        warningId: 'WARN-2025-TMA-001',
        warningLevel: 'Warning',
        dateStart: '2025-12-10T06:00:00Z',
        dateEnd: '2025-12-12T18:00:00Z',
        status: 'Ongoing',
        registeredBy: 'PMO-DMD',
        registeredAt: '2025-12-10T07:30:00Z'
      }
    ];
    setRegisteredEvents(sampleEvents);
    setSelectedEvent(sampleEvents[0]);
  }, []);

  // Handle event registration
  const handleEventRegister = (eventData) => {
    const newEvent = {
      ...eventData,
      id: `EVT-${new Date().getFullYear()}-${String(registeredEvents.length + 1).padStart(3, '0')}`,
      registeredAt: new Date().toISOString(),
      status: 'Ongoing'
    };
    setRegisteredEvents([...registeredEvents, newEvent]);
    setSelectedEvent(newEvent);
    setActiveTab('impact-collection');
  };

  // Handle impact report submission
  const handleImpactSubmit = (impactData) => {
    const newReport = {
      ...impactData,
      id: `IMP-${new Date().getTime()}`,
      reportedAt: new Date().toISOString()
    };
    setImpactReports([...impactReports, newReport]);
  };

  // Calculate summary statistics
  const stats = {
    totalEvents: registeredEvents.length,
    activeEvents: registeredEvents.filter(e => e.status === 'Ongoing').length,
    completedEvents: registeredEvents.filter(e => e.status === 'Completed').length,
    impactReports: impactReports.length
  };

  return (
    <div className="module04-container">
      {/* Module Header */}
      <div className="module04-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="module-title">
              <span className="module-number">MODULE 04</span>
              <span className="module-name">INFORM SEVERITY</span>
            </h1>
            <p className="module-subtitle">
              Measuring Realized Impact and Closing the Risk–Action Loop
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <div className="stat-value">{stats.totalEvents}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats.activeEvents}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats.impactReports}</div>
              <div className="stat-label">Impact Reports</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conceptual Framework */}
      <div className="concept-banner">
        <div className="concept-item">
          <span className="concept-icon">📊</span>
          <div className="concept-text">
            <strong>Severity ≠ Hazard Magnitude</strong>
            <small>Severity measures realized humanitarian impact</small>
          </div>
        </div>
        <div className="concept-arrow">→</div>
        <div className="concept-item">
          <span className="concept-icon">🔄</span>
          <div className="concept-text">
            <strong>Learning Engine</strong>
            <small>Validates risk predictions and improves warnings</small>
          </div>
        </div>
        <div className="concept-arrow">→</div>
        <div className="concept-item">
          <span className="concept-icon">✅</span>
          <div className="concept-text">
            <strong>Evidence-Based</strong>
            <small>Impact data from mandated institutions</small>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="severity-tabs">
        <button
          className={`severity-tab ${activeTab === 'event-registration' ? 'active' : ''}`}
          onClick={() => setActiveTab('event-registration')}
        >
          <span className="tab-icon">📝</span>
          <div className="tab-content">
            <div className="tab-title">Layer 1: Event Registration</div>
            <div className="tab-description">Incident identification & tracking</div>
          </div>
        </button>
        <button
          className={`severity-tab ${activeTab === 'impact-collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact-collection')}
          disabled={!selectedEvent}
        >
          <span className="tab-icon">📊</span>
          <div className="tab-content">
            <div className="tab-title">Layer 2: Impact Collection</div>
            <div className="tab-description">Institutional impact reporting</div>
          </div>
        </button>
        <button
          className={`severity-tab ${activeTab === 'severity-assessment' ? 'active' : ''}`}
          onClick={() => setActiveTab('severity-assessment')}
          disabled={!selectedEvent}
        >
          <span className="tab-icon">📈</span>
          <div className="tab-content">
            <div className="tab-title">Layer 3: Severity Assessment</div>
            <div className="tab-description">Impact analysis & validation</div>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="severity-content">
        {activeTab === 'event-registration' && (
          <Layer1EventRegistration
            onEventRegister={handleEventRegister}
            registeredEvents={registeredEvents}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
            activeWarnings={activeWarnings}
          />
        )}

        {activeTab === 'impact-collection' && selectedEvent && (
          <Layer2ImpactCollection
            selectedEvent={selectedEvent}
            onImpactSubmit={handleImpactSubmit}
            impactReports={impactReports.filter(r => r.eventId === selectedEvent.id)}
          />
        )}

        {activeTab === 'severity-assessment' && selectedEvent && (
          <Layer3SeverityAssessment
            selectedEvent={selectedEvent}
            impactReports={impactReports.filter(r => r.eventId === selectedEvent.id)}
            riskData={riskData}
            activeWarnings={activeWarnings}
          />
        )}
      </div>

      {/* Logic Chain Indicator */}
      <div className="logic-chain">
        <h4>📍 Position in INFORM System</h4>
        <div className="chain-flow">
          <div className="chain-item completed">
            <div className="chain-label">Module 02</div>
            <div className="chain-value">Risk (Potential)</div>
          </div>
          <div className="chain-arrow">→</div>
          <div className="chain-item completed">
            <div className="chain-label">Module 03</div>
            <div className="chain-value">Warning (Anticipated)</div>
          </div>
          <div className="chain-arrow">→</div>
          <div className="chain-item active">
            <div className="chain-label">Module 04</div>
            <div className="chain-value">Severity (Observed)</div>
          </div>
          <div className="chain-arrow">→</div>
          <div className="chain-item">
            <div className="chain-label">Feedback Loop</div>
            <div className="chain-value">Learning & Improvement</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Module04Severity;
