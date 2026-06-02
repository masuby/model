/**
 * DataEntry — edit the INFORM model values and feed them into the whole system.
 *  • PMO / Admin: edits apply directly.
 *  • Sector officer: edits are submitted for PMO approval.
 * Approved/PMO edits set a district's three dimension scores; risk recomputes as
 * ∛(H × V × LCC) and (after "Apply") flows into the map, charts and tables.
 * Persistence is this browser (localStorage); cross-device multi-user is the
 * Supabase backend (supabase/setup.sql) for when a project is connected.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { DISTRICTS, classifyRisk, round1 } from '../inform-risk/riskModel';
import { saveDirect, submit, getPending, approve, reject, resetAll, getOverrides } from '../inform-risk/overrideStore';
import './DataEntry.css';

const REGIONS = [...new Set(DISTRICTS.map((d) => d.admin.adm1Name))].sort();
const cbrt = (h, v, c) => ([h, v, c].every((x) => typeof x === 'number') ? Math.round(Math.cbrt(h * v * c) * 10) / 10 : null);

function Field({ label, hint, value, onChange }) {
  return (
    <label className="de-field">
      <span className="de-field-label">{label}</span>
      <input type="number" min="0" max="10" step="0.1" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      <span className="de-field-hint ui-muted">{hint}</span>
    </label>
  );
}

export default function DataEntry() {
  const [role, setRole] = useState('pmo');
  const [region, setRegion] = useState(REGIONS[0]);
  const districts = useMemo(() => DISTRICTS.filter((d) => d.admin.adm1Name === region), [region]);
  const [code, setCode] = useState(districts[0]?.admin.adm2Code);
  const district = districts.find((d) => d.admin.adm2Code === code) || districts[0];

  const [vals, setVals] = useState({ hazard: null, vuln: null, cope: null });
  const [by, setBy] = useState('');
  const [pending, setPending] = useState(getPending());
  const [needsApply, setNeedsApply] = useState(false);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    setRegion((r) => (districts.length ? r : REGIONS[0]));
    if (!districts.find((d) => d.admin.adm2Code === code)) setCode(districts[0]?.admin.adm2Code);
  }, [region]); // eslint-disable-line

  useEffect(() => {
    if (district) setVals({
      hazard: round1(district.hazardExposure?.total),
      vuln: round1(district.vulnerability?.total),
      cope: round1(district.lackCopingCapacity?.total),
    });
  }, [code, district]);

  const liveRisk = cbrt(vals.hazard, vals.vuln, vals.cope);
  const liveClass = classifyRisk(liveRisk);
  const isOverridden = Boolean(getOverrides()[code]);

  const note = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3500); };

  const onSave = () => {
    if (!district) return;
    if (role === 'pmo') {
      saveDirect(code, { hazard: vals.hazard, vuln: vals.vuln, cope: vals.cope }, by || 'PMO / Admin');
      setNeedsApply(true);
      note(`Saved ${district.admin.adm2Name}. Apply to see it on the map.`);
    } else {
      submit({ code, name: district.admin.adm2Name, region, hazard: vals.hazard, vuln: vals.vuln, cope: vals.cope, by: by || 'Sector officer' });
      setPending(getPending());
      note(`Submitted ${district.admin.adm2Name} for PMO approval.`);
    }
  };

  const onApprove = (id) => { approve(id); setPending(getPending()); setNeedsApply(true); note('Approved & applied.'); };
  const onReject = (id) => { reject(id); setPending(getPending()); note('Rejected.'); };
  const onReset = () => { if (confirm('Remove all local edits and pending submissions?')) { resetAll(); setPending([]); setNeedsApply(true); note('All edits cleared.'); } };
  const apply = () => window.location.reload();

  return (
    <div className="de">
      <header className="de-head ui-card ui-card-pad">
        <div>
          <div className="ui-eyebrow">INFORM model · data entry</div>
          <h1 className="ui-h1">Edit & approve INFORM data</h1>
          <p className="ui-muted">Update a district's dimension scores; risk recomputes and feeds the whole system. PMO/Admin edits apply directly; sector edits need PMO approval.</p>
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
          <button className="ui-btn-primary" onClick={apply}>Apply across the system ↻</button>
        </div>
      )}
      {flash && <div className="de-flash">{flash}</div>}

      <div className="de-grid">
        {/* Editor */}
        <div className="de-editor ui-card ui-card-pad">
          <div className="de-pickers">
            <label className="de-field">
              <span className="de-field-label">Region</span>
              <select value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="de-field">
              <span className="de-field-label">District</span>
              <select value={code} onChange={(e) => setCode(e.target.value)}>
                {districts.map((d) => <option key={d.admin.adm2Code} value={d.admin.adm2Code}>{d.admin.adm2Name}</option>)}
              </select>
            </label>
          </div>

          <div className="de-fields">
            <Field label="Hazard & Exposure" hint="0–10" value={vals.hazard} onChange={(v) => setVals((s) => ({ ...s, hazard: v }))} />
            <Field label="Vulnerability" hint="0–10" value={vals.vuln} onChange={(v) => setVals((s) => ({ ...s, vuln: v }))} />
            <Field label="Lack of Coping Capacity" hint="0–10" value={vals.cope} onChange={(v) => setVals((s) => ({ ...s, cope: v }))} />
          </div>

          <div className="de-preview">
            <span className="ui-muted">Computed INFORM Risk = ∛(H × V × LCC)</span>
            <div className="de-risk" style={{ color: liveClass.color }}>
              {liveRisk ?? '—'} <span className="ui-badge" style={{ background: liveClass.color }}>{liveClass.level}</span>
            </div>
          </div>

          <div className="de-actions">
            <input className="de-by" placeholder="Your name / institution (optional)" value={by} onChange={(e) => setBy(e.target.value)} />
            <button className="ui-btn-primary" onClick={onSave}>
              {role === 'pmo' ? 'Save (apply directly)' : 'Submit for approval'}
            </button>
          </div>
          {isOverridden && <div className="de-edited ui-muted">✎ This district has a saved edit.</div>}
        </div>

        {/* Approval queue */}
        <div className="de-queue ui-card ui-card-pad">
          <div className="de-queue-head">
            <h3 className="ui-h3">Approval queue</h3>
            <span className="ui-badge" style={{ background: pending.length ? '#FF9800' : '#94a3b8' }}>{pending.length} pending</span>
          </div>
          {!pending.length && <p className="ui-muted">No submissions awaiting approval.</p>}
          {pending.map((e) => {
            const r = cbrt(e.hazard, e.vuln, e.cope);
            return (
              <div key={e.id} className="de-pend">
                <div>
                  <div className="de-pend-name">{e.name} <span className="ui-muted">({e.region})</span></div>
                  <div className="ui-muted de-pend-vals">H {round1(e.hazard)} · V {round1(e.vuln)} · C {round1(e.cope)} → Risk {r} · by {e.by}</div>
                </div>
                {role === 'pmo' ? (
                  <div className="de-pend-btns">
                    <button className="ui-chip" onClick={() => onApprove(e.id)}>Approve</button>
                    <button className="ui-chip" onClick={() => onReject(e.id)}>Reject</button>
                  </div>
                ) : <span className="ui-muted">awaiting PMO</span>}
              </div>
            );
          })}
          <button className="de-reset ui-muted" onClick={onReset}>Reset all local edits</button>
        </div>
      </div>

      <p className="de-foot ui-muted">
        Edits are stored in this browser and flow into the map, charts and tables across the app.
        Cross-device, multi-user persistence (sectors and PMO on different machines) connects to the
        Supabase backend — the schema is ready in <code>supabase/setup.sql</code>.
      </p>
    </div>
  );
}
