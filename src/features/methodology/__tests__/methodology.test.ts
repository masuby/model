/**
 * The Methodology page documents the engine, so these tests make sure the documentation cannot drift:
 * catalogue parity (en ↔ sw), the verification counts quoted on the page vs the golden fixtures, the live
 * worked-example derivation vs the model, and coverage of the register and advanced baskets.
 */
import { describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en/methodology.json';
import sw from '@/i18n/locales/sw/methodology.json';
import standardiseFixture from '@/engine/risk/__tests__/fixtures/standardise.fixture.json';
import pipelineFixture from '@/engine/risk/__tests__/fixtures/pipeline.fixture.json';
import workbookFixture from '@/engine/risk/__tests__/fixtures/workbook_rows.fixture.json';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { buildModel } from '@/engine/risk/model';
import { ADVANCED_SPECS, usedSpecs } from '@/engine/risk/standardise';
import { SEVERITY_MODEL } from '@/engine/severity/definitions';
import { BASKETS, KEYED_LEVELS, leafRef, REFERENCES, REGISTER_ROWS, registerCsv, RESOLUTIONS, SECTIONS, sectionKey, SPEC_STATS, VERIFIED, WORKBOOK_BY_LEAF } from '../data';
import { consistency, deriveUnit } from '../derive';

type Tree = { [k: string]: string | Tree };
const flatten = (o: Tree, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`)));
const get = (o: Tree, path: string): unknown => path.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Tree)[k] : undefined), o);

describe('methodology catalogues', () => {
  it('English and Kiswahili have exactly the same keys', () => {
    const a = flatten(en as Tree).sort();
    const b = flatten(sw as Tree).sort();
    expect(b.filter((k) => !a.includes(k))).toEqual([]);
    expect(a.filter((k) => !b.includes(k))).toEqual([]);
  });

  it('no Kiswahili string is left empty or identical to a long English sentence', () => {
    const same = flatten(en as Tree).filter((k) => {
      const e = get(en as Tree, k) as string;
      const s = get(sw as Tree, k) as string;
      return !s || (e.length > 40 && e === s && !k.startsWith('severity.citation'));
    });
    expect(same).toEqual([]);
  });

  it('every dynamically built key exists', () => {
    const need = [
      ...SECTIONS.map((s) => sectionKey(s.id)),
      ...RESOLUTIONS.map((r) => `resolution.${r}`),
      ...KEYED_LEVELS.map((l) => `keyed.${l}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8].flatMap((n) => [`pipeline.steps.${n}.title`, `pipeline.steps.${n}.body`, `pipeline.steps.${n}.formula`]),
      ...REFERENCES.map((r) => `references.use.${r.id}`),
      ...SEVERITY_MODEL.flatMap((d) => [`severity.dim.${d.id}`, ...d.categories.flatMap((c) => [`severity.cat.${c.id}`, `severity.agg.${c.aggregation}`, ...c.components.map((k) => `severity.comp.${k.id}`)])]),
    ];
    for (const cat of [en, sw] as Tree[]) expect(need.filter((k) => typeof get(cat, k) !== 'string')).toEqual([]);
  });
});

describe('figures quoted on the page match the verification fixtures', () => {
  it('standardisation, pipeline and workbook-row counts', () => {
    expect(VERIFIED.standardiseValues).toBe((standardiseFixture as unknown[]).length);
    expect(VERIFIED.pipelineUnits).toBe((pipelineFixture as unknown[]).length);
    expect(VERIFIED.workbookRows).toBe((workbookFixture as unknown[]).length);
  });

  it('specification statistics are internally consistent', () => {
    expect(SPEC_STATS.used).toBe(usedSpecs().length);
    expect(KEYED_LEVELS.reduce((s, l) => s + SPEC_STATS.byLevel[l], 0)).toBe(SPEC_STATS.used);
    expect(SPEC_STATS.custom + SPEC_STATS.range).toBe(SPEC_STATS.used);
  });
});

describe('live worked example', () => {
  const model = buildModel();

  it('re-derives every council and region exactly with the engine', () => {
    const c = consistency([...model.councils, ...model.regions]);
    expect(c.dims.ok).toBe(c.dims.total);
    expect(c.risk.ok).toBe(c.risk.total);
  });

  it('the default council (Kondoa) exists and substitutes real numbers', () => {
    const kondoa = model.councils.find((u) => /^kondoa/i.test(u.name));
    expect(kondoa).toBeDefined();
    const d = deriveUnit(kondoa!);
    for (const dim of d.dims) {
      expect(dim.n).toBeGreaterThan(0);
      expect(dim.geomean).not.toBeNull();
      expect(dim.matches).toBe(true);
    }
    expect(d.risk.result).toBe(kondoa!.risk);
  });
});

describe('register and advanced baskets', () => {
  it('the register covers every indicator group plus exposure', () => {
    const refs = new Set(REGISTER_ROWS.map((r) => r.ref));
    for (const l of ALL_INDICATORS) expect(refs.has(leafRef(l))).toBe(true);
    expect(refs.has('hazard:exposure')).toBe(true);
    expect(registerCsv(REGISTER_ROWS).split('\n')).toHaveLength(REGISTER_ROWS.length + 1);
  });

  it('every workbook indicator in use feeds a documented group', () => {
    const mapped = new Set([...WORKBOOK_BY_LEAF.values()].flat().map((s) => s.id));
    expect(usedSpecs().filter((s) => !mapped.has(s.id)).map((s) => s.id)).toEqual([]);
  });

  it('every advanced sub-indicator is shown in a basket mapped to a group', () => {
    expect(BASKETS.reduce((n, b) => n + b.members.length, 0)).toBe(Object.keys(ADVANCED_SPECS).length);
    expect(BASKETS.every((b) => b.leaf !== null)).toBe(true);
  });
});
