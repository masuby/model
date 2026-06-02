/**
 * DistrictMap — level-aware INFORM choropleth. Renders ADM2 districts, ADM1
 * regions, or the national view, coloured by the active metric. No tile layer.
 */
import React, { useRef, useEffect } from 'react';
import { MapContainer, GeoJSON, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import districts from '../../data/tanzania-districts.json';
import regions from '../../data/tanzania-regions.json';
import waterbodies from '../../data/tanzania-waterbodies.json';
import { DISTRICT_BY_KEY, REGION_BY_KEY, NATIONAL_UNIT, districtKey, normRegion, classifyRisk, round1, provenanceFor } from './riskModel';
import { sourceLabel } from './indicatorSources';
import { RISK_CLASSES } from './riskConstants';

const BASEMAPS = {
  streets: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
};

// Short, plain-language explanation per metric, shown in the hover tooltip.
const METRIC_INFO = {
  risk: 'Overall INFORM Risk = ∛(Hazard × Vulnerability × Lack of Coping).',
  'dim:hazard': 'Hazard & Exposure — how likely/intense hazards are and what is exposed.',
  'dim:vulnerability': 'Vulnerability — susceptibility of people & systems (poverty, health, vulnerable groups).',
  'dim:coping': 'Lack of Coping Capacity — resources & institutions available to cope; higher means fewer.',
  'ind:coping:drrImplementation': 'DRR implementation — disaster-risk-reduction capacity in place (plans, EOCC, ERT, EPRP). Higher = less in place.',
  'ind:coping:governance': 'Governance — institutional capacity to manage disaster risk.',
  'ind:coping:wash': 'WASH — water & sanitation resources available (from 2022-census water points & boreholes).',
  'ind:coping:accessHealth': 'Access to health-care resources.',
  'ind:coping:education': 'Education resources & access.',
  'ind:coping:communication': 'Communication infrastructure.',
  'ind:coping:economicCapacity': 'Economic capacity to prepare & respond.',
  'ind:hazard:flood': 'Flood exposure — riverine & urban flooding.',
  'ind:hazard:drought': 'Drought exposure — agricultural/meteorological drought.',
  'ind:hazard:landslide': 'Landslide exposure — rainfall-triggered slope failure (highlands).',
  'ind:hazard:coastalHazards': 'Coastal hazards — erosion, surge, sea-level rise.',
  'ind:hazard:earthquake': 'Earthquake exposure — Rift Valley seismicity.',
  'ind:hazard:stormsCyclone': 'Storms & tropical cyclone exposure.',
  'ind:vulnerability:developmentPoverty': 'Development & poverty (Household Budget Survey).',
  'ind:vulnerability:childrenHealthNutrition': 'Children health & nutrition — stunting (TDHS 2022).',
};

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function unitBounds(unit, level, geo) {
  if (!unit) return null;
  const match = level === 'region'
    ? (f) => norm(f.properties.reg_name) === norm(unit.admin.adm2Name)
    : (f) => norm(f.properties.dist_name) === norm(unit.admin.adm2Name) && norm(f.properties.reg_name) === norm(unit.admin.adm1Name);
  const feat = geo.features.find(match);
  if (!feat) return null;
  let a = 90, b = -90, c = 180, d = -180;
  const walk = (co) => co.forEach((x) => {
    if (typeof x[0] === 'number') { const [lng, lat] = x; a = Math.min(a, lat); b = Math.max(b, lat); c = Math.min(c, lng); d = Math.max(d, lng); }
    else walk(x);
  });
  walk(feat.geometry.coordinates);
  return [[a, c], [b, d]];
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => { if (bounds) map.fitBounds(bounds, { padding: [14, 14] }); }, [bounds, map]);
  return null;
}

export default function DistrictMap({ metric, selected, onSelect, filterClass, level = 'district', isolateKey, baseLayer = 'none', focusUnit }) {
  const geoRef = useRef(null);
  const geojson = level === 'district' ? districts : regions;
  const hasBase = baseLayer !== 'none' && BASEMAPS[baseLayer];
  const focusBounds = focusUnit ? unitBounds(focusUnit, level, geojson) : null;
  const key = `${metric.key}|${filterClass || 'all'}|${level}|${isolateKey || ''}|${baseLayer}`;

  const unitOf = (f) => {
    if (level === 'district') return DISTRICT_BY_KEY[districtKey(f.properties.dist_name, f.properties.reg_name)];
    if (level === 'region') return REGION_BY_KEY[normRegion(f.properties.reg_name)];
    return NATIONAL_UNIT;
  };
  const labelOf = (f) =>
    level === 'district' ? { name: f.properties.dist_name, sub: f.properties.reg_name }
    : level === 'region' ? { name: f.properties.reg_name, sub: 'Region (ADM1)' }
    : { name: 'Tanzania', sub: 'National' };
  const keyOf = (u) => u && u.admin.adm2Code;

  // Indicator lenses have 0–10 distributions unlike overall risk — colour them by
  // their own quintiles so the real hotspots stand out (risk + dimension totals
  // keep the authoritative INFORM class thresholds/colours).
  const isIndicator = typeof metric.key === 'string' && metric.key.startsWith('ind:');
  const relColor = (() => {
    if (!isIndicator) return null;
    const units = level === 'region' ? Object.values(REGION_BY_KEY) : level === 'national' ? [NATIONAL_UNIT] : Object.values(DISTRICT_BY_KEY);
    const vals = units.map((u) => metric.get(u)).filter((v) => typeof v === 'number').sort((a, b) => a - b);
    if (!vals.length) return () => '#cbd5e1';
    const q = (p) => vals[Math.max(0, Math.min(vals.length - 1, Math.floor(p * (vals.length - 1))))];
    const th = [q(0.2), q(0.4), q(0.6), q(0.8)];
    const PAL = ['#2E7D32', '#8BC34A', '#FFC107', '#FF9800', '#D32F2F'];
    return (v) => { if (v == null) return '#cbd5e1'; let i = 0; while (i < 4 && v > th[i]) i++; return PAL[i]; };
  })();

  const styleFor = (f) => {
    const u = unitOf(f);
    const val = u ? metric.get(u) : null;
    const cls = classifyRisk(val);
    const isSel = selected && u && keyOf(selected) === keyOf(u);
    const dimmed = (filterClass && cls.level !== filterClass) || (isolateKey && keyOf(u) !== isolateKey);
    return {
      fillColor: relColor ? relColor(val) : cls.color,
      fillOpacity: val == null ? (hasBase ? 0.08 : 0.18) : dimmed ? 0.1 : (hasBase ? 0.6 : 0.85),
      color: isSel ? '#0f172a' : dimmed ? '#e2e8f0' : '#ffffff',
      weight: isSel ? 2.6 : level === 'district' ? 0.7 : 1.1,
    };
  };

  const onEach = (f, layer) => {
    const u = unitOf(f);
    const val = u ? metric.get(u) : null;
    const cls = classifyRisk(val);
    const lbl = labelOf(f);
    const info = METRIC_INFO[metric.key];
    const drr = u?.drr ? [u.drr.eocc && 'Regional EOCC', u.drr.eprp && 'EPRP', u.drr.aa && 'Drought Anticipatory Action'].filter(Boolean).join(' · ') : '';
    const fac = u?.facilities ? `🏥 ${u.facilities.health.toLocaleString()} · 🏫 ${u.facilities.education.toLocaleString()} · 💧 ${u.facilities.water.toLocaleString()}` : '';
    // Data source for the active indicator lens (a Data-Entry edit's stamp, else the registry baseline).
    const parts = isIndicator ? metric.key.split(':') : [];
    const prov = isIndicator && u ? provenanceFor(u, parts[1], parts[2]) : null;
    const src = prov ? `${prov.edited ? '✎ Updated by' : '📎 Source:'} ${sourceLabel(prov)}` : '';
    const floods = parts[2] === 'flood' && u?.hazardExposure?.events?.flood?.length ? `🌊 Recorded floods: ${u.hazardExposure.events.flood.join(', ')}` : '';
    const expo = u?.hazardExposure?.exposure ? `👥 ${u.hazardExposure.exposure.population?.toLocaleString()} people · ${u.hazardExposure.exposure.density}/km²` : '';
    layer.bindTooltip(
      `<div class="rx-tip">
        <div class="rx-tip-h"><strong>${lbl.name}</strong> <span>${lbl.sub}</span></div>
        <div class="rx-tip-v">${metric.label}: <b>${round1(val) ?? '—'}</b>${val == null || isIndicator ? '' : ` · ${cls.level}`}</div>
        ${info ? `<div class="rx-tip-d">${info}</div>` : ''}
        ${src ? `<div class="rx-tip-src">${src}</div>` : ''}
        ${floods ? `<div class="rx-tip-drr">${floods}</div>` : ''}
        ${drr ? `<div class="rx-tip-drr">🛡️ DRR: ${drr}</div>` : ''}
        ${expo ? `<div class="rx-tip-f">${expo}</div>` : ''}
        ${fac ? `<div class="rx-tip-f">${fac}</div>` : ''}
      </div>`,
      { sticky: true, className: 'rx-tip-wrap' }
    );
    layer.on({
      click: () => u && onSelect?.(u),
      mouseover: (e) => e.target.setStyle({ weight: 2.4 }),
      mouseout: () => geoRef.current && geoRef.current.resetStyle(layer),
    });
  };

  const legend = isIndicator
    ? ['Lowest', 'Low', 'Medium', 'High', 'Highest'].map((level, i) => ({ level, color: ['#2E7D32', '#8BC34A', '#FFC107', '#FF9800', '#D32F2F'][i] }))
    : RISK_CLASSES;

  return (
    <div className="rx-map">
      <MapContainer bounds={[[-11.8, 29.2], [-0.9, 40.5]]} style={{ height: '100%', width: '100%', background: '#eef2f7', borderRadius: 'var(--r-lg)' }} zoomSnap={0.25} attributionControl={false}>
        {hasBase && <TileLayer key={baseLayer} url={BASEMAPS[baseLayer].url} attribution={BASEMAPS[baseLayer].attribution} />}
        {focusBounds && <FitBounds bounds={focusBounds} />}
        <GeoJSON key={key} ref={geoRef} data={geojson} style={styleFor} onEachFeature={onEach} />
        {/* Real water bodies (2022 PHC geodatabase) — lakes/ocean for geographic context */}
        <GeoJSON data={waterbodies} interactive={false} style={() => ({ fillColor: '#a7cdf0', fillOpacity: 0.55, color: '#5b9bd5', weight: 0.5 })} />
      </MapContainer>
      <div className="rx-legend ui-card">
        <span className="rx-legend-title">{metric.label}{isIndicator ? ' (relative)' : ''}</span>
        {legend.map((l) => (
          <span key={l.level} className="rx-legend-row"><i style={{ background: l.color }} /> {l.level}</span>
        ))}
      </div>
    </div>
  );
}
