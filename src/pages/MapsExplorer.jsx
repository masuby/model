/**
 * Maps Explorer
 *
 * Showcase / sandbox for the upgraded TanzaniaInformMap.
 *
 * Until district-level INFORM scores are seeded into the backend, this page
 * uses a small synthetic dataset so the choropleth has something to color.
 * Wire it to the real backend by passing a `scores` prop populated from
 * informCalculationService output.
 */

import React, { useMemo, useState } from 'react';
import TanzaniaInformMap from '../components/maps/TanzaniaInformMap';

/**
 * Synthetic placeholder scores for ~30 districts. Replace with real INFORM
 * output from the backend / Excel template. Each entry: name → 4 dimension
 * scores on the 0-10 scale.
 */
const DEMO_SCORES = {
  'Dar es Salaam': { risk: 5.8, hazard: 6.1, vulnerability: 5.0, copingCapacity: 6.3 },
  'Mwanza':        { risk: 5.4, hazard: 5.6, vulnerability: 5.2, copingCapacity: 5.5 },
  'Arusha':        { risk: 4.7, hazard: 5.0, vulnerability: 4.3, copingCapacity: 4.9 },
  'Dodoma':        { risk: 4.9, hazard: 5.2, vulnerability: 4.6, copingCapacity: 5.0 },
  'Mbeya':         { risk: 4.2, hazard: 4.5, vulnerability: 3.9, copingCapacity: 4.3 },
  'Tanga':         { risk: 5.1, hazard: 5.7, vulnerability: 4.4, copingCapacity: 5.1 },
  'Morogoro':      { risk: 5.0, hazard: 5.3, vulnerability: 4.6, copingCapacity: 5.1 },
  'Mtwara':        { risk: 5.5, hazard: 5.4, vulnerability: 5.7, copingCapacity: 5.4 },
  'Lindi':         { risk: 5.6, hazard: 5.2, vulnerability: 5.9, copingCapacity: 5.7 },
  'Iringa':        { risk: 4.3, hazard: 4.6, vulnerability: 4.0, copingCapacity: 4.4 },
  'Ruvuma':        { risk: 4.5, hazard: 4.4, vulnerability: 4.6, copingCapacity: 4.5 },
  'Singida':       { risk: 5.2, hazard: 5.0, vulnerability: 5.3, copingCapacity: 5.2 },
  'Tabora':        { risk: 5.4, hazard: 5.2, vulnerability: 5.5, copingCapacity: 5.5 },
  'Rukwa':         { risk: 4.8, hazard: 4.6, vulnerability: 5.0, copingCapacity: 4.9 },
  'Kigoma':        { risk: 5.7, hazard: 5.4, vulnerability: 5.9, copingCapacity: 5.8 },
  'Kagera':        { risk: 5.0, hazard: 5.1, vulnerability: 4.9, copingCapacity: 5.0 },
  'Shinyanga':     { risk: 5.3, hazard: 5.2, vulnerability: 5.4, copingCapacity: 5.3 },
  'Mara':          { risk: 5.2, hazard: 5.0, vulnerability: 5.3, copingCapacity: 5.3 },
  'Pwani':         { risk: 5.6, hazard: 5.9, vulnerability: 5.2, copingCapacity: 5.6 },
  'Manyara':       { risk: 4.4, hazard: 4.7, vulnerability: 4.1, copingCapacity: 4.4 },
  'Geita':         { risk: 5.5, hazard: 5.3, vulnerability: 5.6, copingCapacity: 5.6 },
  'Katavi':        { risk: 5.0, hazard: 4.8, vulnerability: 5.2, copingCapacity: 5.0 },
  'Njombe':        { risk: 4.0, hazard: 4.2, vulnerability: 3.8, copingCapacity: 4.0 },
  'Simiyu':        { risk: 5.4, hazard: 5.2, vulnerability: 5.5, copingCapacity: 5.4 },
  'Songwe':        { risk: 4.6, hazard: 4.4, vulnerability: 4.7, copingCapacity: 4.6 },
};

export default function MapsExplorer() {
  const [selected, setSelected] = useState(null);

  const stats = useMemo(() => {
    const vals = Object.values(DEMO_SCORES).map(s => s.risk).sort((a, b) => a - b);
    const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
    const median = vals[Math.floor(vals.length / 2)];
    return { count: vals.length, mean, median, min: vals[0], max: vals[vals.length - 1] };
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, color: '#0f172a', fontWeight: 700 }}>
          Tanzania INFORM Map Explorer
        </h1>
        <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 14 }}>
          Interactive map showing the 4 INFORM dimensions per region/district, with
          water bodies, regional boundaries, and 4 basemap variants. Switch the
          "Color by" dropdown to recolor by Hazard, Vulnerability, or Lack of Coping.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        {[
          ['Regions with demo data', stats.count],
          ['Mean Risk', stats.mean.toFixed(2)],
          ['Median Risk', stats.median.toFixed(2)],
          ['Min Risk', stats.min.toFixed(2)],
          ['Max Risk', stats.max.toFixed(2)],
        ].map(([label, value]) => (
          <div key={label} style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 16px',
          }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ fontSize: 22, color: '#0f172a', fontWeight: 700, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      <TanzaniaInformMap
        title="Tanzania INFORM Risk — Demo Scores"
        subtitle="Synthetic data for ~25 regions while real district seeding is in progress"
        scores={DEMO_SCORES}
        height={680}
        onFeatureClick={(name, properties, score) => setSelected({ name, properties, score })}
      />

      {selected && (
        <div style={{
          marginTop: 16,
          padding: '16px 20px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
        }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>📍 {selected.name}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: '#475569' }}>
            {selected.score != null
              ? <>INFORM Risk: <strong>{selected.score.toFixed(2)}</strong></>
              : 'No INFORM data for this district yet. Seeding pending.'}
          </div>
          {selected.properties && (
            <pre style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 4, fontSize: 11, color: '#334155', overflow: 'auto' }}>
              {JSON.stringify(selected.properties, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
