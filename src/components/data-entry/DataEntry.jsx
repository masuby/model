/**
 * DataEntry — edit the INFORM model and feed it into the whole system.
 *  • PMO / Admin: edits apply directly.   • Sector officer: edits need PMO approval.
 * Edit each dimension's score directly, or expand it to fill its individual
 * indicators (Hazard/Vulnerability/Coping) — the dimension total recomputes as the
 * mean of its indicators and risk as ∛(H × V × LCC). After "Apply", edits flow into
 * the map (incl. the indicator lens), charts and tables. Persistence is this browser
 * (localStorage); cross-device multi-user is the Supabase backend (supabase/setup.sql).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { DISTRICTS, DIMENSION_TREE, DIM_KEYS, classifyRisk, round1 } from '../inform-risk/riskModel';
import { saveDirect, submit, getPending, approve, reject, resetAll, getOverrides } from '../inform-risk/overrideStore';
import './DataEntry.css';

const REGIONS = [...new Set(DISTRICTS.map((d) => d.admin.adm1Name))].sort();
const TOTAL_KEY = { hazard: 'hazard', vulnerability: 'vuln', coping: 'cope' };
const cbrt = (h, v, c) => ([h, v, c].every((x) => typeof x === 'number') ? round1(Math.cbrt(h * v * c)) : null);

const meanOf = (xs) => { const a = xs.filter((x) => typeof x === 'number'); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
function recomputeDim(dim, ind) {
  const aggs = DIMENSION_TREE[dim].components
    .map((c) => meanOf(c.indicators.map((i) => ind[`${dim}:${i.k}`])))
    .filter((x) => x != null);
  return aggs.length ? round1(meanOf(aggs)) : null;
}

export default function DataEntry() {
  const [role, setRole] = useState('pmo');
  const [region, setRegion] = useState(REGIONS[0]);
  const districts = useMemo(() => DISTRICTS.filter((d) => d.admin.adm1Name === region), [region]);
  const [code, setCode] = useState(districts[0]?.admin.adm2Code);
  const district = districts.find((d) => d.admin.adm2Code === code) || districts[0];

  const [vals, setVals] = useState({ hazard: null, vuln: null, cope: null });
  const [ind, setInd] = useState({});
  const [open, setOpen] = useState('');
  const [by, setBy] = useState('');
  const [pending, setPending] = useState(getPending());
  const [needsApply, setNeedsApply] = useState(false);
  const [flash, setFlash] = useState('');

  useEffect(() => { if (!districts.find((d) => d.admin.adm2Code === code)) setCode(districts[0]?.admin.adm2Code); }, [region]); // eslint-disable-line

  useEffect(() => {
    if (!district) return;
    setVals({ hazard: round1(district.hazardExposure?.total), vuln: round1(district.vulnerability?.total), cope: round1(district.lackCopingCapacity?.total) });
    const m = {};
    for (const dim of DIM_KEYS) for (const c of DIMENSION_TREE[dim].components) for (const i of c.indicators) {
      const v = c.path(district)?.[i.k];
      if (typeof v === 'number') m[`${dim}:${i.k}`] = round1(v);
    }
    setInd(m);
  }, [code, district]);

  const liveRisk = cbrt(vals.hazard, vals.vuln, vals.cope);
  const liveClass = classifyRisk(liveRisk);
  const note = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3500); };

  const onIndChange = (dim, k, raw) => {
    const val = raw === '' ? null : Number(raw);
    const next = { ...ind, [`${dim}:${k}`]: val };
    setInd(next);
    const total = recomputeDim(dim, next);
    if (total != null) setVals((s) => ({ ...s, [TOTAL_KEY[dim]]: total }));
  };

  const payload = () => ({ hazard: vals.hazard, vuln: vals.vuln, cope: vals.cope, ind });
  const onSave = () => {
    if (!district) return;
    if (role === 'pmo') { saveDirect(code, payload(), by || 'PMO / Admin'); setNeedsApply(true); note(`Saved ${district.admin.adm2Name}. Apply to see it on the map.`); }
    else { submit({ code, name: district.admin.adm2Name, region, ...payload(), by: by || 'Sector officer' }); setPending(getPending()); note(`Submitted ${district.admin.adm2Name} for PMO approval.`); }
  };
  const onApprove = (id) => { approve(id); setPending(getPending()); setNeedsApply(true); note('Approved & applied.'); };
  const onReject = (id) => { reject(id); setPending(getPending()); note('Rejected.'); };
  const onReset = () => { if (confirm('Remove all local edits and pending submissions?')) { resetAll(); setPending([]); setNeedsApply(true); note('All edits cleared.'); } };

  return (
    <div className="de">
      <header className="de-head ui-card ui-card-pad">
        <div>
          <div className="ui-eyebrow">INFORM model · data entry</div>
          <h1 className="ui-h1">Edit & approve INFORM data</h1>
          <p className="ui-muted">Set a district's dimension score directly, or expand it to fill the individual indicators. PMO/Admin edits apply directly; sector edits need PMO approval.</p>
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
            <label className="de-field"><span className="de-field-label">District</span>
              <select value={code} onChange={(e) => setCode(e.target.value)}>{districts.map((d) => <option key={d.admin.adm2Code} value={d.admin.adm2Code}>{d.admin.adm2Name}</option>)}</select>
            </label>
          </div>

          {DIM_KEYS.map((dim) => {
            const tree = DIMENSION_TREE[dim];
            const tk = TOTAL_KEY[dim];
            return (
              <div key={dim} className="de-dim">
                <div className="de-dim-head">
                  <span className="de-dim-name">{tree.label}</span>
                  <input className="de-dim-total" type="number" min="0" max="10" step="0.1" value={vals[tk] ?? ''}
                    onChange={(e) => setVals((s) => ({ ...s, [tk]: e.target.value === '' ? null : Number(e.target.value) }))} />
                  <button className="ui-chip de-dim-toggle" onClick={() => setOpen(open === dim ? '' : dim)}>
                    {open === dim ? 'Hide indicators' : 'Fill indicators'}
                  </button>
                </div>
                {open === dim && tree.components.map((c) => (
                  <div key={c.name} className="de-comp">
                    <span className="de-comp-name">{c.name}</span>
                    <div className="de-ind-grid">
                      {c.indicators.map((i) => (
                        <label key={i.k} className="de-ind">
                          <span className="de-ind-label">{i.label}</span>
                          <input type="number" min="0" max="10" step="0.1" value={ind[`${dim}:${i.k}`] ?? ''}
                            onChange={(e) => onIndChange(dim, i.k, e.target.value)} />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="de-preview">
            <span className="ui-muted">Computed INFORM Risk = ∛(H × V × LCC)</span>
            <div className="de-risk" style={{ color: liveClass.color }}>{liveRisk ?? '—'} <span className="ui-badge" style={{ background: liveClass.color }}>{liveClass.level}</span></div>
          </div>

          <div className="de-actions">
            <input className="de-by" placeholder="Your name / institution (optional)" value={by} onChange={(e) => setBy(e.target.value)} />
            <button className="ui-btn-primary" onClick={onSave}>{role === 'pmo' ? 'Save (apply directly)' : 'Submit for approval'}</button>
          </div>
          {getOverrides()[code] && <div className="de-edited ui-muted">✎ This district has a saved edit.</div>}
        </div>

        <div className="de-queue ui-card ui-card-pad">
          <div className="de-queue-head"><h3 className="ui-h3">Approval queue</h3>
            <span className="ui-badge" style={{ background: pending.length ? '#FF9800' : '#94a3b8' }}>{pending.length} pending</span></div>
          {!pending.length && <p className="ui-muted">No submissions awaiting approval.</p>}
          {pending.map((e) => (
            <div key={e.id} className="de-pend">
              <div>
                <div className="de-pend-name">{e.name} <span className="ui-muted">({e.region})</span></div>
                <div className="ui-muted de-pend-vals">H {round1(e.hazard)} · V {round1(e.vuln)} · C {round1(e.cope)} → Risk {cbrt(e.hazard, e.vuln, e.cope)} · by {e.by}</div>
              </div>
              {role === 'pmo'
                ? <div className="de-pend-btns"><button className="ui-chip" onClick={() => onApprove(e.id)}>Approve</button><button className="ui-chip" onClick={() => onReject(e.id)}>Reject</button></div>
                : <span className="ui-muted">awaiting PMO</span>}
            </div>
          ))}
          <button className="de-reset ui-muted" onClick={onReset}>Reset all local edits</button>
        </div>
      </div>

      <p className="de-foot ui-muted">Edits flow into the map, charts and tables across the app. Cross-device multi-user persistence connects to the Supabase backend — schema ready in <code>supabase/setup.sql</code>.</p>
    </div>
  );
}
