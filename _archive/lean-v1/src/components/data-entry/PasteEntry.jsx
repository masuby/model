/**
 * PasteEntry - bulk "copy-paste per indicator" entry. Sectors return a 0-10 score per indicator per unit;
 * here you pick ONE indicator, choose the level (Council / Region / Nation), and paste a column of values
 * (straight from Excel: "Name <tab/comma> value", one per line). Each value is set on that indicator, the
 * dimension is recomputed exactly as the Excel (indicator->category mean, category->dimension scaled
 * geomean), and saved per the underlying INFORM source unit. PMO applies directly; Sector submits for approval.
 */
import React, { useMemo, useState } from 'react';
import { COUNCIL_UNITS, DIMENSION_TREE, DIM_KEYS, round1 } from '../inform-risk/riskModel';
import { AUTHORITIES } from '../inform-risk/indicatorSources';
import { saveDirect, submit, getOverrides } from '../inform-risk/overrideStore';

const TOTAL_KEY = { hazard: 'hazard', vulnerability: 'vuln', coping: 'cope' };
const meanOf = (xs) => { const a = xs.filter((x) => typeof x === 'number'); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
const sgm = (a) => { const xs = a.filter((x) => typeof x === 'number' && isFinite(x)); if (!xs.length) return null; const sc = xs.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.pow(sc.reduce((p, x) => p * x, 1), 1 / sc.length)) / 9 * 10; };
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const INDICATORS = [];
for (const dim of DIM_KEYS) for (const c of DIMENSION_TREE[dim].components) for (const i of c.indicators)
  INDICATORS.push({ key: `${dim}:${i.k}`, dim, label: i.label, comp: c.name, dimLabel: DIMENSION_TREE[dim].label });
const REGIONS = [...new Set(COUNCIL_UNITS.map((c) => c.admin.adm1Name))].sort();
const AUTH_OPTIONS = Object.entries(AUTHORITIES).filter(([k]) => k !== 'INFORM' && k !== 'CHC').map(([k, v]) => ({ k, ...v }));

function unitIndMap(unit, ovr) {
  const m = {};
  for (const dim of DIM_KEYS) for (const c of DIMENSION_TREE[dim].components) for (const i of c.indicators) {
    const v = c.path(unit)?.[i.k]; if (typeof v === 'number') m[`${dim}:${i.k}`] = round1(v);
  }
  return { ...m, ...(ovr?.ind || {}) };
}
function recomputeDim(dim, ind) {
  const aggs = DIMENSION_TREE[dim].components.map((c) => meanOf(c.indicators.map((i) => ind[`${dim}:${i.k}`]))).filter((x) => x != null);
  return aggs.length ? round1(sgm(aggs)) : null;
}

export default function PasteEntry({ role, onSaved }) {
  const [indKey, setIndKey] = useState(INDICATORS[0].key);
  const [level, setLevel] = useState('council');
  const [text, setText] = useState('');
  const [auth, setAuth] = useState(role === 'pmo' ? 'PMO' : 'MOW');
  const [result, setResult] = useState(null);
  const ind = INDICATORS.find((i) => i.key === indKey) || INDICATORS[0];
  const byCouncil = useMemo(() => { const m = {}; COUNCIL_UNITS.forEach((c) => { m[norm(c.admin.adm2Name)] = c; }); return m; }, []);

  function parse() {
    const rows = [];
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim(); if (!t) continue;
      let parts = t.split(/[\t,;|]+/).map((x) => x.trim()).filter(Boolean);
      if (parts.length === 1) { const m = t.match(/^(.*?)[\s]+([\d.]+)$/); if (m) parts = [m[1].trim(), m[2]]; }
      let value, name;
      if (parts.length >= 2) { value = Number(parts[parts.length - 1]); name = parts.slice(0, -1).join(' '); }
      else { value = Number(parts[0]); name = ''; }
      if (!isFinite(value)) continue;
      rows.push({ name, value: Math.max(0, Math.min(10, value)) });
    }
    return rows;
  }

  function apply() {
    const rows = parse();
    if (!rows.length) { setResult({ rows: 0, applied: 0, unmatched: [], err: 'Nothing to parse - paste values first.' }); return; }
    const stamp = `${AUTHORITIES[auth]?.label || auth} (paste)`;
    const targets = []; const unmatched = [];
    if (level === 'nation') {
      const v = rows[0].value; COUNCIL_UNITS.forEach((c) => targets.push({ unit: c, value: v }));
    } else if (level === 'region') {
      rows.forEach((r) => { const reg = REGIONS.find((R) => norm(R) === norm(r.name)); if (reg) COUNCIL_UNITS.filter((c) => c.admin.adm1Name === reg).forEach((c) => targets.push({ unit: c, value: r.value })); else unmatched.push(r.name || '(no name)'); });
    } else { // council; if no names given, match positionally in the council order
      const named = rows.some((r) => r.name);
      if (named) rows.forEach((r) => { const u = byCouncil[norm(r.name)]; if (u) targets.push({ unit: u, value: r.value }); else unmatched.push(r.name || '(no name)'); });
      else rows.forEach((r, i) => { if (COUNCIL_UNITS[i]) targets.push({ unit: COUNCIL_UNITS[i], value: r.value }); });
    }
    const seen = new Set(); let applied = 0; const ovrs = getOverrides();
    for (const { unit, value } of targets) {
      const src = unit._srcCode; if (!src || seen.has(src)) continue; seen.add(src);
      const cur = ovrs[src];
      const indMap = unitIndMap(unit, cur); indMap[indKey] = round1(value);
      const total = recomputeDim(ind.dim, indMap);
      const payload = { ind: indMap, indSrc: { ...(cur?.indSrc || {}), [indKey]: { by: auth, ts: Date.now() } } };
      if (total != null) payload[TOTAL_KEY[ind.dim]] = total;
      if (role === 'pmo') saveDirect(src, payload, stamp);
      else submit({ code: src, name: unit._srcName || unit.admin.adm2Name, region: unit.admin.adm1Name, ...payload, by: stamp });
      applied++;
    }
    setResult({ rows: rows.length, applied, unmatched });
    if (applied && onSaved) onSaved();
  }

  return (
    <div className="pe ui-card ui-card-pad">
      <div className="pe-row">
        <label className="de-field"><span className="de-field-label">Indicator</span>
          <select value={indKey} onChange={(e) => setIndKey(e.target.value)}>
            {INDICATORS.map((i) => <option key={i.key} value={i.key}>{i.dimLabel} · {i.comp} · {i.label}</option>)}
          </select>
        </label>
        <label className="de-field"><span className="de-field-label">Paste level</span>
          <div className="pe-levels">
            {['council', 'region', 'nation'].map((L) => (
              <button key={L} className={`ui-chip ${level === L ? 'is-active' : ''}`} onClick={() => setLevel(L)}>{L[0].toUpperCase() + L.slice(1)}</button>
            ))}
          </div>
        </label>
        <label className="de-field de-auth"><span className="de-field-label">Source / authority</span>
          <select value={auth} onChange={(e) => setAuth(e.target.value)}>{AUTH_OPTIONS.map((a) => <option key={a.k} value={a.k}>{a.full} ({a.label})</option>)}</select>
        </label>
      </div>

      <p className="ui-muted pe-hint">
        Paste a 0-10 score per line. {level === 'nation'
          ? 'Nation: one value applies to every council.'
          : `Format: "${level === 'region' ? 'Region' : 'Council'} name, value" (tab or comma). ${level === 'council' ? 'Values-only is allowed and matched in council order.' : 'Each region\'s value applies to all its councils.'}`}
      </p>
      <textarea className="pe-text" rows={12} value={text} placeholder={level === 'nation' ? '5.4' : (level === 'region' ? 'Dodoma, 6.2\nArusha, 4.1\n...' : 'Kondoa, 6.5\nMpwapwa, 5.8\n...')}
        onChange={(e) => setText(e.target.value)} />

      <div className="pe-actions">
        <span className="ui-muted">{parse().length} value{parse().length === 1 ? '' : 's'} ready · {ind.dimLabel}</span>
        <button className="ui-btn-primary" onClick={apply}>{role === 'pmo' ? 'Apply across units' : 'Submit for approval'}</button>
      </div>

      {result && (
        <div className={`pe-result ${result.err ? 'is-err' : ''}`}>
          {result.err ? result.err : (<>
            <strong>{result.applied}</strong> source unit{result.applied === 1 ? '' : 's'} {role === 'pmo' ? 'updated' : 'submitted'} from {result.rows} pasted value{result.rows === 1 ? '' : 's'}.
            {role === 'pmo' && result.applied > 0 && ' Use “Apply across the system” to push to the map.'}
            {result.unmatched.length > 0 && <div className="pe-unmatched">Unmatched names ({result.unmatched.length}): {result.unmatched.slice(0, 8).join(', ')}{result.unmatched.length > 8 ? ' …' : ''}</div>}
          </>)}
        </div>
      )}
    </div>
  );
}
