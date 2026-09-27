import { describe, expect, it } from 'vitest';
import enArea from '@/i18n/locales/en/area.json';
import swArea from '@/i18n/locales/sw/area.json';
import { buildModel } from '@/engine/risk/model';
import {
  beeswarm,
  categoryRows,
  compareHref,
  coverageCounts,
  delta,
  explorerHref,
  formatDelta,
  indicatorRows,
  peersOf,
  per10k,
  placeListsFor,
  rankAmong,
  regionOf,
  resolveUnit,
  servicesFor,
  unitArea,
  weakestDimension,
} from './lib';

const model = buildModel();
const council = model.councils[0];

describe('resolveUnit', () => {
  it('resolves every id form', () => {
    expect(resolveUnit(model, council.id)).toBe(council);
    expect(resolveUnit(model, council.id.toLowerCase())).toBe(council);
    expect(resolveUnit(model, 'TZ')).toBe(model.national);
    expect(resolveUnit(model, 'tz')).toBe(model.national);
    const src = model.sources[0];
    expect(resolveUnit(model, src.id)).toBe(src);
    const region = model.regions[0];
    expect(resolveUnit(model, region.id)).toBe(region);
    expect(resolveUnit(model, `R-${region.name.toUpperCase()}`)).toBe(region);
    expect(resolveUnit(model, region.name)).toBe(region);
  });
  it('returns null for unknown ids', () => {
    expect(resolveUnit(model, 'C999')).toBeNull();
    expect(resolveUnit(model, 'nowhere')).toBeNull();
    expect(resolveUnit(model, '')).toBeNull();
    expect(resolveUnit(model, undefined)).toBeNull();
  });
});

describe('peers, regions and ranks', () => {
  it('finds the region of councils and source units', () => {
    const r = regionOf(model, council);
    expect(r?.level).toBe('region');
    expect(r?.name).toBe(council.region);
    for (const s of model.sources) expect(regionOf(model, s), s.name).not.toBeNull();
    expect(regionOf(model, model.national)).toBeNull();
  });

  it('ranks with competition ranking and a sensible percentile', () => {
    const peers = peersOf(model, council);
    expect(peers).toHaveLength(model.councils.length);
    const top = [...peers].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))[0];
    const r = rankAmong(top, peers)!;
    expect(r.rank).toBe(1);
    expect(r.percentile).toBeGreaterThanOrEqual(95);
    const any = rankAmong(council, peers)!;
    expect(any.rank).toBeGreaterThanOrEqual(1);
    expect(any.rank).toBeLessThanOrEqual(any.total);
    expect(peersOf(model, model.national)).toEqual([]);
  });

  it('lists siblings, members and regions', () => {
    const [siblings] = placeListsFor(model, council);
    expect(siblings.kind).toBe('siblings');
    expect(siblings.units).toContain(council);
    expect(siblings.units.every((u) => u.region === council.region)).toBe(true);
    const region = regionOf(model, council)!;
    const [members] = placeListsFor(model, region);
    expect(members.units.length).toBe(region.members);
    expect(placeListsFor(model, model.national)[0].units).toHaveLength(model.regions.length);
    const src = model.byId.get(council.sourceId!)!;
    const lists = placeListsFor(model, src);
    expect(lists.find((l) => l.kind === 'sourceCouncils')?.units).toContain(council);
  });
});

describe('indicator and category rows', () => {
  it('covers every leaf and keeps null distinct from zero', () => {
    const rows = indicatorRows(council, regionOf(model, council), model.national);
    expect(rows).toHaveLength(32);
    const cov = coverageCounts(council);
    expect(cov.have).toBe(rows.filter((r) => r.value !== null).length);
    expect(cov.total).toBe(32);
    // The national unit is its own reference, so it has no national comparison.
    expect(indicatorRows(model.national, null, model.national).every((r) => r.national === null)).toBe(true);
  });
  it('builds six category rows', () => {
    const rows = categoryRows(council, regionOf(model, council), model.national);
    expect(rows.map((r) => r.key)).toEqual(['natural', 'human', 'socioEconomic', 'vulnerableGroups', 'infrastructure', 'institutional']);
  });
});

describe('small helpers', () => {
  it('formats deltas with a true minus sign', () => {
    expect(delta(5.44, 4.1)).toBe(1.3);
    expect(delta(null, 4)).toBeNull();
    expect(formatDelta(0.8)).toBe('+0.8');
    expect(formatDelta(-0.3)).toBe('−0.3');
    expect(formatDelta(0)).toBe('0.0');
    expect(formatDelta(null)).toBe('—');
  });
  it('computes per-10k rates and area', () => {
    expect(per10k(25, 100_000)).toBe(2.5);
    expect(per10k(25, 0)).toBeNull();
    expect(unitArea(council)).toBeGreaterThan(0);
  });
  it('picks the weakest dimension on its own scale', () => {
    const w = weakestDimension(model.national);
    expect(w).not.toBeNull();
    expect(['hazard', 'vulnerability', 'coping']).toContain(w!.key);
  });
  it('builds explorer and compare links', () => {
    expect(explorerHref(council)).toBe(`/explore?level=council&id=${council.id}`);
    expect(explorerHref(model.national)).toBe('/explore');
    expect(compareHref(council)).toContain(`cmp=${council.id}`);
  });
});

describe('beeswarm', () => {
  it('keeps exact x values and separates points within a lane', () => {
    const values = [1, 1, 1, 1.05, 2, 5, 5, 5, 5, 5, null];
    const { points, maxLane } = beeswarm(values, (v) => v, 0.2);
    expect(points).toHaveLength(10);
    expect(maxLane).toBeGreaterThanOrEqual(2);
    const lanes = new Map<number, number[]>();
    for (const p of points) lanes.set(p.y, [...(lanes.get(p.y) ?? []), p.x]);
    for (const xs of lanes.values()) for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(0.2 - 1e-9);
  });
});

describe('services', () => {
  it('does not double-count districts shared by several councils', () => {
    const national = servicesFor(model, model.national);
    expect(national.basis).toBe('aggregate');
    expect(national.districts).toBeLessThanOrEqual(model.sources.length);
    const direct = model.sources.filter((s) => s.facilities).reduce((a, s) => a + s.facilities!.health, 0);
    expect(national.facilities?.health).toBeLessThanOrEqual(direct);
    const c = servicesFor(model, council);
    expect(c.basis).toBe('source');
    expect(c.sourceId).toBe(council.sourceId);
    expect(c.sharedBy).toBeGreaterThanOrEqual(1);
  });
});

describe('area translations', () => {
  const flatten = (o: Record<string, unknown>, p = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flatten(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));
  // Plural/ordinal suffixes differ by language (English has one/two/few/other ordinals, Kiswahili only other).
  const base = (k: string) => k.replace(/_(ordinal_)?(zero|one|two|few|many|other)$/, '');
  it('has the same keys in English and Kiswahili', () => {
    const en = new Set(flatten(enArea).map(base));
    const sw = new Set(flatten(swArea).map(base));
    expect([...en].filter((k) => !sw.has(k))).toEqual([]);
    expect([...sw].filter((k) => !en.has(k))).toEqual([]);
  });
});
