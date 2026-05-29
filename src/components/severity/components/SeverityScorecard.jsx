/**
 * SeverityScorecard
 *
 * Displays the result of calculateINFORMSeverity() as a clean scorecard:
 *   • Final Severity score 0-5 with class badge
 *   • Three dimension cards: Impact / Conditions / Complexity
 *   • Per-component breakdown with indicator coverage
 *   • Quality Index (information reliability) badge
 *   • Formula expression
 *
 * Designed to be drop-in for Layer3 (Module 04) AND any other location that
 * surfaces a severity calculation.
 */

import React from 'react';
import { SEVERITY_HIERARCHY } from '../../../services/informSeverityEngine';
import './SeverityScorecard.css';

const DIM_ORDER = ['IMPACT', 'CONDITIONS', 'COMPLEXITY'];

function fmt(v, d = 2) {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(d);
}

function DimensionCard({ dimId, data }) {
  if (!data) return null;
  const dim = SEVERITY_HIERARCHY[dimId];
  const cls = data.classification;
  return (
    <div className="sev-dim-card" style={{ borderTopColor: dim.color }}>
      <div className="sev-dim-card-head">
        <div>
          <div className="sev-dim-card-name">{dim.name}</div>
          <div className="sev-dim-card-desc">{dim.description}</div>
        </div>
        <div className="sev-dim-card-score" style={{ background: cls?.color ?? '#94a3b8' }}>
          {fmt(data.score, 1)}
        </div>
      </div>
      {cls && <div className="sev-dim-card-class">{cls.label}</div>}
      <div className="sev-dim-card-coverage">
        Coverage: {data.coverage}% ({data.componentCount}/{data.totalComponents} components)
      </div>

      <div className="sev-dim-card-components">
        {Object.entries(data.components).map(([compId, comp]) => (
          <div key={compId} className="sev-dim-comp">
            <div className="sev-dim-comp-head">
              <span className="sev-dim-comp-name">{comp.name}</span>
              <span className="sev-dim-comp-score" style={{ color: comp.classification?.color ?? '#475569' }}>
                {fmt(comp.score, 1)}
              </span>
            </div>
            <div className="sev-dim-comp-bar">
              <div
                className="sev-dim-comp-bar-fill"
                style={{
                  width: `${((comp.score ?? 0) / 5) * 100}%`,
                  background: comp.classification?.color ?? '#cbd5e1',
                }}
              />
            </div>
            <div className="sev-dim-comp-meta">
              {comp.indicatorCount}/{comp.totalIndicators} indicators
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SeverityScorecard({ result, title = 'INFORM Severity Assessment' }) {
  if (!result) {
    return (
      <div className="sev-scorecard-empty">
        No impact reports yet. Submit a report in Layer 2 to compute severity.
      </div>
    );
  }

  const cls = result.classification;

  return (
    <div className="sev-scorecard">
      <div className="sev-scorecard-head">
        <div>
          <div className="sev-scorecard-title">{title}</div>
          <div className="sev-scorecard-meta">
            {result.metadata.methodology} · Coverage {result.metadata.coverage}%
            ({result.metadata.indicatorCount}/{result.metadata.totalIndicators} indicators)
          </div>
        </div>
        <div className="sev-scorecard-final">
          <div className="sev-scorecard-final-label">Final Severity (0–5)</div>
          <div
            className="sev-scorecard-final-score"
            style={{ background: cls?.color ?? '#94a3b8' }}
          >
            {fmt(result.severity, 2)}
          </div>
          {cls && <div className="sev-scorecard-final-class">{cls.label}</div>}
        </div>
      </div>

      {result.formula && (
        <div className="sev-scorecard-formula">
          <code>{result.formula.expression}</code>
          {result.formula.preliminary && (
            <span className="sev-scorecard-preliminary">Preliminary — not all 3 dimensions present</span>
          )}
        </div>
      )}

      <div className="sev-scorecard-dims">
        {DIM_ORDER.map((dimId) => (
          <DimensionCard key={dimId} dimId={dimId} data={result.dimensions[dimId]} />
        ))}
      </div>

      {result.quality && (
        <div className="sev-scorecard-quality">
          <div className="sev-scorecard-quality-head">
            <span className="sev-scorecard-quality-label">Information Quality Index</span>
            <span className="sev-scorecard-quality-score">
              {fmt(result.quality.score, 1)} · {result.quality.classification}
            </span>
          </div>
          <div className="sev-scorecard-quality-detail">
            Data availability: <strong>{fmt(result.quality.components.dataAvailability, 1)}</strong> ·
            Assessment recency: <strong>{fmt(result.quality.components.assessmentRecency, 1)}</strong> ·
            Reporting quality: <strong>{fmt(result.quality.components.reportingQuality, 1)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
