// Risk presentation model - the full INFORM hierarchy (dimension → component →
// indicator) for Tanzania districts, plus the metric resolver the explorer uses
// to colour the map/table by overall risk, a dimension, or any single indicator.
// All values are authentic, straight from the country-model workbook.

import riskDataset from '../../data/tanzania-inform-risk.json';
import councilsGeo from '../../data/tanzania-councils.json';
import councilData from '../../data/tanzania-councils-data.json';
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
    label: 'Hazard and Exposure',
    total: (d) => d.hazardExposure?.total,
    components: [
      {
        name: 'Natural hazards', path: (d) => d.hazardExposure?.natural,
        indicators: [
          { k: 'drought', label: 'Drought' }, { k: 'flood', label: 'Flood' },
          { k: 'earthquake', label: 'Earthquake' }, { k: 'landslide', label: 'Landslide' },
          { k: 'wildfire', label: 'Wildfire' }, { k: 'stormsCyclone', label: 'Storms and Cyclone' },
          { k: 'coastalHazards', label: 'Coastal hazards' }, { k: 'heatwave', label: 'Heatwave' },
          { k: 'lightning', label: 'Lightning' }, { k: 'environmentalDegradation', label: 'Env. Degradation' },
          { k: 'volcano', label: 'Volcano' }, { k: 'zoonoses', label: 'Zoonoses, Plants and Pests' },
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
          { k: 'developmentPoverty', label: 'Development and Poverty' }, { k: 'economicDependency', label: 'Economic Dependency' },
          { k: 'habitat', label: 'Habitat' }, { k: 'livelihoods', label: 'Livelihoods' },
        ],
      },
      {
        name: 'Vulnerable groups', path: (d) => d.vulnerability?.vulnerableGroups,
        indicators: [
          { k: 'displacedPeople', label: 'Displaced People' }, { k: 'healthConditions', label: 'Health Conditions' },
          { k: 'childrenHealthNutrition', label: 'Children Health and Nutrition' }, { k: 'economic', label: 'Economic' },
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
const isNum = (x) => typeof x === 'number' && isFinite(x);
// Recompute a deep-meaned dimension object the AUTHENTIC INFORM way (not a flat mean of totals):
// category aggregate = mean of its (unit-averaged) indicators; dimension total = scaled geomean of
// the category aggregates. (sgm/r1 are defined below but resolved at call time - aggregateUnit only
// runs for REGION_UNITS, after they initialise.)
function recomputeDimAgg(dimObj, cats) {
  if (!dimObj) return null;
  const aggs = [];
  for (const c of cats) {
    const co = dimObj[c]; if (!co) continue;
    const m = mean(Object.entries(co).filter(([k]) => k !== 'aggregate').map(([, v]) => v));
    co.aggregate = m;
    if (isNum(m)) aggs.push(m);
  }
  dimObj.total = aggs.length ? r1(sgm(aggs)) : null;
  return dimObj;
}
function aggregateUnit(list, name, regionName, code) {
  const he = recomputeDimAgg(deepMean(list.map((d) => d.hazardExposure)), ['natural', 'human']);
  const vu = recomputeDimAgg(deepMean(list.map((d) => d.vulnerability)), ['socioEconomic', 'vulnerableGroups']);
  const cc = recomputeDimAgg(deepMean(list.map((d) => d.lackCopingCapacity)), ['infrastructure', 'institutional']);
  const h = he?.total, v = vu?.total, c = cc?.total;
  return {
    admin: { adm2Name: name, adm1Name: regionName, adm2Code: code, iso3: 'TZA' },
    hazardExposure: he, vulnerability: vu, lackCopingCapacity: cc,
    risk: [h, v, c].every(isNum) ? riskScore(h, v, c) : null,
  };
}
// Apply locally-saved edits (PMO/Admin direct or PMO-approved sector edits) BEFORE
// aggregating regions/national, so the whole system - map, indicator lens, charts,
// tables, severity baseline - reflects them. Indicator edits recompute component
// aggregates + dimension totals (mean); risk recomputes as ∛(H × V × LCC).
const r1 = (v) => Math.round(v * 10) / 10;
// INFORM risk = the literal Excel cube-root product  ROUND(H^(1/3) * V^(1/3) * LCC^(1/3), 1).
// Exported alongside sgm so the LIVE engine is guarded by the same workbook-golden fixture as the
// formal engine. No `> 0` guard: a 0 dimension yields risk 0 (0^(1/3) = 0), exactly as the workbook.
export const riskScore = (h, v, c) => r1(Math.pow(h, 1 / 3) * Math.pow(v, 1 / 3) * Math.pow(c, 1 / 3));
const setTotal = {
  hazard: (d, v) => { if (d.hazardExposure) d.hazardExposure.total = v; },
  vulnerability: (d, v) => { if (d.vulnerability) d.vulnerability.total = v; },
  coping: (d, v) => { if (d.lackCopingCapacity) d.lackCopingCapacity.total = v; },
};
const DIRECT = { hazard: 'hazard', vulnerability: 'vuln', coping: 'cope' };
// INFORM scaled geometric mean — written EXACTLY as the Excel "INFORM SADC 2024" dimension cell
// (Z4/AK4/AU4), read from the workbook's hidden engine sheets:
//   dimension = ROUND( (10 - GEOMEAN( (10-c)/10*9+1  for each category c )) / 9 * 10 , 1 )
//   where GEOMEAN(x1..xn) = (x1 * x2 * ... * xn)^(1/n)   ← product form, the literal Excel expression.
// (the ROUND to 1 dp is applied by the caller via r1, matching the workbook.)
export const sgm = (a) => {
  const xs = a.filter((x) => typeof x === 'number' && isFinite(x));
  if (!xs.length) return null;
  const sc = xs.map((x) => ((10 - x) / 10 * 9) + 1);          // (10 - c)/10 * 9 + 1
  return (10 - Math.pow(sc.reduce((p, x) => p * x, 1), 1 / sc.length)) / 9 * 10;  // (10 - GEOMEAN)/9*10
};
(function applyEdits() {
  const ovr = getOverrides();
  if (!ovr || !Object.keys(ovr).length) return;
  DISTRICTS.forEach((d) => {
    const o = ovr[d.admin?.adm2Code];
    if (!o) return;
    // Exposure edit → flood = max(hazard, √(hazard × exposure)). Exposure only AMPLIFIES;
    // it never lowers the documented/observed flood hazard (hf) - a known flood area stays flagged.
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
    if ([h, v, c].every((x) => typeof x === 'number')) d.risk = riskScore(h, v, c);
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

// Missing-data treatment, INFORM-style: a `null` indicator means NO DATA and is EXCLUDED from
// every aggregation (mean/scaled-geomean filter to finite numbers); a `0` means a real measured
// zero (e.g. no coastal-hazard exposure inland) and is included. dataCoverage reports the share
// of the model's leaf indicators that actually have data for a unit - its reliability.
export function dataCoverage(unit) {
  let have = 0, total = 0;
  for (const dim of DIM_KEYS) for (const comp of DIMENSION_TREE[dim].components) {
    const obj = comp.path(unit);
    for (const ind of comp.indicators) { total++; if (typeof obj?.[ind.k] === 'number' && isFinite(obj[ind.k])) have++; }
  }
  return total ? Math.round((have / total) * 100) : null;
}

export const REGION_UNITS = (() => {
  const by = {};
  DISTRICTS.forEach((d) => { (by[d.admin.adm1Name] = by[d.admin.adm1Name] || []).push(d); });
  return Object.entries(by).map(([name, list]) => aggregateUnit(list, name, name, `R-${name}`));
})();
// National unit = the OFFICIAL INFORM Tanzania country values (risk 4.1) straight from the
// country model - the authoritative reference, NOT a re-aggregation of the sub-national units
// (which would drift toward a 170/195-mean). National figures are kept official per INFORM.
export const NATIONAL_UNIT = {
  admin: { adm2Name: 'Tanzania', adm1Name: 'Tanzania', adm2Code: 'TZ', iso3: 'TZA' },
  hazardExposure: NATIONAL.dimensions.hazardExposure,
  vulnerability: NATIONAL.dimensions.vulnerability,
  lackCopingCapacity: NATIONAL.dimensions.lackCopingCapacity,
  risk: NATIONAL.risk,
};
export const REGION_BY_KEY = (() => {
  const idx = {};
  REGION_UNITS.forEach((u) => { idx[normRegion(u.admin.adm2Name)] = u; });
  return idx;
})();
// Council / LGA level - the REAL 195 NBS-2022 councils. Each council shows its matched INFORM
// unit's profile; the 28 new/split councils inherit their parent district's data (flagged
// `_inherited`) until council-specific data exists. (Reconciliation in scripts/export-councils.py.)
const ADM2_BY_NAME = (() => { const idx = {}; for (const d of DISTRICTS) idx[normRegion(d.admin.adm2Name)] = d; return idx; })();
export const COUNCIL_UNITS = (councilsGeo.features || []).map((f) => {
  const p = f.properties; const src = ADM2_BY_NAME[normRegion(p.src)];
  if (!src) return null;
  // Council-specific Hazard and Exposure, computed on this council's OWN polygon (CHIRPS v3 drought/
  // heavy-rain, ERA5 heat, NBS-2022 council population ÷ council area), floored at the district's
  // documented level (raise-only). Vulnerability and Coping stay district-level (survey resolution -
  // HBS/TDHS/IPC have no council breakdown), so councils sharing a district share those.
  const cd = councilData[String(p.code)];
  return {
    admin: { adm2Name: p.name, adm1Name: p.reg, adm2Code: p.code, iso3: 'TZA' },
    hazardExposure: cd?.hazardExposure || src.hazardExposure,
    vulnerability: src.vulnerability,
    lackCopingCapacity: src.lackCopingCapacity,
    risk: cd?.risk ?? src.risk,
    facilities: src.facilities, drr: src.drr,
    _inherited: p.isNew ? (p.parent || src.admin.adm2Name) : null, _councilCode: String(p.code),
    _councilHazard: !!cd,
    // The underlying INFORM source (170) unit this council's Vulnerability and Coping come from. Data-
    // Entry edits are keyed by _srcCode so they flow through the 170-resolution backbone to every
    // council that shares this source (we never fabricate per-council survey splits).
    _srcCode: src.admin.adm2Code, _srcName: src.admin.adm2Name,
  };
}).filter(Boolean);
export const COUNCIL_BY_CODE = (() => { const idx = {}; COUNCIL_UNITS.forEach((u) => { idx[u._councilCode] = u; }); return idx; })();

// Levels, in canonical order. The REAL NBS-2022 administrative structure is the
// default the model speaks in: 195 councils → 31 regions → the official national
// INFORM value. The 170 INFORM units remain available as the *source/reference*
// resolution (the country workbook the councils are built from) - never the headline.
export const LEVELS = [
  { key: 'council', label: 'Council / LGA - NBS 2022 (195)', unitNoun: 'councils' },
  { key: 'region', label: 'Region (31)', unitNoun: 'regions' },
  { key: 'national', label: 'National - official INFORM', unitNoun: 'national' },
  { key: 'district', label: 'INFORM source units (170) - reference', unitNoun: 'INFORM units' },
];
export function unitsForLevel(level) {
  return level === 'council' ? COUNCIL_UNITS : level === 'region' ? REGION_UNITS : level === 'national' ? [NATIONAL_UNIT] : DISTRICTS;
}
