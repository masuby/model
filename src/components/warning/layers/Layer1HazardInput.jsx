/**
 * LAYER 1: HAZARD INPUT INTERFACE
 *
 * Allows institutional partners (TMA, MoW, MoH, MoA) to input
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

import React, { useState, useEffect, useCallback } from 'react';
import InteractiveHazardMap from '../components/InteractiveHazardMap';
import ReportExportButton from '../components/ReportExportButton';
import '../Module03WarningSystem.css';
import { logWarningCreated } from '../../../services/auditService';

// Institutional mandates - Keys must match authService.js (TMA, MOW, MOH, MOA, GST)
const INSTITUTIONS = {
  TMA: {
    name: 'Tanzania Meteorological Authority',
    hazards: ['Heavy Rainfall', 'Strong Winds', 'Large Waves', 'Dry Spells', 'Extreme Temperature'],
    icon: '🌧️',
    color: '#2196F3'
  },
  MOW: {
    name: 'Ministry of Water',
    hazards: ['River Flood', 'Dam Level Alert', 'Coastal Flood'],
    icon: '🌊',
    color: '#03A9F4'
  },
  MOH: {
    name: 'Ministry of Health',
    hazards: ['Disease Outbreak', 'Epidemic', 'Health Emergency'],
    icon: '🏥',
    color: '#F44336'
  },
  MOA: {
    name: 'Ministry of Agriculture',
    hazards: ['Agricultural Drought', 'Crop Disease', 'Livestock Disease', 'Pest Infestation'],
    icon: '🌾',
    color: '#8BC34A'
  },
  GST: {
    name: 'Geological Survey of Tanzania',
    hazards: ['Earthquake', 'Landslide', 'Volcanic Activity', 'Ground Subsidence'],
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
  onForecastSubmit,
  selectedInstitution: propInstitution = null // Institution passed from parent (e.g., logged-in user's institution)
}) => {
  // If institution is provided via props, use it (locked mode for institution users)
  // Otherwise, allow selection (for PMO users)
  const isInstitutionLocked = !!propInstitution;
  const [selectedInstitution, setSelectedInstitution] = useState(propInstitution || 'TMA');

  // Get the initial hazard type based on the institution
  const initialInst = propInstitution || 'TMA';
  const initialHazard = INSTITUTIONS[initialInst]?.hazards[0] || 'Heavy Rainfall';
  const [hazardType, setHazardType] = useState(initialHazard);

  // Sync institution and hazard type when prop changes
  useEffect(() => {
    if (propInstitution && propInstitution !== selectedInstitution) {
      setSelectedInstitution(propInstitution);
      // Also set the default hazard type for this institution
      if (INSTITUTIONS[propInstitution]) {
        setHazardType(INSTITUTIONS[propInstitution].hazards[0]);
      }
    }
  }, [propInstitution]);
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
  const [lastSubmittedHazard, setLastSubmittedHazard] = useState(null); // Track last submission for export
  const [drawnShapes, setDrawnShapes] = useState([]); // Track drawn shapes (hazard icons, polygons, etc.) for PDF export

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
  // FIXED: Use functional setState to always get latest state (avoids stale closure issue)
  const handleMapDistrictSelect = useCallback((districtName) => {
    console.log(`🗺️ Map click on district: "${districtName}"`);
    console.log(`📍 Current warning level: ${currentWarningLevel}`);

    setSelectedDistricts(prevDistricts => {
      console.log(`📋 Previous selectedDistricts:`, prevDistricts);

      if (prevDistricts[districtName]) {
        // If clicking on same warning level, deselect. Otherwise, update to new level.
        if (prevDistricts[districtName] === currentWarningLevel) {
          console.log(`❌ Deselecting district (same level)`);
          const newDistricts = { ...prevDistricts };
          delete newDistricts[districtName];
          console.log(`📋 New state:`, newDistricts);
          return newDistricts;
        } else {
          console.log(`🔄 Updating district to new level: ${currentWarningLevel}`);
          const newDistricts = { ...prevDistricts, [districtName]: currentWarningLevel };
          console.log(`📋 New state:`, newDistricts);
          return newDistricts;
        }
      } else {
        console.log(`✅ Adding new district: ${districtName} with level: ${currentWarningLevel}`);
        const newDistricts = { ...prevDistricts, [districtName]: currentWarningLevel };
        console.log(`📋 New state:`, newDistricts);
        return newDistricts;
      }
    });
  }, [currentWarningLevel]);

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
      isSimulation: simulationMode,
      drawnShapes: drawnShapes // Include drawn shapes (hazard icons, polygons, etc.) for PDF export
    };

    onHazardSubmit(hazardData);

    // Save for export functionality
    setLastSubmittedHazard(hazardData);

    // Log to audit trail
    logWarningCreated({
      id: `hazard_${Date.now()}`,
      hazardType: hazardData.hazardType,
      warningLevel: hazardData.warningLevel,
      spatialExtent: hazardData.spatialExtent,
      validFrom: hazardData.temporalValidity?.start,
      validTo: hazardData.temporalValidity?.end
    });

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
          <h2>Hazard Monitoring Input</h2>
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

      {/* Institution Selector - Only show when not locked to a specific institution */}
      {!isInstitutionLocked ? (
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
                <div className="institution-icon">
                  {INSTITUTIONS[key].icon}
                </div>
                <div className="institution-name">{key}</div>
                <div className="institution-full-name">{INSTITUTIONS[key].name}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Show locked institution info for institution users */
        <div className="institution-locked-info" style={{
          background: `linear-gradient(135deg, ${institution.color}15 0%, ${institution.color}25 100%)`,
          padding: '16px 20px',
          borderRadius: '10px',
          border: `2px solid ${institution.color}`,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ fontSize: '36px' }}>{institution.icon}</div>
          <div>
            <div style={{ fontWeight: '700', color: institution.color, fontSize: '16px' }}>
              {institution.name}
            </div>
            <div style={{ color: '#666', fontSize: '13px' }}>
              Submitting as authorized {selectedInstitution} representative
            </div>
          </div>
        </div>
      )}

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
            <div className="action-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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

              {/* Export Current Form as PDF */}
              <ReportExportButton
                reportType="hazard"
                reportData={{
                  hazardType,
                  temperatureType: hazardType === 'Extreme Temperature' ? temperatureType : undefined,
                  shadingMode,
                  institution: selectedInstitution,
                  institutionName: institution.name,
                  spatialExtent: Object.keys(selectedDistricts),
                  districtWarningLevels: selectedDistricts,
                  regions: selectedRegions,
                  forecastDay: forecastDay,
                  forecastDate: forecastDate.toISOString(),
                  temporalValidity: {
                    start: new Date(startDate).toISOString(),
                    end: new Date(endDate).toISOString(),
                    applicableDays: [forecastDay]
                  },
                  warningLevel: currentWarningLevel,
                  quantitativeValue: quantitativeValue ? parseFloat(quantitativeValue) : null,
                  likelihood,
                  source: `${institution.name} ${simulationMode ? '(Simulation)' : '(Live)'}`,
                  issuedAt: new Date().toISOString(),
                  additionalInfo,
                  isSimulation: simulationMode,
                  drawnShapes: drawnShapes
                }}
                buttonStyle="secondary"
                buttonText="Export PDF"
                disabled={Object.keys(selectedDistricts).length === 0}
                onExportComplete={(format) => {
                  console.log(`📤 Hazard input exported as ${format}`);
                }}
              />
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
                onDrawnShapesChange={setDrawnShapes}
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
  // Set to 00:00 (midnight) for clean start time
  now.setHours(0, 0, 0, 0);
  return formatDateTimeLocal(now);
}

function getTomorrowDate() {
  const tomorrow = new Date();
  // Set to 23:59 for full 24-hour validity period
  tomorrow.setHours(23, 59, 0, 0);
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
    'Disease Outbreak': 'cases',
    'Epidemic': 'cases'
  };
  return units[hazardType] || 'value';
}

export default Layer1HazardInput;
