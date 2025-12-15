/**
 * LAYER 1: HAZARD INPUT INTERFACE
 *
 * Allows institutional partners (TMA, MoW, MoH, MoA, GST) to input
 * hazard information that will be combined with risk context.
 *
 * Features:
 * - Institution-specific input forms
 * - Interactive map-based spatial selection
 * - Form-based selection (fallback/alternative)
 * - Temporal validity picker
 * - Intensity scale selector
 * - Simulation mode support
 */

import React, { useState, useEffect } from 'react';
import InteractiveHazardMap from '../components/InteractiveHazardMap';
import '../Module03WarningSystem.css';

// Institutional mandates
const INSTITUTIONS = {
  TMA: {
    name: 'Tanzania Meteorological Authority',
    hazards: ['Heavy Rainfall', 'Strong Winds', 'Large Waves', 'Dry Spells', 'Extreme Temperature'],
    icon: '🌧️',
    color: '#2196F3'
  },
  MoW: {
    name: 'Ministry of Water',
    hazards: ['River Flood', 'Dam Level Alert', 'Coastal Flood'],
    icon: '🌊',
    color: '#03A9F4'
  },
  MoH: {
    name: 'Ministry of Health',
    hazards: ['Disease Outbreak', 'Epidemic', 'Health Emergency'],
    icon: '🏥',
    color: '#F44336'
  },
  MoA: {
    name: 'Ministry of Agriculture',
    hazards: ['Agricultural Drought', 'Crop Disease', 'Livestock Disease', 'Pest Infestation'],
    icon: '🌾',
    color: '#8BC34A'
  },
  GST: {
    name: 'Geological Survey of Tanzania',
    hazards: ['Earthquake', 'Seismic Activity', 'Landslide Risk'],
    icon: '🏔️',
    color: '#795548'
  }
};

// Sample Tanzania regions and districts
const REGIONS = {
  'Dar es Salaam': ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni'],
  'Dodoma': ['Dodoma Urban', 'Chamwino', 'Kondoa', 'Mpwapwa', 'Chemba'],
  'Arusha': ['Arusha Urban', 'Arusha Rural', 'Meru', 'Karatu', 'Monduli'],
  'Kilimanjaro': ['Moshi Urban', 'Moshi Rural', 'Hai', 'Rombo', 'Same'],
  'Mwanza': ['Ilemela', 'Nyamagana', 'Magu', 'Sengerema', 'Ukerewe'],
  'Mbeya': ['Mbeya Urban', 'Mbeya Rural', 'Rungwe', 'Kyela', 'Mbarali'],
  'Morogoro': ['Morogoro Urban', 'Morogoro Rural', 'Kilosa', 'Mvomero', 'Ulanga'],
  'Tanga': ['Tanga Urban', 'Muheza', 'Pangani', 'Korogwe', 'Handeni'],
  'Pwani': ['Kibaha', 'Mkuranga', 'Bagamoyo', 'Kisarawe', 'Rufiji']
};

const Layer1HazardInput = ({
  onHazardSubmit,
  simulationMode,
  riskData,
  forecastDay = 1,
  forecastDate = new Date(),
  onForecastSubmit
}) => {
  const [selectedInstitution, setSelectedInstitution] = useState('TMA');
  const [hazardType, setHazardType] = useState('Heavy Rainfall');
  const [temperatureType, setTemperatureType] = useState('Hot'); // 'Hot' or 'Cold' for Extreme Temperature
  const [shadingMode, setShadingMode] = useState('none'); // 'none', 'low', 'medium', 'high'
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState({}); // Changed to object: { districtName: warningLevel }
  const [currentWarningLevel, setCurrentWarningLevel] = useState('Advisory'); // The "brush" level for painting districts
  const [quantitativeValue, setQuantitativeValue] = useState('');
  const [likelihood, setLikelihood] = useState('High');
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTomorrowDate());
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectionView, setSelectionView] = useState('map'); // 'map' or 'form'

  const institution = INSTITUTIONS[selectedInstitution];

  // Debug: Track selectedDistricts changes
  useEffect(() => {
    console.log(`🔄 selectedDistricts state changed:`, selectedDistricts);
    console.log(`📊 Total selected: ${Object.keys(selectedDistricts).length}`);
  }, [selectedDistricts]);

  // Handle institution change
  const handleInstitutionChange = (inst) => {
    setSelectedInstitution(inst);
    setHazardType(INSTITUTIONS[inst].hazards[0]); // Set first hazard as default
    setSelectedRegions([]);
    setSelectedDistricts({});
  };

  // Handle region selection
  const handleRegionToggle = (region) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
      // Remove all districts from this region
      const districtsToRemove = REGIONS[region];
      const newDistricts = { ...selectedDistricts };
      districtsToRemove.forEach(d => delete newDistricts[d]);
      setSelectedDistricts(newDistricts);
    } else {
      setSelectedRegions([...selectedRegions, region]);
      // Auto-select all districts in region with current warning level
      const newDistricts = { ...selectedDistricts };
      REGIONS[region].forEach(d => {
        newDistricts[d] = currentWarningLevel;
      });
      setSelectedDistricts(newDistricts);
    }
  };

  // Handle district selection
  const handleDistrictToggle = (district, region) => {
    if (selectedDistricts[district]) {
      const newDistricts = { ...selectedDistricts };
      delete newDistricts[district];
      setSelectedDistricts(newDistricts);
      // Check if region should be deselected
      const allDistrictsSelected = REGIONS[region].every(d =>
        selectedDistricts[d] && d !== district
      );
      if (!allDistrictsSelected && selectedRegions.includes(region)) {
        setSelectedRegions(selectedRegions.filter(r => r !== region));
      }
    } else {
      setSelectedDistricts({ ...selectedDistricts, [district]: currentWarningLevel });
      // Check if all districts in region are now selected
      const allDistrictsSelected = REGIONS[region].every(d =>
        selectedDistricts[d] || d === district
      );
      if (allDistrictsSelected && !selectedRegions.includes(region)) {
        setSelectedRegions([...selectedRegions, region]);
      }
    }
  };

  // Handle district selection from map - assigns current warning level
  const handleMapDistrictSelect = (districtName) => {
    console.log(`🗺️ Map click on district: "${districtName}"`);
    console.log(`📍 Current warning level: ${currentWarningLevel}`);
    console.log(`📋 Current selectedDistricts state:`, selectedDistricts);

    if (selectedDistricts[districtName]) {
      // If clicking on same warning level, deselect. Otherwise, update to new level.
      if (selectedDistricts[districtName] === currentWarningLevel) {
        console.log(`❌ Deselecting district (same level)`);
        const newDistricts = { ...selectedDistricts };
        delete newDistricts[districtName];
        setSelectedDistricts(newDistricts);
        console.log(`📋 New state:`, newDistricts);
      } else {
        console.log(`🔄 Updating district to new level`);
        const newDistricts = { ...selectedDistricts, [districtName]: currentWarningLevel };
        setSelectedDistricts(newDistricts);
        console.log(`📋 New state:`, newDistricts);
      }
    } else {
      console.log(`✅ Adding new district selection`);
      const newDistricts = { ...selectedDistricts, [districtName]: currentWarningLevel };
      setSelectedDistricts(newDistricts);
      console.log(`📋 New state:`, newDistricts);
    }
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const districtCount = Object.keys(selectedDistricts).length;
    if (districtCount === 0) {
      alert('Please select at least one affected district');
      return;
    }

    // Count districts by warning level
    const levelCounts = {};
    Object.values(selectedDistricts).forEach(level => {
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    const hazardData = {
      hazardType,
      temperatureType: hazardType === 'Extreme Temperature' ? temperatureType : undefined,
      shadingMode,
      institution: selectedInstitution,
      institutionName: institution.name,
      spatialExtent: Object.keys(selectedDistricts), // Array of district names
      districtWarningLevels: selectedDistricts, // Object mapping districts to warning levels
      regions: selectedRegions,
      forecastDay: forecastDay, // Which forecast day this is for
      forecastDate: forecastDate.toISOString(), // The actual calendar date
      temporalValidity: {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
        applicableDays: [forecastDay] // This forecast is for the specific day
      },
      warningLevel: currentWarningLevel, // Current selected level
      quantitativeValue: quantitativeValue ? parseFloat(quantitativeValue) : null,
      likelihood,
      source: `${institution.name} ${simulationMode ? '(Simulation)' : '(Live)'}`,
      issuedAt: new Date().toISOString(),
      additionalInfo,
      isSimulation: simulationMode
    };

    onHazardSubmit(hazardData);

    // If onForecastSubmit callback exists, also save it as a forecast
    if (onForecastSubmit) {
      onForecastSubmit(forecastDay, hazardData);
    }

    // Build summary message
    const levelSummary = Object.entries(levelCounts)
      .map(([level, count]) => `${count} ${level}`)
      .join(', ');

    // Show confirmation
    alert(`Hazard input submitted!\n\n${hazardType} warning for ${districtCount} districts\n${levelSummary}\n${simulationMode ? '(Simulation Mode)' : '(Live Mode)'}`);

    // Reset form (optional)
    if (simulationMode) {
      // In simulation mode, keep form filled for easy testing
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedRegions([]);
    setSelectedDistricts({});
    setCurrentWarningLevel('Advisory');
    setQuantitativeValue('');
    setLikelihood('High');
    setAdditionalInfo('');
  };

  // Helper to get day name
  const getForecastDayName = (day) => {
    if (day === 1) return 'Today';
    if (day === 2) return 'Tomorrow';
    return `Day ${day}`;
  };

  const forecastDateString = forecastDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="layer1-container">
      <div className="layer-header">
        <div className="header-top">
          <h2>Layer 1: Hazard Monitoring Input</h2>
          <div className="forecast-day-badge" style={{
            background: 'linear-gradient(135deg, #FF9800, #F57C00)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}>
            📅 Forecast for {getForecastDayName(forecastDay)} - {forecastDateString}
          </div>
        </div>
        <p className="layer-description">
          Enter hazard forecast for {getForecastDayName(forecastDay).toLowerCase()}
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
              <div className="institution-icon" style={{ fontSize: '32px' }}>
                {INSTITUTIONS[key].icon}
              </div>
              <div className="institution-name">{key}</div>
              <div className="institution-full-name">{INSTITUTIONS[key].name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hazard Input Form */}
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

          {/* Temperature Type Selector (only for Extreme Temperature) */}
          {hazardType === 'Extreme Temperature' && (
            <div className="form-group temperature-type-selector">
              <label>Temperature Type</label>
              <div className="temperature-type-cards">
                <button
                  type="button"
                  className={`temp-type-card ${temperatureType === 'Hot' ? 'active' : ''}`}
                  onClick={() => setTemperatureType('Hot')}
                  style={{ borderColor: temperatureType === 'Hot' ? '#FF5722' : '#E0E0E0' }}
                >
                  <div className="temp-icon" style={{ backgroundColor: temperatureType === 'Hot' ? '#FF572220' : '#F5F5F5', color: '#FF5722' }}>
                    🔥
                  </div>
                  <div className="temp-label">Extreme Heat</div>
                  <div className="temp-description">Heatwave / High Temperature</div>
                </button>
                <button
                  type="button"
                  className={`temp-type-card ${temperatureType === 'Cold' ? 'active' : ''}`}
                  onClick={() => setTemperatureType('Cold')}
                  style={{ borderColor: temperatureType === 'Cold' ? '#2196F3' : '#E0E0E0' }}
                >
                  <div className="temp-icon" style={{ backgroundColor: temperatureType === 'Cold' ? '#2196F320' : '#F5F5F5', color: '#2196F3' }}>
                    ❄️
                  </div>
                  <div className="temp-label">Extreme Cold</div>
                  <div className="temp-description">Cold Wave / Low Temperature</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warning Configuration Panel - Above Map */}
        <div className="form-section">
          <div className="warning-config-header">
            <h3>⚠️ Warning Configuration</h3>
            <div className="config-status">
              <span className="status-dot"></span>
              <span className="status-text">
                {Object.keys(selectedDistricts).length > 0
                  ? `${Object.keys(selectedDistricts).length} district${Object.keys(selectedDistricts).length > 1 ? 's' : ''} selected`
                  : 'No districts selected'}
              </span>
            </div>
          </div>

          <div className="warning-config-panel">
            {/* Warning Level - Visual Cards */}
            <div className="warning-level-section">
              <label className="section-label">Select Warning Level</label>
              <p className="help-text" style={{ fontSize: '12px', color: '#666', marginBottom: '12px', lineHeight: '1.4' }}>
                💡 <strong>How it works:</strong> Select a warning level below, then click districts on the map to assign that level.
                Different districts can have different warning levels. Click a district again with a different level selected to change it.
              </p>
              <div className="warning-level-cards">
                <div
                  className={`warning-card ${currentWarningLevel === 'Advisory' ? 'active' : ''}`}
                  onClick={() => setCurrentWarningLevel('Advisory')}
                  style={{ borderColor: currentWarningLevel === 'Advisory' ? '#FFFF00' : '#E0E0E0' }}
                >
                  <div className="card-icon" style={{ background: '#FFFF00' }}>🟡</div>
                  <div className="card-content">
                    <div className="card-title">Advisory</div>
                    <div className="card-description">Low impact expected</div>
                  </div>
                  {currentWarningLevel === 'Advisory' && <div className="card-check">✓</div>}
                </div>

                <div
                  className={`warning-card ${currentWarningLevel === 'Warning' ? 'active' : ''}`}
                  onClick={() => setCurrentWarningLevel('Warning')}
                  style={{ borderColor: currentWarningLevel === 'Warning' ? '#FF6600' : '#E0E0E0' }}
                >
                  <div className="card-icon" style={{ background: '#FF6600', color: 'white' }}>🟠</div>
                  <div className="card-content">
                    <div className="card-title">Warning</div>
                    <div className="card-description">Moderate impact expected</div>
                  </div>
                  {currentWarningLevel === 'Warning' && <div className="card-check">✓</div>}
                </div>

                <div
                  className={`warning-card ${currentWarningLevel === 'Major Warning' ? 'active' : ''}`}
                  onClick={() => setCurrentWarningLevel('Major Warning')}
                  style={{ borderColor: currentWarningLevel === 'Major Warning' ? '#FF0000' : '#E0E0E0' }}
                >
                  <div className="card-icon" style={{ background: '#FF0000', color: 'white' }}>🔴</div>
                  <div className="card-content">
                    <div className="card-title">Major Warning</div>
                    <div className="card-description">High impact expected</div>
                  </div>
                  {currentWarningLevel === 'Major Warning' && <div className="card-check">✓</div>}
                </div>
              </div>
            </div>

            {/* Temporal Validity */}
            <div className="config-section">
              <label className="section-label">⏱️ Validity Period</label>
              <div className="date-range-container">
                <div className="date-input-group">
                  <label className="input-label">From</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="config-input date-input"
                    required
                  />
                </div>
                <div className="date-separator">→</div>
                <div className="date-input-group">
                  <label className="input-label">Until</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="config-input date-input"
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
                  <label className="input-label">Likelihood Level</label>
                  <select
                    value={likelihood}
                    onChange={(e) => setLikelihood(e.target.value)}
                    className="config-select styled-select"
                    required
                  >
                    <option value="High">🟢 High Likelihood</option>
                    <option value="Medium">🟡 Medium Likelihood</option>
                    <option value="Low">🔴 Low Likelihood</option>
                  </select>
                </div>

                <div className="param-group">
                  <label className="input-label">Polygon Shading Mode</label>
                  <select
                    value={shadingMode}
                    onChange={(e) => setShadingMode(e.target.value)}
                    className="config-select styled-select"
                  >
                    <option value="none">⬜ No Shading</option>
                    <option value="low">🟨 Low Intensity (Light)</option>
                    <option value="medium">🟧 Medium Intensity</option>
                    <option value="high">🟥 High Intensity (Dark)</option>
                  </select>
                </div>

                <div className="param-group">
                  <label className="input-label">Quantitative Intensity (Optional)</label>
                  <div className="input-with-icon">
                    <input
                      type="number"
                      value={quantitativeValue}
                      onChange={(e) => setQuantitativeValue(e.target.value)}
                      className="config-input"
                      placeholder={`Enter ${getQuantitativeUnit(hazardType)}`}
                    />
                    <span className="input-unit">{getQuantitativeUnit(hazardType)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                type="button"
                className="action-btn secondary"
                onClick={resetForm}
              >
                <span className="btn-icon">🔄</span>
                <span className="btn-text">Clear Form</span>
              </button>
              <button
                type="submit"
                className={`action-btn primary ${Object.keys(selectedDistricts).length === 0 ? 'disabled' : ''}`}
                style={{ backgroundColor: Object.keys(selectedDistricts).length > 0 ? institution.color : '#BDBDBD' }}
                disabled={Object.keys(selectedDistricts).length === 0}
              >
                <span className="btn-icon">{simulationMode ? '🎯' : '🚨'}</span>
                <span className="btn-text">
                  {simulationMode ? 'Test Scenario' : 'Submit Warning'}
                  {Object.keys(selectedDistricts).length > 0 && ` (${Object.keys(selectedDistricts).length})`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Spatial Extent */}
        <div className="form-section">
          <h3>📍 Affected Areas</h3>
          <p className="form-description">
            Click districts on the map to select affected areas
          </p>

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
              <InteractiveHazardMap
                selectedHazardType={hazardType}
                selectedDistricts={selectedDistricts}
                onDistrictSelect={handleMapDistrictSelect}
                riskData={riskData}
                activeHazards={[]}
                showPMOView={false}
                warningLevel={currentWarningLevel}
                shadingMode={shadingMode}
                temperatureType={temperatureType}
              />

              {/* Selected Districts Summary */}
              {Object.keys(selectedDistricts).length > 0 && (
                <div className="district-selection-summary">
                  <h4>Selected Districts ({Object.keys(selectedDistricts).length})</h4>
                  <div className="selected-districts-list">
                    {Object.entries(selectedDistricts).map(([district, level]) => {
                      const levelColor = level === 'Advisory' ? '#FFFF00' : level === 'Warning' ? '#FF6600' : '#FF0000';
                      const levelEmoji = level === 'Advisory' ? '🟡' : level === 'Warning' ? '🟠' : '🔴';
                      return (
                        <span
                          key={district}
                          className="selected-district-tag"
                          style={{ borderLeft: `4px solid ${levelColor}` }}
                        >
                          <span className="district-level-emoji">{levelEmoji}</span>
                          {district}
                          <span className="district-level-text" style={{ fontSize: '10px', opacity: 0.8 }}>
                            ({level})
                          </span>
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
                        <span className="region-name">{region} Region</span>
                        <span className="district-count">
                          ({REGIONS[region].filter(d => d in selectedDistricts).length}/{REGIONS[region].length} districts)
                        </span>
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

              <div className="selected-summary">
                <strong>Selected:</strong> {Object.keys(selectedDistricts).length} districts
                {Object.keys(selectedDistricts).length > 0 && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => {
                      setSelectedRegions([]);
                      setSelectedDistricts({});
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <h3>📝 Additional Information (Optional)</h3>
          <div className="form-group">
            <label>Notes / Context</label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="form-textarea"
              rows={3}
              placeholder="Any additional context, data sources, or special considerations..."
            />
          </div>
        </div>
      </form>

      {/* Info Panel */}
      <div className="info-panel">
        <h4>📋 Institutional Mandate</h4>
        <p>
          <strong>{institution.name}</strong> is the authoritative source for{' '}
          {institution.hazards.join(', ').toLowerCase()} monitoring and forecasting in Tanzania.
        </p>
        <p className="info-note">
          ℹ️ INFORM does not generate hazards. This system integrates your authoritative
          hazard information with risk context to produce impact-based warnings.
        </p>
      </div>
    </div>
  );
};

// Helper functions
function getTodayDate() {
  const now = new Date();
  return formatDateTimeLocal(now);
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateTimeLocal(tomorrow);
}

function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getQuantitativeUnit(hazardType) {
  const units = {
    'Heavy Rainfall': 'mm/24h',
    'River Flood': 'meters',
    'Dam Level Alert': 'meters',
    'Dry Spells': 'days',
    'Heatwave': '°C',
    'Strong Winds': 'km/h',
    'Earthquake': 'Magnitude',
    'Disease Outbreak': 'cases',
    'Epidemic': 'cases'
  };
  return units[hazardType] || 'value';
}

export default Layer1HazardInput;
