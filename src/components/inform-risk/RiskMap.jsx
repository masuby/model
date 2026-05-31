/**
 * RiskMap — region-level INFORM Risk choropleth for Tanzania.
 * Renders the simplified region boundaries (src/data/tanzania-regions.json,
 * ~140KB) coloured by each region's mean district risk. No tile layer — a
 * clean vector map, no external requests.
 */

import React, { useMemo } from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import regions from '../../data/tanzania-regions.json';
import riskDataset from '../../data/tanzania-inform-risk.json';
import { buildRegionRisk, classifyRisk, normRegion } from './regionRisk';
import './RiskMap.css';

const LEGEND = [
  { level: 'Very Low', color: '#43A047' },
  { level: 'Low', color: '#8BC34A' },
  { level: 'Medium', color: '#FFC107' },
  { level: 'High', color: '#FF9800' },
  { level: 'Very High', color: '#F44336' },
];

export default function RiskMap() {
  const regionRisk = useMemo(() => buildRegionRisk(riskDataset), []);

  const styleFor = (feature) => {
    const r = regionRisk[normRegion(feature.properties.reg_name)];
    return {
      fillColor: classifyRisk(r?.risk).color,
      fillOpacity: 0.8,
      color: '#ffffff',
      weight: 1,
    };
  };

  return (
    <div className="risk-map-wrap">
      <MapContainer
        bounds={[[-11.8, 29.2], [-0.9, 40.5]]}
        style={{ height: '560px', width: '100%', background: '#eef2f7' }}
        zoomSnap={0.25}
        attributionControl={false}
      >
        <GeoJSON
          data={regions}
          style={styleFor}
          onEachFeature={(feature, layer) => {
            const r = regionRisk[normRegion(feature.properties.reg_name)];
            const cls = classifyRisk(r?.risk);
            layer.bindTooltip(
              `<strong>${feature.properties.reg_name}</strong><br/>Risk ${
                r?.risk ?? '—'
              } · ${cls.level}`,
              { sticky: true }
            );
            layer.on({
              mouseover: (e) => e.target.setStyle({ weight: 3, color: '#1f3a5f' }),
              mouseout: (e) => e.target.setStyle({ weight: 1, color: '#ffffff' }),
            });
          }}
        />
      </MapContainer>

      <div className="risk-map-legend">
        <span className="risk-map-legend-title">INFORM Risk</span>
        {LEGEND.map((l) => (
          <span key={l.level} className="risk-map-legend-item">
            <span className="risk-map-legend-swatch" style={{ background: l.color }} />
            {l.level}
          </span>
        ))}
      </div>
    </div>
  );
}
