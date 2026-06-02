// Risk presentation model — the full INFORM hierarchy (dimension → component →
// indicator) for Tanzania districts, plus the metric resolver the explorer uses
// to colour the map/table by overall risk, a dimension, or any single indicator.
// All values are authentic, straight from the country-model workbook.

import riskDataset from '../../data/tanzania-inform-risk.json';
import { classifyRisk, normRegion } from './regionRisk';
import { getOverrides } from './overrideStore';
import { sourceFor } from './indicatorSources';

export { classifyRisk, normRegion };
export const DATASET = riskDataset;
export const DISTRICTS = riskDataset.subnational?.adm2 || [];
export const NATIONAL = riskDataset.national;
export const round1 = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : null);

// Full hierarchy: each dimension → its components → each component's indicators.
// `path` returns the component object on a district; indicator `k` is the field.
export const DIMENSION_TREE = {
  hazard: {
    label: 'Hazard & Exposure',
    total: (d) => d.hazardExposure?.total,
    components: [
      {
        name: 'Natural hazards', path: (d) => d.hazardExposure?.natural,
        indicators: [
          { k: 'drought', label: 'Drought' }, { k: 'flood', label: 'Flood' },
          { k: 'earthquake', label: 'Earthquake' }, { k: 'landslide', label: 'Landslide' },
          { k: 'wildfire', label: 'Wildfire' }, { k: 'stormsCyclone', label: 'Storms & Cyclone' },
          { k: 'coastalHazards', label: 'Coastal hazards' }, { k: 'heatwave', label: 'Heatwave' },
          { k: 'lightning', label: 'Lightning' }, { k: 'environmentalDegradation', label: 'Env. Degradation' },
          { k: 'volcano', label: 'Volcano' }, { k: 'zoonoses', label: 'Zoonoses, Plants & Pests' },
        ],
      },
      {
        name: 'Human hazards', path: (d) => d.hazardExposure?.human,
        indicators: [
          { k: 'conflictIntensity', label: 'Conflict Intensity' }, { k: 'conflictRisk', label: 'Conflict Risk' },
          { k: 'hazardousMaterial', label: 'Hazardous Material' }, { k: 'internalViolence', label: 'Internal Violence' },
          { k: 'vehicleAccidents', label: 'Vehicle Accidents' },
        ],
      },
    ],
  },
  vulnerability: {
    label: 'Vulnerability',
    total: (d) => d.vulnerability?.total,
    components: [
      {
        name: 'Socio-economic', path: (d) => d.vulnerability?.socioEconomic,
        indicators: [
          { k: 'developmentPoverty', label: 'Development & Poverty' }, { k: 'economicDependency', label: 'Economic Dependency' },
          { k: 'habitat', label: 'Habitat' }, { k: 'livelihoods', label: 'Livelihoods' },
        ],
      },
      {
        name: 'Vulnerable groups', path: (d) => d.vulnerability?.vulnerableGroups,
        indicators: [
          { k: 'displacedPeople', label: 'Displaced People' }, { k: 'healthConditions', label: 'Health Conditions' },
          { k: 'childrenHealthNutrition', label: 'Children Health & Nutrition' }, { k: 'economic', label: 'Economic' },
        ],
      },
    ],
  },
  coping: {
    label: 'Lack of Coping Capacity',
    total: (d) => d.lackCopingCapacity?.total,
    components: [
      {
        name: 'Infrastructure', path: (d) => d.lackCopingCapacity?.infrastructure,
        indicators: [
          { k: 'accessHealth', label: 'Access to Health Care' }, { k: 'economicCapacity', label: 'Economic Capacity' },
          { k: 'wash', label: 'WASH' }, { k: 'communication', label: 'Communication' }, { k: 'education', label: 'Education' },
        ],
      },
      {
        name: 'Institutional', path: (d) => d.lackCopingCapacity?.institutional,
        indicators: [
          { k: 'drrImplementation', label: 'DRR Implementation' }, { k: 'governance', label: 'Governance' },
        ],
      },
    ],
  },
};

export const DIM_KEYS = ['hazard', 'vulnerability', 'coping'];

// Resolve a metric key into { key, label, scope, get }.
//   'risk'                 → overall INFORM risk
//   'dim:<dim>'            → a dimension total
//   'ind:<dim>:<indKey>'   → a single indicator within a dimension
export function getMetric(metricKey) {
  if (!metricKey || metricKey === 'risk') {
    return { key: 'risk', label: 'Overall INFORM Risk', scope: 'risk', get: (d) => d.risk };
  }
  if (metricKey.startsWith('dim:')) {
    const dim = metricKey.slice(4);
    const t = DIMENSION_TREE[dim];
    return { key: metricKey, label: t.label, scope: dim, get: t.total };
  }
  if (metricKey.startsWith('ind:')) {
    const [, dim, k] = metricKey.split(':');
    const t = DIMENSION_TREE[dim];
    for (const c of t.components) {
      const ind = c.indicators.find((x) => x.k === k);
      if (ind) return { key: metricKey, label: ind.label, scope: dim, component: c.name, get: (d) => c.path(d)?.[k] };
    }
  }
  return { key: 'risk', label: 'Overall INFORM Risk', scope: 'risk', get: (d) => d.risk };
}

// The dimension a metric belongs to (for highlighting the active chip).
export const scopeOf = (metricKey) =>
  metricKey === 'risk' || !metricKey ? 'risk' : metricKey.split(':')[1];

// ---- map join helpers (used by the choropleth) ----------------------------
export const districtKey = (distName, regName) => `${normRegion(distName)}|${normRegion(regName)}`;
export const DISTRICT_BY_KEY = (() => {
  const idx = {};
  for (const d of DISTRICTS) idx[districtKey(d.admin.adm2Name, d.admin.adm1Name)] = d;
  return idx;
})();

// ---- aggregation to region / national level -------------------------------
// Region and national "units" share the district shape (nested dimension →
// component → indicator means), so every lens/indicator/chart works unchanged.
const mean = (a) => { const xs = a.filter((v) => typeof v === 'number'); return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null; };
function deepMean(objs) {
  const valid = objs.filter(Boolean);
  if (!valid.length) return null;
  const out = {}; const keys = new Set();
  valid.forEach((o) => Object.keys(o).forEach((k) => keys.add(k)));
  for (const k of keys) {
    const vals = valid.map((o) => o[k]).filter((v) => v != null);
    if (!vals.length) { out[k] = null; continue; }
    if (typeof vals[0] === 'number') out[k] = mean(vals);
    else if (typeof vals[0] === 'object') out[k] = deepMean(vals);
  }
  return out;
}
function aggregateUnit(list, name, regionName, code) {
  return {
    admin: { adm2Name: name, adm1Name: regionName, adm2Code: code, iso3: 'TZA' },
    hazardExposure: deepMean(list.map((d) => d.hazardExposure)),
    vulnerability: deepMean(list.map((d) => d.vulnerability)),
    lackCopingCapacity: deepMean(list.map((d) => d.lackCopingCapacity)),
    risk: mean(list.map((d) => d.risk)),
  };
}
// Apply locally-saved edits (PMO/Admin direct or PMO-approved sector edits) BEFORE
// aggregating regions/national, so the whole system — map, indicator lens, charts,
// tables, severity baseline — reflects them. Indicator edits recompute component
// aggregates + dimension totals (mean); risk recomputes as ∛(H × V × LCC).
const r1 = (v) => Math.round(v * 10) / 10;
const setTotal = {
  hazard: (d, v) => { if (d.hazardExposure) d.hazardExposure.total = v; },
  vulnerability: (d, v) => { if (d.vulnerability) d.vulnerability.total = v; },
  coping: (d, v) => { if (d.lackCopingCapacity) d.lackCopingCapacity.total = v; },
};
const DIRECT = { hazard: 'hazard', vulnerability: 'vuln', coping: 'cope' };
// INFORM scaled geometric mean (Excel Box 6 / informCalculationEngine) — the authentic
// category→dimension aggregation: a low category drags the dimension down (geometric).
const sgm = (a) => {
  const xs = a.filter((x) => typeof x === 'number' && isFinite(x));
  if (!xs.length) return null;
  const sc = xs.map((x) => ((10 - x) / 10 * 9) + 1);
  return (10 - Math.exp(sc.reduce((s, x) => s + Math.log(x), 0) / sc.length)) / 9 * 10;
};
(function applyEdits() {
  const ovr = getOverrides();
  if (!ovr || !Object.keys(ovr).length) return;
  DISTRICTS.forEach((d) => {
    const o = ovr[d.admin?.adm2Code];
    if (!o) return;
    // Exposure edit → flood = max(hazard, √(hazard × exposure)). Exposure only AMPLIFIES;
    // it never lowers the documented/observed flood hazard (hf) — a known flood area stays flagged.
    if (typeof o.exposure === 'number' && d.hazardExposure) {
      d.hazardExposure.exposure = { ...(d.hazardExposure.exposure || {}), index: o.exposure };
      const hf = d.hazardExposure.hazardFreq?.flood;
      const floodEdited = o.ind && 'hazard:flood' in o.ind;
      if (typeof hf === 'number' && !floodEdited && d.hazardExposure.natural) {
        d.hazardExposure.natural.flood = r1(Math.max(hf, Math.sqrt(hf * Math.max(o.exposure, 0))));
      }
    }
    // Apply edited indicator leaves.
    if (o.ind) for (const [key, val] of Object.entries(o.ind)) {
      const [dim, k] = key.split(':'); const tree = DIMENSION_TREE[dim]; if (!tree) continue;
      for (const comp of tree.components) { const obj = comp.path(d); if (obj && k in obj) { obj[k] = val; break; } }
    }
    // Recompute the AUTHENTIC way: category = MEAN of indicators, dimension = scaled GEOMEAN.
    for (const dim of DIM_KEYS) {
      const edited = (o.ind && Object.keys(o.ind).some((kk) => kk.startsWith(dim + ':'))) || (dim === 'hazard' && typeof o.exposure === 'number');
      if (edited) {
        const aggs = [];
        for (const comp of DIMENSION_TREE[dim].components) {
          const obj = comp.path(d); if (!obj) continue;
          const vals = comp.indicators.map((ind) => obj[ind.k]).filter((x) => typeof x === 'number');
          if (vals.length) { obj.aggregate = r1(mean(vals)); aggs.push(obj.aggregate); }
          else if (typeof obj.aggregate === 'number') aggs.push(obj.aggregate);
        }
        if (aggs.length) setTotal[dim](d, r1(sgm(aggs)));
      }
      if (typeof o[DIRECT[dim]] === 'number') setTotal[dim](d, o[DIRECT[dim]]); // explicit total edit wins
    }
    const h = d.hazardExposure?.total, v = d.vulnerability?.total, c = d.lackCopingCapacity?.total;
    if ([h, v, c].every((x) => typeof x === 'number')) d.risk = r1(Math.cbrt(h * v * c));
    // Provenance for viewing (per-indicator edit source; registry default applied at view time).
    if (o.indSrc) d._prov = { ...(d._prov || {}), ...o.indSrc };
    if (typeof o.exposure === 'number' && o.expSrc) d._prov = { ...(d._prov || {}), 'hazard:exposure': o.expSrc };
  });
})();

// Resolve an indicator's data source on a unit: a Data-Entry edit's stamped source if
// present, else the registry baseline (indicatorSources). dim = hazard|vulnerability|coping.
export function provenanceFor(unit, dim, k) {
  const e = unit?._prov?.[`${dim}:${k}`];
  return e ? { ...e, edited: true } : { ...sourceFor(dim, k), edited: false };
}

export const REGION_UNITS = (() => {
  const by = {};
  DISTRICTS.forEach((d) => { (by[d.admin.adm1Name] = by[d.admin.adm1Name] || []).push(d); });
  return Object.entries(by).map(([name, list]) => aggregateUnit(list, name, name, `R-${name}`));
})();
export const NATIONAL_UNIT = aggregateUnit(DISTRICTS, 'Tanzania', 'Tanzania', 'TZ');
export const REGION_BY_KEY = (() => {
  const idx = {};
  REGION_UNITS.forEach((u) => { idx[normRegion(u.admin.adm2Name)] = u; });
  return idx;
})();
export const LEVELS = [
  { key: 'district', label: 'District (ADM2)', unitNoun: 'districts' },
  { key: 'region', label: 'Region (ADM1)', unitNoun: 'regions' },
  { key: 'national', label: 'National', unitNoun: 'national' },
];
export function unitsForLevel(level) {
  return level === 'region' ? REGION_UNITS : level === 'national' ? [NATIONAL_UNIT] : DISTRICTS;
}
