/**
 * The INFORM Risk hierarchy as used for Tanzania (INFORM Sub-national SADC 2024 structure):
 *   Dimension → Category → Indicator group ("component" in the workbook).
 * The leaf keys match the dataset fields in `src/data/tanzania-inform-risk.json`.
 * Display labels live in the i18n catalogue (`indicators.<key>`); `en` here is the canonical
 * English name used for exports and for mapping workbook component names onto leaves.
 */
import type { Scale } from './classes';

export type DimensionKey = 'hazard' | 'vulnerability' | 'coping';

export interface IndicatorDef {
  key: string;
  en: string;
  /** Workbook component name(s) that feed this leaf (for raw-value entry via the spec). */
  workbook: string[];
}
export interface CategoryDef {
  key: string;
  en: string;
  indicators: IndicatorDef[];
}
export interface DimensionDef {
  key: DimensionKey;
  en: string;
  /** Field name on the source dataset units. */
  field: 'hazardExposure' | 'vulnerability' | 'lackCopingCapacity';
  scale: Scale;
  categories: CategoryDef[];
}

const ind = (key: string, en: string, workbook: string[] = [en]): IndicatorDef => ({ key, en, workbook });

export const DIMENSIONS: readonly DimensionDef[] = [
  {
    key: 'hazard',
    en: 'Hazard & Exposure',
    field: 'hazardExposure',
    scale: 'hazard',
    categories: [
      {
        key: 'natural',
        en: 'Natural hazards',
        indicators: [
          ind('coastalHazards', 'Coastal hazards'),
          ind('drought', 'Drought'),
          ind('earthquake', 'Earthquake'),
          ind('environmentalDegradation', 'Environmental degradation'),
          ind('flood', 'Flood'),
          ind('heatwave', 'Heatwave'),
          ind('landslide', 'Landslide'),
          ind('lightning', 'Lightning'),
          ind('stormsCyclone', 'Storms & cyclones', ['Storms & Cyclone', 'Storms and Cyclone']),
          ind('volcano', 'Volcano'),
          ind('wildfire', 'Wildfire'),
          ind('zoonoses', 'Zoonoses, plants & pests', ['Zoonoses, Plants & Pests', 'Zoonoses, Plants and Pests']),
        ],
      },
      {
        key: 'human',
        en: 'Human hazards',
        indicators: [
          ind('conflictIntensity', 'Conflict intensity'),
          ind('conflictRisk', 'Conflict risk'),
          ind('hazardousMaterial', 'Hazardous material'),
          ind('internalViolence', 'Internal violence'),
          ind('vehicleAccidents', 'Vehicle accidents'),
        ],
      },
    ],
  },
  {
    key: 'vulnerability',
    en: 'Vulnerability',
    field: 'vulnerability',
    scale: 'vulnerability',
    categories: [
      {
        key: 'socioEconomic',
        en: 'Socio-economic vulnerability',
        indicators: [
          ind('developmentPoverty', 'Development & poverty', ['Development & Poverty', 'Development and Poverty']),
          ind('economicDependency', 'Economic dependency'),
          ind('habitat', 'Habitat'),
          ind('livelihoods', 'Livelihoods'),
        ],
      },
      {
        key: 'vulnerableGroups',
        en: 'Vulnerable groups',
        indicators: [
          ind('displacedPeople', 'Displaced people'),
          ind('healthConditions', 'Health conditions'),
          ind('childrenHealthNutrition', 'Children health & nutrition', ['Children Health and Nutrition', 'Children Health & Nutrition']),
          ind('economic', 'Economic (vulnerable groups)', ['Economic', 'Ecomonic']),
        ],
      },
    ],
  },
  {
    key: 'coping',
    en: 'Lack of Coping Capacity',
    field: 'lackCopingCapacity',
    scale: 'coping',
    categories: [
      {
        key: 'infrastructure',
        en: 'Infrastructure',
        indicators: [
          ind('accessHealth', 'Access to health care'),
          ind('economicCapacity', 'Economic capacity'),
          ind('wash', 'WASH', ['WASH', 'Water, Sanitation & Hygiene']),
          ind('communication', 'Communication'),
          ind('education', 'Education'),
        ],
      },
      {
        key: 'institutional',
        en: 'Institutional',
        indicators: [ind('drrImplementation', 'DRR implementation'), ind('governance', 'Governance')],
      },
    ],
  },
];

export const DIMENSION_KEYS: readonly DimensionKey[] = ['hazard', 'vulnerability', 'coping'];
export const DIMENSION_BY_KEY: Record<DimensionKey, DimensionDef> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.key, d]),
) as Record<DimensionKey, DimensionDef>;

/** `${dimension}:${indicator}` - the stable key for an indicator leaf (edits, sources, i18n). */
export type IndicatorRef = `${DimensionKey}:${string}`;
export const indicatorRef = (dim: DimensionKey, key: string): IndicatorRef => `${dim}:${key}`;

export interface IndicatorLocation {
  dimension: DimensionDef;
  category: CategoryDef;
  indicator: IndicatorDef;
}

/** Every leaf, flattened in canonical order. */
export const ALL_INDICATORS: readonly IndicatorLocation[] = DIMENSIONS.flatMap((dimension) =>
  dimension.categories.flatMap((category) => category.indicators.map((indicator) => ({ dimension, category, indicator }))),
);

export function findIndicator(ref: string): IndicatorLocation | null {
  const [dim, key] = ref.split(':');
  return ALL_INDICATORS.find((l) => l.dimension.key === dim && l.indicator.key === key) ?? null;
}

const norm = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');

/** Map a workbook component name (e.g. "Storms & Cyclone") onto its leaf, or null. */
export function leafForWorkbookComponent(name: string): IndicatorLocation | null {
  const n = norm(name);
  return (
    ALL_INDICATORS.find((l) => l.indicator.workbook.some((w) => norm(w) === n) || norm(l.indicator.en) === n) ??
    (n === 'environmentaldegradation' ? findIndicator('hazard:environmentalDegradation') : null)
  );
}
