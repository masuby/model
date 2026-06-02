/**
 * DataEntry — edit the INFORM model and feed it into the whole system, the AUTHENTIC way.
 *  • PMO / Admin: edits apply directly.   • Sector officer: edits need PMO approval.
 * Edit any dimension's score, or expand it to fill individual indicators
 * (Hazard / Vulnerability / Coping), PLUS the population Exposure that drives the
 * flood Hazard×Exposure. Aggregation mirrors the Excel exactly:
 *   indicator → category : arithmetic MEAN
 *   category  → dimension : INFORM scaled GEOMEAN (Box 6)
 *   dimension → risk      : ∛(H × V × LCC)
 * Every edit is stamped with the responsible authority (NBS, TMA, MoW, MoH, MoA,
 * PMO-DMD, DRR Coordinator, MUCHALI/IPC) and shown when viewing the indicator.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { COUNCIL_UNITS, DIMENSION_TREE, DIM_KEYS, classifyRisk, round1 } from '../inform-risk/riskModel';
import { AUTHORITIES } from '../inform-risk/indicatorSources';
import { saveDirect, submit, getPending, approve, reject, resetAll, getOverrides } from '../inform-risk/overrideStore';
import './DataEntry.css';

// Data Entry speaks the real NBS-2022 structure: 31 regions → 195 councils. Each council's data
// comes from an underlying INFORM source (170) unit; edits are keyed by that source so they flow
// through the single data backbone to every council that shares it (we never fabricate splits).
const REGIONS = [...new Set(COUNCIL_UNITS.map((c) => c.admin.adm1Name))].sort();
const TOTAL_KEY = { hazard: 'hazard', vulnerability: 'vuln', coping: 'cope' };
const AUTH_OPTIONS = Object.entries(AUTHORITIES).filter(([k]) => k !== 'INFORM' && k !== 'CHC').map(([k, v]) => ({ k, ...v }));
const DEFAULT_AUTH = { pmo: 'PMO', sector: 'MOW' };

const cbrt = (h, v, c) => ([h, v, c].every((x) => typeof x === 'number') ? round1(Math.cbrt(h * v * c)) : null);
const meanOf = (xs) => { const a = xs.filter((x) => typeof x === 'number'); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
// INFORM scaled geometric mean (Excel Box 6) — category → dimension.
const sgm = (a) => { const xs = a.filter((x) => typeof x === 'number' && isFinite(x)); if (!xs.length) return null; const sc = xs.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.exp(sc.reduce((s, x) => s + Math.log(x), 0) / sc.length)) / 9 * 10; };
function recomputeDim(dim, ind) {
  const aggs = DIMENSION_TREE[dim].components
    .map((c) => meanOf(c.indicators.map((i) => ind[`${dim}:${i.k}`])))
    .filter((x) => x != null);
  return aggs.length ? round1(sgm(aggs)) : null;   // category=MEAN above, dimension=scaled GEOMEAN
}

export default function DataEntry() {
  const [role, setRole] = useState('pmo');
  const [region, setRegion] = useState(REGIONS[0]);
  const councils = useMemo(() => COUNCIL_UNITS.filter((c) => c.admin.adm1Name === region), [region]);
  const [code, setCode] = useState(councils[0]?.admin.adm2Code);
  const unit = councils.find((c) => c.admin.adm2Code === code) || councils[0];
  // Edits are keyed by the underlying INFORM source (170) unit so they flow through the data backbone
  // to every council sharing it — and to the district/region/national views and charts.
  const editCode = unit?._srcCode;
  const siblings = useMemo(
    () => (editCode ? COUNCIL_UNITS.filter((c) => c._srcCode === editCode && c.admin.adm2Code !== code) : []),
    [editCode, code]
  );

  const [vals, setVals] = useState({ hazard: null, vuln: null, cope: null });
  const [ind, setInd] = useState({});
  const [exposure, setExposure] = useState(null);
  const [auth, setAuth] = useState('PMO');
  const [touched, setTouched] = useState({});
  const [open, setOpen] = useState('');
  const [by, setBy] = useState('');
  const [pending, setPending] = useState(getPending());
  const [needsApply, setNeedsApply] = useState(false);
  const [flash, setFlash] = useState('');

  useEffect(() => { if (!councils.find((c) => c.admin.adm2Code === code)) setCode(councils[0]?.admin.adm2Code); }, [region]); // eslint-disable-line
  useEffect(() => { setAuth(DEFAULT_AUTH[role] || 'PMO'); }, [role]);

  useEffect(() => {
    if (!unit) return;
    setVals({ hazard: round1(unit.hazardExposure?.total), vuln: round1(unit.vulnerability?.total), cope: round1(unit.lackCopingCapacity?.total) });
    const m = {};
    for (const dim of DIM_KEYS) for (const c of DIMENSION_TREE[dim].components) for (const i of c.indicators) {
      const v = c.path(unit)?.[i.k];
      if (typeof v === 'number') m[`${dim}:${i.k}`] = round1(v);
    }
    setInd(m);
    setExposure(round1(unit.hazardExposure?.exposure?.index));
    setTouched({});
  }, [code, unit]);

  const liveRisk = cbrt(vals.hazard, vals.vuln, vals.cope);
  const liveClass = classifyRisk(liveRisk);
  const note = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3500); };

  const onIndChange = (dim, k, raw) => {
    const val = raw === '' ? null : Number(raw);
    const next = { ...ind, [`${dim}:${k}`]: val };
    setInd(next); setTouched((t) => ({ ...t, [`${dim}:${k}`]: true }));
    const total = recomputeDim(dim, next);
    if (total != null) setVals((s) => ({ ...s, [TOTAL_KEY[dim]]: total }));
  };

  // Exposure edit → flood Hazard×Exposure = √(hazardFreq.flood × max(E,2)), then hazard recompute.
  const hazardFreqFlood = unit?.hazardExposure?.hazardFreq?.flood;
  const onExposureChange = (raw) => {
    const e = raw === '' ? null : Number(raw);
    setExposure(e); setTouched((t) => ({ ...t, exposure: true }));
    if (typeof e === 'number' && typeof hazardFreqFlood === 'number') {
      // exposure amplifies only; never below the documented/observed flood hazard
      const flood = Math.max(hazardFreqFlood, Math.sqrt(hazardFreqFlood * Math.max(e, 0)));
      const next = { ...ind, 'hazard:flood': round1(flood) };
      setInd(next); setTouched((t) => ({ ...t, 'hazard:flood': true }));
      const total = recomputeDim('hazard', next);
      if (total != null) setVals((s) => ({ ...s, hazard: total }));
    }
  };

  const payload = () => {
    const indSrc = {};
    for (const k of Object.keys(touched)) if (k !== 'exposure' && k in ind) indSrc[k] = { by: auth, ts: Date.now() };
    const out = { hazard: vals.hazard, vuln: vals.vuln, cope: vals.cope, ind };
    if (Object.keys(indSrc).length) out.indSrc = indSrc;
    if (touched.exposure && typeof exposure === 'number') { out.exposure = exposure; out.expSrc = { by: auth, ts: Date.now() }; }
    return out;
  };
  const onSave = () => {
    if (!unit || !editCode) return;
    const stamp = `${AUTHORITIES[auth]?.label || auth}${by ? ' — ' + by : ''}`;
    if (role === 'pmo') { saveDirect(editCode, payload(), stamp); setNeedsApply(true); note(`Saved ${unit.admin.adm2Name}. Apply to see it on the map.`); }
    else { submit({ code: editCode, name: unit.admin.adm2Name, region, ...payload(), by: stamp }); setPending(getPending()); note(`Submitted ${unit.admin.adm2Name} for PMO approval.`); }
  };
  const onApprove = (id) => { approve(id); setPending(getPending()); setNeedsApply(true); note('Approved & applied.'); };
  const onReject = (id) => { reject(id); setPending(getPending()); note('Rejected.'); };
  const onReset = () => { if (confirm('Remove all local edits and pending submissions?')) { resetAll(); setPending([]); setNeedsApply(true); note('All edits cleared.'); } };

  const exp = unit?.hazardExposure?.exposure;

  return (
    <div className="de">
      <header className="de-head ui-card ui-card-pad">
        <div>
          <div className="ui-eyebrow">INFORM model · data entry</div>
          <h1 className="ui-h1">Edit & approve INFORM data</h1>
          <p className="ui-muted">Set a dimension score, or expand it to fill indicators — Hazard, <strong>Exposure</strong>, Vulnerability, Coping. Aggregation follows the Excel: indicator→category mean, category→dimension scaled geometric mean, risk = ∛(H×V×LCC). Every edit is stamped with its source.</p>
        </div>
        <div className="de-role">
          <span className="ui-eyebrow">I am</span>
          <div className="de-role-btns">
            <button className={`ui-chip ${role === 'pmo' ? 'is-active' : ''}`} onClick={() => setRole('pmo')}>PMO / Admin</button>
            <button className={`ui-chip ${role === 'sector' ? 'is-active' : ''}`} onClick={() => setRole('sector')}>Sector officer</button>
          </div>
        </div>
      </header>

      {needsApply && (
        <div className="de-apply ui-card ui-card-pad">
          <span>Edits saved. <strong>Apply</strong> to push them across the system (map, charts, tables).</span>
          <button className="ui-btn-primary" onClick={() => window.location.reload()}>Apply across the system ↻</button>
        </div>
      )}
      {flash && <div className="de-flash">{flash}</div>}

      <div className="de-grid">
        <div className="de-editor ui-card ui-card-pad">
          <div className="de-pickers">
            <label className="de-field"><span className="de-field-label">Region</span>
              <select value={region} onChange={(e) => setRegion(e.target.value)}>{REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            </label>
            <label className="de-field"><span className="de-field-label">Council / LGA</span>
              <select value={code} onChange={(e) => setCode(e.target.value)}>{councils.map((c) => <option key={c.admin.adm2Code} value={c.admin.adm2Code}>{c.admin.adm2Name}{c._inherited ? ' ↳ inherits ' + c._inherited : ''}</option>)}</select>
            </label>
          </div>
          {unit && (
            <p className="de-srcnote ui-muted">
              Editing INFORM source unit <strong>{unit._srcName}</strong>
              {unit._inherited ? ` · ${unit.admin.adm2Name} inherits ${unit._inherited}'s data` : ''}
              {siblings.length ? ` · shared with ${siblings.map((s) => s.admin.adm2Name).join(', ')} — an edit updates ${siblings.length === 1 ? 'it' : 'them'} too` : ''}
            </p>
          )}

          {DIM_KEYS.map((dim) => {
            const tree = DIMENSION_TREE[dim];
            const tk = TOTAL_KEY[dim];
            return (
              <div key={dim} className="de-dim">
                <div className="de-dim-head">
                  <span className="de-dim-name">{tree.label}</span>
                  <input className="de-dim-total" type="number" min="0" max="10" step="0.1" value={vals[tk] ?? ''}
                    onChange={(e) => { setVals((s) => ({ ...s, [tk]: e.target.value === '' ? null : Number(e.target.value) })); setTouched((t) => ({ ...t, [`${dim}:_total`]: true })); }} />
                  <button className="ui-chip de-dim-toggle" onClick={() => setOpen(open === dim ? '' : dim)}>
                    {open === dim ? 'Hide indicators' : 'Fill indicators'}
                  </button>
                </div>
                {open === dim && tree.components.map((c) => (
                  <div key={c.name} className="de-comp">
                    <span className="de-comp-name">{c.name}</span>
                    <div className="de-ind-grid">
                      {c.indicators.map((i) => {
                        const ikey = `${dim}:${i.k}`;
                        const noData = ind[ikey] == null;
                        return (
                          <label key={i.k} className={`de-ind ${noData ? 'is-nodata' : ''}`}>
                            <span className="de-ind-label">{i.label}{noData && <em className="de-nodata"> · no data</em>}</span>
                            <div className="de-ind-input">
                              <input type="number" min="0" max="10" step="0.1" placeholder="— no data" value={ind[ikey] ?? ''}
                                onChange={(e) => onIndChange(dim, i.k, e.target.value)} />
                              <button type="button" className="de-clear" title="Set to NO DATA (null — excluded from the INFORM calculation, not treated as 0)"
                                onClick={() => onIndChange(dim, i.k, '')} disabled={noData}>∅</button>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {dim === 'hazard' && (
                  <div className="de-exposure">
                    <div className="de-exposure-row">
                      <span className="de-exposure-label">Exposure · population</span>
                      <input className="de-dim-total" type="number" min="0" max="10" step="0.1" value={exposure ?? ''} onChange={(e) => onExposureChange(e.target.value)} />
                    </div>
                    <span className="ui-muted de-exposure-hint">
                      {exp ? `${exp.population?.toLocaleString()} people · ${exp.density}/km² (NBS 2022)` : 'population exposure index 0–10'} → drives flood = √(hazard × exposure)
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <div className="de-preview">
            <span className="ui-muted">Computed INFORM Risk = ∛(H × V × LCC)</span>
            <div className="de-risk" style={{ color: liveClass.color }}>{liveRisk ?? '—'} <span className="ui-badge" style={{ background: liveClass.color }}>{liveClass.level}</span></div>
          </div>

          <div className="de-actions">
            <label className="de-field de-auth"><span className="de-field-label">Data source / authority</span>
              <select value={auth} onChange={(e) => setAuth(e.target.value)}>{AUTH_OPTIONS.map((a) => <option key={a.k} value={a.k}>{a.label} — {a.full}</option>)}</select>
            </label>
            <input className="de-by" placeholder="Your name (optional)" value={by} onChange={(e) => setBy(e.target.value)} />
            <button className="ui-btn-primary" onClick={onSave}>{role === 'pmo' ? 'Save (apply directly)' : 'Submit for approval'}</button>
          </div>
          {editCode && getOverrides()[editCode] && <div className="de-edited ui-muted">✎ This council's INFORM source unit has a saved edit.</div>}
        </div>

        <div className="de-queue ui-card ui-card-pad">
          <div className="de-queue-head"><h3 className="ui-h3">Approval queue</h3>
            <span className="ui-badge" style={{ background: pending.length ? '#FF9800' : '#94a3b8' }}>{pending.length} pending</span></div>
          {!pending.length && <p className="ui-muted">No submissions awaiting approval.</p>}
          {pending.map((e) => (
            <div key={e.id} className="de-pend">
              <div>
                <div className="de-pend-name">{e.name} <span className="ui-muted">({e.region})</span></div>
                <div className="ui-muted de-pend-vals">H {round1(e.hazard)} · V {round1(e.vuln)} · C {round1(e.cope)} → Risk {cbrt(e.hazard, e.vuln, e.cope)} · {e.by}</div>
              </div>
              {role === 'pmo'
                ? <div className="de-pend-btns"><button className="ui-chip" onClick={() => onApprove(e.id)}>Approve</button><button className="ui-chip" onClick={() => onReject(e.id)}>Reject</button></div>
                : <span className="ui-muted">awaiting PMO</span>}
            </div>
          ))}
          <button className="de-reset ui-muted" onClick={onReset}>Reset all local edits</button>
        </div>
      </div>

      <p className="de-foot ui-muted">Edits flow into the map, charts and tables. Aggregation matches the INFORM Excel; see the methodology manual for the standardization & formulas. Cross-device persistence connects to the Supabase backend.</p>
    </div>
  );
}
