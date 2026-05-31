/**
 * Module 04 — INFORM Severity
 *
 * A faithful IASC INFORM Severity Index v6 calculator + visualiser.
 * Enter (or load a sample scenario of) the crisis indicators across the three
 * dimensions — Impact, Conditions, Complexity — and the engine computes the
 * 0–5 severity score live. Display is the shared SeverityScorecard.
 *
 * No data entry to a backend, no committee workflow — a single, clear tool
 * driven entirely by the authentic engine (src/services/informSeverityEngine.js).
 */

import React, { useMemo, useState } from 'react';
import { calculateINFORMSeverity, SEVERITY_HIERARCHY } from '../../services/informSeverityEngine';
import { SEVERITY_INDICATORS } from '../../services/informSeverityDefinitions';
import { SEVERITY_SCENARIOS } from './severityScenarios';
import SeverityScorecard from './components/SeverityScorecard';
import './Module04Severity.css';

const DIM_ORDER = ['IMPACT', 'CONDITIONS', 'COMPLEXITY'];

function IndicatorInput({ id, value, onChange }) {
  const def = SEVERITY_INDICATORS[id];
  if (!def) return null;
  return (
    <label className="sev-input">
      <span className="sev-input-label">
        {def.name}
        <span className="sev-input-unit">{def.unit}</span>
      </span>
      <input
        type="number"
        value={value ?? ''}
        min={def.refMin}
        max={def.refMax}
        step="any"
        aria-label={`${def.name} (${def.unit}, range ${def.refMin} to ${def.refMax}${def.polarity === 'POSITIVE' ? ', higher values mean less severe' : ''})`}
        onChange={(e) => onChange(id, e.target.value === '' ? null : Number(e.target.value))}
      />
      <span className="sev-input-range">
        {def.refMin}–{def.refMax}
        {def.polarity === 'POSITIVE' ? ' · higher = less severe' : ''}
      </span>
    </label>
  );
}

export default function Module04Severity() {
  const [scenarioId, setScenarioId] = useState(SEVERITY_SCENARIOS[0].id);
  const [values, setValues] = useState({ ...SEVERITY_SCENARIOS[0].values });

  const result = useMemo(() => calculateINFORMSeverity(values), [values]);

  const loadScenario = (id) => {
    const sc = SEVERITY_SCENARIOS.find((s) => s.id === id);
    if (!sc) return;
    setScenarioId(id);
    setValues({ ...sc.values });
  };

  const setValue = (id, v) => {
    setScenarioId('custom');
    setValues((prev) => ({ ...prev, [id]: v }));
  };

  const activeScenario = SEVERITY_SCENARIOS.find((s) => s.id === scenarioId);

  return (
    <div className="sev-module">
      <header className="sev-module-head ui-card ui-card-pad">
        <div className="ui-eyebrow">INFORM Severity Index v6 · IASC/JRC</div>
        <h1 className="ui-h1">Crisis Severity Calculator</h1>
        <p className="ui-muted">
          Measures how severe a crisis <em>is</em> — its impact, the conditions of affected
          people, and response complexity — distinct from the Risk Index, which estimates how
          likely a crisis is.
        </p>
        <p className="sev-disclaimer">
          The sample scenarios below use <strong>illustrative figures</strong> to
          demonstrate the methodology — they are not official assessments. Enter
          real figures for an actual crisis to compute its severity.
        </p>
      </header>

      <section className="sev-scenarios">
        <span className="sev-scenarios-label">Load an illustrative scenario:</span>
        {SEVERITY_SCENARIOS.map((s) => (
          <button
            key={s.id}
            className={`sev-scenario-btn ${scenarioId === s.id ? 'active' : ''}`}
            onClick={() => loadScenario(s.id)}
          >
            {s.name}
          </button>
        ))}
        {scenarioId === 'custom' && <span className="sev-scenario-btn custom">Custom (edited)</span>}
      </section>
      {activeScenario && <p className="sev-scenario-desc">{activeScenario.description}</p>}

      <div className="sev-layout">
        {/* Inputs grouped by dimension → component */}
        <div className="sev-inputs">
          {DIM_ORDER.map((dimId) => {
            const dim = SEVERITY_HIERARCHY[dimId];
            return (
              <div key={dimId} className="sev-input-dim" style={{ borderTopColor: dim.color }}>
                <h2 style={{ color: dim.color }}>{dim.name}</h2>
                {Object.entries(dim.components).map(([compId, comp]) => (
                  <div key={compId} className="sev-input-comp">
                    <h3>{comp.name}</h3>
                    <div className="sev-input-grid">
                      {comp.indicators.map((indId) => (
                        <IndicatorInput key={indId} id={indId} value={values[indId]} onChange={setValue} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Live scorecard */}
        <div className="sev-result">
          <SeverityScorecard result={result} />
        </div>
      </div>
    </div>
  );
}
