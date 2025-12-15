/**
 * INFORM Choropleth Map - ENHANCED VERSION
 * Professional-grade choropleth visualization with region filtering
 * Following INFORM/UN-OCHA international standards
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  getRiskClass,
  getColorForValue,
  INFORM_COLORS,
  RISK_THRESHOLDS,
  INFORM_FRAMEWORK
} from '../../../config/informFramework';
import 'leaflet/dist/leaflet.css';
import './InformChoroplethMap.css';

// Available indicator columns for visualization
const AVAILABLE_INDICATORS = [
  { column: 'RISK', label: 'INFORM Risk Index', dimension: 'risk' },
  { column: 'HAZARD', label: 'Hazard and Exposure', dimension: 'hazard' },
  { column: 'VULNERABILITY', label: 'Vulnerability', dimension: 'vulnerability' },
  { column: 'LACK OF COPING CAPACITY', label: 'Lack of Coping Capacity', dimension: 'copingCapacity' },
  { column: 'NATURAL', label: 'Natural Hazards', dimension: 'hazard' },
  { column: 'HUMAN', label: 'Human Hazards', dimension: 'hazard' },
  { column: 'SOCIO-ECONOMIC VULNERABILITY', label: 'Socio-Economic Vulnerability', dimension: 'vulnerability' },
  { column: 'VULNERABLE GROUPS', label: 'Vulnerable Groups', dimension: 'vulnerability' },
  { column: 'INFRASTRUCTURE', label: 'Infrastructure', dimension: 'copingCapacity' },
  { column: 'INSTITUTIONAL', label: 'Institutional', dimension: 'copingCapacity' },
  { column: 'Flood', label: 'Flood Risk', dimension: 'hazard' },
  { column: 'Drought', label: 'Drought Risk', dimension: 'hazard' },
  { column: 'Earthquake', label: 'Earthquake Risk', dimension: 'hazard' },
];

// Map bounds control component
const MapBoundsController = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }, [bounds, map]);
  return null;
};

// Legend component
const MapLegend = ({ selectedIndicator }) => {
  return (
    <div className="map-legend">
      <h4>{selectedIndicator?.label || 'Risk Level'}</h4>
      <div className="legend-scale">
        {Object.values(RISK_THRESHOLDS).reverse().map(threshold => (
          <div key={threshold.label} className="legend-row">
            <span
              className="legend-color"
              style={{ backgroundColor: threshold.color }}
            />
            <span className="legend-label">{threshold.label}</span>
            <span className="legend-value">
              {threshold.min.toFixed(1)} - {threshold.max.toFixed(1)}
            </span>
          </div>
        ))}
        <div className="legend-row">
          <span className="legend-color" style={{ backgroundColor: '#BDBDBD' }} />
          <span className="legend-label">No Data</span>
          <span className="legend-value">-</span>
        </div>
      </div>
    </div>
  );
};

// Info panel for hovered/selected region
const InfoPanel = ({ feature, data, selectedIndicator }) => {
  if (!feature) return null;

  const areaName = feature.properties?.ADM2_EN || feature.properties?.shapeName || feature.properties?.ADM1_EN || 'Unknown';
  const regionName = feature.properties?.ADM1_EN || '';

  // Find data for this area
  const areaData = data?.find(row =>
    row.ADM2_NAME === areaName || row.ADM1_NAME === areaName
  );

  const value = areaData ? parseFloat(areaData[selectedIndicator?.column]) : null;
  const riskClass = getRiskClass(value);

  return (
    <div className="info-panel">
      <h3>{areaName}</h3>
      {regionName && <p className="region-name">{regionName} Region</p>}
      <div className="info-stats">
        <div className="stat-item main-stat">
          <span className="stat-label">{selectedIndicator?.label || 'Value'}</span>
          <span
            className="stat-value"
            style={{ color: riskClass?.color || '#666', fontSize: '24px', fontWeight: '700' }}
          >
            {value?.toFixed(2) || 'N/A'}
          </span>
          {riskClass && (
            <span
              className="stat-badge"
              style={{ backgroundColor: riskClass.color }}
            >
              {riskClass.label}
            </span>
          )}
        </div>
        {areaData && (
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Hazard</span>
              <span className="stat-value" style={{ color: INFORM_COLORS.dimensions.hazard }}>
                {parseFloat(areaData['HAZARD'])?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Vulnerability</span>
              <span className="stat-value" style={{ color: INFORM_COLORS.dimensions.vulnerability }}>
                {parseFloat(areaData['VULNERABILITY'])?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Coping Capacity</span>
              <span className="stat-value" style={{ color: INFORM_COLORS.dimensions.copingCapacity }}>
                {parseFloat(areaData['LACK OF COPING CAPACITY'])?.toFixed(2) || 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function InformChoroplethMap({
  data,
  adm1GeoJson,
  adm2GeoJson,
  onAreaSelect,
  initialIndicator = 'RISK',
  isMiniature = false
}) {
  const [selectedIndicator, setSelectedIndicator] = useState(
    AVAILABLE_INDICATORS.find(i => i.column === initialIndicator) || AVAILABLE_INDICATORS[0]
  );
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [adminLevel, setAdminLevel] = useState('adm2'); // 'adm1' or 'adm2'
  const [mapBounds, setMapBounds] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null); // NEW: For region filtering

  const mapCenter = [-6.3690, 34.8888];
  const mapZoom = isMiniature ? 5 : 6;

  // Get list of unique regions
  const availableRegions = useMemo(() => {
    if (!data || !adm1GeoJson) return [];
    const regions = new Set();

    // Get regions from data
    data.forEach(row => {
      if (row.ADM1_NAME) regions.add(row.ADM1_NAME);
    });

    // Also get from GeoJSON to ensure completeness
    if (adm1GeoJson && adm1GeoJson.features) {
      adm1GeoJson.features.forEach(feature => {
        const regionName = feature.properties?.ADM1_EN || feature.properties?.shapeName;
        if (regionName) regions.add(regionName);
      });
    }

    return Array.from(regions).sort();
  }, [data, adm1GeoJson]);

  // Create a lookup map for quick data access
  const dataLookup = useMemo(() => {
    if (!data) return {};
    const lookup = {};
    data.forEach(row => {
      if (row.ADM2_NAME) lookup[row.ADM2_NAME] = row;
      if (row.ADM1_NAME) lookup[row.ADM1_NAME] = row;
    });
    return lookup;
  }, [data]);

  // Filter GeoJSON based on selected region
  const filteredGeoJson = useMemo(() => {
    const baseGeoJson = adminLevel === 'adm1' ? adm1GeoJson : adm2GeoJson;

    if (!baseGeoJson || !selectedRegion) return baseGeoJson;

    // Filter features to only include selected region
    const filtered = {
      ...baseGeoJson,
      features: baseGeoJson.features.filter(feature => {
        const featureRegion = feature.properties?.ADM1_EN || feature.properties?.Region;
        return featureRegion === selectedRegion;
      })
    };

    return filtered;
  }, [adm1GeoJson, adm2GeoJson, adminLevel, selectedRegion]);

  // Calculate bounds for selected region
  useEffect(() => {
    if (selectedRegion && filteredGeoJson && filteredGeoJson.features.length > 0) {
      const bounds = L.geoJSON(filteredGeoJson).getBounds();
      setMapBounds(bounds);
    } else {
      setMapBounds(null);
    }
  }, [selectedRegion, filteredGeoJson]);

  // Style function for GeoJSON features
  const getFeatureStyle = (feature) => {
    const areaName = feature.properties?.ADM2_EN ||
                    feature.properties?.shapeName ||
                    feature.properties?.ADM1_EN;

    const areaData = dataLookup[areaName];
    const value = areaData ? parseFloat(areaData[selectedIndicator.column]) : null;
    const color = getColorForValue(value);

    const isSelected = selectedFeature?.properties?.shapeName === feature.properties?.shapeName ||
                      selectedFeature?.properties?.ADM2_EN === feature.properties?.ADM2_EN;
    const isHovered = hoveredFeature?.properties?.shapeName === feature.properties?.shapeName ||
                      hoveredFeature?.properties?.ADM2_EN === feature.properties?.ADM2_EN;

    return {
      fillColor: color,
      weight: isSelected ? 4 : isHovered ? 3 : 1.5,
      opacity: 1,
      color: isSelected ? '#000' : isHovered ? '#333' : '#fff',
      fillOpacity: isSelected ? 0.95 : isHovered ? 0.85 : 0.75,
    };
  };

  // Event handlers for features
  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        setHoveredFeature(feature);
        e.target.setStyle({
          weight: 3,
          color: '#333',
          fillOpacity: 0.85
        });
        e.target.bringToFront();
      },
      mouseout: (e) => {
        setHoveredFeature(null);
        e.target.setStyle(getFeatureStyle(feature));
      },
      click: (e) => {
        setSelectedFeature(feature);
        const areaName = feature.properties?.ADM2_EN || feature.properties?.shapeName;
        if (onAreaSelect) {
          onAreaSelect(areaName, dataLookup[areaName]);
        }
      }
    });
  };

  // Handle region selection
  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region || null);
    setSelectedFeature(null); // Clear feature selection when changing region
  };

  return (
    <div className={`inform-choropleth-map ${isMiniature ? 'miniature' : ''}`}>
      {!isMiniature && (
        <div className="map-controls" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div className="control-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Indicator:</label>
            <select
              value={selectedIndicator.column}
              onChange={(e) => setSelectedIndicator(
                AVAILABLE_INDICATORS.find(i => i.column === e.target.value)
              )}
              style={{ width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              {AVAILABLE_INDICATORS.map(indicator => (
                <option key={indicator.column} value={indicator.column}>
                  {indicator.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Filter by Region:</label>
            <select
              value={selectedRegion || ''}
              onChange={handleRegionChange}
              style={{ width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Regions</option>
              {availableRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Admin Level:</label>
            <div className="toggle-buttons" style={{ display: 'flex', gap: '5px' }}>
              <button
                className={adminLevel === 'adm1' ? 'active' : ''}
                onClick={() => setAdminLevel('adm1')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: adminLevel === 'adm1' ? '#1976d2' : '#fff',
                  color: adminLevel === 'adm1' ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Regions
              </button>
              <button
                className={adminLevel === 'adm2' ? 'active' : ''}
                onClick={() => setAdminLevel('adm2')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: adminLevel === 'adm2' ? '#1976d2' : '#fff',
                  color: adminLevel === 'adm2' ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Districts
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRegion && !isMiniature && (
        <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px', borderLeft: '4px solid #1976d2' }}>
          <strong>Filtered to: {selectedRegion}</strong>
          <button
            onClick={() => setSelectedRegion(null)}
            style={{
              marginLeft: '15px',
              padding: '4px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="map-wrapper" style={{ position: 'relative', height: isMiniature ? '300px' : '600px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%', borderRadius: '8px' }}
          scrollWheelZoom={!isMiniature}
          dragging={!isMiniature}
          zoomControl={!isMiniature}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          />

          {filteredGeoJson && (
            <GeoJSON
              key={`${adminLevel}-${selectedIndicator.column}-${selectedRegion || 'all'}`}
              data={filteredGeoJson}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* Labels layer on top */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            pane="overlayPane"
          />

          {mapBounds && <MapBoundsController bounds={mapBounds} />}
        </MapContainer>

        {!isMiniature && <MapLegend selectedIndicator={selectedIndicator} />}

        {!isMiniature && (hoveredFeature || selectedFeature) && (
          <InfoPanel
            feature={selectedFeature || hoveredFeature}
            data={data}
            selectedIndicator={selectedIndicator}
          />
        )}
      </div>

      {!isMiniature && (
        <div className="map-footer" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
          <p className="data-source" style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
            <strong>Data:</strong> INFORM SADC 2024 | <strong>Boundaries:</strong> Tanzania NBS
          </p>
          <p className="map-instructions" style={{ margin: 0, fontSize: '13px', color: '#555' }}>
            💡 <strong>Tip:</strong> Use the region filter to focus on a specific area. Click on any district/region to view detailed risk profile.
          </p>
        </div>
      )}
    </div>
  );
}

export default InformChoroplethMap;
