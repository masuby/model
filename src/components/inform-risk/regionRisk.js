// Region-level risk derived from the curated district dataset, plus the INFORM
// 5-class colour scale. Used by the regional choropleth map.

// INFORM risk classification (0–10) — same bands/colours as the dataset.
export function classifyRisk(score) {
  if (score == null || Number.isNaN(score)) return { level: 'No data', color: '#cbd5e1', range: '—' };
  if (score < 2.0) return { level: 'Very Low',  color: '#43A047', range: '0.0–1.9' };
  if (score < 3.5) return { level: 'Low',        color: '#8BC34A', range: '2.0–3.4' };
  if (score < 5.0) return { level: 'Medium',     color: '#FFC107', range: '3.5–4.9' };
  if (score < 6.5) return { level: 'High',       color: '#FF9800', range: '5.0–6.4' };
  return { level: 'Very High', color: '#F44336', range: '6.5–10.0' };
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
