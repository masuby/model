/**
 * The Core dataset is the INFORM SADC 2024 workbook and nothing else: every scoring value of the 170
 * units equals the workbook's cached cell, and every category, dimension and risk the engine derives
 * from those values equals the workbook's own result. Tanzanian improvements live in the Advancement
 * layer, never here. (The fixture is exported straight from the workbook by
 * scripts/audit/export_workbook_leaves.py.)
 */
import { describe, expect, it } from 'vitest';
import data from '@/data/tanzania-inform-risk.json';
import fixture from './fixtures/workbook.leaves.fixture.json';
import { DIMENSIONS } from '../hierarchy';
import { buildModel, indicatorValue, placeKey } from '../model';
import { QUARANTINE_NOTES, noteApplies } from '../notes';

interface FixtureUnit { id: string; name: string; leaves: Record<string, number | null>; hazard: number | null; vulnerability: number | null; coping: number | null; risk: number | null }
const WB = (fixture as { units: FixtureUnit[] }).units;
const D = (data as { subnational: { adm2: Array<Record<string, unknown> & { admin: { adm2Code: string; adm2Name: string } }> }; metadata: Record<string, unknown> }).subnational.adm2;
const META = (data as { metadata: Record<string, unknown> }).metadata;
// The workbook exactly (the reference the tests prove) and the live model (the quarantined values withheld).
const workbook = buildModel({}, { workbookOnly: true });
const model = buildModel();

function leafOf(unit: Record<string, unknown>, dimField: string, category: string, key: string): number | null {
  const v = ((unit[dimField] as Record<string, Record<string, unknown>>)[category] ?? {})[key];
  return typeof v === 'number' ? v : null;
}

describe('the Core is the workbook', () => {
  it('is built from the workbook and says so', () => {
    expect(META.layer).toBe('core');
    expect(String(META.source)).toContain('INFORM Sub-national SADC 2024');
    expect(String(META.sourceSha256)).toMatch(/^[0-9a-f]{64}$/);
    expect(D).toHaveLength(170);
  });

  it('every scoring value of every unit equals the workbook cell (170 × 32)', () => {
    const byId = new Map(D.map((u) => [u.admin.adm2Code, u]));
    const wrong: string[] = [];
    for (const w of WB) {
      const u = byId.get(w.id);
      expect(u, w.id).toBeTruthy();
      for (const dim of DIMENSIONS)
        for (const cat of dim.categories)
          for (const ind of cat.indicators) {
            const ours = leafOf(u!, dim.field, cat.key, ind.key);
            const theirs = w.leaves[ind.key] ?? null;
            if (ours === null ? theirs !== null : theirs === null || Math.abs(ours - theirs) > 1e-9) wrong.push(`${w.name} ${ind.key}: ${ours} ≠ ${theirs}`);
          }
    }
    expect(wrong).toEqual([]);
  });

  it('the engine reproduces every workbook dimension and risk from those values', () => {
    const byId = new Map(workbook.sources.map((s) => [s.id, s]));
    const wrong: string[] = [];
    for (const w of WB) {
      const s = byId.get(w.id)!;
      const pairs: Array<[string, number | null, number | null]> = [
        ['H', s.dims.hazard.score, w.hazard],
        ['V', s.dims.vulnerability.score, w.vulnerability],
        ['LCC', s.dims.coping.score, w.coping],
        ['risk', s.risk, w.risk],
      ];
      for (const [k, ours, theirs] of pairs) if (ours !== theirs) wrong.push(`${w.name} ${k}: ${ours} ≠ ${theirs}`);
    }
    expect(wrong).toEqual([]);
  });

  it('the live model withholds exactly the quarantined values of the data notes, and nothing else', () => {
    const wb = new Map(workbook.sources.map((s) => [s.id, s]));
    let withheld = 0;
    for (const u of model.sources) {
      const w = wb.get(u.id)!;
      for (const dim of DIMENSIONS)
        for (const cat of dim.categories)
          for (const ind of cat.indicators) {
            const ref = `${dim.key}:${ind.key}` as const;
            const live = indicatorValue(u, dim.key, ind.key);
            const exact = indicatorValue(w, dim.key, ind.key);
            const notes = QUARANTINE_NOTES.filter((n) => n.ref === ref && noteApplies(n, w, exact));
            if (notes.length) {
              withheld++;
              expect(u.quarantined?.[ref], `${u.name} ${ref}`).toBe(notes[0].id);
              // A group with one workbook indicator is missing; communication keeps its cellphone indicator.
              if (ref === 'coping:communication') expect(live).not.toBeNull();
              else expect(live, `${u.name} ${ref}`).toBeNull();
            } else {
              expect(u.quarantined?.[ref]).toBeUndefined();
              expect(live, `${u.name} ${ref}`).toBe(exact);
            }
          }
    }
    // Every unit loses coastal erosion and food security, and internal violence, conflict intensity and
    // conflict risk by programme decision (DN-12 to DN-14); Dar es Salaam's drought, Ukerewe's landslide, Dodoma's electricity and the two
    // displaced-people rows are withheld as well. The Lake zone's drought and Kagera's earthquake were
    // explained on 10 October 2026 (DN-02, DN-03) and are retained.
    const unitsIn = (...regions: string[]) => workbook.sources.filter((u) => regions.includes(placeKey(u.region))).length;
    // Since 14 October 2026 the earthquake exposure (DN-10) and the drought frequency (DN-02) are withheld for
    // every unit as well, so Dar es Salaam's drought (DN-01) no longer adds a unit of its own.
    expect(withheld).toBe(170 * 7 + 1 + unitsIn('dodoma') + unitsIn('kaskaziniunguja', 'manyara'));
    // Internal violence has no value left anywhere in the live model: both of its indicators are withheld.
    expect(model.sources.every((u) => indicatorValue(u, 'hazard', 'internalViolence') === null)).toBe(true);
    expect(model.councils.every((c) => indicatorValue(c, 'hazard', 'internalViolence') === null)).toBe(true);
    const dar = model.sources.find((s) => s.name === 'Kinondoni')!;
    expect(indicatorValue(dar, 'hazard', 'drought')).toBeNull();
    expect(indicatorValue(workbook.sources.find((s) => s.name === 'Kinondoni')!, 'hazard', 'drought')).toBe(10);
    const kondoa = model.sources.find((s) => s.name === 'Kondoa')!;
    expect(indicatorValue(kondoa, 'coping', 'communication')).not.toBe(indicatorValue(workbook.sources.find((s) => s.name === 'Kondoa')!, 'coping', 'communication'));
  });

  it('carries no value the workbook does not have (no refill, overlay, grade or floor)', () => {
    const filled = (key: string) => D.filter((u) => typeof (u.hazardExposure as Record<string, Record<string, unknown>>).natural[key] === 'number').length;
    for (const empty of ['heatwave', 'lightning', 'zoonoses']) expect(filled(empty), empty).toBe(0);
    for (const u of D) {
      expect((u.hazardExposure as Record<string, unknown>).hazardFreq).toBeUndefined();
      expect((u.hazardExposure as Record<string, unknown>).events).toBeUndefined();
    }
  });
});
