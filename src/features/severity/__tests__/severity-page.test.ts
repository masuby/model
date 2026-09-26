/**
 * Crisis-severity page: state reducer, area totals, validation, formula breakdown, exports, and the
 * completeness of the `severity` locale (every key used in the page exists in English and Kiswahili).
 */
import i18next, { type i18n as I18n } from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';
import enCommon from '@/i18n/locales/en/common.json';
import en from '@/i18n/locales/en/severity.json';
import swCommon from '@/i18n/locales/sw/common.json';
import sw from '@/i18n/locales/sw/severity.json';
import { AFFECTED_GROUPS, ALL_SEVERITY_INDICATORS, SEVERITY_MODEL } from '@/engine/severity/definitions';
import { computeSeverity } from '@/engine/severity/engine';
import { SEVERITY_SCENARIOS, STRUCTURAL_DEFAULTS } from '@/engine/severity/scenarios';
import type { Unit } from '@/engine/risk/types';
import {
  ACCESS_FIELDS,
  areaTotals,
  buildCsvRows,
  buildExportJson,
  buildSummary,
  DERIVED_INDICATORS,
  formulaBreakdown,
  INDICATOR_INPUTS,
  initialSeverityState,
  levelDistribution,
  missingInputs,
  severityReducer,
  STRUCTURAL_FIELDS,
  unitAreaKm2,
  validateInput,
  type ExportContext,
  type IssueKey,
  type Translate,
} from '../lib';

const council = (id: string, population: number, density: number, risk: number, areaKm2?: number): Unit =>
  ({
    id,
    level: 'council',
    name: `Council ${id}`,
    region: 'Test',
    dims: {} as Unit['dims'],
    risk,
    exposure: { index: null, population, density, areaKm2 },
    edits: {},
  }) as Unit;

describe('form state', () => {
  it('starts from the riverine-flood scenario, unmodified', () => {
    const s = initialSeverityState();
    expect(s.scenario).toBe('riverineFlood');
    expect(s.modified).toBe(false);
    expect(s.input.peopleAffected).toBe(SEVERITY_SCENARIOS[0].input.peopleAffected);
  });

  it('scenario inputs are copies (editing never mutates the engine scenarios)', () => {
    const original = SEVERITY_SCENARIOS[1].input.levels?.[4];
    let s = initialSeverityState('drought');
    s = severityReducer(s, { type: 'setLevel', level: 4, value: 1 });
    expect(SEVERITY_SCENARIOS[1].input.levels?.[4]).toBe(original);
    expect(s.input.levels?.[4]).toBe(1);
    expect(s.modified).toBe(true);
  });

  it('blank keeps the drawn area and only the structural defaults', () => {
    let s = severityReducer(initialSeverityState('custom'), { type: 'toggleCouncil', id: 'C001' });
    s = severityReducer(s, { type: 'loadScenario', id: 'custom' });
    expect(s.councilIds).toEqual(['C001']);
    expect(s.input).toEqual(STRUCTURAL_DEFAULTS);
    expect(s.input.peopleAffected).toBeUndefined();
  });

  it('toggles councils and groups; census fills people and area', () => {
    let s = initialSeverityState('custom');
    s = severityReducer(s, { type: 'toggleCouncil', id: 'C001' });
    s = severityReducer(s, { type: 'toggleCouncil', id: 'C002' });
    s = severityReducer(s, { type: 'toggleCouncil', id: 'C001' });
    expect(s.councilIds).toEqual(['C002']);
    s = severityReducer(s, { type: 'toggleGroup', group: 'refugees' });
    s = severityReducer(s, { type: 'toggleGroup', group: 'idps' });
    expect(s.input.groups).toEqual(['idps', 'refugees']); // canonical order
    s = severityReducer(s, { type: 'toggleGroup', group: 'idps' });
    expect(s.input.groups).toEqual(['refugees']);
    s = severityReducer(s, { type: 'applyCensus', population: 1234, areaKm2: 56 });
    expect(s.input).toMatchObject({ peopleInArea: 1234, areaAffectedKm2: 56 });
    expect(severityReducer(s, { type: 'clearCouncils' }).councilIds).toEqual([]);
  });
});

describe('affected area', () => {
  it('area = stored area, else population ÷ density; risk is a plain mean', () => {
    expect(unitAreaKm2(council('a', 10_000, 50, 4))).toBe(200);
    expect(unitAreaKm2(council('b', 10_000, 50, 4, 321))).toBe(321);
    const tot = areaTotals([council('a', 10_000, 50, 4), council('b', 30_000, 100, 6)]);
    expect(tot).toMatchObject({ count: 2, population: 40_000, areaKm2: 500, meanRisk: 5, minRisk: 4, maxRisk: 6 });
    expect(areaTotals([]).meanRisk).toBeNull();
  });
});

describe('validation', () => {
  it('the illustrative scenarios are internally consistent', () => {
    for (const s of SEVERITY_SCENARIOS) expect(validateInput(s.input)).toEqual([]);
  });
  it('warns when levels exceed the people in the area, and on other impossible relations', () => {
    const keys = validateInput({ peopleInArea: 1_000, peopleAffected: 2_000, displaced: 3_000, fatalities: 5_000, levels: { 5: 600, 4: 600 }, areaAffectedKm2: 2e6 }).map((i) => i.key);
    expect(keys).toEqual(expect.arrayContaining<IssueKey>(['levelsExceedArea', 'affectedExceedsArea', 'displacedExceedsAffected', 'fatalitiesExceedAffected', 'areaExceedsNational']));
  });
  it('flags negatives', () => {
    expect(validateInput({ peopleAffected: -1 }).map((i) => i.key)).toContain('negative');
  });
});

describe('result helpers', () => {
  it('formula breakdown reproduces the engine score', () => {
    for (const s of SEVERITY_SCENARIOS) {
      const r = computeSeverity(s.input);
      const f = formulaBreakdown(r)!;
      expect(Math.round(f.total * 10) / 10).toBe(r.severity);
      expect(f.geoTerm).toBeCloseTo(0.7 * f.g, 10);
    }
    expect(formulaBreakdown(computeSeverity(STRUCTURAL_DEFAULTS))).toBeNull();
  });

  it('missing inputs name what would complete a blank assessment', () => {
    const r = computeSeverity(STRUCTURAL_DEFAULTS);
    const m = missingInputs(STRUCTURAL_DEFAULTS, r);
    expect(m.map((x) => x.dimension)).toEqual(['impact', 'conditions']);
    expect(m[0].fields).toEqual(expect.arrayContaining(['areaAffectedKm2', 'peopleInArea', 'peopleAffected', 'displaced', 'fatalities']));
    expect(m[1].fields).toEqual(expect.arrayContaining(['level5', 'level4', 'level3', 'level2']));
  });

  it('level 1 is the remainder of the people in the area', () => {
    const d = levelDistribution({ peopleInArea: 1_000, levels: { 5: 100, 4: 100, 3: 100, 2: 100 } })!;
    expect(d.map((x) => x.level)).toEqual([5, 4, 3, 2, 1]);
    expect(d.find((x) => x.level === 1)!.count).toBe(600);
    expect(d.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 10);
    expect(levelDistribution({})).toBeNull();
  });

  it('every indicator is mapped to the inputs it needs', () => {
    for (const d of ALL_SEVERITY_INDICATORS) expect(INDICATOR_INPUTS[d.id]?.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* Exports and locale                                                                                 */
/* ------------------------------------------------------------------------------------------------ */

let i18n: I18n;
beforeAll(async () => {
  i18n = i18next.createInstance();
  await i18n.init({
    lng: 'en',
    fallbackLng: false,
    ns: ['severity', 'common'],
    defaultNS: 'severity',
    resources: { en: { severity: en, common: enCommon }, sw: { severity: sw, common: swCommon } },
    interpolation: { escapeValue: false },
  });
});

function ctxFor(lang: 'en' | 'sw'): ExportContext {
  const t = i18n.getFixedT(lang, 'severity');
  const tr: Translate = (k, o) => t(k, o ?? {});
  const state = severityReducer(initialSeverityState('riverineFlood'), { type: 'toggleCouncil', id: 'C001' });
  const councils = [council('C001', 244_854, 53.5, 5.2)];
  return { state, result: computeSeverity(state.input), councils, totals: areaTotals(councils), lang, t: tr, now: new Date('2026-09-26T08:00:00Z') };
}

describe('exports', () => {
  it('JSON carries input, result, formula, calibration and provenance', () => {
    const j = buildExportJson(ctxFor('en'));
    expect(j.scenario).toMatchObject({ id: 'riverineFlood', illustrative: true, modified: false });
    expect(j.result.severity).toBe(computeSeverity(SEVERITY_SCENARIOS[0].input).severity);
    expect(j.result.formula).not.toBeNull();
    expect(j.calibration).toHaveLength(ALL_SEVERITY_INDICATORS.length);
    expect(j.affectedArea.councils[0]).toMatchObject({ id: 'C001', areaKm2: Math.round(244_854 / 53.5) });
    expect(JSON.parse(JSON.stringify(j))).toEqual(j);
  });

  it('CSV has a header, summary, the tree and one row per indicator', () => {
    const rows = buildCsvRows(ctxFor('en'));
    expect(rows[0][0]).toBe('section');
    expect(rows.filter((r) => r[0] === 'indicator')).toHaveLength(ALL_SEVERITY_INDICATORS.length);
    expect(rows.filter((r) => r[0] === 'dimension')).toHaveLength(3);
    expect(new Set(rows.map((r) => r.length)).size).toBe(1);
  });

  it('situation-report summary is fully translated in both languages', () => {
    const enText = buildSummary(ctxFor('en'));
    const swText = buildSummary(ctxFor('sw'));
    const sev = computeSeverity(SEVERITY_SCENARIOS[0].input).severity!.toFixed(1);
    expect(enText).toContain('INFORM Severity — Riverine flood');
    expect(enText).toContain(`${sev} / 5`);
    expect(enText).toContain('Council C001');
    expect(swText).toContain('Ukali wa INFORM — Mafuriko ya mto');
    expect(swText).not.toMatch(/\b(summary|results|scenario)\./);
    expect(enText).not.toMatch(/\b(summary|results|scenario)\./);
  });
});

type Tree = { [k: string]: string | Tree };
const leaves = (o: Tree, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : leaves(v, `${prefix}${k}.`)));
const has = (o: Tree, key: string): boolean => {
  const get = (k: string) => k.split('.').reduce<string | Tree | undefined>((n, p) => (n && typeof n === 'object' ? n[p] : undefined), o);
  return typeof get(key) === 'string' || typeof get(`${key}_other`) === 'string';
};

describe('severity locale', () => {
  const EN = en as unknown as Tree;
  const SW = sw as unknown as Tree;

  it('English and Kiswahili have exactly the same keys', () => {
    expect(leaves(SW).sort()).toEqual(leaves(EN).sort());
  });

  it('Kiswahili is a real translation, not a copy', () => {
    const keys = leaves(EN);
    const get = (o: Tree, k: string) => k.split('.').reduce<string | Tree>((n, p) => (n as Tree)[p], o) as string;
    const same = keys.filter((k) => get(EN, k) === get(SW, k));
    expect(same.length / keys.length).toBeLessThan(0.08);
  });

  it('every dynamic key family resolves', () => {
    const need: string[] = [
      ...ALL_SEVERITY_INDICATORS.map((d) => `ind.${d.id}`),
      ...ALL_SEVERITY_INDICATORS.map((d) => `unit.${d.unit}`),
      ...SEVERITY_MODEL.flatMap((d) => [`dim.${d.id}`, ...d.categories.flatMap((c) => [`cat.${c.id}`, ...c.components.map((k) => `comp.${k.id}`)])]),
      ...[...DERIVED_INDICATORS].map((id) => `derivation.${id}`),
      ...STRUCTURAL_FIELDS.flatMap((f) => [`source.${f}`, `field.${f}.label`, `field.${f}.help`, `field.${f}.short`]),
      ...ACCESS_FIELDS.flatMap((f) => [`field.${f}.label`, `field.${f}.help`, `field.${f}.short`]),
      ...Object.values(INDICATOR_INPUTS).flat().map((f) => `field.${f}.short`),
      ...AFFECTED_GROUPS.map((g) => `group.${g}`),
      ...[...SEVERITY_SCENARIOS.map((s) => s.id), 'custom'].flatMap((id) => [`scenario.${id}.name`, `scenario.${id}.blurb`]),
      ...[1, 2, 3, 4, 5].flatMap((l) => [`level.${l}.name`, `level.${l}.desc`]),
      ...[0, 1, 2, 3].flatMap((n) => [`access.level.${n}.name`, `access.level.${n}.desc`]),
      ...['low', 'medium', 'high'].flatMap((k) => [`reliabilityInput.${k}.name`, `reliabilityInput.${k}.desc`]),
      ...(['negative', 'levelsExceedArea', 'affectedExceedsArea', 'displacedExceedsAffected', 'fatalitiesExceedAffected', 'pinExceedsAffected', 'areaExceedsNational', 'peopleExceedNational'] satisfies IssueKey[]).map(
        (k) => `issue.${k}`,
      ),
      ...['method.cards.normalise', 'method.cards.aggregate', 'method.cards.classify', 'method.cards.reliability'].flatMap((k) => [`${k}.title`, `${k}.body`]),
    ];
    for (const lang of [EN, SW]) {
      const missing = need.filter((k) => !has(lang, k));
      expect(missing).toEqual([]);
    }
  });

  it('every literal t("…") key used by the page exists', () => {
    const sources = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const used = new Set<string>();
    for (const [path, src] of Object.entries(sources)) {
      if (path.includes('__tests__') || /\.test\.tsx?$/.test(path)) continue;
      for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(50);
    const commons = { en: enCommon as unknown as Tree, sw: swCommon as unknown as Tree };
    const missing: string[] = [];
    for (const key of used) {
      for (const [lang, sev] of [['en', EN], ['sw', SW]] as const) {
        const ok = key.startsWith('common:') ? has(commons[lang], key.slice(7)) : has(sev, key);
        if (!ok) missing.push(`${lang}:${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
