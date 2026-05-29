/**
 * IndicatorGuide
 *
 * Reusable popover that explains how to fill a single INFORM indicator:
 *   • What it measures
 *   • Unit + expected range (refMin–refMax)
 *   • Polarity (higher = more / less risk)
 *   • Concrete example values for "low risk" vs "high risk"
 *   • Transform applied (log etc.) so the user knows the engine handles it
 *   • Whether it's INFORM Core or a Tanzania subnational extension
 *
 * Usage:
 *   <IndicatorGuide indicatorId="flood_exposure" />
 *
 * Trigger styles: 'icon' (default — ℹ️ icon) or 'inline' (full inline panel).
 */

import React, { useState, useRef, useEffect } from 'react';
import { ALL_INDICATORS, COMPLETE_HIERARCHY } from '../../services/informIndicatorDefinitions';
import { getIndicatorDescription } from '../../services/informIndicatorDescriptions';
import './IndicatorGuide.css';

const DIRECTION_TEXT = {
  NEGATIVE: 'higher raw value → more risk',
  POSITIVE: 'higher raw value → less risk (engine inverts at ingest)',
};

const TRANSFORM_TEXT = {
  none: null,
  log: 'Log-transformed before normalization (compresses very large values).',
  log1p: 'Log1p-transformed (handles zeros; compresses skewed counts).',
  sqrt: 'Square-root transformed before normalization.',
  sqr: 'Squared before normalization.',
};

/**
 * Synthesize "low-risk" and "high-risk" example values from refMin/refMax
 * accounting for polarity.
 */
function exampleValues(def) {
  const { refMin = 0, refMax = 10, polarity, unit } = def;
  const span = refMax - refMin;
  const low = refMin + span * 0.15;
  const high = refMin + span * 0.85;
  const fmt = (v) => {
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 1) return v.toFixed(1);
    return v.toFixed(2);
  };
  if (polarity === 'POSITIVE') {
    return { lowRisk: `${fmt(high)} ${unit}`, highRisk: `${fmt(low)} ${unit}` };
  }
  return { lowRisk: `${fmt(low)} ${unit}`, highRisk: `${fmt(high)} ${unit}` };
}

function findCategoryName(def) {
  const dim = COMPLETE_HIERARCHY[def.dimension];
  return dim?.categories?.[def.category]?.name ?? def.category;
}
function findComponentName(def) {
  const dim = COMPLETE_HIERARCHY[def.dimension];
  const cat = dim?.categories?.[def.category];
  return cat?.components?.[def.component]?.name ?? def.component;
}

function formatRange(def) {
  const { refMin = 0, refMax = 10, unit, transform } = def;
  const min = Math.abs(refMin) >= 1 ? refMin.toLocaleString() : refMin;
  const max = Math.abs(refMax) >= 1 ? refMax.toLocaleString() : refMax;
  const tx = transform && transform !== 'none' ? ` (${transform} transform)` : '';
  return `${min} – ${max} ${unit ?? ''}${tx}`;
}

function PanelContent({ def }) {
  const ex = exampleValues(def);
  const transformNote = TRANSFORM_TEXT[def.transform] ?? null;
  const desc = getIndicatorDescription(def.id);
  return (
    <div className="indicator-guide-body">
      {desc?.measures && (
        <div className="indicator-guide-row">
          <span className="indicator-guide-label">What it measures</span>
          <span className="indicator-guide-value">{desc.measures}</span>
        </div>
      )}

      {desc?.why && (
        <div className="indicator-guide-row">
          <span className="indicator-guide-label">Why it matters (per INFORM doc)</span>
          <span className="indicator-guide-value ig-why">{desc.why}</span>
        </div>
      )}

      {desc?.source && (
        <div className="indicator-guide-row">
          <span className="indicator-guide-label">Authoritative source</span>
          <span className="indicator-guide-value">{desc.source}</span>
        </div>
      )}

      <div className="indicator-guide-row">
        <span className="indicator-guide-label">Position in INFORM hierarchy</span>
        <span className="indicator-guide-value">
          {def.dimension} → {findCategoryName(def)} → {findComponentName(def)}
        </span>
      </div>

      <div className="indicator-guide-row">
        <span className="indicator-guide-label">Unit & range</span>
        <span className="indicator-guide-value">{formatRange(def)}</span>
      </div>

      <div className="indicator-guide-row">
        <span className="indicator-guide-label">Direction</span>
        <span className={`indicator-guide-value ig-polarity ig-polarity-${def.polarity?.toLowerCase()}`}>
          {DIRECTION_TEXT[def.polarity] ?? def.polarity}
        </span>
      </div>

      <div className="indicator-guide-examples">
        <div className="indicator-guide-example ig-low">
          <span className="ig-pill ig-low-pill">Low risk</span>
          <span className="ig-example-val">{ex.lowRisk}</span>
        </div>
        <div className="indicator-guide-example ig-high">
          <span className="ig-pill ig-high-pill">High risk</span>
          <span className="ig-example-val">{ex.highRisk}</span>
        </div>
      </div>

      {transformNote && (
        <div className="indicator-guide-note">
          <span className="ig-note-icon">⚙️</span> {transformNote}
        </div>
      )}

      <div className="indicator-guide-note ig-tip">
        {desc?.guidance ? (
          <>
            <strong>How to enter:</strong> {desc.guidance}
          </>
        ) : (
          <>
            <strong>How to enter:</strong> Submit the <em>raw</em> value in the unit shown above.
            The engine normalizes and inverts polarity automatically. Leave blank if data unavailable.
          </>
        )}
      </div>

      <div className="indicator-guide-footer">
        <span className={`ig-badge ${def.informCore ? 'ig-core' : 'ig-ext'}`}>
          {def.informCore ? 'INFORM 2017 Core' : 'Tanzania subnational extension'}
        </span>
        {desc?.pdfRef && (
          <span className="ig-pdfref" title="INFORM 2017 Methodology PDF reference">
            📖 {desc.pdfRef}
          </span>
        )}
        <code className="ig-code">{def.id}</code>
      </div>
    </div>
  );
}

export default function IndicatorGuide({ indicatorId, mode = 'icon' }) {
  const def = ALL_INDICATORS[indicatorId];
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  if (!def) {
    return mode === 'icon'
      ? <span className="indicator-guide-missing" title={`No metadata for ${indicatorId}`}>❓</span>
      : null;
  }

  if (mode === 'inline') {
    return (
      <div className="indicator-guide-inline">
        <div className="indicator-guide-head">
          <strong>{def.name}</strong>
          <span className="ig-code">{def.id}</span>
        </div>
        <PanelContent def={def} />
      </div>
    );
  }

  return (
    <span className="indicator-guide-wrap" ref={ref}>
      <button
        type="button"
        className={`indicator-guide-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`How to fill ${def.name}`}
      >
        ℹ️
      </button>
      {open && (
        <div className="indicator-guide-popover" role="dialog">
          <div className="indicator-guide-head">
            <strong>{def.name}</strong>
            <button
              type="button"
              className="indicator-guide-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <PanelContent def={def} />
        </div>
      )}
    </span>
  );
}

/**
 * DataEntryGuideBanner — top-of-form guidance about harmonization rules.
 * Drop this above any data entry form so submitters know the conventions.
 */
export function DataEntryGuideBanner({ onOpenCatalog }) {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <button type="button" className="indicator-guide-banner-mini" onClick={() => setOpen(true)}>
        📖 Show data entry guide
      </button>
    );
  }
  return (
    <div className="indicator-guide-banner">
      <div className="indicator-guide-banner-head">
        <span className="indicator-guide-banner-icon">📖</span>
        <strong>How to fill INFORM indicators (harmonization rules)</strong>
        <button type="button" className="indicator-guide-banner-close" onClick={() => setOpen(false)}>×</button>
      </div>
      <ul className="indicator-guide-banner-rules">
        <li>
          <strong>Enter raw values, not pre-normalized scores.</strong> The engine normalizes each
          indicator using its declared min/max bounds.
        </li>
        <li>
          <strong>Use the unit shown</strong> next to each indicator (%, per 100k, count, USD,
          0–1 index, etc.). Mismatched units will misclassify the score.
        </li>
        <li>
          <strong>Direction matters.</strong> POSITIVE-polarity indicators (HDI, electricity, literacy)
          mean "higher = better" — the engine inverts these automatically. NEGATIVE-polarity indicators
          (flood exposure, mortality rates, poverty) mean "higher = worse".
        </li>
        <li>
          <strong>Leave blank when data is unavailable.</strong> Missing data lowers coverage and the
          Lack of Reliability Index, but a guess silently distorts the dimension score.
        </li>
        <li>
          <strong>Tap the ℹ️ icon</strong> next to any indicator for unit, expected range, and
          example "low/high risk" values.
        </li>
      </ul>
      {onOpenCatalog && (
        <button type="button" className="indicator-guide-banner-cta" onClick={onOpenCatalog}>
          Open full Indicator Catalog →
        </button>
      )}
    </div>
  );
}
