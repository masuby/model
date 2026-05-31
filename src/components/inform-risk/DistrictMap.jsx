/**
 * DistrictMap — Tanzania ADM2 choropleth (150 district polygons, ~375KB),
 * coloured by the selected metric (overall risk, a dimension, or a hazard).
 * No tile layer; clicking a district selects it. Authentic data only.
 */
import React, { useMemo, useRef } from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import districts from '../../data/tanzania-districts.json';
import { DISTRICT_BY_KEY, districtKey, classifyRisk, round1 } from './riskModel';

export default function DistrictMap({ metric, selected, onSelect }) {
  const geoRef = useRef(null);

  // Re-key the GeoJSON layer when the metric changes so styles recompute.
  const key = metric.key;

  const lookup = (feature) =>
    DISTRICT_BY_KEY[districtKey(feature.properties.dist_name, feature.properties.reg_name)];

  const styleFor = (feature) => {
    const d = lookup(feature);
    const val = d ? metric.get(d) : null;
    const selKey = selected && districtKey(selected.admin.adm2Name, selected.admin.adm1Name);
    const fKey = districtKey(feature.properties.dist_name, feature.properties.reg_name);
    return {
      fillColor: classifyRisk(val).color,
      fillOpacity: val == null ? 0.25 : 0.82,
      color: selKey && selKey === fKey ? '#0f172a' : '#ffffff',
      weight: selKey && selKey === fKey ? 2.5 : 0.7,
    };
  };

  const onEach = (feature, layer) => {
    const d = lookup(feature);
    const val = d ? metric.get(d) : null;
    const cls = classifyRisk(val);
    layer.bindTooltip(
      `<strong>${feature.properties.dist_name}</strong><br/>${feature.properties.reg_name}<br/>${
        metric.label
      }: ${round1(val) ?? '—'}${val == null ? '' : ` · ${cls.level}`}`,
      { sticky: true }
    );
    layer.on({
      click: () => d && onSelect?.(d),
      mouseover: (e) => e.target.setStyle({ weight: 2 }),
      mouseout: () => geoRef.current && geoRef.current.resetStyle(layer),
    });
  };

  const legend = useMemo(
    () => [
      { level: 'Very Low', color: 'var(--c-vlow)' },
      { level: 'Low', color: 'var(--c-low)' },
      { level: 'Medium', color: 'var(--c-med)' },
      { level: 'High', color: 'var(--c-high)' },
      { level: 'Very High', color: 'var(--c-vhigh)' },
    ],
    []
  );

  return (
    <div className="rx-map">
      <MapContainer
        bounds={[[-11.8, 29.2], [-0.9, 40.5]]}
        style={{ height: '100%', width: '100%', background: '#eef2f7', borderRadius: 'var(--r-lg)' }}
        zoomSnap={0.25}
        attributionControl={false}
      >
        <GeoJSON key={key} ref={geoRef} data={districts} style={styleFor} onEachFeature={onEach} />
      </MapContainer>
      <div className="rx-legend ui-card">
        <span className="rx-legend-title">{metric.label}</span>
        {legend.map((l) => (
          <span key={l.level} className="rx-legend-row">
            <i style={{ background: l.color }} /> {l.level}
          </span>
        ))}
      </div>
    </div>
  );
}
