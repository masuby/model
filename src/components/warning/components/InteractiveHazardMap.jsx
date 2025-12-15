/**
 * INTERACTIVE HAZARD MAP - MODULE 03 ADVANCED
 *
 * Features:
 * - Multi-hazard selection with visual symbols
 * - Click districts to select affected areas
 * - Real-time PMO visibility
 * - Hazard-specific symbology
 * - Risk context overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, Circle, Rectangle, FeatureGroup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './InteractiveHazardMap.css';

// Hazard symbology with colors and icons
const HAZARD_SYMBOLS = {
  'Heavy Rainfall': { icon: '🌧️', color: '#2196F3', emoji: '💧' },
  'Strong Winds': { icon: '🌪️', color: '#607D8B', emoji: '💨' },
  'Large Waves': { icon: '🌊', color: '#00BCD4', emoji: '🌊' },
  'Flash Floods': { icon: '💦', color: '#0288D1', emoji: '💧' },
  'Dry Spells': { icon: '☀️', color: '#FF9800', emoji: '🌵' },
  'Heatwave': { icon: '🔥', color: '#F44336', emoji: '🌡️' },
  'Extreme Temperature': { icon: '🌡️', color: '#F44336', emoji: '🌡️' },
  'Extreme Temperature (Hot)': { icon: '🔥', color: '#F44336', emoji: '🌡️' },
  'Extreme Temperature (Cold)': { icon: '❄️', color: '#2196F3', emoji: '❄️' },
  'Riverine Floods': { icon: '🌊', color: '#03A9F4', emoji: '💧' },
  'Rising Water Levels': { icon: '📈', color: '#00ACC1', emoji: '💧' },
  'Dam Level Alert': { icon: '🏔️', color: '#0097A7', emoji: '⚠️' },
  'Epidemics': { icon: '🦠', color: '#E91E63', emoji: '🏥' },
  'Disease Outbreak': { icon: '🏥', color: '#F44336', emoji: '🚨' },
  'Health-Related Hazards': { icon: '⚕️', color: '#D32F2F', emoji: '🏥' },
  'Agrometeorological Drought': { icon: '🌾', color: '#8D6E63', emoji: '🌵' },
  'Crop Stress': { icon: '🌾', color: '#A1887F', emoji: '🌱' },
  'Pest Infestation': { icon: '🐛', color: '#795548', emoji: '🦗' },
  'Livestock Disease': { icon: '🐄', color: '#6D4C41', emoji: '🏥' },
  'Earthquake': { icon: '🏔️', color: '#5D4037', emoji: '💥' },
  'Landslide': { icon: '⛰️', color: '#4E342E', emoji: '⚠️' },
  'Volcano': { icon: '🌋', color: '#BF360C', emoji: '🔥' },
  'Seismic Activity': { icon: '📊', color: '#3E2723', emoji: '⚡' }
};

// Create custom Leaflet icon for hazards
const createHazardIcon = (hazardType) => {
  const symbol = HAZARD_SYMBOLS[hazardType] || { icon: '⚠️', color: '#FF9800' };

  return L.divIcon({
    className: 'custom-hazard-marker',
    html: `
      <div style="
        background: ${symbol.color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${symbol.icon}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Auto-fit bounds component
const AutoFitBounds = ({ geoJsonData }) => {
  const map = useMap();

  useEffect(() => {
    if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      const layer = L.geoJSON(geoJsonData);
      const bounds = layer.getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
    }
  }, [geoJsonData, map]);

  return null;
};

// Helper function to calculate area
const calculateArea = (shape) => {
  if (shape.type === 'point') {
    return 0; // Points have no area
  } else if (shape.type === 'circle') {
    // Area of circle: π × radius²
    return Math.PI * shape.radius * shape.radius;
  } else if (shape.type === 'rectangle') {
    // Calculate area from bounds
    const latDiff = Math.abs(shape.bounds[1][0] - shape.bounds[0][0]);
    const lngDiff = Math.abs(shape.bounds[1][1] - shape.bounds[0][1]);

    // Convert to meters (approximate)
    const latMeters = latDiff * 111000; // 1 degree latitude ≈ 111 km
    const lngMeters = lngDiff * 111000 * Math.cos((shape.bounds[0][0] + shape.bounds[1][0]) / 2 * Math.PI / 180);

    return latMeters * lngMeters; // in square meters
  }
  return 0;
};

// Helper to format area
const formatArea = (areaInSquareMeters) => {
  if (areaInSquareMeters === 0) return 'Point (no area)';

  const areaInKm2 = areaInSquareMeters / 1000000;

  if (areaInKm2 < 1) {
    return `${Math.round(areaInSquareMeters).toLocaleString()} m²`;
  }
  return `${areaInKm2.toFixed(2)} km²`;
};

// Drawing control component - FIXED: Only listen when actually drawing
const DrawingControl = ({ mode, onShapeCreated, drawingStart, setDrawingStart }) => {
  const map = useMapEvents({
    click: (e) => {
      // CRITICAL: Only handle clicks when in an active drawing mode
      if (!mode) {
        console.log('🚫 DrawingControl ignoring click - no drawing mode active');
        return;
      }

      console.log('✏️ DrawingControl handling click - mode:', mode);

      if (mode === 'point') {
        // Create point immediately
        onShapeCreated({
          type: 'point',
          position: [e.latlng.lat, e.latlng.lng],
          id: Date.now()
        });
      } else if (mode === 'rectangle' || mode === 'circle') {
        if (!drawingStart) {
          // First click - start drawing
          setDrawingStart([e.latlng.lat, e.latlng.lng]);
        } else {
          // Second click - finish drawing
          if (mode === 'rectangle') {
            onShapeCreated({
              type: 'rectangle',
              bounds: [drawingStart, [e.latlng.lat, e.latlng.lng]],
              id: Date.now()
            });
          } else if (mode === 'circle') {
            const center = drawingStart;
            const radius = map.distance(center, [e.latlng.lat, e.latlng.lng]);
            onShapeCreated({
              type: 'circle',
              center: center,
              radius: radius,
              id: Date.now()
            });
          }
          setDrawingStart(null);
        }
      }
    },
    mousemove: (e) => {
      // Could add preview here if needed
    }
  });

  return null;
};

const InteractiveHazardMap = ({
  selectedHazardType,
  selectedDistricts = {}, // Changed to object: { districtName: warningLevel }
  onDistrictSelect,
  riskData,
  activeHazards = [],
  showPMOView = false,
  warningLevel = 'Advisory', // Current "brush" warning level for selecting
  shadingMode = 'none', // none, low, medium, high
  temperatureType = 'Hot' // Hot or Cold (for Extreme Temperature)
}) => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drawing tools state
  const [drawingMode, setDrawingMode] = useState(null); // null, 'point', 'rectangle', 'circle'
  const [drawnShapes, setDrawnShapes] = useState([]);
  const [drawingStart, setDrawingStart] = useState(null);

  // Load Tanzania GeoJSON - CLEAN BOUNDARIES FROM /Boundaries
  useEffect(() => {
    let timeoutId;
    const loadGeoJSON = async () => {
      console.log('🗺️ Starting GeoJSON load with CLEAN boundaries...');

      // Set a safety timeout
      timeoutId = setTimeout(() => {
        console.warn('⏰ GeoJSON load timeout - proceeding without detailed map');
        setLoading(false);
      }, 30000);

      try {
        // Load CLEAN district boundaries from /Boundaries directory
        console.log('📥 Fetching: /geojson/tanzania_districts_clean.geojson');
        const response = await fetch('/geojson/tanzania_districts_clean.geojson');
        console.log('📥 Response status:', response.status, response.ok);

        if (response.ok) {
          console.log('✅ Clean GeoJSON found, parsing... (this may take 5-10 seconds)');
          const data = await response.json();
          console.log('✅ GeoJSON parsed successfully, features:', data.features?.length || 0);
          setGeoJsonData(data);
          clearTimeout(timeoutId);
          setLoading(false);
          console.log('✅ Loading complete with CLEAN boundaries!');
        } else {
          console.warn('⚠️ GeoJSON file not found, proceeding without map data');
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading GeoJSON:', error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadGeoJSON();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Get district name from feature - UPDATED FOR CLEAN BOUNDARIES
  const getDistrictName = (feature) => {
    // Clean GeoJSON from /Boundaries uses "dist_name" property
    return feature.properties?.dist_name ||
           feature.properties?.ADM2_EN ||
           feature.properties?.shapeName ||
           feature.properties?.ADM2_NAME ||
           feature.properties?.ADM1_EN ||
           'Unknown';
  };

  // Check if district is selected
  const isDistrictSelected = (districtName) => {
    return districtName in selectedDistricts;
  };

  // Get warning level for a specific district
  const getDistrictWarningLevel = (districtName) => {
    return selectedDistricts[districtName] || null;
  };

  // Get risk score for district
  const getDistrictRisk = (districtName) => {
    if (!riskData || !riskData.subnational || !riskData.subnational.adm2) return null;
    const district = riskData.subnational.adm2.find(d => d.admin.adm2Name === districtName);
    return district ? district.risk : null;
  };

  // Get warning color based on warning level (for a specific district or current brush)
  const getWarningColor = (level = null) => {
    const levelToUse = level || warningLevel;
    switch (levelToUse) {
      case 'Advisory':
        return '#FFFF00'; // Pure Yellow
      case 'Warning':
        return '#FF6600'; // Pure Bright Orange
      case 'Major Warning':
        return '#FF0000'; // Pure Red
      default:
        return '#FFFF00'; // Default yellow
    }
  };

  // Get shading opacity based on mode
  const getShadingOpacity = () => {
    switch (shadingMode) {
      case 'none':
        return 0.5; // Default minimal shading
      case 'low':
        return 0.6; // Light intensity
      case 'medium':
        return 0.75; // Medium intensity
      case 'high':
        return 0.9; // High intensity (dark)
      default:
        return 0.5;
    }
  };

  // Get color based on selection and risk - FIXED FOR SINGLE DISTRICT SELECTION
  const getFeatureStyle = (feature) => {
    const districtName = getDistrictName(feature);

    // CRITICAL: Ensure districtName is valid and unique
    if (!districtName || districtName === 'Unknown') {
      return {
        fillColor: '#E0E0E0',
        fillOpacity: 0.1,
        color: '#999',
        weight: 1,
        opacity: 0.3
      };
    }

    const isSelected = isDistrictSelected(districtName);
    const isHovered = hoveredDistrict === districtName;
    const riskScore = getDistrictRisk(districtName);

    if (isSelected) {
      const districtValue = getDistrictWarningLevel(districtName);
      // Check if the value is already a color (hex code) or a warning level string
      const isColor = districtValue && districtValue.startsWith('#');
      const warningColor = isColor ? districtValue : getWarningColor(districtValue);
      const fillOpacity = getShadingOpacity();

      return {
        fillColor: warningColor,
        fillOpacity: fillOpacity,
        color: '#FFFFFF',
        weight: 2,
        opacity: 0.8,
        dashArray: ''
      };
    }

    if (isHovered) {
      return {
        fillColor: '#FFC107',
        fillOpacity: 0.6,
        color: '#FF9800',
        weight: 3,
        opacity: 1,
        dashArray: '5, 5'
      };
    }

    // Default: show risk context
    let fillColor = '#E0E0E0';
    if (riskScore !== null) {
      if (riskScore >= 6.5) fillColor = '#F44336';
      else if (riskScore >= 5.0) fillColor = '#FF9800';
      else if (riskScore >= 3.5) fillColor = '#FFC107';
      else if (riskScore >= 2.0) fillColor = '#8BC34A';
      else fillColor = '#4CAF50';
    }

    return {
      fillColor: fillColor,
      fillOpacity: 0.25,
      color: '#999',
      weight: 1,
      opacity: 0.5
    };
  };

  // Handle district click - FIXED with proper event stopping
  const onFeatureClick = (feature, layer, e) => {
    // CRITICAL: Stop ALL event propagation immediately
    if (e) {
      // Stop Leaflet event propagation
      if (e.stopPropagation) {
        e.stopPropagation();
      }

      // Stop DOM event propagation
      if (e.originalEvent) {
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
        e.originalEvent.stopImmediatePropagation();
      }
    }

    const districtName = getDistrictName(feature);
    console.log(`🎯 District clicked: "${districtName}"`);
    console.log(`   Event stopped: ${e ? 'YES' : 'NO'}`);

    if (onDistrictSelect && !showPMOView) {
      console.log(`   Calling onDistrictSelect("${districtName}")`);
      onDistrictSelect(districtName);
    }

    // Return false to prevent further event handling
    return false;
  };

  // Handle mouse events - RECONFIGURED for stable boundaries
  const onEachFeature = (feature, layer) => {
    const districtName = getDistrictName(feature);

    // CRITICAL: Set layer to be interactive only in non-PMO mode
    if (!showPMOView && onDistrictSelect) {
      // Single click handler - attached directly to layer
      layer.on('click', (e) => {
        // Stop all propagation immediately at layer level
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);

        // CRITICAL: Only select if districtName is valid
        if (districtName && districtName !== 'Unknown') {
          console.log(`🎯 SINGLE district clicked: "${districtName}"`);
          onDistrictSelect(districtName);
        } else {
          console.warn(`⚠️ Invalid district name:`, districtName);
        }
      });

      // Cursor feedback
      layer.on('mouseover', (e) => {
        const mapElement = e.target._map.getContainer();
        mapElement.style.cursor = 'pointer';

        setHoveredDistrict(districtName);
        layer.setStyle({
          weight: 3,
          color: '#FF9800',
          fillOpacity: 0.7,
          dashArray: ''
        });
      });

      layer.on('mouseout', (e) => {
        const mapElement = e.target._map.getContainer();
        mapElement.style.cursor = '';

        setHoveredDistrict(null);
        layer.setStyle(getFeatureStyle(feature));
      });
    } else {
      // PMO view - read-only, no interactions
      layer.on('mouseover', () => {
        setHoveredDistrict(districtName);
      });

      layer.on('mouseout', () => {
        setHoveredDistrict(null);
      });
    }

    // Tooltip
    const riskScore = getDistrictRisk(districtName);
    const isSelected = isDistrictSelected(districtName);
    const districtLevel = getDistrictWarningLevel(districtName);
    const levelEmoji = districtLevel === 'Advisory' ? '🟡' : districtLevel === 'Warning' ? '🟠' : districtLevel === 'Major Warning' ? '🔴' : '';
    const tooltipContent = `
      <div class="district-tooltip">
        <strong>${districtName}</strong><br/>
        ${riskScore !== null ? `Risk: ${riskScore.toFixed(2)}<br/>` : 'No risk data<br/>'}
        ${isSelected
          ? `<span style="color: #FF9800;">${levelEmoji} ${districtLevel} level selected</span>`
          : showPMOView ? 'View mode' : `Click to assign <strong>${warningLevel}</strong>`}
      </div>
    `;
    layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top' });
  };

  // Get hazard markers for active hazards (PMO view)
  const getHazardMarkers = () => {
    if (!showPMOView || activeHazards.length === 0) return null;

    return activeHazards.map((hazard, index) => {
      // Get center point for each affected district
      if (!hazard.spatialExtent || hazard.spatialExtent.length === 0) return null;

      return hazard.spatialExtent.map((districtName, dIndex) => {
        // Find district centroid (simplified - using bounds center)
        if (!geoJsonData) return null;

        const feature = geoJsonData.features.find(f =>
          getDistrictName(f) === districtName
        );

        if (!feature || !feature.geometry) return null;

        // Calculate centroid (simplified)
        const bounds = L.geoJSON(feature).getBounds();
        const center = bounds.getCenter();

        return (
          <Marker
            key={`${index}-${dIndex}`}
            position={[center.lat, center.lng]}
            icon={createHazardIcon(hazard.hazardType)}
          >
            <Popup>
              <div className="hazard-popup">
                <h4>{hazard.hazardType}</h4>
                <div><strong>District:</strong> {districtName}</div>
                <div><strong>Institution:</strong> {hazard.institution}</div>
                <div><strong>Warning Level:</strong> {hazard.warningLevel}</div>
                <div><strong>Valid:</strong> {new Date(hazard.temporalValidity?.start).toLocaleDateString()} - {new Date(hazard.temporalValidity?.end).toLocaleDateString()}</div>
                <div><strong>Confidence:</strong> {hazard.confidence}</div>
              </div>
            </Popup>
          </Marker>
        );
      });
    }).flat().filter(Boolean);
  };

  // Handle shape creation from drawing
  const handleShapeCreated = (shape) => {
    const area = calculateArea(shape);
    const newShape = {
      ...shape,
      area,
      formattedArea: formatArea(area)
    };
    setDrawnShapes([...drawnShapes, newShape]);
    setDrawingMode(null); // Exit drawing mode after creating shape
  };

  // Handle removing a shape
  const handleRemoveShape = (shapeId) => {
    setDrawnShapes(drawnShapes.filter(s => s.id !== shapeId));
  };

  // Handle clearing all shapes
  const handleClearAllShapes = () => {
    setDrawnShapes([]);
    setDrawingMode(null);
    setDrawingStart(null);
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <p>Loading Tanzania map...</p>
      </div>
    );
  }

  return (
    <div className="interactive-hazard-map-container">
      {/* Map Controls */}
      <div className="map-controls">
        <div className="map-mode-indicator">
          {showPMOView ? (
            <span className="pmo-view-badge">🏛️ PMO-DMD Live View</span>
          ) : (
            <span className="input-view-badge">📥 Hazard Input Mode</span>
          )}
        </div>

        {selectedHazardType && !showPMOView && (
          <div className="current-hazard-indicator">
            <span className="hazard-icon">
              {HAZARD_SYMBOLS[selectedHazardType]?.icon || '⚠️'}
            </span>
            <span className="hazard-name">{selectedHazardType}</span>
            <span
              className="warning-level-badge"
              style={{
                backgroundColor: getWarningColor(),
                color: warningLevel === 'Advisory' ? '#000' : '#FFF',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '12px',
                marginLeft: '8px'
              }}
            >
              {warningLevel === 'Advisory' ? '🟡' :
               warningLevel === 'Warning' ? '🟠' : '🔴'} {warningLevel}
            </span>
            <span className="selection-count">
              {Object.keys(selectedDistricts).length} districts selected
            </span>
          </div>
        )}

        {/* Drawing Tools Controls */}
        {!showPMOView && (
          <div className="drawing-tools-controls">
            <h4>🎨 Drawing Tools</h4>
            <div className="drawing-buttons">
              <button
                className={`draw-btn ${drawingMode === 'point' ? 'active' : ''}`}
                onClick={() => setDrawingMode(drawingMode === 'point' ? null : 'point')}
                title="Place a point marker"
              >
                📍 Point
              </button>
              <button
                className={`draw-btn ${drawingMode === 'rectangle' ? 'active' : ''}`}
                onClick={() => {
                  setDrawingMode(drawingMode === 'rectangle' ? null : 'rectangle');
                  setDrawingStart(null);
                }}
                title="Draw a rectangle - click twice to define corners"
              >
                ⬜ Rectangle
              </button>
              <button
                className={`draw-btn ${drawingMode === 'circle' ? 'active' : ''}`}
                onClick={() => {
                  setDrawingMode(drawingMode === 'circle' ? null : 'circle');
                  setDrawingStart(null);
                }}
                title="Draw a circle - click center then radius point"
              >
                ⭕ Circle
              </button>
              {(drawnShapes.length > 0 || drawingMode) && (
                <button
                  className="draw-btn clear-btn"
                  onClick={handleClearAllShapes}
                  title="Clear all drawn shapes"
                >
                  🗑️ Clear All
                </button>
              )}
            </div>
            {drawingMode && (
              <div className="drawing-hint">
                {drawingMode === 'point' && '📍 Click on the map to place a point'}
                {drawingMode === 'rectangle' && (drawingStart ? '⬜ Click second corner to finish rectangle' : '⬜ Click first corner of rectangle')}
                {drawingMode === 'circle' && (drawingStart ? '⭕ Click to set radius (distance from center)' : '⭕ Click center of circle')}
              </div>
            )}
            {drawnShapes.length > 0 && (
              <div className="drawn-shapes-summary">
                <strong>📐 Drawn Shapes: {drawnShapes.length}</strong>
                <div className="shapes-list">
                  {drawnShapes.map(shape => (
                    <div key={shape.id} className="shape-item">
                      <span className="shape-type">
                        {shape.type === 'point' && '📍'}
                        {shape.type === 'rectangle' && '⬜'}
                        {shape.type === 'circle' && '⭕'}
                        {shape.type.charAt(0).toUpperCase() + shape.type.slice(1)}
                      </span>
                      <span className="shape-area">{shape.formattedArea}</span>
                      <button
                        className="remove-shape-btn"
                        onClick={() => handleRemoveShape(shape.id)}
                        title="Remove this shape"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leaflet Map - Reconfigured for stable boundaries */}
      <MapContainer
        center={[-6.369, 34.888]}
        zoom={6}
        style={{ height: '600px', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
        preferCanvas={true}
        doubleClickZoom={false}
        zoomControl={true}
        tap={false}
        touchZoom={true}
        dragging={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {geoJsonData && (
          <>
            <GeoJSON
              key={`geojson-${warningLevel}-${shadingMode}-${JSON.stringify(selectedDistricts)}`}
              data={geoJsonData}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
              bubblingMouseEvents={false}
              interactive={!showPMOView}
              smoothFactor={1.5}
              attribution={false}
            />
            <AutoFitBounds geoJsonData={geoJsonData} />
          </>
        )}

        {/* Drawing Control */}
        {!showPMOView && drawingMode && (
          <DrawingControl
            mode={drawingMode}
            onShapeCreated={handleShapeCreated}
            drawingStart={drawingStart}
            setDrawingStart={setDrawingStart}
          />
        )}

        {/* Render drawn shapes */}
        {drawnShapes.map(shape => {
          if (shape.type === 'point') {
            return (
              <Marker
                key={shape.id}
                position={shape.position}
                icon={L.divIcon({
                  className: 'drawn-point-marker',
                  html: `<div style="
                    background: #9C27B0;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                  "></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>
                  <div>
                    <strong>📍 Point Marker</strong><br />
                    Lat: {shape.position[0].toFixed(4)}<br />
                    Lng: {shape.position[1].toFixed(4)}
                  </div>
                </Popup>
              </Marker>
            );
          } else if (shape.type === 'circle') {
            return (
              <Circle
                key={shape.id}
                center={shape.center}
                radius={shape.radius}
                pathOptions={{
                  color: '#9C27B0',
                  fillColor: '#9C27B0',
                  fillOpacity: 0.2,
                  weight: 3
                }}
              >
                <Popup>
                  <div>
                    <strong>⭕ Circle</strong><br />
                    Radius: {(shape.radius / 1000).toFixed(2)} km<br />
                    Area: {shape.formattedArea}
                  </div>
                </Popup>
              </Circle>
            );
          } else if (shape.type === 'rectangle') {
            return (
              <Rectangle
                key={shape.id}
                bounds={shape.bounds}
                pathOptions={{
                  color: '#9C27B0',
                  fillColor: '#9C27B0',
                  fillOpacity: 0.2,
                  weight: 3
                }}
              >
                <Popup>
                  <div>
                    <strong>⬜ Rectangle</strong><br />
                    Area: {shape.formattedArea}
                  </div>
                </Popup>
              </Rectangle>
            );
          }
          return null;
        })}

        {/* Hazard markers for PMO view */}
        {getHazardMarkers()}
      </MapContainer>

      {/* Map Legend */}
      <div className="map-legend-container">
        {!showPMOView && selectedHazardType && (
          <div className="hazard-legend">
            <h4>Warning Level Selection</h4>
            <div className="legend-item">
              <span
                className="legend-color"
                style={{
                  backgroundColor: getWarningColor(),
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              ></span>
              <span><strong>{warningLevel}</strong> - Current Brush</span>
            </div>
            {Object.keys(selectedDistricts).length > 0 && (
              <>
                <div className="legend-divider"></div>
                <h5>Selected Districts by Level:</h5>
                {['Advisory', 'Warning', 'Major Warning'].map(level => {
                  const count = Object.values(selectedDistricts).filter(l => l === level).length;
                  if (count === 0) return null;
                  return (
                    <div key={level} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: getWarningColor(level) }}></span>
                      <span>{level === 'Advisory' ? '🟡' : level === 'Warning' ? '🟠' : '🔴'} {level}: {count} districts</span>
                    </div>
                  );
                })}
              </>
            )}
            <div className="legend-divider"></div>
            <h5>Warning Level Color Code:</h5>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FFFF00' }}></span>
              <span>🟡 Advisory (Yellow)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FF6600' }}></span>
              <span>🟠 Warning (Pure Orange)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FF0000' }}></span>
              <span>🔴 Major Warning (Red)</span>
            </div>
            {shadingMode !== 'none' && (
              <>
                <div className="legend-divider"></div>
                <h5>Polygon Shading Intensity</h5>
                <div className="legend-item">
                  <span className="legend-icon">
                    {shadingMode === 'low' && '🟨'}
                    {shadingMode === 'medium' && '🟧'}
                    {shadingMode === 'high' && '🟥'}
                  </span>
                  <span>
                    <strong>
                      {shadingMode === 'low' && 'Light Intensity (60%)'}
                      {shadingMode === 'medium' && 'Medium Intensity (75%)'}
                      {shadingMode === 'high' && 'High Intensity (90%)'}
                    </strong> - Active
                  </span>
                </div>
              </>
            )}
            <div className="legend-divider"></div>
            <h5>Background: Risk Context</h5>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#F44336', opacity: 0.3 }}></span>
              <span>Very High Risk (6.5-10)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FF9800', opacity: 0.3 }}></span>
              <span>High Risk (5.0-6.5)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FFC107', opacity: 0.3 }}></span>
              <span>Medium Risk (3.5-5.0)</span>
            </div>
          </div>
        )}

        {showPMOView && activeHazards.length > 0 && (
          <div className="pmo-legend">
            <h4>Active Hazards</h4>
            {Object.entries(
              activeHazards.reduce((acc, h) => {
                acc[h.hazardType] = (acc[h.hazardType] || 0) + 1;
                return acc;
              }, {})
            ).map(([hazardType, count]) => (
              <div key={hazardType} className="legend-item">
                <span className="legend-icon">
                  {HAZARD_SYMBOLS[hazardType]?.icon || '⚠️'}
                </span>
                <span>{hazardType} ({count})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="map-instructions">
        {!showPMOView ? (
          <>
            <strong>📍 Map Selection Instructions:</strong> First, choose your warning level (Advisory/Warning/Major Warning) above.
            Then click districts on the map to select affected areas.
            Selected districts will be highlighted in <strong style={{ color: warningLevel === 'Advisory' ? '#000' : getWarningColor() }}>
              {warningLevel === 'Advisory' ? '🟡 YELLOW (Advisory)' :
               warningLevel === 'Warning' ? '🟠 ORANGE (Warning)' : '🔴 RED (Major Warning)'}
            </strong>.
            District and region names remain visible through the colored overlay.
            Background colors show baseline risk from Module 02.
          </>
        ) : (
          <>
            <strong>PMO-DMD Live View:</strong> Hazard markers show incoming alerts from institutions.
            Click markers for details. Multiple hazards may overlap in the same district.
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveHazardMap;
