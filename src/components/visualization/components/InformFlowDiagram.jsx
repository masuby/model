/**
 * INFORM Flow Diagram - ENHANCED WITH MAPS
 * Shows how individual hazards flow into overall RISK with geographic context
 * Now includes interactive maps showing selected area
 */
import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { INFORM_COLORS, getRiskClass } from '../../../config/informFramework';
import 'leaflet/dist/leaflet.css';
import './InformFlowDiagram.css';

// Individual hazard indicators
const HAZARD_INDICATORS = [
  { id: 'drought', name: 'Drought', column: 'Drought', category: 'NATURAL' },
  { id: 'flood', name: 'Flood', column: 'Flood', category: 'NATURAL' },
  { id: 'earthquake', name: 'Earthquake', column: 'Earthquake', category: 'NATURAL' },
  { id: 'wildfire', name: 'Wildfire', column: 'Wildfire', category: 'NATURAL' },
  { id: 'coastal', name: 'Coastal Hazards', column: 'Coastal hazards', category: 'NATURAL' },
  { id: 'conflict', name: 'Conflict', column: 'Conflict Intensity', category: 'HUMAN' },
];

// Map component that auto-zooms to selected area
const AutoZoomMap = ({ geoJson, selectedAreaName, areaLevel }) => {
  const map = useMap();

  useEffect(() => {
    if (!geoJson || !selectedAreaName) return;

    // Find the feature for selected area
    const feature = geoJson.features.find(f => {
      const name = f.properties?.ADM2_EN || f.properties?.ADM1_EN || f.properties?.shapeName;
      return name === selectedAreaName;
    });

    if (feature) {
      const layer = L.geoJSON(feature);
      const bounds = layer.getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 });
    }
  }, [geoJson, selectedAreaName, map]);

  return null;
};

// Map visualization component - SHOWS ONLY SELECTED REGION
const AreaMap = ({ adm1GeoJson, adm2GeoJson, selectedAreaName, areaLevel, hazardValue, selectedRegion, comparisonAreas = [] }) => {
  const mapCenter = [-6.3690, 34.8888];
  const mapZoom = 6;

  // FILTER GeoJSON to show ONLY selected area
  const filteredGeoJson = useMemo(() => {
    if (areaLevel === 'country') {
      // Show all regions for country level
      return adm1GeoJson;
    } else if (areaLevel === 'region') {
      // Show ONLY districts in the selected region
      if (!adm2GeoJson || !selectedRegion) return null;

      console.log('Filtering for region:', selectedRegion);

      const filtered = {
        type: 'FeatureCollection',
        features: adm2GeoJson.features.filter(feature => {
          // Try multiple property names
          const featureRegion = feature.properties?.reg_name ||
                                feature.properties?.ADM1_EN ||
                                feature.properties?.Region ||
                                feature.properties?.ADM1_NAME;

          console.log('Comparing:', featureRegion, 'with', selectedRegion);
          return featureRegion === selectedRegion;
        })
      };

      console.log('Filtered features:', filtered.features.length);
      return filtered;
    } else if (areaLevel === 'district') {
      // Show ONLY the selected district
      if (!adm2GeoJson || !selectedAreaName) return null;

      return {
        type: 'FeatureCollection',
        features: adm2GeoJson.features.filter(feature => {
          const featureName = feature.properties?.dist_name ||
                             feature.properties?.ADM2_EN ||
                             feature.properties?.shapeName ||
                             feature.properties?.ADM2_NAME;
          return featureName === selectedAreaName;
        })
      };
    }
    return null;
  }, [adm1GeoJson, adm2GeoJson, areaLevel, selectedAreaName, selectedRegion]);

  // Calculate bounds for filtered area
  const mapBounds = useMemo(() => {
    if (filteredGeoJson && filteredGeoJson.features.length > 0) {
      const layer = L.geoJSON(filteredGeoJson);
      return layer.getBounds();
    }
    return null;
  }, [filteredGeoJson]);

  if (!filteredGeoJson) {
    return (
      <div style={{
        height: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '2px dashed #ddd'
      }}>
        <p style={{ color: '#888' }}>Loading map...</p>
      </div>
    );
  }

  const getFeatureStyle = (feature) => {
    const featureName = feature.properties?.dist_name ||
                       feature.properties?.ADM2_EN ||
                       feature.properties?.shapeName ||
                       feature.properties?.reg_name ||
                       feature.properties?.ADM1_EN ||
                       feature.properties?.ADM2_NAME ||
                       feature.properties?.ADM1_NAME;

    const isComparisonArea = comparisonAreas.includes(featureName);
    const riskClass = getRiskClass(hazardValue);

    return {
      fillColor: isComparisonArea ? '#7b1fa2' : (riskClass?.color || '#1976d2'),
      weight: isComparisonArea ? 4 : 3,
      opacity: 1,
      color: isComparisonArea ? '#4a148c' : '#000',
      fillOpacity: isComparisonArea ? 0.85 : 0.7,
    };
  };

  return (
    <div style={{ height: '850px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '4px solid #2c3e50', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
        bounds={mapBounds}
        boundsOptions={{ padding: [30, 30], maxZoom: 10 }}
        key={`map-${areaLevel}-${selectedAreaName || 'country'}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {filteredGeoJson && (
          <GeoJSON
            key={`geojson-${areaLevel}-${selectedAreaName || 'all'}`}
            data={filteredGeoJson}
            style={getFeatureStyle}
          />
        )}

        {/* Labels on top */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          pane="overlayPane"
        />
      </MapContainer>
    </div>
  );
};

function InformFlowDiagram({ data, adm1GeoJson, adm2GeoJson }) {
  const [selectedHazard, setSelectedHazard] = useState(HAZARD_INDICATORS[0]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [comparisonAreas, setComparisonAreas] = useState([]); // NEW: For multi-area comparison

  // Load GeoJSON if not provided
  const [loadedAdm1, setLoadedAdm1] = useState(adm1GeoJson);
  const [loadedAdm2, setLoadedAdm2] = useState(adm2GeoJson);

  useEffect(() => {
    if (!adm1GeoJson) {
      fetch('/geojson/ADM1.geojson')
        .then(res => res.json())
        .then(data => setLoadedAdm1(data))
        .catch(err => console.error('Error loading ADM1:', err));
    }
    if (!adm2GeoJson) {
      fetch('/geojson/ADM2.geojson')
        .then(res => res.json())
        .then(data => setLoadedAdm2(data))
        .catch(err => console.error('Error loading ADM2:', err));
    }
  }, [adm1GeoJson, adm2GeoJson]);

  // Get unique areas
  const areas = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(row => ({
      name: row.ADM2_NAME,
      region: row.ADM1_NAME,
      data: row
    })).filter(a => a.name);
  }, [data]);

  // Get unique regions
  const regions = useMemo(() => {
    if (!data || data.length === 0) return [];
    const regionSet = new Set();
    data.forEach(row => {
      if (row.ADM1_NAME) regionSet.add(row.ADM1_NAME);
    });
    return Array.from(regionSet).sort();
  }, [data]);

  // Determine area level (country, region, or district)
  const areaLevel = useMemo(() => {
    if (!selectedArea) return 'country';
    // Check if it's a region
    if (regions.includes(selectedArea)) return 'region';
    // Otherwise it's a district
    return 'district';
  }, [selectedArea, regions]);

  // Get data for selected area or national average
  const areaData = useMemo(() => {
    if (!data || data.length === 0) return null;

    if (selectedArea) {
      // Check if it's a region
      if (regions.includes(selectedArea)) {
        // Calculate regional average
        const regionData = data.filter(row => row.ADM1_NAME === selectedArea);
        if (regionData.length === 0) return null;

        const avg = {};
        const columns = ['RISK', 'HAZARD', 'NATURAL', 'HUMAN', 'VULNERABILITY', 'LACK OF COPING CAPACITY'];
        HAZARD_INDICATORS.forEach(h => columns.push(h.column));

        columns.forEach(col => {
          const values = regionData.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
          avg[col] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        });
        avg.ADM2_NAME = `${selectedArea} Region`;
        avg.ADM1_NAME = selectedArea;
        return avg;
      }

      // It's a district
      return data.find(row => row.ADM2_NAME === selectedArea);
    }

    // Calculate national average
    const avg = {};
    const columns = ['RISK', 'HAZARD', 'NATURAL', 'HUMAN', 'VULNERABILITY', 'LACK OF COPING CAPACITY'];
    HAZARD_INDICATORS.forEach(h => columns.push(h.column));

    columns.forEach(col => {
      const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      avg[col] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });
    avg.ADM2_NAME = 'National Average';
    avg.ADM1_NAME = 'Tanzania';

    return avg;
  }, [data, selectedArea, regions]);

  // Get selected region for map filtering — must run unconditionally
  const selectedRegion = useMemo(() => {
    if (!selectedArea) return null;
    if (regions.includes(selectedArea)) return selectedArea;
    // Find region for selected district
    const district = data.find(row => row.ADM2_NAME === selectedArea);
    return district?.ADM1_NAME || null;
  }, [selectedArea, regions, data]);

  // Get comparison data for all selected comparison areas. Must precede the
  // early returns below so this hook is invoked unconditionally.
  const comparisonData = useMemo(() => {
    const lookup = (areaName) => {
      if (!areaName) return null;
      if (regions.includes(areaName)) {
        const regionData = data.filter(row => row.ADM1_NAME === areaName);
        if (regionData.length === 0) return null;
        const avg = {};
        const columns = ['RISK', 'HAZARD', 'NATURAL', 'HUMAN', 'VULNERABILITY', 'LACK OF COPING CAPACITY'];
        HAZARD_INDICATORS.forEach(h => columns.push(h.column));
        columns.forEach(col => {
          const values = regionData.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
          avg[col] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        });
        avg.ADM2_NAME = `${areaName} Region`;
        avg.ADM1_NAME = areaName;
        return avg;
      }
      return data.find(row => row.ADM2_NAME === areaName) || null;
    };
    return comparisonAreas.map(areaName => ({
      name: areaName,
      data: lookup(areaName),
      isRegion: regions.includes(areaName)
    })).filter(item => item.data !== null);
  }, [comparisonAreas, data, regions]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h3>No Data Available</h3>
        <p>Please upload an INFORM dataset to see the risk flow diagram.</p>
      </div>
    );
  }

  if (!areaData) return null;

  // Get values
  const hazardValue = parseFloat(areaData[selectedHazard.column]) || 0;
  const categoryValue = parseFloat(areaData[selectedHazard.category]) || 0;
  const totalHazard = parseFloat(areaData.HAZARD) || 0;
  const vulnerability = parseFloat(areaData.VULNERABILITY) || 0;
  const copingCapacity = parseFloat(areaData['LACK OF COPING CAPACITY']) || 0;
  const risk = parseFloat(areaData.RISK) || 0;

  const hazardClass = getRiskClass(hazardValue);
  const riskClass = getRiskClass(risk);

  return (
    <div className="inform-flow-diagram" style={{
      minHeight: '100vh',
      padding: '15px',
      backgroundColor: '#f0f4f8',
      width: '100%',
      maxWidth: '100%',
      margin: 0,
      overflow: 'auto'
    }}>
      {/* Header - Compact */}
      <div style={{ marginBottom: '20px', textAlign: 'center', backgroundColor: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '30px', color: '#1a1a2e', fontWeight: 700 }}>
          🔄 INFORM Risk Framework Flow
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: '15px', lineHeight: 1.4 }}>
          <strong style={{ color: INFORM_COLORS.dimensions.hazard }}>{selectedHazard.name}</strong> in <strong>{areaData.ADM2_NAME}</strong>
        </p>
      </div>

      {/* Controls Row - Simplified */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#333', fontSize: '15px' }}>
            Select Hazard:
          </label>
          <select
            value={selectedHazard.id}
            onChange={(e) => setSelectedHazard(HAZARD_INDICATORS.find(h => h.id === e.target.value))}
            style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '8px', border: '2px solid #ddd', fontWeight: 500 }}
          >
            {HAZARD_INDICATORS.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#333', fontSize: '15px' }}>
            Select Area ({areaLevel === 'country' ? 'National' : areaLevel === 'region' ? 'Region' : 'District'}):
          </label>
          <select
            value={selectedArea || ''}
            onChange={(e) => setSelectedArea(e.target.value || null)}
            style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '8px', border: '2px solid #ddd', fontWeight: 500 }}
          >
            <option value="">🇹🇿 Tanzania (National)</option>
            <optgroup label="📍 Regions (31)">
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </optgroup>
            <optgroup label="🏘️ Districts (184)">
              {areas.map(a => (
                <option key={a.name} value={a.name}>{a.name} ({a.region})</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* NEW: Multi-Select Comparison Panel */}
      <div style={{ marginBottom: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a2e', fontWeight: 700 }}>
            📊 Compare Multiple Areas
          </h3>
          {comparisonAreas.length > 0 && (
            <button
              onClick={() => setComparisonAreas([])}
              style={{
                padding: '6px 14px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Clear All ({comparisonAreas.length})
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333', fontSize: '14px' }}>
              Add area to comparison:
            </label>
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value && !comparisonAreas.includes(value)) {
                  setComparisonAreas([...comparisonAreas, value]);
                  e.target.value = '';
                }
              }}
              style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '6px', border: '2px solid #ddd' }}
            >
              <option value="">Select area to add...</option>
              <optgroup label="Regions">
                {regions.filter(r => !comparisonAreas.includes(r)).map(r => (
                  <option key={r} value={r}>📍 {r}</option>
                ))}
              </optgroup>
              <optgroup label="Districts">
                {areas.filter(a => !comparisonAreas.includes(a.name)).map(a => (
                  <option key={a.name} value={a.name}>🏘️ {a.name} ({a.region})</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Selected comparison areas - Tags */}
        {comparisonAreas.length > 0 && (
          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {comparisonAreas.map(areaName => {
              const isRegion = regions.includes(areaName);
              return (
                <div
                  key={areaName}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: isRegion ? '#e3f2fd' : '#f3e5f5',
                    border: `2px solid ${isRegion ? '#1976d2' : '#7b1fa2'}`,
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isRegion ? '#1976d2' : '#7b1fa2'
                  }}
                >
                  <span>{isRegion ? '📍' : '🏘️'} {areaName}</span>
                  <button
                    onClick={() => setComparisonAreas(comparisonAreas.filter(a => a !== areaName))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0,
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Grid: Map + Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '30px', marginBottom: '30px' }}>

        {/* LEFT: Geographic Context Map */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '22px', color: '#1a1a2e', fontWeight: 700 }}>
            📍 Geographic Context
          </h3>
          <AreaMap
            adm1GeoJson={loadedAdm1}
            adm2GeoJson={loadedAdm2}
            selectedAreaName={selectedArea || null}
            areaLevel={areaLevel}
            hazardValue={hazardValue}
            selectedRegion={selectedRegion}
            comparisonAreas={comparisonAreas}
          />
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#e8f4f8',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#2c3e50',
            borderLeft: '5px solid #3498db',
            fontWeight: 500
          }}>
            <strong>📍 Showing:</strong> {areaData.ADM2_NAME || 'Tanzania'}
            {areaData.ADM1_NAME && ` (${areaData.ADM1_NAME})`}
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#7f8c8d' }}>
              {areaLevel === 'country' && '🌍 Viewing: All 31 Regions'}
              {areaLevel === 'region' && `📍 Viewing: ${selectedRegion} Region Districts`}
              {areaLevel === 'district' && `🏘️ Viewing: ${selectedArea} District Only`}
            </div>
            {comparisonAreas.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                backgroundColor: '#f3e5f5',
                borderRadius: '6px',
                border: '2px solid #7b1fa2',
                fontSize: '13px',
                color: '#4a148c'
              }}>
                <strong>🔍 Highlighted ({comparisonAreas.length}):</strong> Comparison areas shown in purple
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Risk Flow Steps */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '22px', color: '#1a1a2e', fontWeight: 700 }}>
            🔄 Risk Calculation Flow
          </h3>

          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '2px solid #e0e0e0', height: '100%' }}>

            {/* Step 1: Individual Hazard */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
                STEP 1: Individual Hazard
              </div>
              <div style={{
                backgroundColor: hazardClass?.color || '#bbb',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 3px 8px rgba(0,0,0,0.12)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  {selectedHazard.name}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700 }}>
                  {hazardValue.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>
                  {hazardClass?.label || 'N/A'} Risk
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <div style={{ fontSize: '20px', color: '#666' }}>↓</div>
              <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>contributes to</div>
            </div>

            {/* Step 2: Category */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
                STEP 2: Hazard Category
              </div>
              <div style={{
                backgroundColor: selectedHazard.category === 'NATURAL' ? '#EF5350' : '#C62828',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 3px 8px rgba(0,0,0,0.12)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  {selectedHazard.category === 'NATURAL' ? 'Natural Hazards' : 'Human Hazards'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>
                  {categoryValue.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <div style={{ fontSize: '20px', color: '#666' }}>↓</div>
              <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>combined to form</div>
            </div>

            {/* Step 3: Total Hazard */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
                STEP 3: Total Hazard
              </div>
              <div style={{
                backgroundColor: INFORM_COLORS.dimensions.hazard,
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 3px 8px rgba(0,0,0,0.12)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  HAZARD
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>
                  {totalHazard.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <div style={{ fontSize: '20px', color: '#666' }}>↓</div>
              <div style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>COMBINED WITH</div>
            </div>

            {/* Step 4: Three Dimensions */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
                STEP 4: Three Dimensions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{
                  backgroundColor: INFORM_COLORS.dimensions.hazard,
                  color: 'white',
                  padding: '10px 6px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>HAZARD</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{totalHazard.toFixed(2)}</div>
                </div>

                <div style={{
                  backgroundColor: INFORM_COLORS.dimensions.vulnerability,
                  color: 'white',
                  padding: '10px 6px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>VULN</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{vulnerability.toFixed(2)}</div>
                </div>

                <div style={{
                  backgroundColor: INFORM_COLORS.dimensions.copingCapacity,
                  color: 'white',
                  padding: '10px 6px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>COPING</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{copingCapacity.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Formula */}
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <div style={{ fontSize: '20px', color: '#666' }}>↓</div>
              <div style={{
                backgroundColor: '#fff3cd',
                padding: '8px',
                borderRadius: '6px',
                border: '2px solid #ffc107',
                margin: '8px 0'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#856404', marginBottom: '4px' }}>
                  INFORM Formula
                </div>
                <div style={{ fontSize: '12px', color: '#856404', fontFamily: 'monospace' }}>
                  RISK = (H × V × C)^(1/3)
                </div>
              </div>
            </div>

            {/* Step 5: Final Risk */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
                STEP 5: Overall Risk
              </div>
              <div style={{
                backgroundColor: riskClass?.color || '#bbb',
                color: 'white',
                padding: '18px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                border: '3px solid rgba(255,255,255,0.3)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  INFORM RISK INDEX
                </div>
                <div style={{ fontSize: '42px', fontWeight: 700, lineHeight: 1 }}>
                  {risk.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '8px', opacity: 0.95 }}>
                  {riskClass?.label || 'N/A'} Risk
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Explanation Panel */}
      <div style={{
        padding: '30px',
        backgroundColor: '#e3f2fd',
        borderRadius: '10px',
        borderLeft: '6px solid #1976d2'
      }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#1565c0', fontSize: '18px' }}>
          📚 Understanding the Flow for {areaData.ADM2_NAME}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: 1.7, color: '#333' }}>
              <strong>1. Individual Hazard:</strong> {selectedHazard.name} = {hazardValue.toFixed(2)}
            </p>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: 1.7, color: '#333' }}>
              <strong>2. Category:</strong> {selectedHazard.category} = {categoryValue.toFixed(2)}
            </p>
            <p style={{ margin: '0', fontSize: '14px', lineHeight: 1.7, color: '#333' }}>
              <strong>3. Hazard Dimension:</strong> HAZARD = {totalHazard.toFixed(2)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: 1.7, color: '#333' }}>
              <strong>4. Three Dimensions:</strong> H={totalHazard.toFixed(2)}, V={vulnerability.toFixed(2)}, C={copingCapacity.toFixed(2)}
            </p>
            <p style={{ margin: '0', fontSize: '14px', lineHeight: 1.7, color: '#333' }}>
              <strong>5. Final Risk:</strong> RISK = {risk.toFixed(2)} ({riskClass?.label})
            </p>
          </div>
        </div>
      </div>

      {/* NEW: Comparison Table */}
      {comparisonData.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '30px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          border: '2px solid #1976d2'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a1a2e', fontSize: '22px', fontWeight: 700 }}>
            📊 Area Comparison - {selectedHazard.name} Risk
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{
                    padding: '14px 12px',
                    textAlign: 'left',
                    fontWeight: 700,
                    borderBottom: '3px solid #1976d2',
                    color: '#1a1a2e',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: '#f5f5f5',
                    zIndex: 1
                  }}>
                    Area
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, borderBottom: '3px solid #1976d2', color: '#1a1a2e' }}>
                    Type
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, borderBottom: '3px solid #1976d2', color: INFORM_COLORS.dimensions.hazard }}>
                    {selectedHazard.name}
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, borderBottom: '3px solid #1976d2', color: INFORM_COLORS.dimensions.hazard }}>
                    Hazard
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, borderBottom: '3px solid #1976d2', color: INFORM_COLORS.dimensions.vulnerability }}>
                    Vulnerability
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, borderBottom: '3px solid #1976d2', color: INFORM_COLORS.dimensions.copingCapacity }}>
                    Coping
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, borderBottom: '3px solid #1976d2', color: '#c62828' }}>
                    Risk
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, borderBottom: '3px solid #1976d2', color: '#666' }}>
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => {
                  const itemHazardValue = parseFloat(item.data[selectedHazard.column]) || 0;
                  const itemTotalHazard = parseFloat(item.data.HAZARD) || 0;
                  const itemVulnerability = parseFloat(item.data.VULNERABILITY) || 0;
                  const itemCopingCapacity = parseFloat(item.data['LACK OF COPING CAPACITY']) || 0;
                  const itemRisk = parseFloat(item.data.RISK) || 0;
                  const itemRiskClass = getRiskClass(itemRisk);

                  return (
                    <tr
                      key={item.name}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                        borderBottom: '1px solid #e0e0e0'
                      }}
                    >
                      <td style={{
                        padding: '12px',
                        fontWeight: 600,
                        color: '#1a1a2e',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                        zIndex: 1
                      }}>
                        {item.isRegion ? '📍' : '🏘️'} {item.name}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                        {item.isRegion ? 'Region' : 'District'}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '16px',
                        color: getRiskClass(itemHazardValue)?.color || '#666'
                      }}>
                        {itemHazardValue.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '16px',
                        color: INFORM_COLORS.dimensions.hazard
                      }}>
                        {itemTotalHazard.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '16px',
                        color: INFORM_COLORS.dimensions.vulnerability
                      }}>
                        {itemVulnerability.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '16px',
                        color: INFORM_COLORS.dimensions.copingCapacity
                      }}>
                        {itemCopingCapacity.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '18px',
                        color: itemRiskClass?.color || '#666'
                      }}>
                        {itemRisk.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          backgroundColor: itemRiskClass?.color || '#bbb',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-block'
                        }}>
                          {itemRiskClass?.label || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f0f7ff',
            borderRadius: '8px',
            borderLeft: '4px solid #1976d2',
            fontSize: '13px',
            color: '#555'
          }}>
            <strong>💡 Tip:</strong> Select multiple areas above to compare their risk profiles side-by-side. You can mix regions and districts for comprehensive analysis.
          </div>
        </div>
      )}
    </div>
  );
}

export default InformFlowDiagram;
