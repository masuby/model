// Risk presentation model — turns the curated district JSON into the metrics,
// hazard lenses and accessors the redesigned district explorer renders.
// All values are authentic (straight from the INFORM country-model workbook);
// nothing is simulated.

import riskDataset from '../../data/tanzania-inform-risk.json';
import { classifyRisk, normRegion } from './regionRisk';

export { classifyRisk };
export const DATASET = riskDataset;
export const DISTRICTS = riskDataset.subnational?.adm2 || [];
export const NATIONAL = riskDataset.national;

// Natural-hazard lenses — keys match hazardExposure.natural in the data.
export const HAZARDS = [
  { key: 'drought', label: 'Drought', icon: '☀️' },
  { key: 'flood', label: 'Flood', icon: '🌊' },
  { key: 'earthquake', label: 'Earthquake', icon: '🏔️' },
  { key: 'landslide', label: 'Landslide', icon: '⛰️' },
  { key: 'wildfire', label: 'Wildfire', icon: '🔥' },
  { key: 'stormsCyclone', label: 'Storms & Cyclone', icon: '🌀' },
  { key: 'coastalHazards', label: 'Coastal Hazards', icon: '🏖️' },
  { key: 'heatwave', label: 'Heatwave', icon: '🌡️' },
  { key: 'lightning', label: 'Lightning', icon: '⚡' },
  { key: 'environmentalDegradation', label: 'Env. Degradation', icon: '🏜️' },
  { key: 'volcano', label: 'Volcano', icon: '🌋' },
  { key: 'zoonoses', label: 'Zoonoses & Pests', icon: '🦟' },
];

// Selectable map/table metrics: overall risk, the 3 dimensions, and each hazard.
export const METRICS = [
  { key: 'risk', label: 'Overall INFORM Risk', group: 'INFORM', get: (d) => d.risk },
  { key: 'hazard', label: 'Hazard & Exposure', group: 'Dimensions', get: (d) => d.hazardExposure?.total },
  { key: 'vulnerability', label: 'Vulnerability', group: 'Dimensions', get: (d) => d.vulnerability?.total },
  { key: 'coping', label: 'Lack of Coping Capacity', group: 'Dimensions', get: (d) => d.lackCopingCapacity?.total },
  ...HAZARDS.map((h) => ({
    key: `hz:${h.key}`, label: h.label, icon: h.icon, group: 'Hazard type',
    get: (d) => d.hazardExposure?.natural?.[h.key],
  })),
];

export function getMetric(metricKey) {
  return METRICS.find((m) => m.key === metricKey) || METRICS[0];
}

export const round1 = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : null);

// Join key for matching a district to a map polygon (district + region name).
export const districtKey = (distName, regName) => `${normRegion(distName)}|${normRegion(regName)}`;

// Index of districts by join key, for the map.
export const DISTRICT_BY_KEY = (() => {
  const idx = {};
  for (const d of DISTRICTS) idx[districtKey(d.admin.adm2Name, d.admin.adm1Name)] = d;
  return idx;
})();
