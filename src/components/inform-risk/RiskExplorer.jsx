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
import { DISTRICTS, DIMENSION_TREE, DIM_KEYS, getMetric, scopeOf, classifyRisk, round1 } from './riskModel';
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

export default function RiskExplorer() {
  const [metricKey, setMetricKey] = useState('risk');
  const [selected, setSelected] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const metric = getMetric(metricKey);
  const activeScope = scopeOf(metricKey);
  const tree = activeScope !== 'risk' ? DIMENSION_TREE[activeScope] : null;

  const ranked = useMemo(() => {
    const rows = DISTRICTS.map((d) => ({ d, v: metric.get(d) }));
    rows.sort((a, b) => {
      const av = a.v ?? -1, bv = b.v ?? -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return rows;
  }, [metric, sortDir]);

  return (
    <div className="rx">
      {/* Lens + indicator selector */}
      <div className="rx-controls ui-card ui-card-pad">
        <div className="rx-controls-row">
          <span className="ui-eyebrow">Colour districts by</span>
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

      <div className="rx-main">
        <div className="rx-map-wrap ui-card">
          <DistrictMap metric={metric} selected={selected} onSelect={setSelected} />
        </div>

        <div className="rx-table-wrap ui-card">
          <div className="rx-table-head">
            <span className="ui-eyebrow">Districts ranked by {metric.label.toLowerCase()}</span>
            <button className="ui-chip" onClick={() => setSortDir((s) => (s === 'desc' ? 'asc' : 'desc'))}>
              {sortDir === 'desc' ? 'High → Low' : 'Low → High'}
            </button>
          </div>
          <div className="rx-table-scroll">
            <table className="ui-table">
              <thead>
                <tr><th>#</th><th>District</th><th>{metric.label}</th><th>Class</th></tr>
              </thead>
              <tbody>
                {ranked.map(({ d, v }, i) => {
                  const cls = classifyRisk(v);
                  const isSel = selected && selected.admin.adm2Code === d.admin.adm2Code;
                  return (
                    <tr key={d.admin.adm2Code} className={isSel ? 'is-selected' : ''} onClick={() => setSelected(d)}>
                      <td className="ui-muted">{i + 1}</td>
                      <td>
                        <div className="rx-td-name">{d.admin.adm2Name}</div>
                        <div className="rx-td-region ui-muted">{d.admin.adm1Name}</div>
                      </td>
                      <td><b style={{ color: cls.color }}>{round1(v) ?? '—'}</b></td>
                      <td><span className="ui-badge" style={{ background: cls.color }}>{cls.level}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RiskCharts metric={metric} />

      <div className="rx-detail-wrap ui-card ui-card-pad">
        <DistrictDetail d={selected} />
      </div>
    </div>
  );
}
