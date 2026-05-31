/**
 * RiskExplorer — the redesigned district experience for the Risk module.
 * One harmonized view: choose a lens (overall risk / dimension / hazard type),
 * see it on the ADM2 choropleth, ranked in a sortable table, and drill into any
 * district's full INFORM breakdown. All values authentic from the country model.
 */
import React, { useMemo, useState } from 'react';
import DistrictMap from './DistrictMap';
import { DISTRICTS, METRICS, HAZARDS, getMetric, classifyRisk, round1 } from './riskModel';
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
  const topHazards = HAZARDS
    .map((h) => ({ ...h, v: he.natural?.[h.key] }))
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
          {topHazards.length ? topHazards.map((h) => <Bar key={h.key} value={h.v} label={`${h.icon} ${h.label}`} />)
            : <div className="ui-muted" style={{ fontSize: 'var(--fs-sm)' }}>No hazard data</div>}
        </div>
      </div>
    </div>
  );
}

export default function RiskExplorer() {
  const [metricKey, setMetricKey] = useState('risk');
  const [selected, setSelected] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const metric = getMetric(metricKey);

  const ranked = useMemo(() => {
    const rows = DISTRICTS.map((d) => ({ d, v: metric.get(d) }));
    rows.sort((a, b) => {
      const av = a.v ?? -1, bv = b.v ?? -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return rows;
  }, [metric, sortDir]);

  const primary = METRICS.filter((m) => m.group !== 'Hazard type');

  return (
    <div className="rx">
      {/* Lens selector */}
      <div className="rx-controls ui-card ui-card-pad">
        <div className="rx-controls-row">
          <span className="ui-eyebrow">Colour districts by</span>
          <div className="rx-chips">
            {primary.map((m) => (
              <button key={m.key} className={`ui-chip ${metricKey === m.key ? 'is-active' : ''}`} onClick={() => setMetricKey(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
          <label className="rx-hazard-pick">
            <span className="ui-eyebrow">or hazard type</span>
            <select
              className="ui-select"
              value={metricKey.startsWith('hz:') ? metricKey : ''}
              onChange={(e) => e.target.value && setMetricKey(e.target.value)}
            >
              <option value="">— pick a hazard —</option>
              {HAZARDS.map((h) => (
                <option key={h.key} value={`hz:${h.key}`}>{h.icon} {h.label}</option>
              ))}
            </select>
          </label>
        </div>
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

      <div className="rx-detail-wrap ui-card ui-card-pad">
        <DistrictDetail d={selected} />
      </div>
    </div>
  );
}
