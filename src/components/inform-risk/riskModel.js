// Risk presentation model — the full INFORM hierarchy (dimension → component →
// indicator) for Tanzania districts, plus the metric resolver the explorer uses
// to colour the map/table by overall risk, a dimension, or any single indicator.
// All values are authentic, straight from the country-model workbook.

import riskDataset from '../../data/tanzania-inform-risk.json';
import { classifyRisk, normRegion } from './regionRisk';

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

// ---- map join helpers (used by DistrictMap) -------------------------------
export const districtKey = (distName, regName) => `${normRegion(distName)}|${normRegion(regName)}`;
export const DISTRICT_BY_KEY = (() => {
  const idx = {};
  for (const d of DISTRICTS) idx[districtKey(d.admin.adm2Name, d.admin.adm1Name)] = d;
  return idx;
})();
