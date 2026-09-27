/**
 * Risk Explorer logic: URL state round-trips, statistics, ranking, sorting, search, selection carry-over,
 * and translation completeness (every English key has a Kiswahili counterpart).
 */
import { describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en/explore.json';
import sw from '@/i18n/locales/sw/explore.json';
import { classify } from '@/engine/risk/classes';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { parseMetric } from '@/engine/risk/metrics';
import { buildModel, dataCoverage, placeKey } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import {
  computeStats,
  coverageCounts,
  DEFAULT_STATE,
  matchesClass,
  MAX_COMPARE,
  normalizeText,
  rankUnits,
  readExploreState,
  referenceUnit,
  searchUnits,
  sortUnits,
  translateSelection,
  writeExploreState,
} from '../lib/explore';

const model = buildModel();
const lookup = (id: string) => model.byId.get(id);
const risk = parseMetric('risk');
const council = model.councils[0];

describe('URL state', () => {
  it('defaults when the query string is empty', () => {
    expect(readExploreState(new URLSearchParams(), lookup)).toEqual(DEFAULT_STATE);
  });

  it('round-trips a full state', () => {
    const region = model.regions[0];
    const s = {
      ...DEFAULT_STATE,
      level: 'region' as const,
      metric: 'dim:hazard' as const,
      id: region.id,
      cls: 'high' as const,
      view: 'table' as const,
      cmp: [council.id, region.id],
      basemap: 'streets' as const,
      sort: 'name' as const,
      dir: 'asc' as const,
    };
    expect(readExploreState(writeExploreState(s), lookup)).toEqual(s);
  });

  it('rejects invalid values and unknown ids', () => {
    const s = readExploreState(new URLSearchParams('level=planet&metric=ind:hazard:nope&id=XXX&class=purple&view=globe&cmp=XXX,,&sort=bogus&dir=up'), lookup);
    expect(s).toEqual(DEFAULT_STATE);
  });

  it('drops the class filter for indicator lenses (INFORM has no indicator classes)', () => {
    const s = readExploreState(new URLSearchParams('metric=ind:hazard:flood&class=high'), lookup);
    expect(s.metric).toBe('ind:hazard:flood');
    expect(s.cls).toBeNull();
    expect(writeExploreState({ ...s, cls: 'high' }).has('class')).toBe(false);
  });

  it('infers the level from the selected unit when no level is given', () => {
    const region = model.regions[3];
    expect(readExploreState(new URLSearchParams(`id=${region.id}`), lookup).level).toBe('region');
    expect(readExploreState(new URLSearchParams(`id=${model.sources[0].id}`), lookup).level).toBe('source');
  });

  it('ignores the national unit as a selection and caps the comparison at three', () => {
    const ids = model.councils.slice(0, 5).map((c) => c.id);
    const s = readExploreState(new URLSearchParams(`id=TZ&cmp=${ids.join(',')},${ids[0]}`), lookup);
    expect(s.id).toBeNull();
    expect(s.cmp).toEqual(ids.slice(0, MAX_COMPARE));
  });

  it('keeps links short: defaults are omitted except the level', () => {
    expect(writeExploreState(DEFAULT_STATE).toString()).toBe('level=council');
  });
});

describe('selection across levels', () => {
  it('a council maps to its region and its INFORM source unit', () => {
    expect(translateSelection(model, council.id, 'region')).toBe(`R-${placeKey(council.region)}`);
    expect(translateSelection(model, council.id, 'source')).toBe(council.sourceId);
    expect(translateSelection(model, council.id, 'council')).toBe(council.id);
  });
  it('a region has no single council', () => {
    expect(translateSelection(model, model.regions[0].id, 'council')).toBeNull();
    expect(translateSelection(model, null, 'region')).toBeNull();
  });
  it('councils are compared with their region, everything else with the official national figure', () => {
    expect(referenceUnit(model, council).id).toBe(`R-${placeKey(council.region)}`);
    expect(referenceUnit(model, model.regions[0]).id).toBe('TZ');
    expect(referenceUnit(model, model.sources[0]).id).toBe('TZ');
  });
});

describe('statistics', () => {
  it('summarise risk across the 195 councils', () => {
    const s = computeStats(model.councils, risk);
    const values = model.councils.map((c) => c.risk).filter((v): v is number => typeof v === 'number');
    expect(s.total).toBe(195);
    expect(s.withData).toBe(values.length);
    expect(s.mean).toBeCloseTo(values.reduce((a, b) => a + b, 0) / values.length, 10);
    expect(s.min?.value).toBe(Math.min(...values));
    expect(s.max?.value).toBe(Math.max(...values));
    const counted = Object.values(s.classCounts!).reduce((a, b) => a + b, 0);
    expect(counted).toBe(values.length);
    expect(s.bins.reduce((a, b) => a + b, 0)).toBe(values.length);
  });

  it('uses each dimension’s own thresholds for class counts', () => {
    const hz = parseMetric('dim:hazard');
    const s = computeStats(model.councils, hz);
    const high = model.councils.filter((c) => classify(c.dims.hazard.score, 'hazard')?.key === 'high').length;
    expect(s.classCounts!.high).toBe(high);
  });

  it('has no class counts for a continuous indicator lens', () => {
    expect(computeStats(model.councils, parseMetric('ind:hazard:flood')).classCounts).toBeNull();
  });

  it('handles an empty set', () => {
    const s = computeStats([], risk);
    expect(s.mean).toBeNull();
    expect(s.min).toBeNull();
    expect(s.median).toBeNull();
  });
});

describe('ranking and sorting', () => {
  const fake = (id: string, name: string, r: number | null): Unit => ({ ...council, id, name, risk: r });

  it('uses competition ranking on the displayed one-decimal value', () => {
    const units = [fake('a', 'A', 5.04), fake('b', 'B', 5.0), fake('c', 'C', 4.2), fake('d', 'D', null)];
    const ranks = rankUnits(units, risk);
    expect(ranks.get('a')).toBe(1);
    expect(ranks.get('b')).toBe(1);
    expect(ranks.get('c')).toBe(3);
    expect(ranks.has('d')).toBe(false);
  });

  it('sorts with missing values last in both directions and ties broken by name', () => {
    const units = [fake('a', 'Beta', 3), fake('b', 'Alpha', null), fake('c', 'Alpha', 3), fake('d', 'Gamma', 7)];
    expect(sortUnits(units, 'risk', 'desc', risk).map((u) => u.id)).toEqual(['d', 'c', 'a', 'b']);
    expect(sortUnits(units, 'risk', 'asc', risk).map((u) => u.id)).toEqual(['c', 'a', 'd', 'b']);
    expect(sortUnits(units, 'name', 'asc', risk).map((u) => u.name)).toEqual(['Alpha', 'Alpha', 'Beta', 'Gamma']);
  });

  it('filters by class under the active metric only', () => {
    const u = model.councils.find((c) => classify(c.risk)?.key === 'high')!;
    expect(matchesClass(u, risk, 'high')).toBe(true);
    expect(matchesClass(u, risk, 'low')).toBe(false);
    expect(matchesClass(u, parseMetric('ind:hazard:flood'), 'low')).toBe(true);
    expect(matchesClass(u, risk, null)).toBe(true);
  });
});

describe('search', () => {
  const pool = [...model.regions, ...model.councils];

  it('normalises case, accents and punctuation', () => {
    expect(normalizeText('  Dar-es-Salaam ')).toBe('dar es salaam');
    expect(normalizeText('Wanging’Ombé')).toBe('wanging ombe');
  });

  it('puts exact and prefix name matches first, regions before councils', () => {
    const region = model.regions.find((r) => r.name === 'Dodoma')!;
    const hits = searchUnits(pool, 'dodoma');
    expect(hits[0].id).toBe(region.id);
    expect(hits.every((u) => normalizeText(`${u.name} ${u.region}`).includes('dodoma'))).toBe(true);
  });

  it('respects the limit and returns nothing for an empty query', () => {
    expect(searchUnits(pool, 'a', 5)).toHaveLength(5);
    expect(searchUnits(pool, '   ')).toEqual([]);
  });
});

describe('area facts', () => {
  it('coverage counts agree with the engine’s percentage', () => {
    for (const u of [council, model.regions[0], model.sources[0]]) {
      const { have, total } = coverageCounts(u);
      expect(total).toBe(ALL_INDICATORS.length);
      expect(Math.round((have / total) * 100)).toBe(dataCoverage(u));
    }
  });
});

describe('translations', () => {
  const keys = (o: unknown, prefix = ''): string[] =>
    o && typeof o === 'object'
      ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
      : [];

  it('Kiswahili has every English key (and no extras)', () => {
    expect(keys(sw).sort()).toEqual(keys(en).sort());
  });

  it('no empty strings', () => {
    const values = (o: unknown): string[] => (o && typeof o === 'object' ? Object.values(o as Record<string, unknown>).flatMap(values) : [String(o)]);
    expect(values(en).every((v) => v.trim().length > 0)).toBe(true);
    expect(values(sw).every((v) => v.trim().length > 0)).toBe(true);
  });
});
