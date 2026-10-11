/**
 * Labelled sensitivities beside the Core (decision D11; issues MET-10, MET-11, MET-12, MET-14). Nothing
 * here changes a Core value: each function reads a model and returns the alternative figures, so a page
 * can show "what the other rule would give" with the rule named.
 *
 *  • INFORM Global's aggregation rule for the hazard dimension: the natural-hazard groups combined by the
 *    inverted geometric mean (the regional SADC 2024 workbook averages them), human hazard taken as the
 *    maximum of current conflict intensity and projected conflict risk (the workbook averages five groups).
 *  • Tanzanian classes: class thresholds derived from the model's own units by natural breaks (the
 *    one-dimensional cluster method), for risk, the dimensions and the categories, as INFORM derives its
 *    classes from its own units; the Core keeps the SADC-wide thresholds.
 *  • A lack-of-reliability score per unit, after INFORM's index: missing data, data age and inheritance.
 */
import { CLASS_KEYS, classify, type ClassKey, type Scale } from './classes';
import { DIMENSIONS, type DimensionKey } from './hierarchy';
import { dimensionScore, isNum, mean, riskScore, round1, scaledGeomean } from './math';
import { placeKey, recomputeDimension } from './model';
import type { RiskModel, Unit } from './types';

/* ------------------------------------------------------------------------------------------------ */
/* INFORM Global's hazard aggregation                                                                 */
/* ------------------------------------------------------------------------------------------------ */

export interface GlobalRuleValues {
  natural: number | null;
  human: number | null;
  hazard: number | null;
  risk: number | null;
}

/**
 * The two rules of INFORM Global that the SADC workbook replaces by arithmetic means, each switchable:
 * `natural` 'geomean' combines the natural-hazard groups by the inverted geometric mean (MET-10);
 * `human` 'max' takes human hazard as the maximum of current conflict intensity and projected conflict
 * risk (MET-11). 'mean' keeps the workbook's rule for that category.
 */
export interface GlobalRuleOptions {
  natural: 'geomean' | 'mean';
  human: 'max' | 'mean';
}
export const NATURAL_GEOMEAN: GlobalRuleOptions = { natural: 'geomean', human: 'mean' };
export const INFORM_GLOBAL: GlobalRuleOptions = { natural: 'geomean', human: 'max' };

/** The unit's hazard dimension and risk under the chosen rules, from the same indicator-group values. */
export function globalRuleOf(unit: Unit, rule: GlobalRuleOptions = INFORM_GLOBAL): GlobalRuleValues {
  const nat = Object.values(unit.dims.hazard.categories.natural?.indicators ?? {});
  const hum = unit.dims.hazard.categories.human?.indicators ?? {};
  const natural = rule.natural === 'geomean' ? scaledGeomean(nat) : mean(nat);
  let human: number | null;
  if (rule.human === 'max') {
    const conflict = [hum.conflictIntensity, hum.conflictRisk].filter(isNum);
    human = conflict.length ? Math.max(...conflict) : null;
  } else human = mean(Object.values(hum));
  const hazard = dimensionScore([natural, human]);
  return { natural, human, hazard, risk: riskScore(hazard, unit.dims.vulnerability.score, unit.dims.coping.score) };
}

export interface GlobalRuleSummary {
  units: number;
  /** Mean and largest change of the hazard dimension (global rule minus Core). */
  meanHazardDelta: number;
  maxHazardDelta: number;
  /** Units whose risk class differs under the global rule. */
  riskClassChanges: number;
  /** Class counts under the Core and under the global rule. */
  classes: { core: Record<ClassKey, number>; global: Record<ClassKey, number> };
}

const emptyCounts = (): Record<ClassKey, number> => Object.fromEntries(CLASS_KEYS.map((k) => [k, 0])) as Record<ClassKey, number>;

/** How far a rule moves a set of units (the 170 workbook units, or the councils). */
export function globalRuleSummary(units: readonly Unit[], rule: GlobalRuleOptions = INFORM_GLOBAL): GlobalRuleSummary {
  let sum = 0;
  let n = 0;
  let max = 0;
  let changes = 0;
  const classes = { core: emptyCounts(), global: emptyCounts() };
  for (const u of units) {
    const g = globalRuleOf(u, rule);
    if (isNum(g.hazard) && isNum(u.dims.hazard.score)) {
      const d = g.hazard - u.dims.hazard.score;
      sum += d;
      n++;
      max = Math.max(max, Math.abs(d));
    }
    const a = classify(u.risk, 'risk')?.key;
    const b = classify(g.risk, 'risk')?.key;
    if (a) classes.core[a]++;
    if (b) classes.global[b]++;
    if (a !== b) changes++;
  }
  return { units: units.length, meanHazardDelta: n ? round1(sum / n) : 0, maxHazardDelta: round1(max), riskClassChanges: changes, classes };
}

/* ------------------------------------------------------------------------------------------------ */
/* Tanzanian classes by natural breaks                                                                */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Fisher–Jenks natural breaks: the partition of sorted values into `k` classes that minimises the sum of
 * squared deviations within classes (the one-dimensional cluster method). Returns the lower bounds of
 * classes 2..k (k − 1 thresholds), each the smallest value of its class.
 */
export function naturalBreaks(values: ReadonlyArray<number | null | undefined>, k = 5): number[] {
  const xs = values.filter(isNum).sort((a, b) => a - b);
  const n = xs.length;
  if (n === 0) return [];
  if (n <= k) return xs.slice(1);
  // prefix sums for O(1) within-class variance
  const S = [0];
  const Q = [0];
  for (const x of xs) {
    S.push(S[S.length - 1] + x);
    Q.push(Q[Q.length - 1] + x * x);
  }
  const ssd = (i: number, j: number) => {
    // values i..j-1 (0-based, j exclusive)
    const m = j - i;
    const s = S[j] - S[i];
    return Q[j] - Q[i] - (s * s) / m;
  };
  // cost[c][j]: best SSD for the first j values in c classes; split[c][j]: start of the last class
  const cost: number[][] = Array.from({ length: k + 1 }, () => new Array<number>(n + 1).fill(Infinity));
  const split: number[][] = Array.from({ length: k + 1 }, () => new Array<number>(n + 1).fill(0));
  cost[0][0] = 0;
  for (let c = 1; c <= k; c++) {
    for (let j = c; j <= n; j++) {
      let best = Infinity;
      let at = c - 1;
      for (let i = c - 1; i < j; i++) {
        const v = cost[c - 1][i] + ssd(i, j);
        if (v < best) {
          best = v;
          at = i;
        }
      }
      cost[c][j] = best;
      split[c][j] = at;
    }
  }
  const starts: number[] = [];
  let j = n;
  for (let c = k; c >= 1; c--) {
    starts.unshift(split[c][j]);
    j = split[c][j];
  }
  return starts.slice(1).map((i) => xs[i]);
}

export type ClassScale = Scale | `category:${string}`;

export interface TanzanianClasses {
  /** Thresholds (exclusive upper bounds of very low … high, as in the workbook's Thresholds sheet). */
  thresholds: number[];
  /** Units per class under these thresholds. */
  counts: Record<ClassKey, number>;
  /** Units per class under the Core's SADC thresholds (null for categories, which have none). */
  sadcCounts: Record<ClassKey, number> | null;
  n: number;
}

const roundTo = (x: number, step: number) => Math.round(x / step) * step;

/** Classify a value against explicit thresholds (exclusive upper bounds). */
export function classifyWith(value: number | null | undefined, thresholds: readonly number[]): ClassKey | null {
  if (!isNum(value)) return null;
  let i = 0;
  while (i < thresholds.length && value >= thresholds[i]) i++;
  return CLASS_KEYS[Math.min(i, CLASS_KEYS.length - 1)];
}

/**
 * Tanzanian class thresholds for one scale, derived from the given units by natural breaks: risk
 * thresholds rounded to 0.5 (as INFORM rounds its risk classes), dimensions and categories to 0.1.
 */
export function tanzanianClasses(units: readonly Unit[], scale: ClassScale): TanzanianClasses {
  const valueOf = (u: Unit): number | null => {
    if (scale === 'risk') return u.risk;
    if (scale.startsWith('category:')) {
      const key = scale.slice('category:'.length);
      for (const d of DIMENSIONS) {
        const cat = u.dims[d.key].categories[key];
        if (cat) return cat.score;
      }
      return null;
    }
    return u.dims[scale as DimensionKey].score;
  };
  const values = units.map(valueOf);
  const step = scale === 'risk' ? 0.5 : 0.1;
  const thresholds = [...new Set(naturalBreaks(values, 5).map((t) => round1(roundTo(t, step))))];
  const counts = emptyCounts();
  const sadcCounts = scale.startsWith('category:') ? null : emptyCounts();
  for (const v of values) {
    const k = classifyWith(v, thresholds);
    if (k) counts[k]++;
    if (sadcCounts) {
      const s = classify(v, scale as Scale)?.key;
      if (s) sadcCounts[s]++;
    }
  }
  return { thresholds, counts, sadcCounts, n: values.filter(isNum).length };
}

/* ------------------------------------------------------------------------------------------------ */
/* Lack of reliability                                                                                */
/* ------------------------------------------------------------------------------------------------ */

export interface Reliability {
  /** 0 (fully reliable) to 10 (no reliability), after INFORM's lack-of-reliability index. */
  lack: number;
  /** Share of the indicator groups without data. */
  missing: number;
  /** Age of the data in years, averaged over the groups with data (workbook values date from the data-as-of month). */
  ageYears: number;
  /** 1 for a council carved from another unit, 0.5 for a council sharing its unit with another, else 0. */
  inherited: number;
  groupsWithData: number;
  groupsTotal: number;
}

const MISSING_WEIGHT = 0.5;
const AGE_WEIGHT = 0.3;
const INHERITED_WEIGHT = 0.2;
const AGE_CAP_YEARS = 5;

/**
 * Lack of reliability of a unit's score: how much is missing, how old the data are and whether the
 * values are the unit's own. lack = 10 × (0.5·missing + 0.3·min(age, 5)/5 + 0.2·inherited).
 */
export function lackOfReliability(unit: Unit, model: RiskModel, asOf: string, today = new Date()): Reliability {
  let have = 0;
  let total = 0;
  const ages: number[] = [];
  const base = new Date(`${asOf}-01T00:00:00Z`);
  const yearsSince = (d: Date) => Math.max(0, (today.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  for (const d of DIMENSIONS)
    for (const cat of d.categories)
      for (const ind of cat.indicators) {
        total++;
        const v = unit.dims[d.key].categories[cat.key]?.indicators[ind.key];
        if (!isNum(v)) continue;
        have++;
        const stamp = unit.edits[`${d.key}:${ind.key}`];
        ages.push(yearsSince(stamp?.at ? new Date(stamp.at) : base));
      }
  const missing = total ? (total - have) / total : 1;
  const ageYears = ages.length ? mean(ages)! : AGE_CAP_YEARS;
  const shared = unit.level === 'council' && unit.sourceId ? model.councils.filter((c) => c.sourceId === unit.sourceId).length > 1 : false;
  const inherited = unit.level === 'council' && unit.inheritedFrom ? 1 : shared ? 0.5 : 0;
  const lack = round1(10 * (MISSING_WEIGHT * missing + AGE_WEIGHT * (Math.min(ageYears, AGE_CAP_YEARS) / AGE_CAP_YEARS) + INHERITED_WEIGHT * inherited));
  return { lack: Math.max(0, Math.min(10, lack)), missing, ageYears, inherited, groupsWithData: have, groupsTotal: total };
}

/* ------------------------------------------------------------------------------------------------ */
/* Regional aggregation rule (MET-07)                                                                 */
/* ------------------------------------------------------------------------------------------------ */

/**
 * How a region (and the nation) is built from its councils. The Core takes the plain mean of the
 * councils' indicator values, so a workbook unit that backs two councils counts twice; 'units' counts
 * each workbook unit once; 'population' weights each council's indicator values by its census
 * population. The categories, dimensions and risk then follow the INFORM rules as always.
 */
export type RegionalRule = 'councils' | 'units' | 'population';

/** One aggregate unit from members under a rule (plain or population-weighted indicator means). */
export function aggregateUnder(members: readonly Unit[], rule: RegionalRule, id: string, name: string): Unit {
  const list = rule === 'units' ? [...new Map(members.map((m) => [m.sourceId ?? m.id, m])).values()] : [...members];
  const weight = (m: Unit): number => (rule === 'population' ? (m.exposure?.population ?? 0) : 1);
  const dims = {} as Unit['dims'];
  for (const def of DIMENSIONS) {
    const categories: Unit['dims'][DimensionKey]['categories'] = {};
    for (const cat of def.categories) {
      const indicators: Record<string, number | null> = {};
      for (const ind of cat.indicators) {
        let sum = 0;
        let w = 0;
        for (const m of list) {
          const v = m.dims[def.key].categories[cat.key]?.indicators[ind.key];
          const wt = weight(m);
          if (isNum(v) && wt > 0) {
            sum += v * wt;
            w += wt;
          }
        }
        indicators[ind.key] = w > 0 ? sum / w : null;
      }
      categories[cat.key] = { score: null, indicators };
    }
    dims[def.key] = recomputeDimension({ score: null, categories });
  }
  return { ...list[0], id, name, level: 'region', dims, risk: riskScore(dims.hazard.score, dims.vulnerability.score, dims.coping.score), members: list.length, edits: {} };
}

export interface RegionalRuleSummary {
  rule: RegionalRule;
  regions: number;
  /** Regions whose risk differs from the Core's under the rule, and the largest difference. */
  changed: number;
  maxDelta: number;
  national: number | null;
  nationalDelta: number;
  /** Per region: Core risk, risk under the rule. */
  rows: Array<{ id: string; name: string; core: number | null; under: number | null }>;
}

/** What a region-building rule would change against the Core's plain mean over councils. */
export function regionalRuleSummary(model: RiskModel, rule: RegionalRule): RegionalRuleSummary {
  const rows = model.regions.map((r) => {
    const members = model.councilsByRegion.get(placeKey(r.name)) ?? [];
    const under = members.length ? aggregateUnder(members, rule, r.id, r.name).risk : null;
    return { id: r.id, name: r.name, core: r.risk, under };
  });
  const deltas = rows.map((x) => (isNum(x.core) && isNum(x.under) ? Math.abs(x.under - x.core) : 0));
  const national = aggregateUnder(model.councils, rule, model.national.id, model.national.name).risk;
  return {
    rule,
    regions: rows.length,
    changed: deltas.filter((d) => d > 1e-9).length,
    maxDelta: round1(Math.max(0, ...deltas)),
    national,
    nationalDelta: isNum(national) && isNum(model.national.risk) ? round1(national - model.national.risk) : 0,
    rows,
  };
}
