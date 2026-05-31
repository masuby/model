/**
 * RiskCharts — visualization panel below the map. Reacts to the active lens/
 * indicator and shows: the distribution of districts across risk classes, the
 * highest-scoring districts, and a regional comparison. Pure CSS/SVG (no chart
 * library) for a light bundle and full control over quality.
 */
import React, { useMemo } from 'react';
import { DISTRICTS, classifyRisk, round1 } from './riskModel';

const CLASSES = [
  { level: 'Very Low', color: 'var(--c-vlow)' },
  { level: 'Low', color: 'var(--c-low)' },
  { level: 'Medium', color: 'var(--c-med)' },
  { level: 'High', color: 'var(--c-high)' },
  { level: 'Very High', color: 'var(--c-vhigh)' },
];

function HBar({ label, sub, value, onClick }) {
  const cls = classifyRisk(value);
  const w = `${Math.max(2, Math.min(100, ((value ?? 0) / 10) * 100))}%`;
  return (
    <button className="rc-hbar" onClick={onClick} title={`${label}: ${round1(value) ?? '—'}`}>
      <span className="rc-hbar-label">
        <span className="rc-hbar-name">{label}</span>
        {sub && <span className="rc-hbar-sub">{sub}</span>}
      </span>
      <span className="rc-hbar-track"><i style={{ width: w, background: cls.color }} /></span>
      <span className="rc-hbar-val" style={{ color: cls.color }}>{round1(value) ?? '—'}</span>
    </button>
  );
}

export default function RiskCharts({ metric, onSelect }) {
  const rows = useMemo(
    () => DISTRICTS.map((d) => ({ d, v: metric.get(d) })).filter((x) => typeof x.v === 'number'),
    [metric]
  );

  const dist = useMemo(() => {
    const counts = Object.fromEntries(CLASSES.map((c) => [c.level, 0]));
    rows.forEach(({ v }) => { counts[classifyRisk(v).level] = (counts[classifyRisk(v).level] || 0) + 1; });
    const max = Math.max(1, ...Object.values(counts));
    return CLASSES.map((c) => ({ ...c, count: counts[c.level], pct: (counts[c.level] / max) * 100 }));
  }, [rows]);

  const top = useMemo(() => [...rows].sort((a, b) => b.v - a.v).slice(0, 10), [rows]);

  const regions = useMemo(() => {
    const byReg = {};
    rows.forEach(({ d, v }) => {
      const r = d.admin.adm1Name;
      (byReg[r] = byReg[r] || []).push(v);
    });
    return Object.entries(byReg)
      .map(([name, vs]) => ({ name, v: vs.reduce((s, x) => s + x, 0) / vs.length, n: vs.length }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 12);
  }, [rows]);

  return (
    <div className="rx-charts">
      {/* Distribution */}
      <div className="ui-card ui-card-pad rc-card">
        <div className="rc-title"><span className="ui-eyebrow">Distribution</span><span className="ui-muted">{rows.length} districts by {metric.label.toLowerCase()}</span></div>
        <div className="rc-dist">
          {dist.map((c) => (
            <div key={c.level} className="rc-dist-col">
              <span className="rc-dist-count">{c.count}</span>
              <span className="rc-dist-bar" style={{ height: `${Math.max(4, c.pct)}%`, background: c.color }} />
              <span className="rc-dist-label">{c.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top districts */}
      <div className="ui-card ui-card-pad rc-card">
        <div className="rc-title"><span className="ui-eyebrow">Highest districts</span><span className="ui-muted">top 10</span></div>
        <div className="rc-list">
          {top.map(({ d, v }) => (
            <HBar key={d.admin.adm2Code} label={d.admin.adm2Name} sub={d.admin.adm1Name} value={v} onClick={() => onSelect?.(d)} />
          ))}
        </div>
      </div>

      {/* Regional comparison */}
      <div className="ui-card ui-card-pad rc-card">
        <div className="rc-title"><span className="ui-eyebrow">By region</span><span className="ui-muted">average · top 12</span></div>
        <div className="rc-list">
          {regions.map((r) => (
            <HBar key={r.name} label={r.name} sub={`${r.n} districts`} value={r.v} />
          ))}
        </div>
      </div>
    </div>
  );
}
