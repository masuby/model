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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, Circle, Rectangle, Polygon, FeatureGroup, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './InteractiveHazardMap.css';
import {
  HOSPITALS,
  EMERGENCY_SHELTERS,
  MAJOR_ROADS,
  EVACUATION_ROUTES,
  FIRE_STATIONS,
  POLICE_STATIONS
} from '../data/mapLayersData';

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

// Auto-fit bounds component - LOCKED to Tanzania
const AutoFitBounds = ({ geoJsonData }) => {
  const map = useMap();
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    // Only fit bounds ONCE on initial load
    if (!hasInitialized.current && geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      hasInitialized.current = true;

      // Fixed Tanzania bounds - TIGHT fit
      const tanzaniaBounds = [
        [-11.8, 29.2],  // Southwest corner
        [-0.9, 40.6]    // Northeast corner
      ];

      // Fit to Tanzania immediately
      map.fitBounds(tanzaniaBounds, {
        padding: [10, 10],
        maxZoom: 6,
        animate: false
      });

      // LOCK map strictly to Tanzania region - prevent shifting
      const strictBounds = [
        [-12.5, 28.5],  // Tight bounds for panning
        [-0.2, 41.2]
      ];
      map.setMaxBounds(strictBounds);
      map.setMinZoom(6);
      map.setMaxZoom(8);

      // Prevent bounce at edges
      map.options.maxBoundsViscosity = 1.0;
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

// Drawing Event Handler - handles map events for drawing (inside MapContainer)
const DrawingEventHandler = ({ activeTool, setActiveTool, isDrawing, setIsDrawing, warningColor, warningLevel, setDrawnShapes, formatArea, onDrawingStateChange, selectedHazardType }) => {
  const map = useMap();
  const drawStartRef = useRef(null);
  const tempLayerRef = useRef(null);
  const polygonPointsRef = useRef([]);

  // Notify parent when drawing state changes
  useEffect(() => {
    if (onDrawingStateChange) {
      onDrawingStateChange(activeTool !== null);
    }
  }, [activeTool, onDrawingStateChange]);

  // Clean up temp layer
  const cleanupTempLayer = useCallback(() => {
    if (tempLayerRef.current && map) {
      map.removeLayer(tempLayerRef.current);
      tempLayerRef.current = null;
    }
    polygonPointsRef.current = [];
  }, [map]);

  // Create shape from drawing
  const createShape = useCallback((type, data) => {
    const shapeData = {
      id: Date.now(),
      type,
      color: warningColor,
      warningLevel,
      ...data
    };

    // Create Leaflet layer
    let layer;
    const style = {
      color: warningColor,
      fillColor: warningColor,
      fillOpacity: 0.75,
      weight: 2
    };

    if (type === 'marker') {
      layer = L.marker(data.position, {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-draw-marker',
          html: `<div style="background: ${warningColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      });
      shapeData.formattedArea = 'Point (no area)';
    } else if (type === 'circle') {
      layer = L.circle(data.center, { ...style, radius: data.radius });
      const area = Math.PI * data.radius * data.radius;
      shapeData.formattedArea = formatArea(area);
    } else if (type === 'rectangle') {
      layer = L.rectangle(data.bounds, style);
      const latDiff = Math.abs(data.bounds[1][0] - data.bounds[0][0]);
      const lngDiff = Math.abs(data.bounds[1][1] - data.bounds[0][1]);
      const latMeters = latDiff * 111000;
      const lngMeters = lngDiff * 111000 * Math.cos((data.bounds[0][0] + data.bounds[1][0]) / 2 * Math.PI / 180);
      shapeData.formattedArea = formatArea(latMeters * lngMeters);
    } else if (type === 'polygon') {
      layer = L.polygon(data.coordinates, style);
      let area = 0;
      const coords = data.coordinates;
      for (let i = 0; i < coords.length; i++) {
        const j = (i + 1) % coords.length;
        area += coords[i][0] * coords[j][1];
        area -= coords[j][0] * coords[i][1];
      }
      area = Math.abs(area) / 2 * 111000 * 111000;
      shapeData.formattedArea = formatArea(area);
    } else if (type === 'hazardIcon') {
      // Create hazard-specific icon marker
      const hazardSymbol = HAZARD_SYMBOLS[data.hazardType] || { icon: '⚠️', color: '#FF9800' };
      layer = L.marker(data.position, {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-hazard-icon',
          html: `
            <div style="
              background: ${hazardSymbol.color};
              width: 44px;
              height: 44px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 26px;
              border: 3px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            ">
              ${hazardSymbol.icon}
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        })
      });
      shapeData.hazardType = data.hazardType;
      shapeData.formattedArea = `${data.hazardType} Icon`;
    }

    if (layer) {
      layer.addTo(map);
      shapeData.layer = layer;

      layer.bindPopup(`
        <div style="text-align: center;">
          <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong><br/>
          <span style="background: ${warningColor}; padding: 2px 8px; border-radius: 4px; color: ${warningLevel === 'Advisory' ? '#000' : '#FFF'};">${warningLevel}</span><br/>
          <small>${shapeData.formattedArea}</small><br/>
          <button onclick="window.deleteDrawnShape(${shapeData.id})" style="margin-top: 8px; padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Delete</button>
        </div>
      `);

      if (type !== 'marker') {
        layer.on('click', () => layer.openPopup());
      }

      setDrawnShapes(prev => [...prev, shapeData]);
    }

    return shapeData;
  }, [map, warningColor, warningLevel, formatArea, setDrawnShapes]);

  // Set up global delete function
  useEffect(() => {
    window.deleteDrawnShape = (shapeId) => {
      setDrawnShapes(prev => {
        const shape = prev.find(s => s.id === shapeId);
        if (shape && shape.layer && map) {
          map.removeLayer(shape.layer);
        }
        return prev.filter(s => s.id !== shapeId);
      });
    };
    return () => { delete window.deleteDrawnShape; };
  }, [map, setDrawnShapes]);

  // Handle map clicks for drawing
  useEffect(() => {
    if (!map || !activeTool) return;

    const handleMapClick = (e) => {
      const latlng = e.latlng;

      if (activeTool === 'marker') {
        createShape('marker', { position: [latlng.lat, latlng.lng] });
        setActiveTool(null);
        setIsDrawing(false);
      } else if (activeTool === 'circle') {
        if (!isDrawing) {
          drawStartRef.current = latlng;
          setIsDrawing(true);
          tempLayerRef.current = L.circle(latlng, {
            radius: 1000,
            color: warningColor,
            fillColor: warningColor,
            fillOpacity: 0.3,
            weight: 2,
            dashArray: '5, 5'
          }).addTo(map);
        } else {
          const radius = drawStartRef.current.distanceTo(latlng);
          cleanupTempLayer();
          createShape('circle', {
            center: [drawStartRef.current.lat, drawStartRef.current.lng],
            radius: Math.max(radius, 500)
          });
          setActiveTool(null);
          setIsDrawing(false);
        }
      } else if (activeTool === 'rectangle') {
        if (!isDrawing) {
          drawStartRef.current = latlng;
          setIsDrawing(true);
          tempLayerRef.current = L.rectangle([latlng, latlng], {
            color: warningColor,
            fillColor: warningColor,
            fillOpacity: 0.3,
            weight: 2,
            dashArray: '5, 5'
          }).addTo(map);
        } else {
          cleanupTempLayer();
          const bounds = [
            [Math.min(drawStartRef.current.lat, latlng.lat), Math.min(drawStartRef.current.lng, latlng.lng)],
            [Math.max(drawStartRef.current.lat, latlng.lat), Math.max(drawStartRef.current.lng, latlng.lng)]
          ];
          createShape('rectangle', { bounds });
          setActiveTool(null);
          setIsDrawing(false);
        }
      } else if (activeTool === 'polygon') {
        // Add point to polygon
        polygonPointsRef.current.push([latlng.lat, latlng.lng]);

        // Remove old temp layer WITHOUT clearing points
        if (tempLayerRef.current && map) {
          map.removeLayer(tempLayerRef.current);
          tempLayerRef.current = null;
        }

        // Draw updated polygon preview with all points
        if (polygonPointsRef.current.length > 0) {
          tempLayerRef.current = L.polygon(polygonPointsRef.current, {
            color: warningColor,
            fillColor: warningColor,
            fillOpacity: 0.3,
            weight: 2,
            dashArray: '5, 5'
          }).addTo(map);
        }
        setIsDrawing(true);
        console.log(`🔷 Polygon points: ${polygonPointsRef.current.length} (double-click to finish)`);
      } else if (activeTool === 'hazardIcon') {
        // Place hazard icon at clicked location
        createShape('hazardIcon', {
          position: [latlng.lat, latlng.lng],
          hazardType: selectedHazardType
        });
        setActiveTool(null);
        setIsDrawing(false);
      }
    };

    const handleMouseMove = (e) => {
      if (!isDrawing || !tempLayerRef.current) return;

      if (activeTool === 'circle' && drawStartRef.current) {
        const radius = drawStartRef.current.distanceTo(e.latlng);
        tempLayerRef.current.setRadius(Math.max(radius, 100));
      } else if (activeTool === 'rectangle' && drawStartRef.current) {
        tempLayerRef.current.setBounds([drawStartRef.current, e.latlng]);
      } else if (activeTool === 'polygon' && polygonPointsRef.current.length > 0) {
        const previewPoints = [...polygonPointsRef.current, [e.latlng.lat, e.latlng.lng]];
        tempLayerRef.current.setLatLngs(previewPoints);
      }
    };

    const handleDblClick = (e) => {
      if (activeTool === 'polygon' && polygonPointsRef.current.length >= 3) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);

        // Save coordinates BEFORE cleanup (cleanupTempLayer clears polygonPointsRef)
        const savedCoordinates = [...polygonPointsRef.current];

        // Remove temp preview layer only (don't clear points yet)
        if (tempLayerRef.current && map) {
          map.removeLayer(tempLayerRef.current);
          tempLayerRef.current = null;
        }

        // Create the final polygon with saved coordinates
        createShape('polygon', { coordinates: savedCoordinates });

        // Now clear the points
        polygonPointsRef.current = [];
        setActiveTool(null);
        setIsDrawing(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        cleanupTempLayer();
        setActiveTool(null);
        setIsDrawing(false);
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);
    map.on('dblclick', handleDblClick);
    document.addEventListener('keydown', handleKeyDown);
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.off('dblclick', handleDblClick);
      document.removeEventListener('keydown', handleKeyDown);
      map.getContainer().style.cursor = '';
    };
  }, [map, activeTool, isDrawing, warningColor, createShape, cleanupTempLayer, setActiveTool, setIsDrawing]);

  return null; // This component only handles events, no rendering
};

const InteractiveHazardMap = ({
  selectedHazardType,
  selectedDistricts = {}, // Changed to object: { districtName: warningLevel }
  onDistrictSelect,
  riskData,
  activeHazards = [],
  selectedHazardsForMarkers = [], // Only show markers for these selected hazards (from Hazard Alerts selection)
  showPMOView = false,
  warningLevel = 'Advisory', // Current "brush" warning level for selecting
  shadingMode = 'none', // none, low, medium, high
  temperatureType = 'Hot', // Hot or Cold (for Extreme Temperature)
  // Risk Layer Overlay Props
  enabledLayers = {}, // Object with layer toggles for coping capacity (hospitals, shelters, roads, etc.)
  riskLayerOverlay = null, // { type: 'overall'|'flood_risk'|etc, score: number, color: string }
  forecastOverlay = null, // { type: 'heavy_rainfall'|'flood'|etc, icon: string, institution: string }
  exposureOverlay = null, // { type: 'population'|'infrastructure'|'cropland'|'livestock' }
  vulnerabilityOverlay = null, // { type: 'poverty'|'foodInsecurity'|'healthAccess'|'waterAccess'|'vulnerableGroups' }
  // Callback for drawn shapes (for PDF export)
  onDrawnShapesChange = null // Callback when drawn shapes change - passes array of shape objects
}) => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drawing tools state
  const [drawnShapes, setDrawnShapes] = useState([]);
  const [isDrawingActive, setIsDrawingActive] = useState(false); // Prevents district clicks when drawing
  const [activeTool, setActiveTool] = useState(null); // Current drawing tool
  const [isDrawing, setIsDrawing] = useState(false); // Currently in drawing process
  const isDrawingActiveRef = useRef(false); // Ref for stable access in event handlers
  const featureGroupRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    isDrawingActiveRef.current = isDrawingActive;
  }, [isDrawingActive]);

  // Notify parent when drawn shapes change (for PDF export)
  useEffect(() => {
    if (onDrawnShapesChange) {
      // Extract serializable data from drawnShapes (excluding Leaflet layer objects)
      const serializableShapes = drawnShapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        hazardType: shape.hazardType,
        warningLevel: shape.warningLevel,
        color: shape.color,
        position: shape.position,
        center: shape.center,
        radius: shape.radius,
        bounds: shape.bounds,
        coordinates: shape.coordinates,
        formattedArea: shape.formattedArea
      }));
      onDrawnShapesChange(serializableShapes);
    }
  }, [drawnShapes, onDrawnShapesChange]);

  // Clear all drawn shapes
  const handleClearAllShapes = useCallback(() => {
    drawnShapes.forEach(shape => {
      if (shape.layer) {
        try {
          shape.layer.remove();
        } catch (e) {
          console.warn('Error removing layer:', e);
        }
      }
    });
    setDrawnShapes([]);
  }, [drawnShapes]);

  // Cancel current drawing
  const handleCancelDrawing = useCallback(() => {
    setActiveTool(null);
    setIsDrawing(false);
  }, []);

  // Geographic layers state
  const [waterBodiesData, setWaterBodiesData] = useState(null);
  const [boundaryData, setBoundaryData] = useState(null);

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

  // Load water bodies and international boundary
  useEffect(() => {
    const loadGeographicLayers = async () => {
      try {
        // Load Water Bodies (clipped)
        const waterRes = await fetch('/geojson/Water_Body_Clipped.geojson');
        if (waterRes.ok) {
          const data = await waterRes.json();
          setWaterBodiesData(data);
          console.log('✅ Water bodies loaded:', data.features?.length);
        }

        // Load International Boundary (clipped)
        const boundaryRes = await fetch('/geojson/TZ_International_Boundary_Clipped.geojson');
        if (boundaryRes.ok) {
          const data = await boundaryRes.json();
          setBoundaryData(data);
          console.log('✅ Boundary loaded:', data.features?.length);
        }
      } catch (error) {
        console.error('Error loading geographic layers:', error);
      }
    };
    loadGeographicLayers();
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
        return '#FFEA00'; // Bright Neon Yellow - maximum visibility
      case 'Warning':
        return '#FF6D00'; // Vivid Bright Orange - high saturation
      case 'Major Warning':
        return '#FF1744'; // Bright Vivid Red - maximum alert
      default:
        return '#FFEA00'; // Default neon yellow
    }
  };

  // Get shading opacity based on mode - ENHANCED for brighter colors
  const getShadingOpacity = () => {
    switch (shadingMode) {
      case 'none':
        return 0.7; // Default bright shading
      case 'low':
        return 0.75; // Light intensity
      case 'medium':
        return 0.85; // Medium intensity
      case 'high':
        return 0.95; // High intensity (very bright)
      default:
        return 0.7;
    }
  };

  // Get risk color based on score (0-10 scale)
  const getRiskColor = (score, riskType = 'overall') => {
    if (score === null || score === undefined) return '#E0E0E0';

    // Color scales for different risk types
    const colorScales = {
      overall: { low: '#43A047', medium: '#FFC107', high: '#FF9800', veryHigh: '#F44336' },
      hazard_exposure: { low: '#81D4FA', medium: '#29B6F6', high: '#0288D1', veryHigh: '#01579B' },
      vulnerability: { low: '#C8E6C9', medium: '#FFCC80', high: '#FF8A65', veryHigh: '#E53935' },
      lack_coping: { low: '#B39DDB', medium: '#7E57C2', high: '#5E35B1', veryHigh: '#4527A0' },
      flood_risk: { low: '#B3E5FC', medium: '#4FC3F7', high: '#0288D1', veryHigh: '#01579B' },
      drought_risk: { low: '#FFE0B2', medium: '#FFB74D', high: '#F57C00', veryHigh: '#E65100' },
      epidemic_risk: { low: '#F8BBD9', medium: '#F06292', high: '#E91E63', veryHigh: '#AD1457' },
      cyclone_risk: { low: '#CFD8DC', medium: '#90A4AE', high: '#607D8B', veryHigh: '#37474F' }
    };

    const colors = colorScales[riskType] || colorScales.overall;

    if (score < 2.5) return colors.low;
    if (score < 5) return colors.medium;
    if (score < 7.5) return colors.high;
    return colors.veryHigh;
  };

  // Get district risk score based on risk type
  const getDistrictRiskByType = (districtName, riskType) => {
    if (!riskData || !riskData.subnational || !riskData.subnational.adm2) return null;

    const district = riskData.subnational.adm2.find(d =>
      d.admin?.adm2Name === districtName ||
      d.admin?.adm2Name?.toLowerCase() === districtName?.toLowerCase()
    );

    if (!district) return null;

    switch (riskType) {
      case 'overall': return district.risk;
      case 'hazard_exposure': return district.hazardExposure;
      case 'vulnerability': return district.vulnerability;
      case 'lack_coping': return district.lackCopingCapacity;
      case 'flood_risk': return district.hazards?.flood || district.risk * 1.1;
      case 'drought_risk': return district.hazards?.drought || district.risk * 0.9;
      case 'epidemic_risk': return district.hazards?.epidemic || district.vulnerability * 0.8;
      case 'cyclone_risk': return district.hazards?.cyclone || district.risk * 0.6;
      default: return district.risk;
    }
  };

  // Get color based on selection and risk - ENHANCED FOR RISK LAYER OVERLAY
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

    // PRIORITY 1: Selected districts from hazard alerts (highest priority)
    if (isSelected) {
      const districtValue = getDistrictWarningLevel(districtName);
      const isColor = districtValue && districtValue.startsWith('#');
      const warningColor = isColor ? districtValue : getWarningColor(districtValue);

      // Solid flat color with prominent border
      return {
        fillColor: warningColor,
        fillOpacity: 0.75,
        color: '#333333',
        weight: isHovered ? 3 : 2,
        opacity: 1.0,
        dashArray: ''
      };
    }

    // PRIORITY 2: RISK LAYER OVERLAY MODE - Color districts by risk score
    if (riskLayerOverlay && riskLayerOverlay.id) {
      const riskScore = getDistrictRiskByType(districtName, riskLayerOverlay.id);
      const riskColor = getRiskColor(riskScore, riskLayerOverlay.id);

      // Calculate opacity based on risk score (higher risk = more opaque)
      const riskOpacity = riskScore ? Math.min(0.7, 0.3 + (riskScore / 10) * 0.4) : 0.2;

      if (isHovered) {
        return {
          fillColor: riskColor,
          fillOpacity: riskOpacity + 0.15,
          color: '#333',
          weight: 3,
          opacity: 1,
          dashArray: ''
        };
      }

      return {
        fillColor: riskColor,
        fillOpacity: riskOpacity,
        color: '#666',
        weight: 1,
        opacity: 0.6
      };
    }

    // PRIORITY 3: Hovered state
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

    // Default: clean neutral styling (no risk colors)
    return {
      fillColor: '#F5F5F5',
      fillOpacity: 0.3,
      color: '#666',
      weight: 1,
      opacity: 0.6
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
        // CRITICAL: Ignore clicks when drawing tool is active
        if (isDrawingActiveRef.current) {
          console.log('🎨 Drawing mode active - ignoring district click');
          return;
        }

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
        // Null check for _map before accessing container
        if (e.target._map) {
          const mapElement = e.target._map.getContainer();
          // Keep crosshair when drawing, otherwise pointer
          if (!isDrawingActiveRef.current) {
            mapElement.style.cursor = 'pointer';
          }
        }

        // Only show hover effect when not drawing
        if (!isDrawingActiveRef.current) {
          setHoveredDistrict(districtName);
          layer.setStyle({
            weight: 3,
            color: '#FF9800',
            fillOpacity: 0.7,
            dashArray: ''
          });
        }
      });

      layer.on('mouseout', (e) => {
        // Null check for _map before accessing container
        if (e.target._map) {
          const mapElement = e.target._map.getContainer();
          if (!isDrawingActiveRef.current) {
            mapElement.style.cursor = '';
          }
        }

        if (!isDrawingActiveRef.current) {
          setHoveredDistrict(null);
          layer.setStyle(getFeatureStyle(feature));
        }
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

  // Get hazard markers only for SELECTED hazards (not all active hazards)
  const getHazardMarkers = () => {
    // Use selectedHazardsForMarkers if provided, otherwise fall back to activeHazards
    const hazardsToShow = selectedHazardsForMarkers.length > 0 ? selectedHazardsForMarkers : [];

    if (!showPMOView || hazardsToShow.length === 0) return null;

    return hazardsToShow.map((hazard, index) => {
      // Get hazard data (may be nested in hazardData property from Layer2 selection)
      const hazardInfo = hazard.hazardData || hazard;
      const spatialExtent = hazardInfo.spatialExtent || hazard.spatialExtent || [];

      // Get center point for each affected district
      if (spatialExtent.length === 0) return null;

      return spatialExtent.map((districtName, dIndex) => {
        // Find district centroid (simplified - using bounds center)
        if (!geoJsonData) return null;

        const feature = geoJsonData.features.find(f =>
          getDistrictName(f) === districtName
        );

        if (!feature || !feature.geometry) return null;

        // Calculate centroid (simplified)
        const bounds = L.geoJSON(feature).getBounds();
        const center = bounds.getCenter();

        const hazardType = hazardInfo.hazardType || hazard.label || 'Unknown';
        const institution = hazardInfo.institution || hazardInfo.institutionName || hazard.institution || 'Unknown';
        const warnLevel = hazardInfo.warningLevel || hazard.severity || 'Advisory';
        const validity = hazardInfo.temporalValidity || {};
        const confidence = hazardInfo.confidence || hazard.confidence || 'Medium';

        return (
          <Marker
            key={`${index}-${dIndex}`}
            position={[center.lat, center.lng]}
            icon={createHazardIcon(hazardType)}
          >
            <Popup>
              <div className="hazard-popup">
                <h4>{hazardType}</h4>
                <div><strong>District:</strong> {districtName}</div>
                <div><strong>Institution:</strong> {institution}</div>
                <div><strong>Warning Level:</strong> {warnLevel}</div>
                {validity.start && <div><strong>Valid:</strong> {new Date(validity.start).toLocaleDateString()} - {new Date(validity.end).toLocaleDateString()}</div>}
                <div><strong>Confidence:</strong> {confidence}</div>
              </div>
            </Popup>
          </Marker>
        );
      });
    }).flat().filter(Boolean);
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
    <div id="hazard-map-container" className="interactive-hazard-map-container">
      {/* Map Controls */}
      <div className="map-controls">
        {showPMOView && (
          <div className="map-mode-indicator">
            <span className="pmo-view-badge">🏛️ PMO-DMD Live View</span>
          </div>
        )}

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

        {/* Drawing Tools Control Panel */}
        {!showPMOView && (
          <div className="drawing-tools-controls">
            <h4>🎨 Drawing Tools</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setActiveTool(activeTool === 'marker' ? null : 'marker'); setIsDrawing(false); }}
                style={{
                  padding: '8px 12px',
                  background: activeTool === 'marker' ? getWarningColor() : '#f5f5f5',
                  color: activeTool === 'marker' ? (warningLevel === 'Advisory' ? '#000' : '#fff') : '#333',
                  border: activeTool === 'marker' ? '2px solid #333' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                title="Add Marker - Click on map to place"
              >
                📍 Marker
              </button>
              <button
                onClick={() => { setActiveTool(activeTool === 'circle' ? null : 'circle'); setIsDrawing(false); }}
                style={{
                  padding: '8px 12px',
                  background: activeTool === 'circle' ? getWarningColor() : '#f5f5f5',
                  color: activeTool === 'circle' ? (warningLevel === 'Advisory' ? '#000' : '#fff') : '#333',
                  border: activeTool === 'circle' ? '2px solid #333' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                title="Draw Circle - Click center, then click to set radius"
              >
                ⭕ Circle
              </button>
              <button
                onClick={() => { setActiveTool(activeTool === 'rectangle' ? null : 'rectangle'); setIsDrawing(false); }}
                style={{
                  padding: '8px 12px',
                  background: activeTool === 'rectangle' ? getWarningColor() : '#f5f5f5',
                  color: activeTool === 'rectangle' ? (warningLevel === 'Advisory' ? '#000' : '#fff') : '#333',
                  border: activeTool === 'rectangle' ? '2px solid #333' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                title="Draw Rectangle - Click first corner, then opposite corner"
              >
                ⬜ Rectangle
              </button>
              <button
                onClick={() => { setActiveTool(activeTool === 'polygon' ? null : 'polygon'); setIsDrawing(false); }}
                style={{
                  padding: '8px 12px',
                  background: activeTool === 'polygon' ? getWarningColor() : '#f5f5f5',
                  color: activeTool === 'polygon' ? (warningLevel === 'Advisory' ? '#000' : '#fff') : '#333',
                  border: activeTool === 'polygon' ? '2px solid #333' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                title="Draw Polygon - Click points, double-click to finish"
              >
                🔷 Polygon
              </button>
              {selectedHazardType && (
                <button
                  onClick={() => { setActiveTool(activeTool === 'hazardIcon' ? null : 'hazardIcon'); setIsDrawing(false); }}
                  style={{
                    padding: '8px 12px',
                    background: activeTool === 'hazardIcon' ? (HAZARD_SYMBOLS[selectedHazardType]?.color || '#FF9800') : '#f5f5f5',
                    color: activeTool === 'hazardIcon' ? '#fff' : '#333',
                    border: activeTool === 'hazardIcon' ? '2px solid #333' : '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}
                  title={`Add ${selectedHazardType} icon on map`}
                >
                  {HAZARD_SYMBOLS[selectedHazardType]?.icon || '⚠️'} Hazard Icon
                </button>
              )}
              {drawnShapes.length > 0 && (
                <button
                  onClick={handleClearAllShapes}
                  style={{
                    padding: '8px 12px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  title="Clear all drawn shapes"
                >
                  🗑️ Clear All
                </button>
              )}
            </div>
            {activeTool && (
              <div style={{ padding: '8px', background: '#E3F2FD', borderRadius: '4px', marginBottom: '8px' }}>
                <strong>
                  {activeTool === 'marker' && '📍 Click on map to place marker'}
                  {activeTool === 'circle' && (isDrawing ? '⭕ Click to set circle radius' : '⭕ Click to set circle center')}
                  {activeTool === 'rectangle' && (isDrawing ? '⬜ Click opposite corner to finish' : '⬜ Click first corner of rectangle')}
                  {activeTool === 'polygon' && '🔷 Click points, double-click to finish polygon'}
                  {activeTool === 'hazardIcon' && `${HAZARD_SYMBOLS[selectedHazardType]?.icon || '⚠️'} Click on map to place ${selectedHazardType} icon`}
                </strong>
                <button
                  onClick={handleCancelDrawing}
                  style={{ marginLeft: '12px', padding: '4px 8px', background: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel (ESC)
                </button>
              </div>
            )}
            {drawnShapes.length > 0 && (
              <div className="drawn-shapes-summary">
                <strong>📐 Drawn Shapes: {drawnShapes.length}</strong>
                <div className="shapes-list">
                  {drawnShapes.map(shape => (
                    <div key={shape.id} className="shape-item">
                      <span className="shape-type">
                        {shape.type === 'marker' && '📍'}
                        {shape.type === 'rectangle' && '⬜'}
                        {shape.type === 'circle' && '⭕'}
                        {shape.type === 'polygon' && '🔷'}
                        {shape.type === 'polyline' && '📏'}
                        {shape.type === 'hazardIcon' && (HAZARD_SYMBOLS[shape.hazardType]?.icon || '⚠️')}
                        {shape.type === 'hazardIcon' ? shape.hazardType : shape.type.charAt(0).toUpperCase() + shape.type.slice(1)}
                      </span>
                      <span className="shape-area">{shape.formattedArea || 'N/A'}</span>
                      <span
                        className="shape-level-indicator"
                        style={{
                          backgroundColor: shape.color,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: shape.warningLevel === 'Advisory' ? '#000' : '#FFF'
                        }}
                      >
                        {shape.warningLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leaflet Map - Stable configuration for drawing and selection */}
      <MapContainer
        center={[-6.369, 34.888]}
        zoom={6}
        minZoom={6}
        maxZoom={8}
        maxBounds={[[-12.5, 28.5], [-0.2, 41.2]]}
        maxBoundsViscosity={1.0}
        style={{ height: '600px', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={false}
        preferCanvas={true}
        doubleClickZoom={false}
        zoomControl={true}
        tap={false}
        touchZoom={false}
        dragging={true}
        zoomSnap={1}
        zoomDelta={1}
        wheelDebounceTime={100}
        wheelPxPerZoomLevel={120}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          crossOrigin="anonymous"
        />

        {/* Water Bodies Layer - rendered first (underneath) */}
        {waterBodiesData && (
          <GeoJSON
            key="water-bodies"
            data={waterBodiesData}
            style={{
              fillColor: '#64B5F6',
              fillOpacity: 0.7,
              color: 'transparent',
              weight: 0
            }}
          />
        )}

        {geoJsonData && (
          <>
            <GeoJSON
              key={`geojson-${warningLevel}-${shadingMode}-${JSON.stringify(selectedDistricts)}-${riskLayerOverlay?.id || 'none'}`}
              data={geoJsonData}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
              bubblingMouseEvents={true}
              interactive={!showPMOView}
              smoothFactor={1.5}
              attribution={false}
            />
            <AutoFitBounds geoJsonData={geoJsonData} />
          </>
        )}

        {/* International Boundary - rendered on top */}
        {boundaryData && (
          <GeoJSON
            key="boundary"
            data={boundaryData}
            style={{
              fillColor: 'transparent',
              fillOpacity: 0,
              color: '#37474F',
              weight: 2.5,
              opacity: 0.9,
              dashArray: '8, 4'
            }}
          />
        )}

        {/* Drawing Event Handler - handles map events for drawing */}
        {!showPMOView && (
          <DrawingEventHandler
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            warningColor={getWarningColor()}
            warningLevel={warningLevel}
            setDrawnShapes={setDrawnShapes}
            formatArea={formatArea}
            onDrawingStateChange={setIsDrawingActive}
            selectedHazardType={selectedHazardType}
          />
        )}

        {/* Hazard markers for PMO view */}
        {getHazardMarkers()}

        {/* ==================== RISK LAYER OVERLAYS ==================== */}

        {/* Forecast Overlay - Show hazard icon at affected regions */}
        {forecastOverlay && forecastOverlay.type !== 'none' && (
          <>
            {/* Forecast indicator markers at key locations */}
            <Marker
              position={[-6.8, 39.2]} // Dar es Salaam
              icon={L.divIcon({
                className: 'forecast-overlay-icon',
                html: `<div style="
                  background: #F44336;
                  width: 48px;
                  height: 48px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 28px;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(244,67,54,0.5);
                  animation: pulse 2s infinite;
                ">${forecastOverlay.icon || '⚠️'}</div>`,
                iconSize: [48, 48],
                iconAnchor: [24, 24]
              })}
            >
              <Popup>
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{forecastOverlay.icon}</div>
                  <strong style={{ color: '#D32F2F' }}>{forecastOverlay.label || 'Active Forecast'}</strong>
                  <br />
                  <span style={{ fontSize: '12px', color: '#666' }}>Source: {forecastOverlay.institution || 'TMA'}</span>
                </div>
              </Popup>
            </Marker>
            {/* Additional forecast markers for affected areas */}
            <Circle
              center={[-6.8, 39.2]}
              radius={80000}
              pathOptions={{
                color: '#F44336',
                fillColor: '#F44336',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '10, 5'
              }}
            />
          </>
        )}

        {/* Exposure Overlay - Population density circles */}
        {exposureOverlay && exposureOverlay.type === 'population' && (
          <>
            <Circle center={[-6.8, 39.27]} radius={35000} pathOptions={{ color: '#1976D2', fillColor: '#1976D2', fillOpacity: 0.4, weight: 2 }}>
              <Popup><strong>Dar es Salaam</strong><br/>Population: 5.4M<br/>Density: Very High</Popup>
            </Circle>
            <Circle center={[-2.52, 32.9]} radius={28000} pathOptions={{ color: '#1976D2', fillColor: '#1976D2', fillOpacity: 0.35, weight: 2 }}>
              <Popup><strong>Mwanza</strong><br/>Population: 3.1M<br/>Density: High</Popup>
            </Circle>
            <Circle center={[-3.37, 36.68]} radius={22000} pathOptions={{ color: '#1976D2', fillColor: '#1976D2', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Arusha</strong><br/>Population: 1.7M<br/>Density: High</Popup>
            </Circle>
            <Circle center={[-6.17, 35.75]} radius={20000} pathOptions={{ color: '#1976D2', fillColor: '#1976D2', fillOpacity: 0.25, weight: 2 }}>
              <Popup><strong>Dodoma</strong><br/>Population: 2.2M<br/>Density: Medium</Popup>
            </Circle>
            <Circle center={[-8.9, 33.45]} radius={24000} pathOptions={{ color: '#1976D2', fillColor: '#1976D2', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Mbeya</strong><br/>Population: 2.8M<br/>Density: Medium</Popup>
            </Circle>
          </>
        )}

        {/* Exposure Overlay - Infrastructure */}
        {exposureOverlay && exposureOverlay.type === 'infrastructure' && (
          <>
            <Circle center={[-6.8, 39.27]} radius={30000} pathOptions={{ color: '#7B1FA2', fillColor: '#7B1FA2', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Dar es Salaam</strong><br/>Infrastructure: Very High<br/>Major economic hub</Popup>
            </Circle>
            <Circle center={[-3.37, 36.68]} radius={20000} pathOptions={{ color: '#7B1FA2', fillColor: '#7B1FA2', fillOpacity: 0.25, weight: 2 }}>
              <Popup><strong>Arusha</strong><br/>Infrastructure: High<br/>Tourism center</Popup>
            </Circle>
            <Circle center={[-6.17, 35.75]} radius={18000} pathOptions={{ color: '#7B1FA2', fillColor: '#7B1FA2', fillOpacity: 0.2, weight: 2 }}>
              <Popup><strong>Dodoma</strong><br/>Infrastructure: Medium<br/>Capital city</Popup>
            </Circle>
          </>
        )}

        {/* Exposure Overlay - Agricultural Land */}
        {exposureOverlay && exposureOverlay.type === 'cropland' && (
          <>
            <Circle center={[-6.83, 37.65]} radius={60000} pathOptions={{ color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.25, weight: 2 }}>
              <Popup><strong>Morogoro</strong><br/>Cropland: Very High<br/>Major agricultural region</Popup>
            </Circle>
            <Circle center={[-5.02, 32.8]} radius={50000} pathOptions={{ color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.2, weight: 2 }}>
              <Popup><strong>Shinyanga</strong><br/>Cropland: High<br/>Cotton & maize</Popup>
            </Circle>
            <Circle center={[-8.9, 33.45]} radius={45000} pathOptions={{ color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.2, weight: 2 }}>
              <Popup><strong>Mbeya</strong><br/>Cropland: High<br/>Highlands agriculture</Popup>
            </Circle>
          </>
        )}

        {/* Exposure Overlay - Livestock */}
        {exposureOverlay && exposureOverlay.type === 'livestock' && (
          <>
            <Circle center={[-4.02, 34.75]} radius={55000} pathOptions={{ color: '#795548', fillColor: '#795548', fillOpacity: 0.25, weight: 2 }}>
              <Popup><strong>Singida/Manyara</strong><br/>Livestock: Very High<br/>Major pastoral zone</Popup>
            </Circle>
            <Circle center={[-5.02, 32.8]} radius={50000} pathOptions={{ color: '#795548', fillColor: '#795548', fillOpacity: 0.2, weight: 2 }}>
              <Popup><strong>Shinyanga</strong><br/>Livestock: High<br/>Cattle corridor</Popup>
            </Circle>
            <Circle center={[-2.52, 32.9]} radius={40000} pathOptions={{ color: '#795548', fillColor: '#795548', fillOpacity: 0.2, weight: 2 }}>
              <Popup><strong>Mwanza</strong><br/>Livestock: High<br/>Lake zone herding</Popup>
            </Circle>
          </>
        )}

        {/* Vulnerability Overlay - Poverty Rate */}
        {vulnerabilityOverlay && vulnerabilityOverlay.type === 'poverty' && (
          <>
            <Circle center={[-10.68, 39.85]} radius={45000} pathOptions={{ color: '#FF5722', fillColor: '#FF5722', fillOpacity: 0.35, weight: 2 }}>
              <Popup><strong>Lindi</strong><br/>Poverty Rate: 52%<br/>High vulnerability</Popup>
            </Circle>
            <Circle center={[-4.88, 29.62]} radius={50000} pathOptions={{ color: '#FF5722', fillColor: '#FF5722', fillOpacity: 0.35, weight: 2 }}>
              <Popup><strong>Kigoma</strong><br/>Poverty Rate: 50%<br/>High vulnerability</Popup>
            </Circle>
            <Circle center={[-10.27, 40.18]} radius={40000} pathOptions={{ color: '#FF5722', fillColor: '#FF5722', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Mtwara</strong><br/>Poverty Rate: 48%<br/>Moderate-High vulnerability</Popup>
            </Circle>
            <Circle center={[-1.68, 31.27]} radius={45000} pathOptions={{ color: '#FF5722', fillColor: '#FF5722', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Kagera</strong><br/>Poverty Rate: 45%<br/>Moderate-High vulnerability</Popup>
            </Circle>
          </>
        )}

        {/* Vulnerability Overlay - Food Insecurity */}
        {vulnerabilityOverlay && vulnerabilityOverlay.type === 'foodInsecurity' && (
          <>
            <Circle center={[-4.88, 29.62]} radius={55000} pathOptions={{ color: '#E91E63', fillColor: '#E91E63', fillOpacity: 0.35, weight: 2 }}>
              <Popup><strong>Kigoma</strong><br/>Food Insecurity: 52%<br/>Critical food security zone</Popup>
            </Circle>
            <Circle center={[-10.68, 39.85]} radius={45000} pathOptions={{ color: '#E91E63', fillColor: '#E91E63', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Lindi</strong><br/>Food Insecurity: 48%<br/>High food insecurity</Popup>
            </Circle>
            <Circle center={[-6.17, 35.75]} radius={40000} pathOptions={{ color: '#E91E63', fillColor: '#E91E63', fillOpacity: 0.25, weight: 2 }}>
              <Popup><strong>Dodoma</strong><br/>Food Insecurity: 38%<br/>Moderate food insecurity</Popup>
            </Circle>
          </>
        )}

        {/* Vulnerability Overlay - Health Access (inverted - low access = high vulnerability) */}
        {vulnerabilityOverlay && vulnerabilityOverlay.type === 'healthAccess' && (
          <>
            <Circle center={[-10.68, 39.85]} radius={50000} pathOptions={{ color: '#9C27B0', fillColor: '#9C27B0', fillOpacity: 0.35, weight: 2 }}>
              <Popup><strong>Lindi</strong><br/>Health Access: 35%<br/>Limited healthcare reach</Popup>
            </Circle>
            <Circle center={[-4.88, 29.62]} radius={50000} pathOptions={{ color: '#9C27B0', fillColor: '#9C27B0', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Kigoma</strong><br/>Health Access: 38%<br/>Limited healthcare reach</Popup>
            </Circle>
            <Circle center={[-7.77, 31.62]} radius={45000} pathOptions={{ color: '#9C27B0', fillColor: '#9C27B0', fillOpacity: 0.25, weight: 2 }}>
              <Popup><strong>Rukwa</strong><br/>Health Access: 45%<br/>Moderate healthcare gap</Popup>
            </Circle>
          </>
        )}

        {/* Vulnerability Overlay - Water Access */}
        {vulnerabilityOverlay && vulnerabilityOverlay.type === 'waterAccess' && (
          <>
            <Circle center={[-10.68, 39.85]} radius={50000} pathOptions={{ color: '#00BCD4', fillColor: '#00BCD4', fillOpacity: 0.35, weight: 2 }}>
              <Popup><strong>Lindi</strong><br/>Safe Water Access: 32%<br/>Critical water gap</Popup>
            </Circle>
            <Circle center={[-4.88, 29.62]} radius={50000} pathOptions={{ color: '#00BCD4', fillColor: '#00BCD4', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Kigoma</strong><br/>Safe Water Access: 35%<br/>Critical water gap</Popup>
            </Circle>
            <Circle center={[-1.68, 31.27]} radius={45000} pathOptions={{ color: '#00BCD4', fillColor: '#00BCD4', fillOpacity: 0.25, weight: 2 }}>
              <Popup><strong>Kagera</strong><br/>Safe Water Access: 38%<br/>Moderate water gap</Popup>
            </Circle>
          </>
        )}

        {/* Vulnerability Overlay - Vulnerable Groups */}
        {vulnerabilityOverlay && vulnerabilityOverlay.type === 'vulnerableGroups' && (
          <>
            <Circle center={[-4.88, 29.62]} radius={50000} pathOptions={{ color: '#FF9800', fillColor: '#FF9800', fillOpacity: 0.35, weight: 2 }}>
              <Popup><strong>Kigoma</strong><br/>Vulnerable Groups: 48%<br/>Refugees, children, elderly</Popup>
            </Circle>
            <Circle center={[-1.68, 31.27]} radius={45000} pathOptions={{ color: '#FF9800', fillColor: '#FF9800', fillOpacity: 0.3, weight: 2 }}>
              <Popup><strong>Kagera</strong><br/>Vulnerable Groups: 45%<br/>High dependency ratio</Popup>
            </Circle>
            <Circle center={[-10.27, 40.18]} radius={40000} pathOptions={{ color: '#FF9800', fillColor: '#FF9800', fillOpacity: 0.25, weight: 2 }}>
              <Popup><strong>Mtwara</strong><br/>Vulnerable Groups: 44%<br/>Elderly population</Popup>
            </Circle>
          </>
        )}

        {/* ==================== COPING CAPACITY INFRASTRUCTURE LAYERS ==================== */}

        {/* Hospitals Layer */}
        {enabledLayers.hospitals && HOSPITALS.map(hospital => (
          <Marker
            key={hospital.id}
            position={hospital.coordinates}
            icon={L.divIcon({
              className: 'infrastructure-icon hospital-icon',
              html: `<div style="
                background: #D32F2F;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">🏥</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong style={{ color: '#D32F2F' }}>{hospital.name}</strong>
                <br /><span style={{ fontSize: '12px', color: '#666' }}>{hospital.type}</span>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />
                <div style={{ fontSize: '12px' }}>
                  <div>📍 {hospital.district}, {hospital.region}</div>
                  <div>🛏️ Capacity: {hospital.capacity} beds</div>
                  <div>🚨 Emergency: {hospital.emergency ? 'Yes' : 'No'}</div>
                  <div>📞 {hospital.phone}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Emergency Shelters Layer */}
        {enabledLayers.shelters && EMERGENCY_SHELTERS.map(shelter => (
          <Marker
            key={shelter.id}
            position={shelter.coordinates}
            icon={L.divIcon({
              className: 'infrastructure-icon shelter-icon',
              html: `<div style="
                background: #1976D2;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">🏠</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <strong style={{ color: '#1976D2' }}>{shelter.name}</strong>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />
                <div style={{ fontSize: '12px' }}>
                  <div>📍 {shelter.district}, {shelter.region}</div>
                  <div>👥 Capacity: {shelter.capacity} people</div>
                  <div>🏷️ Type: {shelter.type}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fire Stations Layer */}
        {enabledLayers.fireStations && FIRE_STATIONS.map(station => (
          <Marker
            key={station.id}
            position={station.coordinates}
            icon={L.divIcon({
              className: 'infrastructure-icon fire-icon',
              html: `<div style="
                background: #FF5722;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">🚒</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })}
          >
            <Popup>
              <div>
                <strong style={{ color: '#FF5722' }}>{station.name}</strong>
                <br /><span style={{ fontSize: '12px' }}>📍 {station.district}, {station.region}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Police Stations Layer */}
        {enabledLayers.policeStations && POLICE_STATIONS.map(station => (
          <Marker
            key={station.id}
            position={station.coordinates}
            icon={L.divIcon({
              className: 'infrastructure-icon police-icon',
              html: `<div style="
                background: #3F51B5;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">👮</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })}
          >
            <Popup>
              <div>
                <strong style={{ color: '#3F51B5' }}>{station.name}</strong>
                <br /><span style={{ fontSize: '12px' }}>📍 {station.district}, {station.region}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Major Roads Layer */}
        {enabledLayers.roads && MAJOR_ROADS.map(road => (
          <Marker
            key={road.id}
            position={road.coordinates}
            icon={L.divIcon({
              className: 'infrastructure-icon road-icon',
              html: `<div style="
                background: #607D8B;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">🛣️</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })}
          >
            <Popup>
              <div>
                <strong style={{ color: '#607D8B' }}>{road.name}</strong>
                <br /><span style={{ fontSize: '12px' }}>Type: {road.type}</span>
                <br /><span style={{ fontSize: '12px' }}>Status: {road.status}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Evacuation Routes Layer */}
        {enabledLayers.evacuationRoutes && EVACUATION_ROUTES.map(route => (
          <Marker
            key={route.id}
            position={route.coordinates}
            icon={L.divIcon({
              className: 'infrastructure-icon evac-icon',
              html: `<div style="
                background: #4CAF50;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">🚗</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })}
          >
            <Popup>
              <div>
                <strong style={{ color: '#4CAF50' }}>{route.name}</strong>
                <br /><span style={{ fontSize: '12px' }}>Destination: {route.destination}</span>
                <br /><span style={{ fontSize: '12px' }}>Capacity: {route.capacity}</span>
              </div>
            </Popup>
          </Marker>
        ))}
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
            Selected districts will be highlighted in <strong style={{ color: getWarningColor() }}>
              {warningLevel === 'Advisory' ? '🟡 GOLDEN YELLOW (Advisory)' :
               warningLevel === 'Warning' ? '🟠 VIVID ORANGE (Warning)' : '🔴 CRIMSON RED (Major Warning)'}
            </strong>.
            District and region names remain visible through the colored overlay.
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
