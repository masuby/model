/**
 * SECTION 1: HAZARD - "What Can Happen?"
 *
 * Teaching: Hazard alone does NOT create risk
 * A hazard is a potentially damaging event, but impact depends on exposure and vulnerability
 */

import React, { useState } from 'react';
import './Section1Hazard.css';

const HAZARD_CATEGORIES = {
  natural: {
    title: 'Natural Hazards',
    icon: '🌍',
    color: '#D32F2F',
    hazards: [
      { id: 'rainfall', name: 'Heavy Rainfall', icon: '🌧️', frequency: 'Annual' },
      { id: 'flood', name: 'Floods (Riverine and Flash)', icon: '🌊', frequency: 'Seasonal' },
      { id: 'drought', name: 'Drought', icon: '☀️', frequency: '3-5 years' },
      { id: 'cyclone', name: 'Cyclones', icon: '🌪️', frequency: 'Occasional' },
      { id: 'waves', name: 'Large Waves (Coastal)', icon: '🌊', frequency: 'Seasonal' },
      { id: 'wildfire', name: 'Wildfires', icon: '🔥', frequency: 'Dry season' },
      { id: 'temperature', name: 'Extreme Temperatures', icon: '🌡️', frequency: 'Annual' },
      { id: 'heatwave', name: 'Heat Waves', icon: '🌡️', frequency: 'Occasional' },
      { id: 'volcano', name: 'Volcanic Activity', icon: '🌋', frequency: 'Rare' },
      { id: 'earthquake', name: 'Earthquakes', icon: '🏔️', frequency: 'Rare' },
      { id: 'landslide', name: 'Landslides', icon: '⛰️', frequency: 'Rainy season' },
    ]
  },
  human: {
    title: 'Human Hazards',
    icon: '👥',
    color: '#C62828',
    hazards: [
      { id: 'conflict', name: 'Conflict and Unrest', icon: '⚔️', frequency: 'Variable' },
      { id: 'epidemic', name: 'Epidemics and Disease Outbreaks', icon: '🦠', frequency: 'Variable' },
    ]
  }
};

function Section1Hazard() {
  const [selectedCategory, setSelectedCategory] = useState('natural');
  const [selectedHazard, setSelectedHazard] = useState(null);

  const currentCategory = HAZARD_CATEGORIES[selectedCategory];

  return (
    <div className="section1-hazard">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-number">SECTION 1 OF 6</div>
        <h2 className="section-title">HAZARD: What Can Happen?</h2>
        <p className="section-intro">
          Understanding what hazards are and why they don't automatically cause disasters
        </p>
      </div>

      {/* INFORM Definition */}
      <div className="inform-definition">
        <div className="definition-header">
          <span className="definition-label">INFORM Definition</span>
        </div>
        <div className="definition-content">
          <h3>What is a Hazard?</h3>
          <p>
            <strong>A hazard is a potentially damaging physical or human-induced event.</strong>
          </p>
          <p>
            Hazards are natural or human processes that may cause loss of life, injury, property damage,
            social and economic disruption, or environmental degradation.
          </p>
        </div>
      </div>

      {/* Key Principle - Teaching Box */}
      <div className="teaching-box critical">
        <div className="teaching-icon">⚠️</div>
        <div className="teaching-content">
          <h4>CRITICAL LESSON</h4>
          <div className="teaching-divider"></div>
          <h3>HAZARD and DISASTER</h3>
          <p className="teaching-emphasis">
            A hazard becomes a disaster only when:
          </p>
          <ul className="teaching-list">
            <li><strong>People are exposed</strong> (living in hazard zones)</li>
            <li><strong>Communities are vulnerable</strong> (poor housing, health, resources)</li>
            <li><strong>Response capacity is inadequate</strong> (weak early warning, emergency services)</li>
          </ul>
          <div className="teaching-example">
            <strong>Example:</strong> A flood in an uninhabited forest has <strong>zero humanitarian risk</strong>.
            The same flood in a densely populated area with poor drainage becomes a disaster.
          </div>
        </div>
      </div>

      {/* Hazards in Tanzania */}
      <div className="tanzania-hazards">
        <h3 className="subsection-title">Hazards in Tanzania</h3>
        <p className="subsection-intro">
          Tanzania faces multiple types of hazards. Understanding each type helps in planning and preparedness.
        </p>

        {/* Category Selector */}
        <div className="category-selector">
          {Object.entries(HAZARD_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              className={`category-button ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(key);
                setSelectedHazard(null);
              }}
              style={{
                borderColor: selectedCategory === key ? category.color : '#ddd',
                backgroundColor: selectedCategory === key ? category.color : 'white',
                color: selectedCategory === key ? 'white' : '#333'
              }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-title">{category.title}</span>
              <span className="category-count">({category.hazards.length})</span>
            </button>
          ))}
        </div>

        {/* Hazard Cards */}
        <div className="hazard-grid">
          {currentCategory.hazards.map(hazard => (
            <div
              key={hazard.id}
              className={`hazard-card ${selectedHazard?.id === hazard.id ? 'selected' : ''}`}
              onClick={() => setSelectedHazard(hazard)}
              style={{
                borderColor: selectedHazard?.id === hazard.id ? currentCategory.color : '#e0e0e0'
              }}
            >
              <div className="hazard-icon" style={{ color: currentCategory.color }}>
                {hazard.icon}
              </div>
              <div className="hazard-info">
                <h4 className="hazard-name">{hazard.name}</h4>
                <div className="hazard-frequency">
                  <span className="frequency-label">Frequency:</span>
                  <span className="frequency-value">{hazard.frequency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Hazard Details */}
        {selectedHazard && (
          <div className="hazard-details" style={{ borderLeftColor: currentCategory.color }}>
            <h4>{selectedHazard.icon} {selectedHazard.name}</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{currentCategory.title}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Typical Frequency:</span>
                <span className="detail-value">{selectedHazard.frequency}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {selectedHazard.id === 'epidemic' ? 'Recently occurred (COVID-19, Cholera)' :
                   selectedHazard.id === 'flood' ? 'Seasonal threat (Oct-May)' :
                   selectedHazard.id === 'drought' ? 'Current concern in central regions' :
                   'Monitored continuously'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Important No Impact Yet Notice */}
      <div className="no-impact-notice">
        <div className="notice-icon">📌</div>
        <div className="notice-text">
          <strong>Important:</strong> At this stage, we are only identifying <strong>what can happen</strong>.
          <br />
          We have NOT mentioned population, impact, or disaster yet.
          <br />
          <span className="notice-emphasis">This teaches: "Events exist, but they don't automatically cause crises"</span>
        </div>
      </div>

      {/* Historical Timeline Visualization */}
      <div className="historical-timeline">
        <h3 className="subsection-title">Major Hazard Events in Tanzania (Last 10 Years)</h3>
        <p className="subsection-intro">
          Historical frequency helps us understand hazard patterns, but does NOT predict impact.
        </p>

        <div className="timeline-chart">
          <div className="timeline-year-labels">
            {['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'].map(year => (
              <div key={year} className="year-label">{year}</div>
            ))}
          </div>
          <div className="timeline-events">
            <div className="event-row floods">
              <span className="event-type">🌊 Floods</span>
              <div className="event-markers">
                <div className="event-marker" style={{ left: '10%' }}></div>
                <div className="event-marker" style={{ left: '30%' }}></div>
                <div className="event-marker" style={{ left: '50%' }}></div>
                <div className="event-marker" style={{ left: '70%' }}></div>
                <div className="event-marker" style={{ left: '90%' }}></div>
              </div>
            </div>
            <div className="event-row drought">
              <span className="event-type">☀️ Drought</span>
              <div className="event-markers">
                <div className="event-marker" style={{ left: '25%', width: '30%' }}></div>
                <div className="event-marker" style={{ left: '65%', width: '25%' }}></div>
              </div>
            </div>
            <div className="event-row epidemics">
              <span className="event-type">🦠 Epidemics</span>
              <div className="event-markers">
                <div className="event-marker" style={{ left: '15%' }}></div>
                <div className="event-marker" style={{ left: '55%', width: '35%' }}></div>
              </div>
            </div>
            <div className="event-row cyclones">
              <span className="event-type">🌪️ Cyclones</span>
              <div className="event-markers">
                <div className="event-marker" style={{ left: '40%' }}></div>
                <div className="event-marker" style={{ left: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-note">
          <strong>Note:</strong> This is a simplified representation. Actual hazard monitoring data
          would show precise dates, intensities, and affected locations.
        </div>
      </div>

      {/* Summary Box */}
      <div className="section-summary">
        <h4>Section 1 Summary: What You Learned</h4>
        <ul>
          <li>✓ Hazards are potentially damaging events (natural or human)</li>
          <li>✓ Tanzania faces multiple hazard types with varying frequencies</li>
          <li>✓ <strong>Hazards alone do NOT create disasters</strong></li>
          <li>✓ Impact depends on exposure, vulnerability, and coping capacity (coming next!)</li>
        </ul>
        <div className="next-preview">
          <strong>Next Section:</strong> EXPOSURE - Where hazards meet people
        </div>
      </div>
    </div>
  );
}

export default Section1Hazard;
