/**
 * RawDataEntry - the AUTHENTIC data entry: a sector keys the ACTUAL value in the indicator's natural
 * unit (18 for 18% underweight, 11 for an 11-year drought frequency, a count of displaced people), and
 * the proven standardiser produces the 0-10 live - exactly as the workbook. The officer never invents a
 * score. Driven entirely by the spec (inform-indicator-spec.json), so it is flexible: all 78 indicators,
 * add/delete by the spec, any unit, any resolution.
 *
 * standardise(raw, spec) and computeFromRaw are proven against the workbook (8664/8664 values, 170/170
 * districts). This component is additive - it does not change the existing score-entry path or the model.
 */
import React, { useMemo, useState } from 'react';
import { ALL_SPECS, standardise, computeFromRaw } from '../../services/standardise';
import { classifyRisk } from '../inform-risk/riskModel';

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

const refOf = (s) =>
  String(s.normalisation).startsWith('Custom')
    ? `fixed [${s.resolved_min}, ${s.resolved_max}]`
    : `range [${s.resolved_min}, ${s.resolved_max}]`;

export default function RawDataEntry() {
  const [raw, setRaw] = useState({});
  const set = (id, v) => setRaw((r) => ({ ...r, [id]: v === '' ? undefined : v }));

  const rawById = useMemo(
    () => Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v))),
    [raw]
  );
  const result = useMemo(() => computeFromRaw(rawById), [rawById]);
  const cls = classifyRisk(result.risk);
  const filled = Object.keys(rawById).length;

  return (
    <div className="de-raw">
      <div className="de-raw-head ui-muted">
        Enter each indicator's <strong>actual value in its own unit</strong> - the model standardises it to
        0-10 exactly as the INFORM workbook. {filled} of 53 indicators entered.
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
                        <input type="number" step="any" placeholder={s.unit || 'actual value'} value={raw[s.id] ?? ''}
                          onChange={(e) => set(s.id, e.target.value)} />
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
        <div className="de-risk" style={{ color: cls.color }}>
          {result.risk ?? '-'} <span className="ui-badge" style={{ background: cls.color }}>{cls.level}</span>
        </div>
      </div>
    </div>
  );
}
