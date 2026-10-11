// @vitest-environment jsdom
/**
 * Committee records follow the chain with area scopes (D8): a DDRRC records only its council, the RDRRC
 * of that region approves (never the author, never another region), region records need the NDRRC,
 * PMO-DMD may do anything, warnings publish on entry and lift on their end date, and approved content
 * reaches the model, the guide rows and the profile summary.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalRepository, demoProfile } from '@/data-layer/local';
import { activeWarnings, approvedDrrByUnit, canReviewCommittee, canSubmitCommittee, warningInForce, type NewCommitteeRecord, type Profile } from '@/data-layer/types';
import { buildModel } from '@/engine/risk/model';
import { servicesFor } from '@/features/area/lib';
import { applyGuidance, reportedEvents, vcActions, type KnowRow } from '@/features/guide/data';

const drr = (unitId: string, name: string): NewCommitteeRecord => ({
  kind: 'drr',
  unitId,
  level: 'council',
  unitName: name,
  region: 'Dodoma',
  regionId: 'R-dodoma',
  payload: { eprp: true, aa: false, ert: null, rvca: true, rvcaYear: 2025 },
  source: 'Council EPRP approved 12 March 2026; DDRRC minutes',
});
const regionDrr: NewCommitteeRecord = { kind: 'drr', unitId: 'R-dodoma', level: 'region', unitName: 'Dodoma', region: 'Dodoma', regionId: 'R-dodoma', payload: { eocc: true, ert: true }, source: 'Regional EOCC commissioned 2025 (PMO-DMD letter)' };
const guidance = (replaces: number | null): NewCommitteeRecord => ({
  kind: 'guidance',
  unitId: 'C001',
  level: 'council',
  unitName: 'Kondoa District',
  region: 'Dodoma',
  regionId: 'R-dodoma',
  payload: { area: { en: 'Bubu valley wards', sw: 'Kata za bonde la Bubu' }, risk: { en: 'Flash floods after heavy rain', sw: 'Mafuriko ya ghafla baada ya mvua kubwa' }, advice: { en: 'Keep channels clear', sw: 'Weka mifereji wazi' }, replaces, topic: 'hazard' },
  source: 'DDRRC meeting of 3 Sept 2026',
});
const event: NewCommitteeRecord = {
  kind: 'event',
  unitId: 'C001',
  level: 'council',
  unitName: 'Kondoa District',
  region: 'Dodoma',
  regionId: 'R-dodoma',
  hazard: 'floods',
  payload: { date: '2026-01-10', description: 'Flash floods along the Bubu river', affected: 400, displaced: 60 },
  source: 'DDRRC situation report of 10 Jan 2026',
};
const warning = (areas: string[], validFrom: string, validTo: string | null): NewCommitteeRecord => ({
  kind: 'warning',
  unitId: 'TZ',
  level: 'national',
  unitName: 'Tanzania',
  region: '',
  regionId: null,
  hazard: 'heavyRainfall',
  payload: { alertLevel: 2, areas, issuer: 'TMA', bulletin: 'TMA warning 12/2026' },
  source: 'TMA warning 12/2026',
  validFrom,
  validTo,
});

const ddrrc = demoProfile('ddrrc'); // Kondoa District (C001)
const rdrrc = demoProfile('rdrrc'); // Dodoma Region
const ndrrc = demoProfile('ndrrc');
const pmo = demoProfile('pmo');
const kigomaRdrrc: Profile = { ...rdrrc, id: 'rdrrc-kigoma', fullName: 'Kigoma RDRRC', scopeUnitId: 'R-kigoma' };

describe('committee scopes', () => {
  it('demo committee members carry their default area', () => {
    expect(ddrrc).toMatchObject({ role: 'ddrrc', scopeUnitId: 'C001' });
    expect(rdrrc).toMatchObject({ role: 'rdrrc', scopeUnitId: 'R-dodoma' });
    expect(ndrrc.scopeUnitId ?? null).toBeNull();
  });
  it('a DDRRC records only its council; an RDRRC its region and councils; the NDRRC and PMO anywhere; warnings only the NDRRC and PMO', () => {
    const c = (unitId: string, regionId: string) => ({ kind: 'drr' as const, unitId, level: 'council' as const, regionId });
    expect(canSubmitCommittee(ddrrc, c('C001', 'R-dodoma'))).toBe(true);
    expect(canSubmitCommittee(ddrrc, c('C002', 'R-dodoma'))).toBe(false);
    expect(canSubmitCommittee(ddrrc, { kind: 'drr', unitId: 'R-dodoma', level: 'region', regionId: 'R-dodoma' })).toBe(false);
    expect(canSubmitCommittee(rdrrc, c('C002', 'R-dodoma'))).toBe(true);
    expect(canSubmitCommittee(rdrrc, { kind: 'drr', unitId: 'R-dodoma', level: 'region', regionId: 'R-dodoma' })).toBe(true);
    expect(canSubmitCommittee(rdrrc, c('C113', 'R-kigoma'))).toBe(false);
    expect(canSubmitCommittee(rdrrc, { kind: 'guidance', unitId: 'TZ', level: 'national', regionId: null })).toBe(false);
    expect(canSubmitCommittee(ndrrc, c('C113', 'R-kigoma'))).toBe(true);
    expect(canSubmitCommittee(pmo, { kind: 'drr', unitId: 'R-kigoma', level: 'region', regionId: 'R-kigoma' })).toBe(true);
    expect(canSubmitCommittee(demoProfile('sector'), c('C001', 'R-dodoma'))).toBe(false);
    const w = { kind: 'warning' as const, unitId: 'TZ', level: 'national' as const, regionId: null };
    expect(canSubmitCommittee(rdrrc, w)).toBe(false);
    expect(canSubmitCommittee(ndrrc, w)).toBe(true);
    expect(canSubmitCommittee(pmo, w)).toBe(true);
  });
  it('council records are approved by the RDRRC of the region, region records by the NDRRC, national ones by PMO, never by the author', () => {
    const c = { kind: 'drr' as const, level: 'council' as const, regionId: 'R-dodoma', authorId: ddrrc.id };
    expect(canReviewCommittee(rdrrc, c)).toBe(true);
    expect(canReviewCommittee(kigomaRdrrc, c)).toBe(false);
    expect(canReviewCommittee(ndrrc, c)).toBe(false);
    expect(canReviewCommittee(ddrrc, c)).toBe(false);
    expect(canReviewCommittee(pmo, c)).toBe(true);
    const r = { kind: 'drr' as const, level: 'region' as const, regionId: 'R-dodoma', authorId: rdrrc.id };
    expect(canReviewCommittee(rdrrc, r)).toBe(false);
    expect(canReviewCommittee(ndrrc, r)).toBe(true);
    expect(canReviewCommittee(ndrrc, { ...r, authorId: ndrrc.id })).toBe(false);
    const n = { kind: 'guidance' as const, level: 'national' as const, regionId: null, authorId: ndrrc.id, payload: { topic: 'hazard' } as never };
    expect(canReviewCommittee(ndrrc, n)).toBe(false);
    expect(canReviewCommittee(pmo, n)).toBe(true);
    const vc = { ...n, authorId: pmo.id, payload: { topic: 'vc' } as never };
    expect(canReviewCommittee(ndrrc, vc)).toBe(true);
  });
});

describe('local repository: the chain is enforced', () => {
  const repo = createLocalRepository();
  beforeEach(() => localStorage.clear());

  it('a DDRRC cannot write outside its council', async () => {
    await expect(repo.submitCommittee(drr('C002', 'Kondoa Town'), ddrrc)).rejects.toThrow(/permission/);
    const r = await repo.submitCommittee(drr('C001', 'Kondoa District'), ddrrc);
    expect(r).toMatchObject({ status: 'pending', unitId: 'C001', authorRole: 'ddrrc' });
  });

  it('a council record is approved by its regional committee only', async () => {
    const r = await repo.submitCommittee(drr('C001', 'Kondoa District'), ddrrc);
    await expect(repo.reviewCommittee(r.id, 'approved', ddrrc)).rejects.toThrow(/permission/);
    await expect(repo.reviewCommittee(r.id, 'approved', kigomaRdrrc)).rejects.toThrow(/permission/);
    await expect(repo.reviewCommittee(r.id, 'approved', ndrrc)).rejects.toThrow(/permission/);
    await repo.reviewCommittee(r.id, 'approved', rdrrc);
    expect((await repo.listCommitteeRecords()).find((x) => x.id === r.id)).toMatchObject({ status: 'approved', reviewerName: rdrrc.fullName });
  });

  it('a region record is approved by the national committee; PMO-DMD may approve anything', async () => {
    const r = await repo.submitCommittee(regionDrr, rdrrc);
    await expect(repo.reviewCommittee(r.id, 'approved', rdrrc)).rejects.toThrow(/permission/);
    await repo.reviewCommittee(r.id, 'approved', ndrrc);
    const second = await repo.submitCommittee(drr('C002', 'Kondoa Town'), rdrrc);
    await repo.reviewCommittee(second.id, 'rejected', pmo, 'EPRP not yet costed');
    const list = await repo.listCommitteeRecords();
    expect(list.find((x) => x.id === r.id)!.status).toBe('approved');
    expect(list.find((x) => x.id === second.id)).toMatchObject({ status: 'rejected', reviewNote: 'EPRP not yet costed' });
  });

  it('approved arrangements reach the model and the profile summary; pending ones do not', async () => {
    const r1 = await repo.submitCommittee(drr('C001', 'Kondoa District'), ddrrc);
    await repo.reviewCommittee(r1.id, 'approved', rdrrc);
    const r2 = await repo.submitCommittee(regionDrr, rdrrc);
    await repo.reviewCommittee(r2.id, 'approved', ndrrc);
    await repo.submitCommittee(drr('C002', 'Kondoa Town'), rdrrc); // pending: must not count
    const drrByUnit = approvedDrrByUnit(await repo.listCommitteeRecords());
    expect(Object.keys(drrByUnit).sort()).toEqual(['C001', 'R-dodoma']);
    const model = buildModel({}, { drr: drrByUnit });
    expect(model.byId.get('C001')!.drr).toMatchObject({ eprp: true, aa: false, eocc: true, rvca: true });
    expect(model.byId.get('C002')!.drr?.eocc).toBe(true);
    expect(servicesFor(model, model.byId.get('C001')!).drr).toMatchObject({ eprp: 1, aa: 0, rvca: 1, eocc: 1, recorded: 1, total: 1 });
    const regionInfo = servicesFor(model, model.byId.get('R-dodoma')!);
    expect(regionInfo.drr.total).toBe(model.councilsByRegion.get('dodoma')!.length);
    expect(regionInfo.drr.eocc).toBe(regionInfo.drr.recorded);
    // Without records the council carries the published flags: Kondoa's plan came with its assessment.
    expect(buildModel().byId.get('C001')!.drr?.rvca).toBe(true);
  });

  it('guidance statements replace or add to the guide rows once approved; events show once validated', async () => {
    const rows: KnowRow[] = [
      { area: { en: 'Kondoa town', sw: 'Mji wa Kondoa' }, risk: { en: 'r1', sw: 'h1' }, advice: { en: 'a1', sw: 'u1' } },
      { area: { en: 'Highlands', sw: 'Milimani' }, risk: { en: 'r2', sw: 'h2' }, advice: { en: 'a2', sw: 'u2' } },
    ];
    const g1 = await repo.submitCommittee(guidance(0), ddrrc);
    const g2 = await repo.submitCommittee(guidance(null), ddrrc);
    const e1 = await repo.submitCommittee(event, ddrrc);
    let view = applyGuidance(rows, await repo.listCommitteeRecords(), 'C001');
    expect(view.map((v) => v.from)).toEqual(['guide', 'guide']); // nothing approved yet
    await repo.reviewCommittee(g1.id, 'approved', rdrrc);
    await repo.reviewCommittee(g2.id, 'approved', rdrrc);
    await repo.reviewCommittee(e1.id, 'approved', rdrrc);
    const records = await repo.listCommitteeRecords();
    view = applyGuidance(rows, records, 'C001');
    expect(view).toHaveLength(3);
    expect(view[0]).toMatchObject({ from: 'committee', area: { en: 'Bubu valley wards' } });
    expect(view[1]).toMatchObject({ from: 'guide', area: { en: 'Highlands' } });
    expect(view[2].from).toBe('committee');
    expect(applyGuidance(rows, records, 'C002').every((v) => v.from === 'guide')).toBe(true);
    expect(reportedEvents(records, ['C001']).map((r) => r.id)).toEqual([e1.id]);
    expect(reportedEvents(records, ['C002'])).toEqual([]);
  });

  it('warnings publish on entry for the NDRRC or PMO only, apply to their areas while valid, and can be withdrawn', async () => {
    await expect(repo.submitCommittee(warning(['R-dodoma'], '2026-10-01', '2026-10-12'), rdrrc)).rejects.toThrow(/permission/);
    const w = await repo.submitCommittee(warning(['R-dodoma', 'C113'], '2026-10-01', '2026-10-12'), ndrrc);
    expect(w.status).toBe('approved');
    expect(warningInForce(w, '2026-10-09')).toBe(true);
    expect(warningInForce(w, '2026-10-13')).toBe(false);
    expect(warningInForce(w, '2026-09-30')).toBe(false);
    const records = await repo.listCommitteeRecords();
    // A Dodoma council is covered through its region; Kasulu Town (C113) directly; a Kigoma neighbour is not.
    expect(activeWarnings(records, { id: 'C001', regionId: 'R-dodoma' }, '2026-10-09')).toHaveLength(1);
    expect(activeWarnings(records, { id: 'C113', regionId: 'R-kigoma' }, '2026-10-09')).toHaveLength(1);
    expect(activeWarnings(records, { id: 'C114', regionId: 'R-kigoma' }, '2026-10-09')).toHaveLength(0);
    expect(activeWarnings(records, { id: 'R-dodoma' }, '2026-10-09')).toHaveLength(1);
    expect(activeWarnings(records, { id: 'TZ', councilIds: ['R-dodoma', 'C113'] }, '2026-10-09')).toHaveLength(1);
    expect(activeWarnings(records, { id: 'C001', regionId: 'R-dodoma' }, '2026-10-20')).toHaveLength(0);
    const open = await repo.submitCommittee(warning(['TZ'], '2026-10-09', null), pmo);
    expect(activeWarnings(await repo.listCommitteeRecords(), { id: 'C114', regionId: 'R-kigoma' }, '2027-01-01')).toHaveLength(1);
    await expect(repo.reviewCommittee(open.id, 'rejected', rdrrc, 'x')).rejects.toThrow(/permission/);
    await repo.reviewCommittee(open.id, 'rejected', ndrrc, 'Lifted by TMA');
    expect(activeWarnings(await repo.listCommitteeRecords(), { id: 'C114', regionId: 'R-kigoma' }, '2027-01-01')).toHaveLength(0);
  });

  it('the action library is written by PMO-DMD and reviewed by the NDRRC; committees cannot write national content', async () => {
    const entry: NewCommitteeRecord = {
      kind: 'guidance',
      unitId: 'TZ',
      level: 'national',
      unitName: 'Tanzania',
      region: '',
      regionId: null,
      payload: { topic: 'vc', group: 'coping:wash', leadSector: 'MOW', area: { en: '', sw: '' }, risk: { en: 'Unsafe water spreads disease after floods', sw: '' }, advice: { en: 'Protect wells and extend piped supply', sw: 'Linda visima na panua maji ya bomba' }, replaces: null } as never,
      source: 'National Water Policy; NDMS 2022-2027 s.4',
    };
    await expect(repo.submitCommittee(entry, rdrrc)).rejects.toThrow(/permission/);
    const r = await repo.submitCommittee(entry, pmo);
    expect(r.status).toBe('pending');
    await expect(repo.reviewCommittee(r.id, 'approved', rdrrc)).rejects.toThrow(/permission/);
    await repo.reviewCommittee(r.id, 'approved', ndrrc);
    const lib = vcActions(await repo.listCommitteeRecords());
    expect(lib.get('coping:wash')).toMatchObject({ leadSector: 'MOW', actions: { en: 'Protect wells and extend piped supply' } });
    expect(lib.get('coping:wash')!.leadSectors).toEqual([]); // an older entry: one authority, no sectors chosen
    expect(lib.has('coping:education')).toBe(false);
  });
});
