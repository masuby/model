/**
 * The lead sectors of every indicator group: who acts on a high score. The list here is a proposal from
 * the mandates of the ministries, agencies and the councils; the national action library (PMO-DMD writes
 * through the Data portal's Committee desk, the NDRRC reviews) sets the sectors of a group when it has an
 * entry (`leadSectors`), and the detailed risk card shows those first. Names: `sectors.*` in common.json.
 */
import type { DimensionKey } from '@/engine/risk/hierarchy';

export const SECTOR_KEYS = [
  'pmo',
  'poralg',
  'tma',
  'water',
  'works',
  'lands',
  'agriculture',
  'health',
  'education',
  'environment',
  'forestry',
  'fire',
  'energy',
  'tcra',
  'finance',
  'social',
  'police',
  'home',
  'transport',
  'industry',
  'gst',
] as const;
export type SectorKey = (typeof SECTOR_KEYS)[number];

const LEADS: Record<string, readonly SectorKey[]> = {
  // Hazard & Exposure
  'hazard:coastalHazards': ['environment', 'works', 'lands'],
  'hazard:drought': ['agriculture', 'water', 'pmo'],
  'hazard:earthquake': ['gst', 'works', 'lands'],
  'hazard:environmentalDegradation': ['environment', 'forestry', 'agriculture'],
  'hazard:flood': ['water', 'works', 'lands', 'poralg'],
  'hazard:heatwave': ['health', 'tma', 'poralg'],
  'hazard:landslide': ['lands', 'works', 'gst'],
  'hazard:lightning': ['tma', 'education', 'energy'],
  'hazard:stormsCyclone': ['tma', 'works', 'lands'],
  'hazard:volcano': ['gst', 'pmo'],
  'hazard:wildfire': ['forestry', 'fire', 'poralg'],
  'hazard:zoonoses': ['health', 'agriculture'],
  'hazard:conflictIntensity': ['home', 'police', 'poralg'],
  'hazard:conflictRisk': ['home', 'police', 'poralg'],
  'hazard:hazardousMaterial': ['environment', 'industry', 'fire'],
  'hazard:internalViolence': ['home', 'police'],
  'hazard:vehicleAccidents': ['police', 'works', 'transport', 'health'],
  // Vulnerability
  'vulnerability:developmentPoverty': ['finance', 'social', 'poralg'],
  'vulnerability:economicDependency': ['finance', 'industry'],
  'vulnerability:habitat': ['lands', 'poralg'],
  'vulnerability:livelihoods': ['agriculture', 'social'],
  'vulnerability:displacedPeople': ['pmo', 'home', 'poralg'],
  'vulnerability:healthConditions': ['health'],
  'vulnerability:childrenHealthNutrition': ['health', 'social'],
  'vulnerability:economic': ['finance', 'industry'],
  // Lack of Coping Capacity
  'coping:accessHealth': ['health', 'poralg'],
  'coping:economicCapacity': ['finance', 'poralg'],
  'coping:wash': ['water', 'health', 'poralg'],
  'coping:communication': ['tcra', 'energy', 'works'],
  'coping:education': ['education', 'poralg'],
  'coping:drrImplementation': ['pmo', 'poralg'],
  'coping:governance': ['pmo', 'poralg'],
};

/** The lead sectors of a group (PMO-DMD and the councils when none is recorded). */
export function sectorsFor(dim: DimensionKey, key: string): readonly SectorKey[] {
  return LEADS[`${dim}:${key}`] ?? ['pmo', 'poralg'];
}
