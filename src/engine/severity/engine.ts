/**
 * INFORM Severity Index engine (see definitions.ts for the model and its sources).
 * Pure functions; every intermediate score is returned so the UI can explain the result.
 */
import {
  AFFECTED_GROUPS,
  SEVERITY_CATEGORY_KEYS,
  SEVERITY_COLORS,
  SEVERITY_INDICATOR_BY_ID,
  SEVERITY_MODEL,
  SEVERITY_WEIGHTS,
  type AffectedGroup,
  type SeverityCategoryKey,
  type SeverityDimensionKey,
  type SeverityIndicatorDef,
} from './definitions';

/** National denominators (NBS 2022 Population and Housing Census; total area incl. inland water). */
export const TANZANIA_POPULATION_2022 = 61_741_120;
export const TANZANIA_AREA_KM2 = 947_303;

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const mean = (xs: Array<number | null>) => {
  const v = xs.filter(isNum);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};
const clamp5 = (x: number) => Math.max(0, Math.min(5, x));
export const round1 = (x: number) => Math.round(x * 10) / 10;

/** People by level of humanitarian conditions (Table 1). Level 1 is the remainder of people in the area. */
export interface ConditionLevels {
  5?: number | null;
  4?: number | null;
  3?: number | null;
  2?: number | null;
}

export interface SeverityInput {
  areaAffectedKm2?: number | null;
  peopleInArea?: number | null;
  peopleAffected?: number | null;
  displaced?: number | null;
  fatalities?: number | null;
  levels?: ConditionLevels;
  groups?: AffectedGroup[];
  accessOfActors?: number | null;
  accessOfPeople?: number | null;
  physicalSecurityConstraints?: number | null;
  gini?: number | null;
  genderInequality?: number | null;
  conflictIntensity?: number | null;
  violenceFatalities?: number | null;
  corruptionPerception?: number | null;
  ruleOfLawPercentile?: number | null;
  /** Reliability inputs (reported alongside, never mixed into the severity score). */
  dataReliability?: 'low' | 'medium' | 'high' | null;
  daysSinceUpdate?: number | null;
}

/** Derived raw indicator values, including the relative indicators computed from the absolutes. */
export function deriveIndicators(input: SeverityInput): Record<string, number | null> {
  const n = (x: number | null | undefined) => (isNum(x) ? x : null);
  const ratio = (a: number | null, b: number | null, k: number) => (isNum(a) && isNum(b) && b > 0 ? (a / b) * k : null);
  const peopleInArea = n(input.peopleInArea);
  const affected = n(input.peopleAffected);
  const lv = input.levels ?? {};
  const l5 = n(lv[5]) ?? 0;
  const l4 = n(lv[4]) ?? 0;
  const l3 = n(lv[3]) ?? 0;
  const l2 = n(lv[2]) ?? 0;
  const anyLevel = [lv[5], lv[4], lv[3], lv[2]].some(isNum);
  const pin = anyLevel ? l5 + l4 + l3 : null;

  // Concentration of conditions (Table 3): the level whose cumulative relative frequency, counted from
  // level 5 downward, first exceeds 5% of the people in the affected area.
  let concentration: number | null = null;
  if (anyLevel && isNum(peopleInArea) && peopleInArea > 0) {
    concentration = 1;
    let cum = 0;
    for (const [level, count] of [[5, l5], [4, l4], [3, l3], [2, l2]] as const) {
      cum += count;
      if (cum / peopleInArea > 0.05) {
        concentration = level;
        break;
      }
    }
  }

  return {
    areaAffectedKm2: n(input.areaAffectedKm2),
    areaAffectedPct: ratio(n(input.areaAffectedKm2), TANZANIA_AREA_KM2, 100),
    peopleInArea,
    peopleInAreaPct: ratio(peopleInArea, TANZANIA_POPULATION_2022, 100),
    peopleAffected: affected,
    peopleAffectedPct: ratio(affected, peopleInArea, 100),
    displaced: n(input.displaced),
    displacedPct: ratio(n(input.displaced), affected, 100),
    fatalities: n(input.fatalities),
    fatalitiesPer10k: ratio(n(input.fatalities), affected, 10_000),
    peopleInNeed: pin,
    concentrationLevel: concentration,
    gini: n(input.gini),
    genderInequality: n(input.genderInequality),
    conflictIntensity: n(input.conflictIntensity),
    violenceFatalities: n(input.violenceFatalities),
    corruptionPerception: n(input.corruptionPerception),
    ruleOfLawPercentile: n(input.ruleOfLawPercentile),
    groupsAffected: input.groups ? Math.min(5, new Set(input.groups.filter((g) => AFFECTED_GROUPS.includes(g))).size) : null,
    accessOfActors: n(input.accessOfActors),
    accessOfPeople: n(input.accessOfPeople),
    physicalSecurityConstraints: n(input.physicalSecurityConstraints),
  };
}

/** Min–max to 0–5 (log10(1 + x) for absolute counts), inverted where higher = less severe. */
export function normalise(def: SeverityIndicatorDef, raw: number | null | undefined): number | null {
  if (!isNum(raw)) return null;
  const f = def.log ? (x: number) => Math.log10(1 + Math.max(0, x)) : (x: number) => x;
  const lo = f(def.min);
  const hi = f(def.max);
  if (hi === lo) return null;
  const s = clamp5((5 * (f(raw) - lo)) / (hi - lo));
  return def.inverse ? 5 - s : s;
}

/**
 * INFORM weighted geometric average for "higher is worse" scores (methodology footnote 17):
 * invert → rescale to [1,5] → weighted geometric mean → rescale to [0,5] → invert.
 * Missing members are skipped (weights renormalised).
 */
export function informGeometric(values: Array<number | null>, weights?: number[]): number | null {
  let wsum = 0;
  let acc = 0;
  values.forEach((v, idx) => {
    if (!isNum(v)) return;
    const w = weights?.[idx] ?? 1;
    const y = ((5 - clamp5(v)) * 4) / 5 + 1; // invert, rescale to [1,5]
    acc += w * Math.log(y);
    wsum += w;
  });
  if (!wsum) return null;
  const g = Math.exp(acc / wsum);
  return 5 - ((g - 1) * 5) / 4;
}

export interface ScoreNode {
  id: string;
  score: number | null;
  children?: ScoreNode[];
}

export interface SeverityResult {
  severity: number | null;
  category: SeverityCategoryKey | null;
  level: number | null; // 1–5
  color: string | null;
  dimensions: Record<SeverityDimensionKey, ScoreNode>;
  indicators: Record<string, { raw: number | null; score: number | null }>;
  complete: boolean;
  missing: string[];
  reliability: Reliability;
}

export type ReliabilityKey = SeverityCategoryKey;
export interface Reliability {
  score: number; // 1–5, 5 = most reliable
  key: ReliabilityKey;
  completeness: number; // % of indicators with data
}

/**
 * Tanzania implementation of the INFORM reliability concept: data reliability, recency, information gaps.
 * An element with no information scores as least reliable (1) - absence of evidence is not medium quality.
 */
export function reliability(input: SeverityInput, completeness: number): Reliability {
  const rel = input.dataReliability === 'high' ? 5 : input.dataReliability === 'medium' ? 3 : 1;
  const d = input.daysSinceUpdate;
  const rec = !isNum(d) ? 1 : d <= 30 ? 5 : d <= 90 ? 4 : d <= 180 ? 3 : d <= 365 ? 2 : 1;
  const gap = completeness >= 90 ? 5 : completeness >= 75 ? 4 : completeness >= 50 ? 3 : completeness >= 25 ? 2 : 1;
  const score = Math.max(1, Math.min(5, Math.round((rel + rec + gap) / 3)));
  return { score, key: SEVERITY_CATEGORY_KEYS[score - 1], completeness: Math.round(completeness) };
}

/** Category = ROUNDUP of the (1-dp) score, clamped to 1–5 (methodology Table 9). */
export function severityCategory(score: number | null): { key: SeverityCategoryKey; level: number; color: string } | null {
  if (!isNum(score)) return null;
  const level = Math.max(1, Math.min(5, Math.ceil(round1(score))));
  const key = SEVERITY_CATEGORY_KEYS[level - 1];
  return { key, level, color: SEVERITY_COLORS[key] };
}

export function computeSeverity(input: SeverityInput): SeverityResult {
  const raw = deriveIndicators(input);
  const indicators: SeverityResult['indicators'] = {};
  const missing: string[] = [];
  let have = 0;
  let total = 0;

  const dimensions = {} as Record<SeverityDimensionKey, ScoreNode>;
  for (const dim of SEVERITY_MODEL) {
    const catNodes: ScoreNode[] = dim.categories.map((cat) => {
      const compNodes: ScoreNode[] = cat.components.map((comp) => {
        const scores = comp.indicators.map((def) => {
          const r = raw[def.id] ?? null;
          const s = normalise(def, r);
          indicators[def.id] = { raw: r, score: s };
          total++;
          if (isNum(s)) have++;
          else missing.push(def.id);
          return s;
        });
        return { id: comp.id, score: mean(scores) };
      });
      const compScores = compNodes.map((c) => c.score);
      const score = cat.aggregation === 'geometric' ? informGeometric(compScores) : mean(compScores);
      return { id: cat.id, score, children: compNodes };
    });
    const score = informGeometric(
      catNodes.map((c) => c.score),
      dim.categories.map((c) => c.weight),
    );
    dimensions[dim.id] = { id: dim.id, score, children: catNodes };
  }

  // The index is only published when every category of every dimension has data (methodology §4.4.1);
  // a dimension carried by a single category would silently misrepresent the crisis.
  const complete = Object.values(dimensions).every((d) => isNum(d.score) && (d.children ?? []).every((c) => isNum(c.score)));
  let severity: number | null = null;
  if (complete) {
    const w = SEVERITY_WEIGHTS;
    const g = informGeometric([dimensions.impact.score, dimensions.conditions.score], [w.impactVsConditions.impact, w.impactVsConditions.conditions])!;
    severity = w.geo * g + w.complexity * dimensions.complexity.score!;
  }
  const cat = severityCategory(severity);
  return {
    severity: isNum(severity) ? round1(severity) : null,
    category: cat?.key ?? null,
    level: cat?.level ?? null,
    color: cat?.color ?? null,
    dimensions,
    indicators,
    complete,
    missing,
    reliability: reliability(input, total ? (have / total) * 100 : 0),
  };
}

export const severityIndicatorDef = (id: string) => SEVERITY_INDICATOR_BY_ID[id];
