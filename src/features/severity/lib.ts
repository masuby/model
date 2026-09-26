/**
 * Crisis-severity page — pure state and helpers (no React), kept apart so they are unit-tested.
 * The INFORM Severity maths itself lives in `@/engine/severity`; nothing here changes a score.
 */
import {
  AFFECTED_GROUPS,
  SEVERITY_CATEGORY_KEYS,
  SEVERITY_COLORS,
  SEVERITY_MODEL,
  SEVERITY_WEIGHTS,
  type AffectedGroup,
  type SeverityCategoryKey,
  type SeverityDimensionKey,
  type SeverityIndicatorDef,
} from '@/engine/severity/definitions';
import { informGeometric, TANZANIA_AREA_KM2, TANZANIA_POPULATION_2022, type SeverityInput, type SeverityResult } from '@/engine/severity/engine';
import { SEVERITY_SCENARIOS, STRUCTURAL_DEFAULTS, type SeverityScenario } from '@/engine/severity/scenarios';
import type { Unit } from '@/engine/risk/types';
import { formatNumber } from '@/lib/utils';

export const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/* ------------------------------------------------------------------------------------------------ */
/* Form state                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export type ScenarioId = SeverityScenario['id'];
export type ScenarioChoice = ScenarioId | 'custom';
export type ConditionLevel = 5 | 4 | 3 | 2;

/** A blank assessment: only the national structural (Society & safety) defaults are pre-filled. */
export const blankInput = (): SeverityInput => ({ ...STRUCTURAL_DEFAULTS });

export function scenarioInput(id: ScenarioChoice): SeverityInput {
  const s = SEVERITY_SCENARIOS.find((x) => x.id === id);
  return s ? structuredClone(s.input) : blankInput();
}

export interface SeverityFormState {
  scenario: ScenarioChoice;
  /** True once the user has edited the loaded scenario. */
  modified: boolean;
  /** Council ids that make up the affected area. */
  councilIds: string[];
  input: SeverityInput;
}

export type SeverityAction =
  | { type: 'loadScenario'; id: ScenarioChoice }
  | { type: 'patch'; patch: Partial<SeverityInput> }
  | { type: 'setLevel'; level: ConditionLevel; value: number | null }
  | { type: 'toggleGroup'; group: AffectedGroup }
  | { type: 'toggleCouncil'; id: string }
  | { type: 'clearCouncils' }
  | { type: 'applyCensus'; population: number; areaKm2: number };

export function initialSeverityState(id: ScenarioChoice = 'riverineFlood'): SeverityFormState {
  const s = SEVERITY_SCENARIOS.find((x) => x.id === id);
  return { scenario: id, modified: false, councilIds: s ? [...s.councils] : [], input: scenarioInput(id) };
}

export function severityReducer(state: SeverityFormState, action: SeverityAction): SeverityFormState {
  switch (action.type) {
    case 'loadScenario': {
      const s = SEVERITY_SCENARIOS.find((x) => x.id === action.id);
      // A scenario's figures describe its own area, so its council list replaces the selection;
      // a blank form keeps whatever area the user has already drawn.
      return { scenario: action.id, modified: false, councilIds: s ? [...s.councils] : state.councilIds, input: scenarioInput(action.id) };
    }
    case 'patch':
      return { ...state, modified: true, input: { ...state.input, ...action.patch } };
    case 'setLevel':
      return { ...state, modified: true, input: { ...state.input, levels: { ...state.input.levels, [action.level]: action.value } } };
    case 'toggleGroup': {
      const cur = state.input.groups ?? [];
      const groups = cur.includes(action.group) ? cur.filter((g) => g !== action.group) : AFFECTED_GROUPS.filter((g) => g === action.group || cur.includes(g));
      return { ...state, modified: true, input: { ...state.input, groups } };
    }
    case 'toggleCouncil': {
      const has = state.councilIds.includes(action.id);
      return { ...state, councilIds: has ? state.councilIds.filter((x) => x !== action.id) : [...state.councilIds, action.id] };
    }
    case 'clearCouncils':
      return { ...state, councilIds: [] };
    case 'applyCensus':
      return { ...state, modified: true, input: { ...state.input, peopleInArea: action.population, areaAffectedKm2: action.areaKm2 } };
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* Affected area (councils → census totals)                                                           */
/* ------------------------------------------------------------------------------------------------ */

/** Council area in km²: stored area, else population ÷ density (the dataset stores density, not area). */
export function unitAreaKm2(u: Unit): number {
  const e = u.exposure;
  if (!e) return 0;
  if (isNum(e.areaKm2) && e.areaKm2 > 0) return e.areaKm2;
  if (isNum(e.population) && isNum(e.density) && e.density > 0) return e.population / e.density;
  return 0;
}

export interface AreaTotals {
  count: number;
  population: number;
  areaKm2: number;
  /** Arithmetic mean of the councils' INFORM Risk (context only — never enters the severity formula). */
  meanRisk: number | null;
  minRisk: number | null;
  maxRisk: number | null;
}

export function areaTotals(units: Unit[]): AreaTotals {
  const risks = units.map((u) => u.risk).filter(isNum);
  return {
    count: units.length,
    population: Math.round(units.reduce((s, u) => s + (isNum(u.exposure?.population) ? u.exposure.population : 0), 0)),
    areaKm2: Math.round(units.reduce((s, u) => s + unitAreaKm2(u), 0)),
    meanRisk: risks.length ? risks.reduce((s, x) => s + x, 0) / risks.length : null,
    minRisk: risks.length ? Math.min(...risks) : null,
    maxRisk: risks.length ? Math.max(...risks) : null,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Input fields, validation, missing inputs                                                           */
/* ------------------------------------------------------------------------------------------------ */

export type NumericField =
  | 'areaAffectedKm2'
  | 'peopleInArea'
  | 'peopleAffected'
  | 'displaced'
  | 'fatalities'
  | 'gini'
  | 'genderInequality'
  | 'conflictIntensity'
  | 'violenceFatalities'
  | 'corruptionPerception'
  | 'ruleOfLawPercentile'
  | 'daysSinceUpdate';
export type AccessField = 'accessOfActors' | 'accessOfPeople' | 'physicalSecurityConstraints';
export type InputFieldId = NumericField | AccessField | 'level5' | 'level4' | 'level3' | 'level2' | 'groups' | 'dataReliability';

export const ACCESS_FIELDS: readonly AccessField[] = ['accessOfActors', 'accessOfPeople', 'physicalSecurityConstraints'];
export const STRUCTURAL_FIELDS = ['gini', 'genderInequality', 'conflictIntensity', 'violenceFatalities', 'corruptionPerception', 'ruleOfLawPercentile'] as const;
export type StructuralField = (typeof STRUCTURAL_FIELDS)[number];

/** DOM id of an input, so the results panel can jump to it. */
export const fieldDomId = (f: InputFieldId) => `sev-${f}`;

/** Which user inputs each indicator needs (derived indicators need several). */
export const INDICATOR_INPUTS: Record<string, InputFieldId[]> = {
  areaAffectedKm2: ['areaAffectedKm2'],
  areaAffectedPct: ['areaAffectedKm2'],
  peopleInArea: ['peopleInArea'],
  peopleInAreaPct: ['peopleInArea'],
  peopleAffected: ['peopleAffected'],
  peopleAffectedPct: ['peopleAffected', 'peopleInArea'],
  displaced: ['displaced'],
  displacedPct: ['displaced', 'peopleAffected'],
  fatalities: ['fatalities'],
  fatalitiesPer10k: ['fatalities', 'peopleAffected'],
  peopleInNeed: ['level5', 'level4', 'level3'],
  concentrationLevel: ['level5', 'level4', 'level3', 'level2', 'peopleInArea'],
  gini: ['gini'],
  genderInequality: ['genderInequality'],
  conflictIntensity: ['conflictIntensity'],
  violenceFatalities: ['violenceFatalities'],
  corruptionPerception: ['corruptionPerception'],
  ruleOfLawPercentile: ['ruleOfLawPercentile'],
  groupsAffected: ['groups'],
  accessOfActors: ['accessOfActors'],
  accessOfPeople: ['accessOfPeople'],
  physicalSecurityConstraints: ['physicalSecurityConstraints'],
};

/** Indicators computed from other inputs (shown with their derivation). */
export const DERIVED_INDICATORS = new Set(['areaAffectedPct', 'peopleInAreaPct', 'peopleAffectedPct', 'displacedPct', 'fatalitiesPer10k', 'peopleInNeed', 'concentrationLevel', 'groupsAffected']);

export function isFieldEmpty(input: SeverityInput, f: InputFieldId): boolean {
  switch (f) {
    case 'level5':
    case 'level4':
    case 'level3':
    case 'level2':
      return !isNum(input.levels?.[Number(f.slice(5)) as ConditionLevel]);
    case 'groups':
      return !input.groups;
    case 'dataReliability':
      return !input.dataReliability;
    default:
      return !isNum(input[f]);
  }
}

/** For each dimension that cannot be scored yet, the empty inputs that would let it be scored. */
export function missingInputs(input: SeverityInput, result: SeverityResult): Array<{ dimension: SeverityDimensionKey; fields: InputFieldId[] }> {
  const out: Array<{ dimension: SeverityDimensionKey; fields: InputFieldId[] }> = [];
  for (const dim of SEVERITY_MODEL) {
    if (isNum(result.dimensions[dim.id].score)) continue;
    const fields = new Set<InputFieldId>();
    for (const cat of dim.categories)
      for (const comp of cat.components)
        for (const ind of comp.indicators) for (const f of INDICATOR_INPUTS[ind.id] ?? []) if (isFieldEmpty(input, f)) fields.add(f);
    out.push({ dimension: dim.id, fields: [...fields] });
  }
  return out;
}

export type IssueKey =
  | 'negative'
  | 'levelsExceedArea'
  | 'affectedExceedsArea'
  | 'displacedExceedsAffected'
  | 'fatalitiesExceedAffected'
  | 'pinExceedsAffected'
  | 'areaExceedsNational'
  | 'peopleExceedNational';

export interface InputIssue {
  key: IssueKey;
  /** Inputs the warning is attached to. */
  fields: InputFieldId[];
  values: Record<string, number>;
}

/** Plausibility checks. Warnings never block the calculation — the analyst decides. */
export function validateInput(input: SeverityInput): InputIssue[] {
  const issues: InputIssue[] = [];
  const numeric: NumericField[] = ['areaAffectedKm2', 'peopleInArea', 'peopleAffected', 'displaced', 'fatalities', ...STRUCTURAL_FIELDS, 'daysSinceUpdate'];
  const negatives: InputFieldId[] = numeric.filter((f) => isNum(input[f]) && (input[f] as number) < 0);
  for (const l of [5, 4, 3, 2] as const) if (isNum(input.levels?.[l]) && input.levels![l]! < 0) negatives.push(`level${l}`);
  if (negatives.length) issues.push({ key: 'negative', fields: negatives, values: {} });

  const area = input.peopleInArea;
  const affected = input.peopleAffected;
  const lv = input.levels ?? {};
  const levelVals = [lv[5], lv[4], lv[3], lv[2]];
  const levelSum = levelVals.reduce<number>((s, x) => s + (isNum(x) ? x : 0), 0);
  const pin = [lv[5], lv[4], lv[3]].reduce<number>((s, x) => s + (isNum(x) ? x : 0), 0);

  if (isNum(area) && levelVals.some(isNum) && levelSum > area) issues.push({ key: 'levelsExceedArea', fields: ['level5', 'level4', 'level3', 'level2'], values: { sum: levelSum, area } });
  if (isNum(area) && isNum(affected) && affected > area) issues.push({ key: 'affectedExceedsArea', fields: ['peopleAffected'], values: { affected, area } });
  if (isNum(affected) && isNum(input.displaced) && input.displaced > affected) issues.push({ key: 'displacedExceedsAffected', fields: ['displaced'], values: { displaced: input.displaced, affected } });
  if (isNum(affected) && isNum(input.fatalities) && input.fatalities > affected) issues.push({ key: 'fatalitiesExceedAffected', fields: ['fatalities'], values: { fatalities: input.fatalities, affected } });
  if (isNum(affected) && [lv[5], lv[4], lv[3]].some(isNum) && pin > affected) issues.push({ key: 'pinExceedsAffected', fields: ['level5', 'level4', 'level3'], values: { pin, affected } });
  if (isNum(input.areaAffectedKm2) && input.areaAffectedKm2 > TANZANIA_AREA_KM2) issues.push({ key: 'areaExceedsNational', fields: ['areaAffectedKm2'], values: { max: TANZANIA_AREA_KM2 } });
  if (isNum(area) && area > TANZANIA_POPULATION_2022) issues.push({ key: 'peopleExceedNational', fields: ['peopleInArea'], values: { max: TANZANIA_POPULATION_2022 } });
  return issues;
}

/* ------------------------------------------------------------------------------------------------ */
/* Result helpers                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export interface FormulaBreakdown {
  impact: number;
  conditions: number;
  complexity: number;
  /** G(Impact ⅓, Conditions ⅔). */
  g: number;
  geoTerm: number;
  complexityTerm: number;
  total: number;
}

/** The final formula with the actual numbers: 0.7 × G(Impact ⅓, Conditions ⅔) + 0.3 × Complexity. */
export function formulaBreakdown(result: SeverityResult): FormulaBreakdown | null {
  const impact = result.dimensions.impact.score;
  const conditions = result.dimensions.conditions.score;
  const complexity = result.dimensions.complexity.score;
  if (!isNum(impact) || !isNum(conditions) || !isNum(complexity)) return null;
  const w = SEVERITY_WEIGHTS;
  const g = informGeometric([impact, conditions], [w.impactVsConditions.impact, w.impactVsConditions.conditions]);
  if (!isNum(g)) return null;
  const geoTerm = w.geo * g;
  const complexityTerm = w.complexity * complexity;
  return { impact, conditions, complexity, g, geoTerm, complexityTerm, total: geoTerm + complexityTerm };
}

/** Readable text colour on a SEVERITY_COLORS fill. */
export const ON_SEVERITY: Record<SeverityCategoryKey, string> = {
  veryLow: '#431407',
  low: '#431407',
  medium: '#2a0d04',
  high: '#1f0703',
  veryHigh: '#ffffff',
};

/** Level of humanitarian conditions (1–5) → the matching colour of the severity ramp. */
export const levelColor = (level: 1 | 2 | 3 | 4 | 5) => SEVERITY_COLORS[SEVERITY_CATEGORY_KEYS[level - 1]];

export interface LevelShare {
  level: 1 | 2 | 3 | 4 | 5;
  count: number;
  share: number;
}

/** People in the area by level of conditions; level 1 is the remainder. Null without a population. */
export function levelDistribution(input: SeverityInput): LevelShare[] | null {
  const area = input.peopleInArea;
  if (!isNum(area) || area <= 0) return null;
  const lv = input.levels ?? {};
  const c = (x: number | null | undefined) => (isNum(x) ? Math.max(0, x) : 0);
  const counts: Array<[LevelShare['level'], number]> = [
    [5, c(lv[5])],
    [4, c(lv[4])],
    [3, c(lv[3])],
    [2, c(lv[2])],
  ];
  const sum = counts.reduce((s, [, n]) => s + n, 0);
  counts.push([1, Math.max(0, area - sum)]);
  const denom = Math.max(area, sum);
  return counts.map(([level, count]) => ({ level, count, share: denom ? count / denom : 0 }));
}

/** Number of indicators with data (of the model's total). */
export function indicatorCoverage(result: SeverityResult): { have: number; total: number } {
  const all = Object.values(result.indicators);
  return { have: all.filter((x) => isNum(x.score)).length, total: all.length };
}

/** Format a raw indicator value for display, by unit. */
export function formatRaw(unit: SeverityIndicatorDef['unit'], v: number | null | undefined, lang: string): string {
  if (!isNum(v)) return '—';
  switch (unit) {
    case 'people':
    case 'count':
      return formatNumber(Math.round(v), lang);
    case 'km2':
      return formatNumber(v, lang, { maximumFractionDigits: v < 10 ? 1 : 0 });
    case 'percent':
      return `${formatNumber(v, lang, { maximumFractionDigits: v < 1 ? 2 : 1 })}%`;
    case 'per10k':
    case 'index':
      return formatNumber(v, lang, { maximumFractionDigits: 2 });
    case 'score':
      return formatNumber(v, lang, { maximumFractionDigits: 1 });
  }
}

/** Flat walk of the model: every indicator with its dimension / category / component. */
export interface IndicatorPath {
  dimension: SeverityDimensionKey;
  category: string;
  component: string;
  def: SeverityIndicatorDef;
}
export const INDICATOR_PATHS: IndicatorPath[] = SEVERITY_MODEL.flatMap((d) =>
  d.categories.flatMap((c) => c.components.flatMap((k) => k.indicators.map((def) => ({ dimension: d.id, category: c.id, component: k.id, def })))),
);

/* ------------------------------------------------------------------------------------------------ */
/* Export (JSON / CSV / situation-report text)                                                        */
/* ------------------------------------------------------------------------------------------------ */

export type Translate = (key: string, opts?: Record<string, unknown>) => string;

export interface ExportContext {
  state: SeverityFormState;
  result: SeverityResult;
  councils: Unit[];
  totals: AreaTotals;
  lang: string;
  t: Translate;
  /** Timestamp of the export (injected for deterministic tests). */
  now?: Date;
}

const r2 = (x: number | null | undefined) => (isNum(x) ? Math.round(x * 100) / 100 : null);

export function buildExportJson(ctx: ExportContext) {
  const { state, result, councils, totals, t } = ctx;
  const f = formulaBreakdown(result);
  return {
    generator: 'INFORM Tanzania — crisis severity calculator',
    method: 'INFORM Severity Index (JRC/ACAPS): Severity = 0.7 × G(Impact 1/3, Conditions 2/3) + 0.3 × Complexity; category = ROUNDUP(score)',
    references: [t('method.cite.jrc'), t('method.cite.acaps')],
    exportedAt: (ctx.now ?? new Date()).toISOString(),
    language: ctx.lang,
    scenario: { id: state.scenario, name: t(`scenario.${state.scenario}.name`), illustrative: state.scenario !== 'custom', modified: state.modified },
    affectedArea: {
      councils: councils.map((u) => ({ id: u.id, name: u.name, region: u.region, population: u.exposure?.population ?? null, areaKm2: Math.round(unitAreaKm2(u)), informRisk: u.risk })),
      census: { population: totals.population, areaKm2: totals.areaKm2, source: 'NBS 2022 Population and Housing Census' },
      preCrisisInformRisk: { mean: r2(totals.meanRisk), min: totals.minRisk, max: totals.maxRisk, note: 'Context only; not part of the severity formula.' },
    },
    input: state.input,
    result: {
      severity: result.severity,
      category: result.category,
      level: result.level,
      complete: result.complete,
      missing: result.missing,
      formula: f && { impact: r2(f.impact), conditions: r2(f.conditions), complexity: r2(f.complexity), g: r2(f.g), geoTerm: r2(f.geoTerm), complexityTerm: r2(f.complexityTerm) },
      dimensions: result.dimensions,
      indicators: result.indicators,
      reliability: result.reliability,
      issues: validateInput(state.input).map((i) => i.key),
    },
    calibration: INDICATOR_PATHS.map(({ def, dimension, category, component }) => ({
      id: def.id,
      dimension,
      category,
      component,
      unit: def.unit,
      min: def.min,
      max: def.max,
      log: !!def.log,
      inverse: !!def.inverse,
    })),
  };
}

export type CsvRow = Array<string | number | null>;

export function buildCsvRows(ctx: ExportContext): CsvRow[] {
  const { result, t, state, totals } = ctx;
  const rows: CsvRow[] = [['section', 'id', 'label', 'raw_value', 'score_0_5', 'unit', 'ref_min', 'ref_max', 'log_scale', 'inverse']];
  rows.push(['summary', 'scenario', t(`scenario.${state.scenario}.name`), state.scenario, null, null, null, null, null, null]);
  rows.push(['summary', 'severity', t('results.title'), null, result.severity, '0-5', null, null, null, null]);
  rows.push(['summary', 'category', result.category ? t(`common:classes.${result.category}`) : '', result.level, null, '1-5', null, null, null, null]);
  rows.push(['summary', 'reliability', t('results.reliability'), result.reliability.completeness, result.reliability.score, '1-5', null, null, null, null]);
  rows.push(['summary', 'councils', t('area.title'), totals.count, null, null, null, null, null, null]);
  rows.push(['summary', 'preCrisisInformRisk', t('area.context'), r2(totals.meanRisk), null, '0-10', null, null, null, null]);
  for (const dim of SEVERITY_MODEL) {
    const node = result.dimensions[dim.id];
    rows.push(['dimension', dim.id, t(`dim.${dim.id}`), null, r2(node.score), '0-5', null, null, null, null]);
    for (const cat of node.children ?? []) {
      rows.push(['category', cat.id, t(`cat.${cat.id}`), null, r2(cat.score), '0-5', null, null, null, null]);
      for (const comp of cat.children ?? []) rows.push(['component', comp.id, t(`comp.${comp.id}`), null, r2(comp.score), '0-5', null, null, null, null]);
    }
  }
  for (const { def } of INDICATOR_PATHS) {
    const v = result.indicators[def.id];
    rows.push(['indicator', def.id, t(`ind.${def.id}`), r2(v?.raw), r2(v?.score), def.unit, def.min, def.max, def.log ? 'yes' : 'no', def.inverse ? 'yes' : 'no']);
  }
  return rows;
}

/** Plain-text summary for a situation report. */
export function buildSummary(ctx: ExportContext): string {
  const { state, result, councils, totals, lang, t } = ctx;
  const n = (x: number | null | undefined) => formatNumber(isNum(x) ? Math.round(x) : null, lang);
  const s1 = (x: number | null | undefined) => (isNum(x) ? (Math.round(x * 10) / 10).toFixed(1) : '—');
  const input = state.input;
  const lv = input.levels ?? {};
  const pinParts = [lv[5], lv[4], lv[3]];
  const pin = pinParts.some(isNum) ? pinParts.reduce<number>((s, x) => s + (isNum(x) ? x : 0), 0) : null;
  const lines: string[] = [];
  const name = t(`scenario.${state.scenario}.name`);
  lines.push(t('summary.title', { name }) + (state.scenario !== 'custom' ? ` ${t('summary.illustrative')}` : ''));
  const names = councils.map((u) => u.name);
  const shown = names.length > 8 ? `${names.slice(0, 8).join(', ')} ${t('summary.more', { count: names.length - 8 })}` : names.join(', ');
  lines.push(t('summary.area', { councils: names.length ? shown : t('summary.noArea') }));
  lines.push(t('summary.areaFigures', { people: n(input.peopleInArea), area: n(input.areaAffectedKm2) }));
  if (isNum(result.severity) && result.category)
    lines.push(t('summary.severity', { score: s1(result.severity), category: t(`common:classes.${result.category}`), level: result.level }));
  else lines.push(t('summary.incomplete'));
  lines.push(
    t('summary.dims', {
      impact: s1(result.dimensions.impact.score),
      conditions: s1(result.dimensions.conditions.score),
      complexity: s1(result.dimensions.complexity.score),
    }),
  );
  lines.push(t('summary.figures', { affected: n(input.peopleAffected), displaced: n(input.displaced), fatalities: n(input.fatalities), pin: n(pin) }));
  lines.push(t('summary.reliability', { score: result.reliability.score, label: t(`common:classes.${result.reliability.key}`), completeness: result.reliability.completeness }));
  if (isNum(totals.meanRisk)) lines.push(t('summary.risk', { risk: s1(totals.meanRisk) }));
  lines.push(t('summary.method', { date: new Intl.DateTimeFormat(lang === 'sw' ? 'sw-TZ' : 'en-GB', { dateStyle: 'medium' }).format(ctx.now ?? new Date()) }));
  return lines.join('\n');
}
