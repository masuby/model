// Region-level risk derived from the curated district dataset, plus the INFORM
// 5-class colour scale. Used by the regional choropleth map.

// Authoritative Tanzania INFORM risk classification — single source of truth
// for the whole Risk module. Thresholds and colours mirror TANZANIA_THRESHOLDS.RISK
// [2.5, 3.4, 4.3, 5.9, 10] and RISK_CLASS_LABELS in
// src/services/informIndicatorDefinitions.js (sourced from TZ_INFORM_model.xlsx).
export function classifyRisk(score) {
  if (score == null || Number.isNaN(score)) return { level: 'No data', color: '#cbd5e1', range: '—' };
  if (score < 2.5) return { level: 'Very Low',  color: '#2E7D32', range: '0.0–2.4' };
  if (score < 3.4) return { level: 'Low',        color: '#8BC34A', range: '2.5–3.3' };
  if (score < 4.3) return { level: 'Medium',     color: '#FFC107', range: '3.4–4.2' };
  if (score < 5.9) return { level: 'High',       color: '#FF9800', range: '4.3–5.8' };
  return { level: 'Very High', color: '#D32F2F', range: '5.9–10.0' };
}

// Normalise region names so e.g. "Dar-es-salaam" matches "Dar es Salaam".
export const normRegion = (name) => String(name || '').toLowerCase().replace(/[^a-z]/g, '');

// Mean district risk per region, keyed by normalised region name.
export function buildRegionRisk(dataset) {
  const out = {};
  const adm1 = dataset?.subnational?.adm1 || {};
  for (const [regionName, districts] of Object.entries(adm1)) {
    const risks = (districts || []).map((d) => d.risk).filter((r) => typeof r === 'number');
    const mean = risks.length ? risks.reduce((s, r) => s + r, 0) / risks.length : null;
    out[normRegion(regionName)] = { name: regionName, risk: mean == null ? null : Math.round(mean * 10) / 10 };
  }
  return out;
}
