/**
 * LAYER 2: IMPACT DATA COLLECTION
 *
 * Institutional impact reporting based on mandates
 * Multi-institution approach aligned with INFORM principles
 */

import React, { useState } from 'react';
import '../Module04Severity.css';
import './Layer2ImpactCollection.css';
import {
  IMPACT_REPORTING_INSTITUTIONS,
  SEVERITY_INDICATORS,
  normalizeIndicator
} from '../data/severityData';

const Layer2ImpactCollection = ({
  selectedEvent,
  onImpactSubmit,
  impactReports
}) => {
  const [selectedInstitution, setSelectedInstitution] = useState('PMO-DMD');
  const [impactData, setImpactData] = useState({});
  const [reportNotes, setReportNotes] = useState('');

  const institution = IMPACT_REPORTING_INSTITUTIONS[selectedInstitution];

  const handleIndicatorChange = (categoryKey, indicatorId, value) => {
    setImpactData({
      ...impactData,
      [`${categoryKey}.${indicatorId}`]: value ? parseFloat(value) : 0
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const report = {
      eventId: selectedEvent.id,
      institution: selectedInstitution,
      institutionName: institution.name,
      impactData: impactData,
      notes: reportNotes,
      reportedBy: selectedInstitution,
      timestamp: new Date().toISOString()
    };

    onImpactSubmit(report);

    // Reset form
    setImpactData({});
    setReportNotes('');

    alert(`Impact report submitted successfully!\n\nInstitution: ${institution.name}\nEvent: ${selectedEvent.eventName}`);
  };

  // Get relevant indicators for selected institution
  const getRelevantIndicators = () => {
    const indicators = [];

    // All institutions can report human impact
    if (institution.impactDomains.some(domain =>
      domain.includes('Impact') || domain.includes('People') || domain.includes('National')
    )) {
      indicators.push({
        category: 'HUMAN_IMPACT',
        ...SEVERITY_INDICATORS.HUMAN_IMPACT
      });
    }

    // Infrastructure reporting institutions
    if (selectedInstitution === 'MoW' || selectedInstitution === 'PMO-DMD' ||
        selectedInstitution === 'District Authorities') {
      indicators.push({
        category: 'INFRASTRUCTURE_IMPACT',
        ...SEVERITY_INDICATORS.INFRASTRUCTURE_IMPACT
      });
    }

    // Livelihood reporting institutions
    if (selectedInstitution === 'MoA' || selectedInstitution === 'PMO-DMD' ||
        selectedInstitution === 'Regional Authorities') {
      indicators.push({
        category: 'LIVELIHOOD_IMPACT',
        ...SEVERITY_INDICATORS.LIVELIHOOD_IMPACT
      });
    }

    return indicators;
  };

  const relevantIndicators = getRelevantIndicators();

  return (
    <div className="layer2-container">
      {/* Layer Header */}
      <div className="layer-header">
        <h2>Layer 2: Impact Data Collection</h2>
        <p className="layer-description">
          Institutional reporting based on mandated responsibilities
        </p>
      </div>

      {/* Selected Event Info */}
      <div className="selected-event-banner">
        <div className="banner-header">
          <h3>📍 Selected Event</h3>
          <span className="event-id-badge">{selectedEvent.id}</span>
        </div>
        <div className="event-info-grid">
          <div className="info-item">
            <span className="info-label">Event Name:</span>
            <span className="info-value">{selectedEvent.eventName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Hazard Type:</span>
            <span className="info-value">{selectedEvent.hazardType}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Affected Regions:</span>
            <span className="info-value">{selectedEvent.affectedRegions.join(', ')}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className={`status-badge ${selectedEvent.status.toLowerCase()}`}>
              {selectedEvent.status}
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Mandate Overview */}
      <div className="mandate-section">
        <h3>🏛️ Institutional Reporting Framework</h3>
        <p className="mandate-description">
          Impact data comes from mandated institutions, ensuring authoritative and systematic reporting
        </p>
        <div className="institutions-grid">
          {Object.entries(IMPACT_REPORTING_INSTITUTIONS).map(([key, inst]) => (
            <div
              key={key}
              className={`institution-card ${selectedInstitution === key ? 'active' : ''}`}
              onClick={() => setSelectedInstitution(key)}
              style={{ borderColor: selectedInstitution === key ? inst.color : '#E0E0E0' }}
            >
              <div className="inst-header">
                <div className="inst-name">{inst.name}</div>
                <div className="inst-role" style={{ color: inst.color }}>
                  {inst.role}
                </div>
              </div>
              <div className="inst-domains">
                {inst.impactDomains.map((domain, idx) => (
                  <span key={idx} className="domain-tag">{domain}</span>
                ))}
              </div>
              {selectedInstitution === key && (
                <div className="selected-indicator">✓ Selected</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Impact Reporting Form */}
      <div className="impact-form-container">
        <div className="form-header" style={{ borderColor: institution.color }}>
          <h3 style={{ color: institution.color }}>
            📊 Impact Report: {institution.name}
          </h3>
          <div className="reporting-capabilities">
            <strong>Reporting Capabilities:</strong>
            <ul>
              {institution.reportingCapabilities.map((cap, idx) => (
                <li key={idx}>{cap}</li>
              ))}
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="impact-form">
          {/* Impact Indicators by Category */}
          {relevantIndicators.map(({ category, name, icon, color, indicators }) => (
            <div key={category} className="indicator-category">
              <div className="category-header" style={{ borderLeftColor: color }}>
                <span className="category-icon">{icon}</span>
                <h4>{name}</h4>
              </div>

              <div className="indicators-grid">
                {indicators.map(indicator => (
                  <div key={indicator.id} className="indicator-input-group">
                    <label>
                      {indicator.label}
                      <span className="indicator-unit">({indicator.unit})</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={impactData[`${category}.${indicator.id}`] || ''}
                      onChange={(e) => handleIndicatorChange(category, indicator.id, e.target.value)}
                      placeholder={`Enter ${indicator.label.toLowerCase()}`}
                    />
                    <small className="indicator-description">{indicator.description}</small>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Notes */}
          <div className="notes-section">
            <label>
              <strong>Additional Context & Notes</strong>
            </label>
            <textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={4}
              placeholder="Provide additional context, data sources, verification methods, or special considerations..."
            />
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit-impact"
              style={{ backgroundColor: institution.color }}
            >
              <span className="btn-icon">✓</span>
              <span className="btn-text">Submit Impact Report</span>
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Reports */}
      <div className="submitted-reports-section">
        <h3>📋 Submitted Impact Reports ({impactReports.length})</h3>
        {impactReports.length === 0 ? (
          <div className="no-reports">
            <p>No impact reports submitted yet for this event</p>
            <small>Use the form above to submit the first report</small>
          </div>
        ) : (
          <div className="reports-timeline">
            {impactReports.map((report, idx) => {
              const inst = IMPACT_REPORTING_INSTITUTIONS[report.institution];
              return (
                <div key={idx} className="report-card">
                  <div className="report-header">
                    <div className="report-institution" style={{ color: inst.color }}>
                      {inst.name}
                    </div>
                    <div className="report-timestamp">
                      {new Date(report.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="report-body">
                    <div className="report-data-summary">
                      <strong>Data Points Reported:</strong>
                      <div className="data-points">
                        {Object.entries(report.impactData).map(([key, value]) => {
                          const [category, indicator] = key.split('.');
                          return value > 0 ? (
                            <span key={key} className="data-point">
                              {indicator.replace(/_/g, ' ')}: <strong>{value.toLocaleString()}</strong>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    {report.notes && (
                      <div className="report-notes">
                        <strong>Notes:</strong> {report.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INFORM Principle Reminder */}
      <div className="inform-principle-box">
        <h4>💡 INFORM Principle: Institutional Data Sources</h4>
        <p>
          Impact data comes from <strong>mandated institutions</strong>, not estimates alone.
          This ensures:
        </p>
        <ul>
          <li>Authoritative and verified information</li>
          <li>Systematic and consistent reporting</li>
          <li>Clear accountability and traceability</li>
          <li>Evidence-based severity assessment</li>
        </ul>
      </div>
    </div>
  );
};

export default Layer2ImpactCollection;
