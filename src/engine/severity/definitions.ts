/**
 * INFORM Severity Index - model structure (JRC / ACAPS, "INFORM Severity Index: Concept and
 * methodology", Poljanšek et al., 2020; ACAPS data-collection manual 2024), adapted for Tanzania.
 *
 *   Severity = 70% × G(Impact 1/3, Conditions 2/3) + 30% × Complexity                  (Figure 12)
 *   Impact     = G(Geographical 1/3, Human 2/3)                                          (Figure 13)
 *   Conditions = G(People in need, Concentration of conditions)                         (Figure 15)
 *   Complexity = G(Society & safety, Operating environment)                             (Figure 16)
 * where G is INFORM's inverted/rescaled weighted geometric mean (footnote 17) and components/indicators
 * are arithmetic averages. All scores are on 0–5; the category is ROUNDUP(score) (Table 9).
 *
 * Indicator reference ranges (min/max, log where the manual scores absolute counts on a log scale) are
 * CALIBRATION PARAMETERS for sub-national Tanzanian crises; they are shown in the UI and are editable in
 * one place (this file).
 */

export type SeverityDimensionKey = 'impact' | 'conditions' | 'complexity';

export interface SeverityIndicatorDef {
  id: string;
  unit: 'people' | 'km2' | 'percent' | 'per10k' | 'score' | 'count' | 'index';
  min: number;
  max: number;
  /** Absolute counts are scored on a log10 scale (log10(1 + x)). */
  log?: boolean;
  /** true when a higher raw value means LOWER severity. */
  inverse?: boolean;
  /** Default value (e.g. a national structural indicator), with its public source. */
  default?: number;
  defaultSource?: string;
}

export interface SeverityComponentDef {
  id: string;
  indicators: SeverityIndicatorDef[];
}
export interface SeverityCategoryDef {
  id: string;
  /** Weight inside the dimension's geometric mean. */
  weight: number;
  /** How components combine into the category. */
  aggregation: 'geometric' | 'arithmetic';
  components: SeverityComponentDef[];
}
export interface SeverityDimensionDef {
  id: SeverityDimensionKey;
  categories: SeverityCategoryDef[];
}

const i = (id: string, unit: SeverityIndicatorDef['unit'], min: number, max: number, extra: Partial<SeverityIndicatorDef> = {}): SeverityIndicatorDef => ({
  id,
  unit,
  min,
  max,
  ...extra,
});

export const SEVERITY_MODEL: readonly SeverityDimensionDef[] = [
  {
    id: 'impact',
    categories: [
      {
        id: 'geographical',
        weight: 1 / 3,
        aggregation: 'geometric',
        components: [
          { id: 'affectedArea', indicators: [i('areaAffectedKm2', 'km2', 10, 100_000, { log: true }), i('areaAffectedPct', 'percent', 0, 25)] },
          { id: 'peopleInArea', indicators: [i('peopleInArea', 'people', 1_000, 10_000_000, { log: true }), i('peopleInAreaPct', 'percent', 0, 25)] },
        ],
      },
      {
        id: 'human',
        weight: 2 / 3,
        aggregation: 'geometric',
        components: [
          { id: 'peopleAffected', indicators: [i('peopleAffected', 'people', 1_000, 5_000_000, { log: true }), i('peopleAffectedPct', 'percent', 0, 100)] },
          {
            id: 'peopleByCategory',
            indicators: [
              i('displaced', 'people', 100, 1_000_000, { log: true }),
              i('displacedPct', 'percent', 0, 50),
              i('fatalities', 'people', 1, 10_000, { log: true }),
              i('fatalitiesPer10k', 'per10k', 0, 20),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'conditions',
    categories: [
      { id: 'peopleInNeed', weight: 1 / 2, aggregation: 'arithmetic', components: [{ id: 'peopleInNeed', indicators: [i('peopleInNeed', 'people', 1_000, 5_000_000, { log: true })] }] },
      { id: 'concentration', weight: 1 / 2, aggregation: 'arithmetic', components: [{ id: 'concentration', indicators: [i('concentrationLevel', 'score', 0, 5)] }] },
    ],
  },
  {
    id: 'complexity',
    categories: [
      {
        id: 'societySafety',
        weight: 1 / 2,
        aggregation: 'arithmetic',
        components: [
          {
            id: 'socialCohesion',
            indicators: [
              i('gini', 'index', 25, 65, { default: 40.5, defaultSource: 'World Bank, Gini index (HBS 2018)' }),
              i('genderInequality', 'index', 0, 0.8, { default: 0.51, defaultSource: 'UNDP Gender Inequality Index (HDR 2023/24)' }),
            ],
          },
          {
            id: 'safetySecurity',
            indicators: [
              i('conflictIntensity', 'score', 0, 5, { default: 1, defaultSource: 'HIIK Conflict Barometer scale 0–5 (analyst)' }),
              i('violenceFatalities', 'people', 1, 10_000, { log: true, default: 0, defaultSource: 'ACLED, last 12 months (analyst)' }),
            ],
          },
          {
            id: 'ruleOfLaw',
            indicators: [
              i('corruptionPerception', 'index', 0, 100, { inverse: true, default: 41, defaultSource: 'Transparency International CPI 2024' }),
              i('ruleOfLawPercentile', 'index', 0, 100, { inverse: true, default: 40, defaultSource: 'World Bank WGI Rule of Law percentile' }),
            ],
          },
        ],
      },
      {
        id: 'operatingEnvironment',
        weight: 1 / 2,
        aggregation: 'arithmetic',
        components: [
          { id: 'diversityOfGroups', indicators: [i('groupsAffected', 'count', 0, 5)] },
          {
            id: 'humanitarianAccess',
            indicators: [i('accessOfActors', 'score', 0, 3), i('accessOfPeople', 'score', 0, 3), i('physicalSecurityConstraints', 'score', 0, 3)],
          },
        ],
      },
    ],
  },
];

/** Dimension weights of the final formula (Figure 12). */
export const SEVERITY_WEIGHTS = { impactVsConditions: { impact: 1 / 3, conditions: 2 / 3 }, geo: 0.7, complexity: 0.3 } as const;

export const SEVERITY_CATEGORY_KEYS = ['veryLow', 'low', 'medium', 'high', 'veryHigh'] as const;
export type SeverityCategoryKey = (typeof SEVERITY_CATEGORY_KEYS)[number];
export const SEVERITY_COLORS: Record<SeverityCategoryKey, string> = {
  veryLow: '#fde0c5',
  low: '#facba6',
  medium: '#f59e6b',
  high: '#c2410c',
  // #b91c1c: ≥ 3:1 as a mark on both the light and the dark background, white text on it ≥ 4.5:1.
  veryHigh: '#b91c1c',
};

/** Population groups affected (IASC Humanitarian Profile) - the diversity score is their count, max 5. */
export const AFFECTED_GROUPS = ['idps', 'refugees', 'returnees', 'hostCommunities', 'nonHost'] as const;
export type AffectedGroup = (typeof AFFECTED_GROUPS)[number];

/** Levels of humanitarian conditions (Table 1). Level 1 = none/minimal … Level 5 = extreme. */
export const CONDITION_LEVELS = [5, 4, 3, 2] as const;

export const ALL_SEVERITY_INDICATORS: SeverityIndicatorDef[] = SEVERITY_MODEL.flatMap((d) =>
  d.categories.flatMap((c) => c.components.flatMap((k) => k.indicators)),
);
export const SEVERITY_INDICATOR_BY_ID: Record<string, SeverityIndicatorDef> = Object.fromEntries(ALL_SEVERITY_INDICATORS.map((x) => [x.id, x]));
