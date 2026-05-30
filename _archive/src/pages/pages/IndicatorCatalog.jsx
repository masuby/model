/**
 * IndicatorCatalog
 *
 * Full reference for every indicator in the Tanzania INFORM operational
 * model (~80 indicators). Use as a printable / shareable guide for regional
 * data-collection teams.
 *
 * Filter controls: dimension, INFORM Core vs Tanzania Extension, free-text search.
 * Each row links to the IndicatorGuide popover for the full PDF-sourced
 * explanation.
 */

import React, { useMemo, useState } from 'react';
import {
  COMPLETE_HIERARCHY,
  ALL_INDICATORS,
  ALL_COMPONENTS,
  STATISTICS
} from '../services/informIndicatorDefinitions';
import { getIndicatorDescription } from '../services/informIndicatorDescriptions';
import IndicatorGuide from '../components/data-entry/IndicatorGuide';
import '../components/data-entry/IndicatorGuide.css';

const DIM_LABELS = {
  HAZARD: { name: 'Hazard & Exposure', color: '#ef4444', icon: '⚠️' },
  VULNERABILITY: { name: 'Vulnerability', color: '#f97316', icon: '👥' },
  COPING_CAPACITY: { name: 'Lack of Coping Capacity', color: '#22c55e', icon: '🛡️' }
};

export default function IndicatorCatalog() {
  const [filterDim, setFilterDim] = useState('ALL');
  const [filterScope, setFilterScope] = useState('ALL'); // ALL | CORE | EXTENSION
  const [search, setSearch] = useState('');

  const indicators = useMemo(() => {
    const all = Object.values(ALL_INDICATORS);
    return all
      .filter(i => filterDim === 'ALL' || i.dimension === filterDim)
      .filter(i => {
        if (filterScope === 'ALL') return true;
        if (filterScope === 'CORE') return i.informCore;
        return i.tanzaniaExtension;
      })
      .filter(i => {
        if (!search) return true;
        const q = search.toLowerCase();
        return i.name.toLowerCase().includes(q)
            || i.id.toLowerCase().includes(q)
            || (getIndicatorDescription(i.id)?.measures ?? '').toLowerCase().includes(q);
      });
  }, [filterDim, filterScope, search]);

  // Group by dimension → category → component for the readable layout
  const grouped = useMemo(() => {
    const out = {};
    for (const ind of indicators) {
      const dimId = ind.dimension;
      const catId = ind.category;
      const compId = ind.component;
      out[dimId] ??= { name: DIM_LABELS[dimId]?.name ?? dimId, categories: {} };
      const catName = COMPLETE_HIERARCHY[dimId]?.categories?.[catId]?.name ?? catId;
      out[dimId].categories[catId] ??= { name: catName, components: {} };
      const comp = ALL_COMPONENTS[compId];
      out[dimId].categories[catId].components[compId] ??= { name: comp?.name ?? compId, indicators: [] };
      out[dimId].categories[catId].components[compId].indicators.push(ind);
    }
    return out;
  }, [indicators]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>📖 INFORM Indicator Catalog</h1>
          <p style={styles.subtitle}>
            Authoritative reference for every indicator used in the Tanzania
            INFORM operational model. Descriptions sourced from the official
            INFORM Concept and Methodology v2017 (JRC, Vernaccini) plus
            Tanzania-specific operational guidance for subnational extensions.
          </p>
        </div>
      </div>

      <div style={styles.statsBar}>
        <Stat label="Dimensions" value={STATISTICS.dimensions} />
        <Stat label="Categories" value={STATISTICS.categories} />
        <Stat label="Components" value={STATISTICS.components} />
        <Stat label="Indicators" value={STATISTICS.indicators} />
        <Stat label="INFORM 2017 Core" value={STATISTICS.informCoreIndicators} color="#1e3a8a" />
        <Stat label="Tanzania Extensions" value={STATISTICS.tanzaniaExtensions} color="#92400e" />
        <Stat label="Filtered" value={indicators.length} color="#0369a1" />
      </div>

      <div style={styles.filters}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 Search by name, id, or description..."
          style={styles.search}
        />
        <select value={filterDim} onChange={(e) => setFilterDim(e.target.value)} style={styles.select}>
          <option value="ALL">All dimensions</option>
          {Object.entries(DIM_LABELS).map(([id, d]) => (
            <option key={id} value={id}>{d.icon} {d.name}</option>
          ))}
        </select>
        <select value={filterScope} onChange={(e) => setFilterScope(e.target.value)} style={styles.select}>
          <option value="ALL">All indicators</option>
          <option value="CORE">INFORM 2017 Core only</option>
          <option value="EXTENSION">Tanzania extensions only</option>
        </select>
      </div>

      {Object.entries(grouped).map(([dimId, dim]) => (
        <section key={dimId} style={{...styles.dimSection, borderColor: DIM_LABELS[dimId]?.color }}>
          <h2 style={{...styles.h2, color: DIM_LABELS[dimId]?.color }}>
            {DIM_LABELS[dimId]?.icon} {dim.name}
          </h2>
          {Object.entries(dim.categories).map(([catId, cat]) => (
            <div key={catId} style={styles.catBlock}>
              <h3 style={styles.h3}>{cat.name}</h3>
              {Object.entries(cat.components).map(([compId, comp]) => (
                <div key={compId} style={styles.compBlock}>
                  <h4 style={styles.h4}>{comp.name} <span style={styles.compCount}>({comp.indicators.length})</span></h4>
                  <div style={styles.indicatorList}>
                    {comp.indicators.map((ind) => {
                      const desc = getIndicatorDescription(ind.id);
                      return (
                        <div key={ind.id} style={styles.indicatorRow}>
                          <div style={styles.indicatorMain}>
                            <div style={styles.indicatorTitle}>
                              <strong>{ind.name}</strong>
                              <IndicatorGuide indicatorId={ind.id} />
                              <span style={ind.informCore ? styles.badgeCore : styles.badgeExt}>
                                {ind.informCore ? 'CORE' : 'EXT'}
                              </span>
                            </div>
                            <div style={styles.indicatorMeta}>
                              <span style={styles.metaItem}>📐 {ind.refMin}–{ind.refMax} {ind.unit}</span>
                              <span style={styles.metaItem}>
                                🧭 {ind.polarity === 'POSITIVE' ? 'Higher = less risk' : 'Higher = more risk'}
                              </span>
                              {ind.transform && ind.transform !== 'none' && (
                                <span style={styles.metaItem}>⚙️ {ind.transform}</span>
                              )}
                            </div>
                            {desc?.measures && <div style={styles.indicatorDesc}>{desc.measures}</div>}
                            {desc?.guidance && (
                              <div style={styles.indicatorGuidance}>
                                <strong>How to enter:</strong> {desc.guidance}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}

      {indicators.length === 0 && (
        <div style={styles.empty}>No indicators match the current filters.</div>
      )}
    </div>
  );
}

function Stat({ label, value, color = '#0f172a' }) {
  return (
    <div style={styles.stat}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' },
  header: { marginBottom: 20 },
  h1: { margin: 0, fontSize: 26, color: '#0f172a', fontWeight: 700 },
  subtitle: { margin: '6px 0 0', color: '#475569', fontSize: 14, maxWidth: 800 },
  statsBar: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12, marginBottom: 20
  },
  stat: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' },
  filters: {
    display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center'
  },
  search: {
    flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14
  },
  select: { padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, background: '#ffffff' },
  dimSection: {
    background: '#ffffff', borderTop: '4px solid #94a3b8',
    border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px', marginBottom: 18
  },
  h2: { margin: '0 0 12px', fontSize: 20 },
  catBlock: { marginBottom: 18 },
  h3: { margin: '0 0 8px', fontSize: 15, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: 4 },
  compBlock: { marginBottom: 14, paddingLeft: 12 },
  h4: { margin: '6px 0 6px', fontSize: 13, color: '#334155', fontWeight: 700 },
  compCount: { color: '#94a3b8', fontWeight: 500, marginLeft: 4 },
  indicatorList: { display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 14 },
  indicatorRow: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' },
  indicatorMain: { display: 'flex', flexDirection: 'column', gap: 6 },
  indicatorTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#0f172a' },
  indicatorMeta: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  metaItem: { fontSize: 11, color: '#64748b', fontFamily: 'SF Mono,Menlo,Consolas,monospace' },
  indicatorDesc: { fontSize: 13, color: '#1e293b', lineHeight: 1.4 },
  indicatorGuidance: {
    fontSize: 12, color: '#713f12', background: '#fef9c3',
    borderLeft: '3px solid #facc15', padding: '6px 10px', borderRadius: 4
  },
  badgeCore: {
    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
    background: '#dbeafe', color: '#1e3a8a', letterSpacing: 0.06
  },
  badgeExt: {
    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
    background: '#fef3c7', color: '#92400e', letterSpacing: 0.06
  },
  empty: { padding: 40, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }
};
