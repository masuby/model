/**
 * LAYER 1: EVENT REGISTRATION
 *
 * Incident identification & event tracking
 * Links warnings to observed events for validation
 */

import React, { useState } from 'react';
import '../Module04Severity.css';
import './Layer1EventRegistration.css';

const Layer1EventRegistration = ({
  onEventRegister,
  registeredEvents,
  selectedEvent,
  onSelectEvent,
  activeWarnings
}) => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    hazardType: 'Heavy Rainfall',
    affectedRegions: [],
    affectedDistricts: [],
    warningId: '',
    warningLevel: 'Advisory',
    dateStart: new Date().toISOString().slice(0, 16),
    dateEnd: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    eventDescription: '',
    registeredBy: 'PMO-DMD'
  });

  const hazardTypes = [
    'Heavy Rainfall',
    'Flooding',
    'Drought',
    'Strong Winds',
    'Earthquake',
    'Disease Outbreak',
    'Epidemic'
  ];

  const regions = [
    'Dar es Salaam',
    'Mwanza',
    'Arusha',
    'Dodoma',
    'Mbeya',
    'Morogoro',
    'Tanga',
    'Tabora',
    'Pwani',
    'Kilimanjaro'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onEventRegister(formData);
    setShowRegistrationForm(false);
    // Reset form
    setFormData({
      eventName: '',
      hazardType: 'Heavy Rainfall',
      affectedRegions: [],
      affectedDistricts: [],
      warningId: '',
      warningLevel: 'Advisory',
      dateStart: new Date().toISOString().slice(0, 16),
      dateEnd: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      eventDescription: '',
      registeredBy: 'PMO-DMD'
    });
  };

  const handleRegionToggle = (region) => {
    if (formData.affectedRegions.includes(region)) {
      setFormData({
        ...formData,
        affectedRegions: formData.affectedRegions.filter(r => r !== region)
      });
    } else {
      setFormData({
        ...formData,
        affectedRegions: [...formData.affectedRegions, region]
      });
    }
  };

  return (
    <div className="layer1-container">
      {/* Layer Header */}
      <div className="layer-header">
        <h2>Layer 1: Event Identification & Registration</h2>
        <p className="layer-description">
          Register hazard events to enable impact tracking and warning validation
        </p>
      </div>

      {/* Registration Trigger */}
      <div className="event-trigger-section">
        <h3>📌 When to Register an Event</h3>
        <div className="trigger-grid">
          <div className="trigger-card">
            <div className="trigger-icon">📢</div>
            <div className="trigger-content">
              <strong>Warning Issued</strong>
              <p>A formal warning has been issued (Module 03)</p>
            </div>
          </div>
          <div className="trigger-or">OR</div>
          <div className="trigger-card">
            <div className="trigger-icon">⚠️</div>
            <div className="trigger-content">
              <strong>Significant Impact Reported</strong>
              <p>Authorities report hazard impacts requiring response</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Warnings Available for Registration */}
      {activeWarnings && activeWarnings.length > 0 && (
        <div className="active-warnings-section">
          <h3>⚡ Active Warnings Available for Event Registration</h3>
          <div className="warnings-list">
            {activeWarnings.slice(0, 5).map((warning, idx) => (
              <div key={idx} className="warning-item">
                <div className="warning-header">
                  <span className="warning-badge" style={{
                    backgroundColor: warning.warningLevel === 'Major Warning' ? '#F44336' :
                                    warning.warningLevel === 'Warning' ? '#FF6600' : '#FFFF00',
                    color: warning.warningLevel === 'Advisory' ? '#000' : '#FFF'
                  }}>
                    {warning.warningLevel}
                  </span>
                  <span className="warning-hazard">{warning.hazard?.hazardType}</span>
                </div>
                <div className="warning-details">
                  <span>District: {warning.district}</span>
                  <span>Issued: {new Date(warning.issuedAt).toLocaleDateString()}</span>
                </div>
                <button
                  className="btn-register-from-warning"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      eventName: `${warning.hazard?.hazardType} - ${warning.district}`,
                      hazardType: warning.hazard?.hazardType || 'Heavy Rainfall',
                      warningLevel: warning.warningLevel,
                      warningId: warning.id
                    });
                    setShowRegistrationForm(true);
                  }}
                >
                  Register Event
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Form */}
      {!showRegistrationForm ? (
        <div className="registration-cta">
          <button
            className="btn-new-event"
            onClick={() => setShowRegistrationForm(true)}
          >
            <span className="btn-icon">➕</span>
            <span className="btn-text">Register New Event</span>
          </button>
        </div>
      ) : (
        <div className="registration-form-container">
          <div className="form-header">
            <h3>📝 Event Registration Form</h3>
            <button
              className="btn-close-form"
              onClick={() => setShowRegistrationForm(false)}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="event-form">
            {/* Basic Information */}
            <div className="form-section">
              <h4>Basic Information</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Event Name *</label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    placeholder="e.g., Dar es Salaam Heavy Rainfall December 2025"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hazard Type *</label>
                  <select
                    value={formData.hazardType}
                    onChange={(e) => setFormData({ ...formData, hazardType: e.target.value })}
                    required
                  >
                    {hazardTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Warning Level</label>
                  <select
                    value={formData.warningLevel}
                    onChange={(e) => setFormData({ ...formData, warningLevel: e.target.value })}
                  >
                    <option value="Advisory">Advisory</option>
                    <option value="Warning">Warning</option>
                    <option value="Major Warning">Major Warning</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Registered By</label>
                  <select
                    value={formData.registeredBy}
                    onChange={(e) => setFormData({ ...formData, registeredBy: e.target.value })}
                  >
                    <option value="PMO-DMD">PMO-DMD</option>
                    <option value="Regional Authorities">Regional Authorities</option>
                    <option value="District Authorities">District Authorities</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Temporal Extent */}
            <div className="form-section">
              <h4>Temporal Extent</h4>
              <div className="date-grid">
                <div className="form-group">
                  <label>Event Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.dateStart}
                    onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Event End Date & Time (Estimated)</label>
                  <input
                    type="datetime-local"
                    value={formData.dateEnd}
                    onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Spatial Extent */}
            <div className="form-section">
              <h4>Affected Regions</h4>
              <div className="regions-grid">
                {regions.map(region => (
                  <label key={region} className="region-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.affectedRegions.includes(region)}
                      onChange={() => handleRegionToggle(region)}
                    />
                    <span>{region}</span>
                  </label>
                ))}
              </div>
              <small className="form-hint">
                Selected: {formData.affectedRegions.length} region{formData.affectedRegions.length !== 1 ? 's' : ''}
              </small>
            </div>

            {/* Event Description */}
            <div className="form-section">
              <h4>Event Description</h4>
              <textarea
                value={formData.eventDescription}
                onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
                rows={4}
                placeholder="Brief description of the event, initial observations, or context..."
              />
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowRegistrationForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={!formData.eventName || formData.affectedRegions.length === 0}
              >
                <span className="btn-icon">✓</span>
                <span className="btn-text">Register Event</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Registered Events List */}
      <div className="registered-events-section">
        <h3>📋 Registered Events ({registeredEvents.length})</h3>
        {registeredEvents.length === 0 ? (
          <div className="no-events">
            <p>No events registered yet</p>
            <small>Register your first event using the button above</small>
          </div>
        ) : (
          <div className="events-grid">
            {registeredEvents.map((event, idx) => (
              <div
                key={idx}
                className={`event-card ${selectedEvent?.id === event.id ? 'selected' : ''}`}
                onClick={() => onSelectEvent(event)}
              >
                <div className="event-card-header">
                  <span className="event-id">{event.id}</span>
                  <span className={`event-status ${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>
                <div className="event-card-body">
                  <h4>{event.eventName}</h4>
                  <div className="event-detail">
                    <span className="detail-icon">🌊</span>
                    <span>{event.hazardType}</span>
                  </div>
                  <div className="event-detail">
                    <span className="detail-icon">📍</span>
                    <span>{event.affectedRegions.join(', ')}</span>
                  </div>
                  <div className="event-detail">
                    <span className="detail-icon">📅</span>
                    <span>{new Date(event.dateStart).toLocaleDateString()}</span>
                  </div>
                </div>
                {selectedEvent?.id === event.id && (
                  <div className="selected-badge">✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Traceability Info */}
      <div className="traceability-panel">
        <h4>🔗 Traceability & Validation</h4>
        <p>
          Each registered event enables:
        </p>
        <ul>
          <li><strong>Warning Validation:</strong> Compare anticipated impact (Module 03) vs observed impact (Module 04)</li>
          <li><strong>Risk Validation:</strong> Validate risk estimates (Module 02) against real events</li>
          <li><strong>Response Tracking:</strong> Monitor actions taken and identify gaps</li>
          <li><strong>Institutional Learning:</strong> Improve future risk assessment and warnings</li>
        </ul>
      </div>
    </div>
  );
};

export default Layer1EventRegistration;
