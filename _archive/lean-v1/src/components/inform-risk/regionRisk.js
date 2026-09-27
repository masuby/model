// Region-level risk derived from the curated district dataset, plus the INFORM
// 5-class colour scale. Used by the regional choropleth map.

// Risk classification lives in riskConstants.js (single source of truth).
export { classifyRisk } from './riskConstants';

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
