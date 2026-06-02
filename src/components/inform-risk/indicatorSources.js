/**
 * indicatorSources — the data-source / provenance layer for every INFORM indicator.
 *
 * Two levels:
 *   1. A baseline AUTHORITY + dataset + method per indicator (this file) — the
 *      institution responsible and how the value was derived. Shown on the map
 *      tooltip and district detail so a viewer always knows where a number came from.
 *   2. A per-edit override stamped from Data Entry (see overrideStore `indSrc`) — when
 *      a sector/ministry updates an indicator, that authority + date supersedes the
 *      baseline on view ("Updated by MoW · 2026-06").
 *
 * Indicators are keyed `${dim}:${k}` (dim = hazard|vulnerability|coping; k = the leaf,
 * e.g. drought, developmentPoverty, wash). `exposure` is the population term that, with
 * the physical hazard, forms INFORM's Hazard × Exposure.
 */

// Responsible institutions (short label + full name) for chips/tooltips.
export const AUTHORITIES = {
  NBS: { label: 'NBS', full: 'National Bureau of Statistics' },
  TMA: { label: 'TMA', full: 'Tanzania Meteorological Authority' },
  MOA: { label: 'MoA', full: 'Ministry of Agriculture' },
  MOW: { label: 'MoW', full: 'Ministry of Water' },
  MOH: { label: 'MoH', full: 'Ministry of Health' },
  PMO: { label: 'PMO-DMD', full: "Prime Minister's Office — Disaster Management Dept" },
  DRRC: { label: 'DRR Coordinator', full: 'Regional / District DRR Coordinator' },
  MUCHALI: { label: 'MUCHALI / IPC', full: 'Tanzania Food Security & Nutrition Analysis System (IPC)' },
  CHC: { label: 'CHC / ECMWF', full: 'CHIRPS v3 rainfall + ERA5 temperature (computed)' },
  INFORM: { label: 'INFORM SADC', full: 'INFORM Sub-national SADC 2024 baseline' },
};

// Baseline source per indicator. `by` = lead authority; `also` = contributing ones.
export const INDICATOR_SOURCE = {
  // Hazard & Exposure — climate-computed where possible
  'hazard:drought': { by: 'TMA', also: ['MOA', 'CHC'], dataset: 'CHIRPS v3 (1991–2024) + ERA5 t2m', method: 'SPI-12 & SPEI-12 drought frequency × exposure' },
  'hazard:flood': { by: 'PMO', also: ['TMA', 'MOW'], dataset: 'CHIRPS v3 daily + recorded floods', method: '>50/>100 mm event counts + events × exposure' },
  'hazard:landslide': { by: 'TMA', also: ['PMO'], dataset: 'documented rainfall-triggered events (highlands)', method: 'documented overlay' },
  'hazard:coastalHazards': { by: 'TMA', also: ['PMO'], dataset: 'coastal strip exposure', method: 'documented overlay' },
  'hazard:stormsCyclone': { by: 'TMA', also: ['PMO'], dataset: 'Cyclone Hidaya 2024, Lindi cyclone 1952, Zanzibar 1872', method: 'documented cyclone/storm exposure overlay (coastal)' },
  'hazard:heatwave': { by: 'TMA', dataset: 'ERA5 t2m climatology', method: 'temperature-based heat exposure (capped, computed)' },
  'hazard:lightning': { by: 'TMA', dataset: 'Lake Victoria basin (NASA LIS/OTD flash density)', method: 'documented lightning-hotspot overlay' },
  'hazard:volcano': { by: 'TMA', also: ['PMO'], dataset: 'Ol Doinyo Lengai, Rungwe, Kilimanjaro/Meru', method: 'documented volcanism overlay' },
  'hazard:zoonoses': { by: 'MOA', also: ['MOH'], dataset: '2020 desert locust, armyworm, livestock disease', method: 'documented overlay' },
  'hazard:earthquake': { by: 'TMA', also: ['PMO'], dataset: 'East African Rift seismicity; 2016 Kagera Mw5.9', method: 'rift-proximity overlay (USGS refine pending)' },
  'hazard:wildfire': { by: 'TMA', also: ['PMO'], dataset: 'miombo dry-season fire regime', method: 'documented overlay (MODIS/VIIRS pending)' },
  'hazard:vehicleAccidents': { by: 'PMO', also: ['TMA'], dataset: 'highway corridors + urban traffic', method: 'documented overlay' },
  'hazard:hazardousMaterial': { by: 'PMO', dataset: 'industrial / mining / gas-petroleum sites', method: 'documented overlay' },
  'hazard:exposure': { by: 'NBS', dataset: '2022 PHC population', method: 'population density (rank-normalised)' },
  // Vulnerability
  'vulnerability:developmentPoverty': { by: 'NBS', dataset: 'Household Budget Survey 2017/18', method: 'poverty headcount' },
  'vulnerability:childrenHealthNutrition': { by: 'MOH', also: ['NBS'], dataset: 'TDHS-MIS 2022', method: 'under-5 stunting' },
  'vulnerability:livelihoods': { by: 'MUCHALI', also: ['MOA'], dataset: 'IPC / MUCHALI acute food-insecurity rounds', method: 'food-insecurity phase' },
  'vulnerability:habitat': { by: 'NBS', dataset: '2022 PHC housing', method: 'housing & services' },
  // Lack of coping capacity — resources available
  'coping:wash': { by: 'MOW', dataset: '2022 PHC water points & boreholes', method: 'resource availability (rank-normalised)' },
  'coping:accessHealth': { by: 'MOH', dataset: '2022 PHC health facilities', method: 'resource availability' },
  'coping:education': { by: 'NBS', also: ['MOH'], dataset: '2022 PHC schools', method: 'resource availability' },
  'coping:drrImplementation': { by: 'PMO', also: ['DRRC'], dataset: 'EPRP / EOCC / Anticipatory-Action records', method: 'DRM investment overlay' },
  'coping:governance': { by: 'PMO', dataset: 'INFORM SADC governance', method: 'baseline' },
};

export const DEFAULT_SOURCE = { by: 'INFORM', dataset: 'INFORM Sub-national SADC 2024', method: 'baseline' };

const norm = (s) => String(s || '').toLowerCase();
const dimAlias = (d) => (norm(d).startsWith('vuln') ? 'vulnerability' : norm(d).startsWith('cop') || norm(d).startsWith('lack') ? 'coping' : 'hazard');

// Baseline source descriptor for an indicator (dim, leaf key).
export function sourceFor(dim, k) {
  return INDICATOR_SOURCE[`${dimAlias(dim)}:${k}`] || DEFAULT_SOURCE;
}

// From a metric key as produced by getMetric: 'ind:<dim>:<k>' | 'dim:<dim>' | 'risk'.
export function sourceForMetricKey(metricKey) {
  if (!metricKey || metricKey === 'risk') return null;
  if (metricKey.startsWith('ind:')) { const [, dim, k] = metricKey.split(':'); return sourceFor(dim, k); }
  return null;
}

// One-line human label, e.g. "TMA · CHIRPS v3 (1991–2024) + ERA5 t2m".
export function sourceLabel(src) {
  if (!src) return '';
  const a = AUTHORITIES[src.by]?.label || src.by;
  const extra = (src.also || []).map((x) => AUTHORITIES[x]?.label || x).join(', ');
  const who = extra ? `${a} (+${extra})` : a;
  return src.dataset ? `${who} · ${src.dataset}` : who;
}
