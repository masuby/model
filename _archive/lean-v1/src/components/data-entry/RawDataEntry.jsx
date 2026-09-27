/**
 * RawDataEntry - the AUTHENTIC data entry: a sector keys the ACTUAL value in the indicator's natural
 * unit (18 for 18% underweight, 11 for an 11-year drought frequency, a count of displaced people), and
 * the proven standardiser produces the 0-10 live - exactly as the workbook. The officer never invents a
 * score. Driven entirely by the spec (inform-indicator-spec.json): all 78 indicators, add/delete by the
 * spec, any unit, any resolution.
 *
 * Submit maps the standardised COMPONENT values (78 raw -> 32 components via AVERAGEIFS) onto the engine's
 * DIMENSION_TREE leaves and feeds them through the SAME override + PMO-approval flow as score entry, so
 * the model recomputes (applyEdits: category MEAN -> dimension scaled GEOMEAN -> risk cube-root).
 *
 * standardise/computeFromRaw are proven vs the workbook (8664/8664 values, 170/170 districts).
 */
import React, { useMemo, useState } from 'react';
import { ALL_SPECS, standardise, computeFromRaw } from '../../services/standardise';
import { COUNCIL_UNITS, DIMENSION_TREE, DIM_KEYS, classifyRisk } from '../inform-risk/riskModel';
import { AUTHORITIES } from '../inform-risk/indicatorSources';
import { saveDirect, submit } from '../inform-risk/overrideStore';

const REGIONS = [...new Set(COUNCIL_UNITS.map((c) => c.admin.adm1Name))].sort();
const AUTH_OPTIONS = Object.entries(AUTHORITIES).filter(([k]) => k !== 'INFORM' && k !== 'CHC').map(([k, v]) => ({ k, ...v }));

// used indicators grouped: dimension -> component -> [spec]
const GROUPS = (() => {
  const out = {};
  for (const s of Object.values(ALL_SPECS)) {
    if (s.use !== 'Yes') continue;
    (out[s.dimension] = out[s.dimension] || {});
    (out[s.dimension][s.component] = out[s.dimension][s.component] || []).push(s);
  }
  return out;
})();

// map a workbook component name ("Drought", "Access to health care") onto the engine's DIMENSION_TREE
// leaf {dim, k}, by normalised label - with the one alias the tree abbreviates.
const norm = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
const COMPONENT_TO_LEAF = (() => {
  const m = {};
  for (const dim of DIM_KEYS) for (const c of DIMENSION_TREE[dim].components) for (const i of c.indicators) m[norm(i.label)] = { dim, k: i.k };
  m[norm('Environmental Degradation')] = { dim: 'hazard', k: 'environmentalDegradation' };
  return m;
})();
const leafFor = (componentName) => COMPONENT_TO_LEAF[norm(componentName)];

const round1 = (x) => (typeof x === 'number' ? Math.floor(x * 10 + 0.5) / 10 : null);
const refOf = (s) => (String(s.normalisation).startsWith('Custom') ? `fixed [${s.resolved_min}, ${s.resolved_max}]` : `range [${s.resolved_min}, ${s.resolved_max}]`);

export default function RawDataEntry({ role = 'pmo', onSaved }) {
  const [region, setRegion] = useState(REGIONS[0]);
  const councils = useMemo(() => COUNCIL_UNITS.filter((c) => c.admin.adm1Name === region), [region]);
  const [code, setCode] = useState(councils[0]?.admin.adm2Code);
  const unit = councils.find((c) => c.admin.adm2Code === code) || councils[0];
  const [raw, setRaw] = useState({});
  const [auth, setAuth] = useState('MOW');
  const [by, setBy] = useState('');
  const [msg, setMsg] = useState('');

  const set = (id, v) => setRaw((r) => ({ ...r, [id]: v === '' ? undefined : v }));
  const rawById = useMemo(
    () => Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v))),
    [raw]
  );
  const result = useMemo(() => computeFromRaw(rawById), [rawById]);
  const cls = classifyRisk(result.risk);
  const filled = Object.keys(rawById).length;

  const onSubmit = () => {
    if (!unit?._srcCode || !filled) { setMsg('Enter at least one actual value first.'); return; }
    // standardised component values -> engine leaves
    const ind = {}, indSrc = {};
    for (const [compName, score] of Object.entries(result.component)) {
      const leaf = leafFor(compName);
      if (!leaf || score == null) continue;
      const key = `${leaf.dim}:${leaf.k}`;
      ind[key] = round1(score);
      indSrc[key] = { by: auth, ts: Date.now() };
    }
    if (!Object.keys(ind).length) { setMsg('Nothing mapped to the model.'); return; }
    const stamp = `${AUTHORITIES[auth]?.label || auth}${by ? ' - ' + by : ''}`;
    if (role === 'pmo') { saveDirect(unit._srcCode, { ind, indSrc }, stamp); setMsg(`Saved ${Object.keys(ind).length} indicators for ${unit.admin.adm2Name}. Apply to see it across the system.`); }
    else { submit({ code: unit._srcCode, name: unit.admin.adm2Name, region, ind, indSrc, by: stamp }); setMsg(`Submitted ${Object.keys(ind).length} indicators for PMO approval.`); }
    if (onSaved) onSaved();
  };

  return (
    <div className="de-raw">
      <div className="de-raw-head ui-muted">
        Enter each indicator's <strong>actual value in its own unit</strong> - the model standardises it to
        0-10 exactly as the INFORM workbook, then submits the components through the approval flow. {filled} of 53 entered.
      </div>

      <div className="de-pickers">
        <label className="de-field"><span className="de-field-label">Region</span>
          <select value={region} onChange={(e) => { setRegion(e.target.value); const cs = COUNCIL_UNITS.filter((c) => c.admin.adm1Name === e.target.value); setCode(cs[0]?.admin.adm2Code); }}>{REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
        </label>
        <label className="de-field"><span className="de-field-label">Council / LGA</span>
          <select value={code} onChange={(e) => setCode(e.target.value)}>{councils.map((c) => <option key={c.admin.adm2Code} value={c.admin.adm2Code}>{c.admin.adm2Name}</option>)}</select>
        </label>
      </div>

      {Object.entries(GROUPS).map(([dim, comps]) => (
        <div key={dim} className="de-raw-dim">
          <div className="de-raw-dim-name">{dim}</div>
          {Object.entries(comps).map(([comp, specs]) => (
            <div key={comp} className="de-raw-comp">
              <span className="de-raw-comp-name">{comp}</span>
              <div className="de-raw-grid">
                {specs.map((s) => {
                  const score = standardise(raw[s.id] === '' || raw[s.id] == null ? null : Number(raw[s.id]), s);
                  return (
                    <label key={s.id} className="de-raw-ind">
                      <span className="de-raw-label">
                        {s.name} <em className="de-raw-unit">({s.unit || 'value'})</em>
                        <span className="de-raw-meta">{s.keyed_at} · {refOf(s)} · {String(s.sign).startsWith('Dec') ? 'protective' : 'risk'}</span>
                      </span>
                      <div className="de-raw-input">
                        <input type="number" step="any" placeholder={s.unit || 'actual value'} value={raw[s.id] ?? ''} onChange={(e) => set(s.id, e.target.value)} />
                        <span className={`de-raw-score ${score == null ? 'is-empty' : ''}`}>{score == null ? '-' : `→ ${score}`}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="de-raw-result">
        <div className="ui-muted">Computed from your actual values - standardise → component → dimension → INFORM Risk</div>
        <div className="de-raw-dims">
          <span>Hazard {result.dimension.H ?? '-'}</span>
          <span>Vulnerability {result.dimension.V ?? '-'}</span>
          <span>Coping {result.dimension.C ?? '-'}</span>
        </div>
        <div className="de-risk" style={{ color: cls.color }}>{result.risk ?? '-'} <span className="ui-badge" style={{ background: cls.color }}>{cls.level}</span></div>
      </div>

      <div className="de-actions">
        <label className="de-field de-auth"><span className="de-field-label">Data source / authority</span>
          <select value={auth} onChange={(e) => setAuth(e.target.value)}>{AUTH_OPTIONS.map((a) => <option key={a.k} value={a.k}>{a.full} ({a.label})</option>)}</select>
        </label>
        <input className="de-by" placeholder="Your name (optional)" value={by} onChange={(e) => setBy(e.target.value)} />
        <button className="ui-btn-primary" onClick={onSubmit} disabled={!filled}>{role === 'pmo' ? 'Save actual values (apply directly)' : 'Submit for approval'}</button>
      </div>
      {msg && <div className="de-flash">{msg}</div>}
    </div>
  );
}
