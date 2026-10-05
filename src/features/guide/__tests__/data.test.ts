/**
 * The Risk Action Guide Book data (built by scripts/build-action-guide.py): every council on the site has
 * its own guidance, filed under its own region, and everything is there in English and Kiswahili.
 */
import { describe, expect, it } from 'vitest';
import incidents from '@/data/action-guide/incidents.json';
import { buildModel, placeKey } from '@/engine/risk/model';
import { guideCouncils, HAZARD_KEYS, isStatusRow, pick, rankHazards, type GuideLevels, type IncidentGroup, type RegionGuide } from '../data';

const regionFiles = import.meta.glob<RegionGuide>('../../../data/action-guide/regions/*.json', { import: 'default', eager: true });
const hazardFiles = import.meta.glob<{ levels: GuideLevels }>('../../../data/action-guide/hazards/*.json', { import: 'default', eager: true });
const model = buildModel();
const fileKey = (path: string) => path.replace(/^.*\/(.+)\.json$/, '$1');

describe('Risk Action Guide Book data', () => {
  const byCouncil = new Map(Object.entries(regionFiles).flatMap(([path, r]) => Object.entries(r.councils).map(([id, g]) => [id, { region: fileKey(path), guide: g }] as const)));

  it('gives every council on the site its own guidance, filed under its region', () => {
    expect(byCouncil.size).toBe(model.councils.length);
    for (const c of model.councils) {
      const entry = byCouncil.get(c.id);
      expect(entry, c.name).toBeTruthy();
      expect(entry!.region, c.name).toBe(placeKey(c.region));
      expect(entry!.guide.hazards.length, c.name).toBeGreaterThan(0);
      for (const h of entry!.guide.hazards) expect(HAZARD_KEYS).toContain(h);
      expect(entry!.guide.know.length, c.name).toBeGreaterThan(0);
      for (const k of entry!.guide.know)
        for (const text of [k.area, k.risk]) {
          expect(text.en, c.name).toBeTruthy();
          expect(text.sw, c.name).toBeTruthy();
        }
    }
  });

  it('has the three alert levels of every hazard, in English and Kiswahili', () => {
    expect(Object.keys(hazardFiles).map(fileKey).sort()).toEqual([...HAZARD_KEYS].sort());
    for (const [path, { levels }] of Object.entries(hazardFiles))
      for (const level of ['1', '2', '3'] as const) {
        const rows = levels[level] ?? [];
        expect(rows.filter((r) => !isStatusRow(r)).length, `${fileKey(path)} level ${level}`).toBeGreaterThanOrEqual(3);
        for (const r of rows) {
          expect(r.impact.en && r.impact.sw, `${fileKey(path)} ${level}: ${r.impact.en}`).toBeTruthy();
          expect(r.actions.en.length && r.actions.sw.length, `${fileKey(path)} ${level}: ${r.impact.en}`).toBeTruthy();
        }
      }
  });

  it("has Tabora's council plans, and the incident guide, in both languages", () => {
    const tabora = Object.values(regionFiles['../../../data/action-guide/regions/tabora.json'].councils);
    expect(tabora.length).toBeGreaterThan(0);
    for (const c of tabora) expect(Object.keys(c.levels ?? {}).sort()).toEqual(['1', '2', '3']);
    const groups = incidents as IncidentGroup[];
    expect(groups.length).toBeGreaterThanOrEqual(5);
    for (const g of groups) for (const r of g.rows) expect(r.incident.sw && r.actions.sw.length).toBeTruthy();
  });

  it('keeps to the house style: no em dashes', () => {
    const all = JSON.stringify([regionFiles, hazardFiles, incidents]);
    expect(all.includes('\u2014')).toBe(false);
  });
});

describe('guide helpers', () => {
  it('finds the councils behind any area', () => {
    const council = model.councils[0];
    expect(guideCouncils(model, council)).toEqual([council]);
    const region = model.byId.get(`R-${placeKey(council.region)}`)!;
    expect(guideCouncils(model, region).map((c) => c.id)).toContain(council.id);
    const source = model.byId.get(council.sourceId!)!;
    expect(guideCouncils(model, source).every((c) => c.sourceId === source.id)).toBe(true);
    expect(guideCouncils(model, model.national)).toEqual([]);
  });

  it('ranks hazards by how many councils name them, then by how early', () => {
    expect(rankHazards([['floods', 'drought'], ['drought'], ['wildfire', 'floods']])).toEqual(['floods', 'drought', 'wildfire']);
    expect(rankHazards([])).toEqual([]);
  });

  it('reads the reader’s language, falling back to the other', () => {
    expect(pick({ en: 'Flood', sw: 'Mafuriko' }, 'sw')).toBe('Mafuriko');
    expect(pick({ en: 'Flood', sw: '' }, 'sw')).toBe('Flood');
    expect(pick({ en: 'Flood', sw: 'Mafuriko' }, 'en')).toBe('Flood');
  });
});
