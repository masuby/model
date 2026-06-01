/**
 * DistrictMap — level-aware INFORM choropleth. Renders ADM2 districts, ADM1
 * regions, or the national view, coloured by the active metric. No tile layer.
 */
import React, { useRef } from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import districts from '../../data/tanzania-districts.json';
import regions from '../../data/tanzania-regions.json';
import { DISTRICT_BY_KEY, REGION_BY_KEY, NATIONAL_UNIT, districtKey, normRegion, classifyRisk, round1 } from './riskModel';
import { RISK_CLASSES } from './riskConstants';

export default function DistrictMap({ metric, selected, onSelect, filterClass, level = 'district', isolateKey }) {
  const geoRef = useRef(null);
  const geojson = level === 'district' ? districts : regions;
  const key = `${metric.key}|${filterClass || 'all'}|${level}|${isolateKey || ''}`;

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

  const styleFor = (f) => {
    const u = unitOf(f);
    const val = u ? metric.get(u) : null;
    const cls = classifyRisk(val);
    const isSel = selected && u && keyOf(selected) === keyOf(u);
    const dimmed = (filterClass && cls.level !== filterClass) || (isolateKey && keyOf(u) !== isolateKey);
    return {
      fillColor: cls.color,
      fillOpacity: val == null ? 0.18 : dimmed ? 0.12 : 0.85,
      color: isSel ? '#0f172a' : dimmed ? '#e2e8f0' : '#ffffff',
      weight: isSel ? 2.6 : level === 'district' ? 0.7 : 1.1,
    };
  };

  const onEach = (f, layer) => {
    const u = unitOf(f);
    const val = u ? metric.get(u) : null;
    const cls = classifyRisk(val);
    const lbl = labelOf(f);
    layer.bindTooltip(
      `<strong>${lbl.name}</strong><br/>${lbl.sub}<br/>${metric.label}: ${round1(val) ?? '—'}${val == null ? '' : ` · ${cls.level}`}`,
      { sticky: true }
    );
    layer.on({
      click: () => u && onSelect?.(u),
      mouseover: (e) => e.target.setStyle({ weight: 2.4 }),
      mouseout: () => geoRef.current && geoRef.current.resetStyle(layer),
    });
  };

  const legend = RISK_CLASSES;

  return (
    <div className="rx-map">
      <MapContainer bounds={[[-11.8, 29.2], [-0.9, 40.5]]} style={{ height: '100%', width: '100%', background: '#eef2f7', borderRadius: 'var(--r-lg)' }} zoomSnap={0.25} attributionControl={false}>
        <GeoJSON key={key} ref={geoRef} data={geojson} style={styleFor} onEachFeature={onEach} />
      </MapContainer>
      <div className="rx-legend ui-card">
        <span className="rx-legend-title">{metric.label}</span>
        {legend.map((l) => (
          <span key={l.level} className="rx-legend-row"><i style={{ background: l.color }} /> {l.level}</span>
        ))}
      </div>
    </div>
  );
}
