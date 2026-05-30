/**
 * HAZARD INPUT PANEL
 * Simplified Layer 1 for standalone system
 * Allows institutions to submit hazard forecasts
 */

import React, { useState, useCallback } from 'react';
import { INSTITUTIONS, REGIONS, getTodayDate, getTomorrowDate, formatDateTimeLocal, getQuantitativeUnit } from '../data/hazardConfig';
import StandaloneHazardMap from '../components/StandaloneHazardMap';
import { logWarningCreated } from '../../../services/auditService';

const HazardInputPanel = ({ onHazardSubmit, simulationMode = false, riskData = null }) => {
  const [selectedInstitution, setSelectedInstitution] = useState('TMA');
  const [hazardType, setHazardType] = useState('Heavy Rainfall');
  const [temperatureType, setTemperatureType] = useState('Hot');
  const [selectedDistricts, setSelectedDistricts] = useState({});
  const [currentWarningLevel, setCurrentWarningLevel] = useState('Advisory');
  const [quantitativeValue, setQuantitativeValue] = useState('');
  const [likelihood, setLikelihood] = useState('High');
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTomorrowDate());
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectionView, setSelectionView] = useState('map');
  const [selectedRegions, setSelectedRegions] = useState([]);

  const institution = INSTITUTIONS[selectedInstitution];

  // Handle institution change
  const handleInstitutionChange = (inst) => {
    setSelectedInstitution(inst);
    setHazardType(INSTITUTIONS[inst].hazards[0]);
    setSelectedRegions([]);
    setSelectedDistricts({});
  };

  // Handle map district selection
  const handleMapDistrictSelect = useCallback((districtName) => {
    setSelectedDistricts(prevDistricts => {
      if (prevDistricts[districtName]) {
        if (prevDistricts[districtName] === currentWarningLevel) {
          const newDistricts = { ...prevDistricts };
          delete newDistricts[districtName];
          return newDistricts;
        } else {
          return { ...prevDistricts, [districtName]: currentWarningLevel };
        }
      } else {
        return { ...prevDistricts, [districtName]: currentWarningLevel };
      }
    });
  }, [currentWarningLevel]);

  // Handle region toggle
  const handleRegionToggle = (region) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
      const districtsToRemove = REGIONS[region];
      const newDistricts = { ...selectedDistricts };
      districtsToRemove.forEach(d => delete newDistricts[d]);
      setSelectedDistricts(newDistricts);
    } else {
      setSelectedRegions([...selectedRegions, region]);
      const newDistricts = { ...selectedDistricts };
      REGIONS[region].forEach(d => {
        newDistricts[d] = currentWarningLevel;
      });
      setSelectedDistricts(newDistricts);
    }
  };

  // Handle district toggle
  const handleDistrictToggle = (district, region) => {
    if (selectedDistricts[district]) {
      const newDistricts = { ...selectedDistricts };
      delete newDistricts[district];
      setSelectedDistricts(newDistricts);
    } else {
      setSelectedDistricts({ ...selectedDistricts, [district]: currentWarningLevel });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const districtCount = Object.keys(selectedDistricts).length;
    if (districtCount === 0) {
      alert('Please select at least one affected district');
      return;
    }

    const levelCounts = {};
    Object.values(selectedDistricts).forEach(level => {
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    const hazardData = {
      hazardType,
      temperatureType: hazardType === 'Extreme Temperature' ? temperatureType : undefined,
      institution: selectedInstitution,
      institutionName: institution.name,
      spatialExtent: Object.keys(selectedDistricts),
      districtWarningLevels: selectedDistricts,
      regions: selectedRegions,
      temporalValidity: {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString()
      },
      warningLevel: currentWarningLevel,
      quantitativeValue: quantitativeValue ? parseFloat(quantitativeValue) : null,
      likelihood,
      source: `${institution.name} ${simulationMode ? '(Simulation)' : '(Live)'}`,
      issuedAt: new Date().toISOString(),
      additionalInfo,
      isSimulation: simulationMode
    };

    onHazardSubmit(hazardData);

    // Log to audit trail
    logWarningCreated({
      id: `hazard_${Date.now()}`,
      hazardType: hazardData.hazardType,
      warningLevel: hazardData.warningLevel,
      spatialExtent: hazardData.spatialExtent,
      validFrom: hazardData.temporalValidity?.start,
      validTo: hazardData.temporalValidity?.end
    });

    resetForm();
  };

  const resetForm = () => {
    setSelectedRegions([]);
    setSelectedDistricts({});
    setCurrentWarningLevel('Advisory');
    setQuantitativeValue('');
    setLikelihood('High');
    setAdditionalInfo('');
  };

  return (
    <div className="hazard-input-panel">
      <div className="panel-header">
        <h2>Hazard Monitoring Input</h2>
        <p className="panel-description">
          Submit hazard forecast for national consolidation and PMO validation
          {simulationMode && <span className="simulation-badge">🎯 SIMULATION MODE</span>}
        </p>
      </div>

      {/* Institution Selector */}
      <div className="institution-selector">
        <h3>Select Institution</h3>
        <div className="institution-cards">
          {Object.keys(INSTITUTIONS).map(key => (
            <button
              key={key}
              className={`institution-card ${selectedInstitution === key ? 'selected' : ''}`}
              onClick={() => handleInstitutionChange(key)}
              style={{
                borderColor: selectedInstitution === key ? INSTITUTIONS[key].color : '#E0E0E0'
              }}
            >
              <div className="institution-icon">{INSTITUTIONS[key].icon}</div>
              <div className="institution-name">{key}</div>
              <div className="institution-full-name">{INSTITUTIONS[key].name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hazard Form */}
      <form onSubmit={handleSubmit} className="hazard-form">
        {/* Hazard Type */}
        <div className="form-section">
          <h3>Hazard Type</h3>
          <div className="form-group">
            <label>Select Hazard</label>
            <select
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              className="form-input"
              required
            >
              {institution.hazards.map(hazard => (
                <option key={hazard} value={hazard}>{hazard}</option>
              ))}
            </select>
          </div>

          {/* Temperature Type (for Extreme Temperature) */}
          {hazardType === 'Extreme Temperature' && (
            <div className="form-group temperature-type-selector">
              <label>Temperature Type</label>
              <div className="temperature-type-cards">
                <button
                  type="button"
                  className={`temp-type-card ${temperatureType === 'Hot' ? 'active' : ''}`}
                  onClick={() => setTemperatureType('Hot')}
                >
                  <div style={{ fontSize: '36px' }}>🔥</div>
                  <div className="temp-label">Extreme Heat</div>
                </button>
                <button
                  type="button"
                  className={`temp-type-card ${temperatureType === 'Cold' ? 'active' : ''}`}
                  onClick={() => setTemperatureType('Cold')}
                >
                  <div style={{ fontSize: '36px' }}>❄️</div>
                  <div className="temp-label">Extreme Cold</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warning Configuration */}
        <div className="form-section">
          <h3>⚠️ Warning Configuration</h3>

          {/* Warning Level Selection */}
          <div className="warning-level-section">
            <label className="section-label">Select Warning Level</label>
            <div className="warning-level-cards">
              {['Advisory', 'Warning', 'Major Warning'].map(level => {
                const colors = {
                  'Advisory': { bg: '#FFFF00', border: '#FFFF00', emoji: '🟡' },
                  'Warning': { bg: '#FF6600', border: '#FF6600', emoji: '🟠' },
                  'Major Warning': { bg: '#FF0000', border: '#FF0000', emoji: '🔴' }
                };
                return (
                  <div
                    key={level}
                    className={`warning-card ${currentWarningLevel === level ? 'active' : ''}`}
                    onClick={() => setCurrentWarningLevel(level)}
                    style={{ borderColor: colors[level].border }}
                  >
                    <div style={{ fontSize: '32px' }}>{colors[level].emoji}</div>
                    <div className="card-title">{level}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Temporal Validity */}
          <div className="config-section">
            <label className="section-label">⏱️ Validity Period</label>
            <div className="date-range-container">
              <div className="date-input-group">
                <label>From</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="config-input"
                  required
                />
              </div>
              <div className="date-separator">→</div>
              <div className="date-input-group">
                <label>Until</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="config-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Parameters */}
          <div className="config-section">
            <label className="section-label">📊 Additional Parameters</label>
            <div className="params-grid">
              <div className="param-group">
                <label>Likelihood Level</label>
                <select value={likelihood} onChange={(e) => setLikelihood(e.target.value)} className="config-select" required>
                  <option value="High">🟢 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🔴 Low</option>
                </select>
              </div>
              <div className="param-group">
                <label>Quantitative Intensity (Optional)</label>
                <input
                  type="number"
                  value={quantitativeValue}
                  onChange={(e) => setQuantitativeValue(e.target.value)}
                  className="config-input"
                  placeholder={getQuantitativeUnit(hazardType)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spatial Extent */}
        <div className="form-section">
          <h3>📍 Affected Areas</h3>

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${selectionView === 'map' ? 'active' : ''}`}
              onClick={() => setSelectionView('map')}
            >
              🗺️ Map Selection
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${selectionView === 'form' ? 'active' : ''}`}
              onClick={() => setSelectionView('form')}
            >
              📋 Form Selection
            </button>
          </div>

          {/* Map View */}
          {selectionView === 'map' ? (
            <div className="map-selection-view">
              <StandaloneHazardMap
                selectedHazardType={hazardType}
                selectedDistricts={selectedDistricts}
                onDistrictSelect={handleMapDistrictSelect}
                riskData={riskData}
                warningLevel={currentWarningLevel}
              />
              {Object.keys(selectedDistricts).length > 0 && (
                <div className="district-selection-summary">
                  <h4>Selected Districts ({Object.keys(selectedDistricts).length})</h4>
                  <div className="selected-districts-list">
                    {Object.entries(selectedDistricts).map(([district, level]) => {
                      const colors = { 'Advisory': '#FFFF00', 'Warning': '#FF6600', 'Major Warning': '#FF0000' };
                      return (
                        <span key={district} className="selected-district-tag" style={{ borderLeft: `4px solid ${colors[level]}` }}>
                          {district}
                          <span
                            className="remove-btn"
                            onClick={() => handleMapDistrictSelect(district)}
                          >
                            ✕
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Form View */
            <div className="form-selection-view">
              <div className="spatial-selector">
                {Object.keys(REGIONS).map(region => (
                  <div key={region} className="region-group">
                    <div className="region-header">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedRegions.includes(region)}
                          onChange={() => handleRegionToggle(region)}
                        />
                        <span>{region} Region</span>
                      </label>
                    </div>
                    {selectedRegions.includes(region) && (
                      <div className="districts-list">
                        {REGIONS[region].map(district => (
                          <label key={district} className="checkbox-label district">
                            <input
                              type="checkbox"
                              checked={district in selectedDistricts}
                              onChange={() => handleDistrictToggle(district, region)}
                            />
                            <span>{district}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <h3>📝 Additional Information (Optional)</h3>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            className="form-textarea"
            rows={3}
            placeholder="Any additional context or special considerations..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="action-buttons">
          <button type="button" className="action-btn secondary" onClick={resetForm}>
            🔄 Clear Form
          </button>
          <button
            type="submit"
            className={`action-btn primary ${Object.keys(selectedDistricts).length === 0 ? 'disabled' : ''}`}
            style={{ backgroundColor: Object.keys(selectedDistricts).length > 0 ? institution.color : '#BDBDBD' }}
            disabled={Object.keys(selectedDistricts).length === 0}
          >
            {simulationMode ? '🎯 Test Scenario' : '🚨 Submit Warning'} ({Object.keys(selectedDistricts).length})
          </button>
        </div>
      </form>

      {/* Info Panel */}
      <div className="info-panel">
        <h4>📋 Institutional Mandate</h4>
        <p>
          <strong>{institution.name}</strong> is the authoritative source for {institution.hazards.join(', ').toLowerCase()} monitoring.
        </p>
        <p className="info-note">
          ℹ️ This system integrates your hazard information with risk context for PMO validation and decision support.
        </p>
      </div>
    </div>
  );
};

export default HazardInputPanel;
