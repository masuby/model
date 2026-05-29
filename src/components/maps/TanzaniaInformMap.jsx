/**
 * TanzaniaInformMap
 *
 * Modern, reusable Leaflet map for the INFORM Tanzania system.
 *
 * Layers (all toggleable):
 *   • Basemap selector — OSM, Carto Light, ESRI World Imagery, OpenTopo
 *   • Tanzania border (ADM0)
 *   • Regions (ADM1, 31)
 *   • Districts (ADM2, 184) — colored by selected INFORM dimension
 *   • Water bodies — Lake Victoria, Tanganyika, Nyasa, Manyara, Natron, etc.
 *   • International boundary (clipped)
 *   • Custom overlay layers (hazards, hospitals, etc.) via the `extraLayers` prop
 *
 * Choropleth: pick any dimension (RISK / HAZARD / VULNERABILITY / COPING_CAPACITY)
 * — districts are colored with the per-dimension thresholds defined in
 * informCalculationEngine. The legend updates automatically.
 *
 * Performance: GeoJSON fetched at runtime from /public/geojson/ so the heavy
 * boundary data is not bundled into the JS chunk.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  ZoomControl,
  ScaleControl,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  classifyDimension,
  classifyRisk,
  RISK_CLASS_LABELS,
  TANZANIA_THRESHOLDS,
} from '../../services/informCalculationEngine';
import './TanzaniaInformMap.css';

const TANZANIA_BOUNDS = [
  [-11.75, 29.34],
  [-1.05, 40.43],
];
const TANZANIA_CENTER = [-6.369, 34.888];

const BASEMAPS = [
  {
    name: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap, © CARTO',
    default: true,
  },
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  {
    name: 'ESRI Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
  },
  {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data © OpenStreetMap, SRTM | © OpenTopoMap',
  },
];

const DIMENSIONS = [
  { key: 'RISK', label: 'INFORM Risk' },
  { key: 'HAZARD', label: 'Hazard & Exposure' },
  { key: 'VULNERABILITY', label: 'Vulnerability' },
  { key: 'COPING_CAPACITY', label: 'Lack of Coping' },
];

const DISTRICT_NAME_KEYS = ['dist_name', 'ADM2_NAME', 'ADM2_EN', 'shapeName'];
const REGION_NAME_KEYS = ['reg_name', 'ADM1_NAME', 'ADM1_EN', 'shapeName'];

function pickName(properties, keys) {
  for (const k of keys) {
    if (properties?.[k]) return properties[k];
  }
  return null;
}

function classify(score, dimension) {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  return dimension === 'RISK'
    ? classifyRisk(score)
    : classifyDimension(score, dimension);
}

/**
 * Build a property-name → score lookup for the chosen dimension.
 * Accepts {adm2Name: {risk, hazard, vulnerability, copingCapacity}} or any
 * subset; missing scores produce null colors.
 */
function buildScoreLookup(scores, dimension) {
  const key = ({
    RISK: 'risk',
    HAZARD: 'hazard',
    VULNERABILITY: 'vulnerability',
    COPING_CAPACITY: 'copingCapacity',
  })[dimension];
  const lookup = {};
  for (const [name, record] of Object.entries(scores || {})) {
    if (record && record[key] !== null && record[key] !== undefined) {
      lookup[name] = Number(record[key]);
    }
  }
  return lookup;
}

// ---------------------------------------------------------------------------
// FitBoundsOnMount — only on first GeoJSON load (so user pan/zoom isn't reset)
// ---------------------------------------------------------------------------
function FitBoundsOnMount({ geojson }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || !geojson) return;
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
        fitted.current = true;
      }
    } catch (e) {
      console.warn('FitBoundsOnMount: invalid geojson', e);
    }
  }, [geojson, map]);
  return null;
}

// ---------------------------------------------------------------------------
// useGeoJsonFetch — lazy fetch a public GeoJSON file
// ---------------------------------------------------------------------------
function useGeoJsonFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e); });
    return () => { cancelled = true; };
  }, [url]);
  return { data, error };
}

// ---------------------------------------------------------------------------
// Legend (updates with selected dimension)
// ---------------------------------------------------------------------------
function ChoroplethLegend({ dimension }) {
  const thresholds = TANZANIA_THRESHOLDS[dimension] ?? TANZANIA_THRESHOLDS.RISK;
  const bands = RISK_CLASS_LABELS.map((label, i) => ({
    ...label,
    min: i === 0 ? 0 : thresholds[i - 1],
    max: thresholds[i],
  }));
  return (
    <div className="tz-map-legend">
      <div className="tz-map-legend-title">
        {DIMENSIONS.find((d) => d.key === dimension)?.label ?? dimension}
      </div>
      {bands.map((b) => (
        <div className="tz-map-legend-row" key={b.label}>
          <span className="tz-map-legend-swatch" style={{ background: b.color }} />
          <span className="tz-map-legend-text">
            {b.label} <span className="tz-map-legend-range">{b.min.toFixed(1)}–{b.max.toFixed(1)}</span>
          </span>
        </div>
      ))}
      <div className="tz-map-legend-row tz-map-legend-na">
        <span className="tz-map-legend-swatch" style={{ background: '#e5e7eb' }} />
        <span className="tz-map-legend-text">No data</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header — dimension selector + basemap selector
// ---------------------------------------------------------------------------
function MapHeader({ dimension, onDimensionChange, basemap, onBasemapChange, title, subtitle }) {
  return (
    <div className="tz-map-header">
      <div className="tz-map-header-titles">
        {title && <div className="tz-map-title">{title}</div>}
        {subtitle && <div className="tz-map-subtitle">{subtitle}</div>}
      </div>
      <div className="tz-map-controls">
        <label className="tz-map-control">
          <span>Color by</span>
          <select value={dimension} onChange={(e) => onDimensionChange(e.target.value)}>
            {DIMENSIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </label>
        <label className="tz-map-control">
          <span>Basemap</span>
          <select value={basemap} onChange={(e) => onBasemapChange(e.target.value)}>
            {BASEMAPS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TanzaniaInformMap({
  title = 'Tanzania INFORM Risk Map',
  subtitle,
  scores = {},               // { 'Arusha': { risk: 5.4, hazard: 6.2, vulnerability: 4.1, copingCapacity: 5.8 } }
  initialDimension = 'RISK',
  height = 600,
  showRegions = true,
  showDistricts = true,
  showWaterBodies = true,
  showCountryBorder = true,
  extraLayers = null,        // arbitrary children rendered inside MapContainer
  onFeatureClick,            // (name, properties, score) => void
}) {
  const [dimension, setDimension] = useState(initialDimension);
  const [basemap, setBasemap] = useState(BASEMAPS.find((b) => b.default)?.name ?? BASEMAPS[0].name);
  const [hovered, setHovered] = useState(null);

  const adm0 = useGeoJsonFetch('/geojson/Tanzania_Country.geojson');
  const adm1 = useGeoJsonFetch('/geojson/ADM1_NEW.geojson');
  const adm2 = useGeoJsonFetch('/geojson/tanzania_districts_clean.geojson');
  const water = useGeoJsonFetch('/geojson/Water_Body_Clipped.geojson');
  const intBorder = useGeoJsonFetch('/geojson/TZ_International_Boundary_Clipped.geojson');

  const lookup = useMemo(() => buildScoreLookup(scores, dimension), [scores, dimension]);
  const activeBasemap = BASEMAPS.find((b) => b.name === basemap) ?? BASEMAPS[0];

  // Style: choropleth fill for districts, neutral for regions
  const districtStyle = (feature) => {
    const name = pickName(feature.properties, DISTRICT_NAME_KEYS);
    const score = name != null ? lookup[name] : null;
    const cls = classify(score, dimension);
    return {
      fillColor: cls?.color ?? '#e5e7eb',
      color: '#475569',
      weight: 0.6,
      opacity: 0.9,
      fillOpacity: cls ? 0.65 : 0.35,
    };
  };

  const regionStyle = () => ({
    color: '#0f172a',
    weight: 1.5,
    opacity: 0.85,
    fillOpacity: 0,
    dashArray: '4 4',
  });

  const countryStyle = () => ({
    color: '#1e293b',
    weight: 2.5,
    opacity: 1,
    fillOpacity: 0,
  });

  const waterStyle = () => ({
    color: '#0369a1',
    weight: 0.5,
    fillColor: '#38bdf8',
    fillOpacity: 0.55,
  });

  const intBorderStyle = () => ({
    color: '#dc2626',
    weight: 2,
    dashArray: '6 4',
    opacity: 0.7,
    fillOpacity: 0,
  });

  // District interactions: hover highlight + click handler
  const onEachDistrict = (feature, layer) => {
    const name = pickName(feature.properties, DISTRICT_NAME_KEYS);
    const score = name != null ? lookup[name] : null;
    const cls = classify(score, dimension);

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 2.5, color: '#facc15', fillOpacity: 0.85 });
        e.target.bringToFront();
        setHovered({ name, score, classification: cls?.label });
      },
      mouseout: (e) => {
        e.target.setStyle(districtStyle(feature));
        setHovered(null);
      },
      click: (e) => {
        if (onFeatureClick) onFeatureClick(name, feature.properties, score);
        e.target._map.fitBounds(e.target.getBounds(), { padding: [40, 40] });
      },
    });

    if (name) {
      layer.bindPopup(`
        <div class="tz-map-popup">
          <div class="tz-map-popup-title">${name}</div>
          ${score != null
            ? `<div class="tz-map-popup-score">
                 <strong>${DIMENSIONS.find((d) => d.key === dimension)?.label}</strong>
                 <span class="tz-map-popup-badge" style="background:${cls?.color}">${cls?.label} (${score.toFixed(1)})</span>
               </div>`
            : '<div class="tz-map-popup-na">No INFORM data for this district yet</div>'}
        </div>
      `);
    }
  };

  const onEachWater = (feature, layer) => {
    const name = feature.properties?.LAKES;
    if (name) layer.bindPopup(`<strong>💧 ${name}</strong>`);
  };

  const onEachRegion = (feature, layer) => {
    const name = pickName(feature.properties, REGION_NAME_KEYS);
    if (name) layer.bindTooltip(name, { sticky: true, direction: 'center', className: 'tz-map-region-tooltip' });
  };

  return (
    <div className="tz-map-wrapper" style={{ height }}>
      <MapHeader
        title={title}
        subtitle={subtitle}
        dimension={dimension}
        onDimensionChange={setDimension}
        basemap={basemap}
        onBasemapChange={setBasemap}
      />

      <div className="tz-map-canvas">
        <MapContainer
          center={TANZANIA_CENTER}
          zoom={6}
          maxBounds={TANZANIA_BOUNDS}
          maxBoundsViscosity={1}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            key={activeBasemap.name}
            url={activeBasemap.url}
            attribution={activeBasemap.attribution}
            maxZoom={18}
          />

          <LayersControl position="topright">
            {showDistricts && adm2.data && (
              <LayersControl.Overlay checked name="Districts (INFORM choropleth)">
                <GeoJSON
                  key={`adm2-${dimension}-${Object.keys(lookup).length}`}
                  data={adm2.data}
                  style={districtStyle}
                  onEachFeature={onEachDistrict}
                />
              </LayersControl.Overlay>
            )}

            {showRegions && adm1.data && (
              <LayersControl.Overlay checked name="Regions (ADM1, dashed)">
                <GeoJSON
                  key="adm1"
                  data={adm1.data}
                  style={regionStyle}
                  onEachFeature={onEachRegion}
                />
              </LayersControl.Overlay>
            )}

            {showWaterBodies && water.data && (
              <LayersControl.Overlay checked name="Water bodies (lakes, ocean, dams)">
                <GeoJSON
                  key="water"
                  data={water.data}
                  style={waterStyle}
                  onEachFeature={onEachWater}
                />
              </LayersControl.Overlay>
            )}

            {showCountryBorder && adm0.data && (
              <LayersControl.Overlay checked name="Tanzania border">
                <GeoJSON key="adm0" data={adm0.data} style={countryStyle} />
              </LayersControl.Overlay>
            )}

            {intBorder.data && (
              <LayersControl.Overlay name="International boundary (clipped)">
                <GeoJSON key="intborder" data={intBorder.data} style={intBorderStyle} />
              </LayersControl.Overlay>
            )}
          </LayersControl>

          <ZoomControl position="bottomright" />
          <ScaleControl position="bottomleft" imperial={false} />

          <FitBoundsOnMount geojson={adm0.data ?? adm1.data ?? adm2.data} />

          {extraLayers}
        </MapContainer>

        <ChoroplethLegend dimension={dimension} />

        {hovered && (
          <div className="tz-map-hover-card">
            <div className="tz-map-hover-name">{hovered.name}</div>
            {hovered.score != null
              ? <div className="tz-map-hover-score">{hovered.classification} · {hovered.score.toFixed(1)}</div>
              : <div className="tz-map-hover-na">No data</div>}
          </div>
        )}

        {(!adm2.data || !adm1.data) && (
          <div className="tz-map-loading">Loading Tanzania boundaries…</div>
        )}
      </div>
    </div>
  );
}
