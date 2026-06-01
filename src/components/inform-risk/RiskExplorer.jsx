/**
 * RiskExplorer — the district experience for the Risk module.
 * Choose a lens (overall risk / a dimension), then drill into any of that
 * dimension's indicators — via the dropdown or the visible indicator chips —
 * to colour the choropleth + ranked table by it. Click a district for its full
 * INFORM breakdown. Every value is authentic from the country model.
 */
import React, { useMemo, useState } from 'react';
import DistrictMap from './DistrictMap';
import RiskCharts from './RiskCharts';
import { DIMENSION_TREE, DIM_KEYS, getMetric, scopeOf, classifyRisk, round1, unitsForLevel, LEVELS } from './riskModel';
import './RiskExplorer.css';

const pct = (v) => `${Math.max(0, Math.min(100, ((v ?? 0) / 10) * 100))}%`;

function Bar({ value, label }) {
  const cls = classifyRisk(value);
  return (
    <div className="rx-bar-row" title={`${label}: ${round1(value) ?? '—'}`}>
      <span className="rx-bar-label">{label}</span>
      <span className="ui-bar" style={{ flex: 1 }}>
        <i style={{ '--val': pct(value), '--col': cls.color }} />
      </span>
      <span className="rx-bar-val">{round1(value) ?? '—'}</span>
    </div>
  );
}

function DistrictDetail({ d }) {
  if (!d) {
    return <div className="rx-detail-empty ui-muted">Select a district on the map or table to see its full INFORM profile.</div>;
  }
  const cls = classifyRisk(d.risk);
  const he = d.hazardExposure || {};
  const vu = d.vulnerability || {};
  const cc = d.lackCopingCapacity || {};
  const topHazards = DIMENSION_TREE.hazard.components[0].indicators
    .map((h) => ({ ...h, v: he.natural?.[h.k] }))
    .filter((h) => typeof h.v === 'number')
    .sort((a, b) => b.v - a.v)
    .slice(0, 4);

  return (
    <div className="rx-detail">
      <div className="rx-detail-head">
        <div>
          <div className="ui-eyebrow">{d.admin.adm1Name} Region · {d.admin.adm2Code}</div>
          <h3 className="ui-h2">{d.admin.adm2Name}</h3>
        </div>
        <div className="rx-detail-score" style={{ color: cls.color }}>
          {round1(d.risk)}
          <span className="ui-badge" style={{ background: cls.color }}>{cls.level}</span>
        </div>
      </div>

      <div className="rx-detail-grid">
        <div className="rx-dim ui-card ui-card-pad">
          <div className="rx-dim-head"><span>Hazard &amp; Exposure</span><b style={{ color: classifyRisk(he.total).color }}>{round1(he.total) ?? '—'}</b></div>
          <Bar value={he.natural?.aggregate} label="Natural" />
          <Bar value={he.human?.aggregate} label="Human" />
        </div>
        <div className="rx-dim ui-card ui-card-pad">
          <div className="rx-dim-head"><span>Vulnerability</span><b style={{ color: classifyRisk(vu.total).color }}>{round1(vu.total) ?? '—'}</b></div>
          <Bar value={vu.socioEconomic?.aggregate} label="Socio-economic" />
          <Bar value={vu.vulnerableGroups?.aggregate} label="Vulnerable groups" />
        </div>
        <div className="rx-dim ui-card ui-card-pad">
          <div className="rx-dim-head"><span>Lack of Coping</span><b style={{ color: classifyRisk(cc.total).color }}>{round1(cc.total) ?? '—'}</b></div>
          <Bar value={cc.infrastructure?.aggregate} label="Infrastructure" />
          <Bar value={cc.institutional?.aggregate} label="Institutional" />
        </div>
        <div className="rx-dim ui-card ui-card-pad">
          <div className="rx-dim-head"><span>Top hazards</span></div>
          {topHazards.length ? topHazards.map((h) => <Bar key={h.k} value={h.v} label={h.label} />)
            : <div className="ui-muted" style={{ fontSize: 'var(--fs-sm)' }}>No hazard data</div>}
        </div>
      </div>
    </div>
  );
}

const LENSES = [
  { key: 'risk', scope: 'risk', label: 'Overall INFORM Risk' },
  ...DIM_KEYS.map((k) => ({ key: `dim:${k}`, scope: k, label: DIMENSION_TREE[k].label })),
];

import { RISK_CLASSES as CATEGORIES } from './riskConstants';

export default function RiskExplorer() {
  const [level, setLevel] = useState('district');
  const [metricKey, setMetricKey] = useState('risk');
  const [selected, setSelected] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [classFilter, setClassFilter] = useState(null);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [tableOpen, setTableOpen] = useState(true);

  const metric = getMetric(metricKey);
  const activeScope = scopeOf(metricKey);
  const tree = activeScope !== 'risk' ? DIMENSION_TREE[activeScope] : null;
  const units = useMemo(() => unitsForLevel(level), [level]);
  const noun = LEVELS.find((l) => l.key === level)?.unitNoun || 'units';

  const changeLevel = (lv) => { setLevel(lv); setSelected(null); setClassFilter(null); setSelectedOnly(false); };

  const ranked = useMemo(() => {
    const rows = units.map((d) => ({ d, v: metric.get(d) }));
    rows.sort((a, b) => {
      const av = a.v ?? -1, bv = b.v ?? -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return rows;
  }, [units, metric, sortDir]);

  const filtered = useMemo(() => {
    if (selectedOnly && selected) return ranked.filter((r) => r.d.admin.adm2Code === selected.admin.adm2Code);
    return classFilter ? ranked.filter((r) => classifyRisk(r.v).level === classFilter) : ranked;
  }, [ranked, classFilter, selectedOnly, selected]);

  return (
    <div className="rx">
      {/* Level + lens + indicator selector */}
      <div className="rx-controls ui-card ui-card-pad">
        <div className="rx-level-row">
          <span className="ui-eyebrow">View at level</span>
          <select className="ui-select rx-level-select" value={level} onChange={(e) => changeLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
          <span className="ui-muted rx-level-count">{ranked.length} {noun}</span>
        </div>
        <div className="rx-controls-row">
          <span className="ui-eyebrow">Colour {noun} by</span>
          <div className="rx-chips">
            {LENSES.map((l) => (
              <button
                key={l.key}
                className={`ui-chip ${activeScope === l.scope ? 'is-active' : ''}`}
                onClick={() => setMetricKey(l.key)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {tree && (
          <div className="rx-indicators">
            <div className="rx-indicators-top">
              <span className="ui-eyebrow">{tree.label} indicators</span>
              <label className="rx-ind-pick">
                <span className="ui-muted">Show indicator:</span>
                <select className="ui-select" value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
                  <option value={`dim:${activeScope}`}>Whole {tree.label} (dimension)</option>
                  {tree.components.map((c) => (
                    <optgroup key={c.name} label={c.name}>
                      {c.indicators.map((ind) => (
                        <option key={ind.k} value={`ind:${activeScope}:${ind.k}`}>{ind.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
            {/* Visible, clickable indicator list grouped by component */}
            {tree.components.map((c) => (
              <div key={c.name} className="rx-ind-group">
                <span className="rx-ind-group-name">{c.name}</span>
                <div className="rx-ind-chips">
                  {c.indicators.map((ind) => {
                    const key = `ind:${activeScope}:${ind.k}`;
                    return (
                      <button
                        key={ind.k}
                        className={`rx-ind-chip ${metricKey === key ? 'is-active' : ''}`}
                        onClick={() => setMetricKey(key)}
                      >
                        {ind.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category filter (map + table) */}
      <div className="rx-catbar ui-card ui-card-pad">
        <span className="ui-eyebrow">View</span>
        <div className="rx-cats">
          <button className={`rx-cat ${!classFilter && !selectedOnly ? 'is-active' : ''}`} onClick={() => { setClassFilter(null); setSelectedOnly(false); }}>
            All <span className="rx-cat-n">{ranked.length}</span>
          </button>
          <button
            className={`rx-cat rx-cat-sel ${selectedOnly ? 'is-active' : ''}`}
            disabled={!selected}
            title={selected ? `Show only ${selected.admin.adm2Name}` : 'Select a unit on the map or table first'}
            onClick={() => { setSelectedOnly((s) => !s); setClassFilter(null); }}
          >
            ★ Selected{selected ? `: ${selected.admin.adm2Name}` : ''}
          </button>
          {CATEGORIES.map((c) => {
            const n = ranked.filter((r) => classifyRisk(r.v).level === c.level).length;
            const on = classFilter === c.level && !selectedOnly;
            return (
              <button
                key={c.level}
                className={`rx-cat ${on ? 'is-active' : ''}`}
                style={on ? { background: c.color, borderColor: c.color, color: '#fff' } : { borderColor: c.color }}
                onClick={() => { setClassFilter(on ? null : c.level); setSelectedOnly(false); }}
              >
                <span className="rx-cat-dot" style={{ background: c.color }} />
                {c.level} <span className="rx-cat-n">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wide map */}
      <div className="rx-map-wrap ui-card">
        <DistrictMap
          metric={metric} selected={selected} onSelect={setSelected}
          filterClass={selectedOnly ? null : classFilter} level={level}
          isolateKey={selectedOnly && selected ? selected.admin.adm2Code : null}
        />
      </div>

      {/* Wide table */}
      <div className="rx-table-wrap ui-card">
        <div className="rx-table-head">
          <span className="ui-muted rx-table-count">{filtered.length} {noun}</span>
          <div className="rx-table-actions">
            {tableOpen && (
              <button className="ui-chip" onClick={() => setSortDir((s) => (s === 'desc' ? 'asc' : 'desc'))}>
                {sortDir === 'desc' ? 'High → Low' : 'Low → High'}
              </button>
            )}
            <button className="ui-chip" onClick={() => setTableOpen((o) => !o)}>
              {tableOpen ? 'Hide table ▲' : 'Show table ▼'}
            </button>
          </div>
        </div>
        {tableOpen && (
        <div className="rx-table-scroll">
          <table className="ui-table">
            <thead>
              <tr>
                <th>#</th><th>{level === 'region' ? 'Region' : level === 'national' ? 'Area' : 'District'}</th><th>Region</th><th>{metric.label}</th>
                <th>Hazard</th><th>Vulnerability</th><th>Coping</th><th>Class</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ d, v }, i) => {
                const cls = classifyRisk(v);
                const isSel = selected && selected.admin.adm2Code === d.admin.adm2Code;
                const cell = (x) => <td className="rx-td-num">{round1(x) ?? '—'}</td>;
                return (
                  <tr key={d.admin.adm2Code} className={isSel ? 'is-selected' : ''} onClick={() => setSelected(d)}>
                    <td className="ui-muted">{i + 1}</td>
                    <td className="rx-td-name">{d.admin.adm2Name}</td>
                    <td className="ui-muted">{d.admin.adm1Name}</td>
                    <td><b style={{ color: cls.color }}>{round1(v) ?? '—'}</b></td>
                    {cell(d.hazardExposure?.total)}
                    {cell(d.vulnerability?.total)}
                    {cell(d.lackCopingCapacity?.total)}
                    <td><span className="ui-badge" style={{ background: cls.color }}>{cls.level}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <RiskCharts metric={metric} selected={selected} />

      <div className="rx-detail-wrap ui-card ui-card-pad">
        <DistrictDetail d={selected} />
      </div>
    </div>
  );
}
