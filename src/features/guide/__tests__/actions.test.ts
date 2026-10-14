/**
 * The Guide Book's standing actions assembled for an area: a hazard's rows that hold everywhere, the rows that
 * go further where its own score is high, the coast's rows on the coast only; a group's rows where it scores
 * medium or above; and the committees' rows standing in place of a guide row or following the rows, the most
 * specific first (docs/RISK_COMMUNICATION_DESIGN.md). Nothing here is a warning.
 */
import { describe, expect, it } from 'vitest';
import type { CommitteeRecord, GuidancePayload } from '@/data-layer/types';
import { buildModel } from '@/engine/risk/model';
import { actionRecords, applyActions, groupActionRows, groupsAtLevel, hazardActionRows, scopeOf } from '../actions';
import { levelForScore } from '../alert';
import type { GuideRow, IndicatorGuide, StandingGuide } from '../data';

const model = buildModel();

const row = (en: string): GuideRow => ({ impact: { en, sw: `${en} (sw)` }, actions: { en: [`do ${en}`], sw: [`fanya ${en}`] } });
const standing: StandingGuide = {
  hazard: 'floods',
  title: { en: 'Floods', sw: 'Mafuriko' },
  intro: { en: 'keep doing', sw: 'endelea' },
  rows: [
    { who: { en: 'Households', sw: 'Kaya' }, actions: { en: ['know the mark'], sw: ['fahamu alama'] }, high: false, coastal: false },
    { who: { en: 'Committees', sw: 'Kamati' }, actions: { en: ['mark the plots'], sw: ['weka alama'] }, high: false, coastal: false },
    { who: { en: 'Coastal households', sw: 'Kaya za pwani' }, actions: { en: ['know the way up'], sw: ['fahamu njia'] }, high: false, coastal: true },
    { who: { en: 'Where the risk is high', sw: 'Pale hatari ilipo juu' }, actions: { en: ['build higher'], sw: ['jenga juu'] }, high: true, coastal: false },
  ],
};

function record(unitId: string, payload: Partial<GuidancePayload> & { topic: 'action' }, extra: Partial<CommitteeRecord> = {}): CommitteeRecord {
  const level = unitId === 'TZ' ? 'national' : unitId.startsWith('R-') ? 'region' : 'council';
  return {
    id: `${unitId}-${payload.group ?? extra.hazard}-${payload.level ?? 'all'}-${payload.replaces ?? 'new'}-${payload.impact?.en ?? ''}`,
    kind: 'guidance',
    unitId,
    level,
    unitName: unitId,
    region: '',
    regionId: level === 'national' ? null : level === 'region' ? unitId : 'R-dodoma',
    payload: { area: { en: '', sw: '' }, risk: { en: '', sw: '' }, advice: { en: '', sw: '' }, replaces: null, ...payload },
    source: 'test',
    authorName: 'test',
    status: 'approved',
    createdAt: '2026-10-14T00:00:00Z',
    ...extra,
  };
}

describe('the band of one hazard or group', () => {
  it('follows the hazard list display rule: under 4 band 1, 4 to under 6 band 2, 6 and above band 3', () => {
    expect(levelForScore(0)).toBe(1);
    expect(levelForScore(3.9)).toBe(1);
    expect(levelForScore(4)).toBe(2);
    expect(levelForScore(5.9)).toBe(2);
    expect(levelForScore(6)).toBe(3);
    expect(levelForScore(10)).toBe(3);
    expect(levelForScore(null)).toBeNull();
  });

  it('lists the vulnerability and coping groups of a council scoring medium or above, highest first, never a hazard group', () => {
    const kondoa = model.byId.get('C001')!;
    const groups = groupsAtLevel(kondoa);
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      expect(['vulnerability', 'coping']).toContain(g.dim);
      expect(g.score).toBeGreaterThanOrEqual(4);
      expect(g.level).toBeGreaterThanOrEqual(2);
    }
    expect(groups.map((g) => g.score)).toEqual([...groups.map((g) => g.score)].sort((a, b) => b - a));
    expect(scopeOf(kondoa)).toEqual({ councilId: 'C001', regionId: 'R-dodoma' });
  });
});

describe('standing rows of a hazard', () => {
  const scope = { councilId: 'C001', regionId: 'R-dodoma' };

  it('hold everywhere; the rows for high risk join at band 3; the coast rows on the coast only', () => {
    expect(hazardActionRows(1, standing, false, 'floods', [], scope).map((r) => r.impact.en)).toEqual(['Households', 'Committees']);
    expect(hazardActionRows(2, standing, false, 'floods', [], scope).map((r) => r.impact.en)).toEqual(['Households', 'Committees']);
    expect(hazardActionRows(3, standing, false, 'floods', [], scope).map((r) => r.impact.en)).toEqual(['Households', 'Committees', 'Where the risk is high']);
    expect(hazardActionRows(3, standing, true, 'floods', [], scope).map((r) => r.impact.en)).toEqual(['Households', 'Committees', 'Coastal households', 'Where the risk is high']);
    expect(hazardActionRows(2, standing, false, 'floods', [], scope)[0]).toMatchObject({ from: 'guide', actions: { en: ['know the mark'] } });
    expect(hazardActionRows(3, null, false, 'floods', [], scope)).toEqual([]);
  });

  it("apply the committees' rows: a replacement stands in place (counted as the book lists its rows), additions follow, the council's before the region's before the nation's, a row holding from the band it names up", () => {
    const records = [
      record('TZ', { topic: 'action', level: null, impact: { en: 'national add', sw: '' }, actions: { en: ['n'], sw: [] } }, { hazard: 'floods' }),
      record('TZ', { topic: 'action', level: null, replaces: 0, impact: { en: 'national replace 0', sw: '' }, actions: { en: ['n0'], sw: [] } }, { hazard: 'floods' }),
      record('C001', { topic: 'action', level: null, replaces: 0, impact: { en: 'council replace 0', sw: '' }, actions: { en: ['c0'], sw: [] } }, { hazard: 'floods' }),
      record('R-dodoma', { topic: 'action', level: 2, impact: { en: 'region from medium', sw: '' }, actions: { en: ['r'], sw: [] } }, { hazard: 'floods' }),
      record('C001', { topic: 'action', level: 3, impact: { en: 'council at high', sw: '' }, actions: { en: ['c3'], sw: [] } }, { hazard: 'floods' }),
      record('TZ', { topic: 'action', level: null, replaces: 3, impact: { en: 'national replace the high row', sw: '' }, actions: { en: ['n3'], sw: [] } }, { hazard: 'floods' }),
      record('C999', { topic: 'action', level: null, impact: { en: 'another council', sw: '' }, actions: { en: ['x'], sw: [] } }, { hazard: 'floods' }),
      record('TZ', { topic: 'action', level: null, impact: { en: 'other hazard', sw: '' }, actions: { en: ['x'], sw: [] } }, { hazard: 'drought' }),
      record('TZ', { topic: 'action', level: null, impact: { en: 'pending', sw: '' }, actions: { en: ['x'], sw: [] } }, { hazard: 'floods', status: 'pending' }),
    ];
    const names = (rows: { impact: { en: string } }[]) => rows.map((r) => r.impact.en);
    expect(names(actionRecords(records, { hazard: 'floods' }, 1, scope).map((r) => r.payload as GuidancePayload) as never)).toEqual(['council replace 0', 'national add', 'national replace 0', 'national replace the high row']);
    expect(names(hazardActionRows(1, standing, false, 'floods', records, scope))).toEqual(['council replace 0', 'Committees', 'national add']);
    expect(names(hazardActionRows(2, standing, false, 'floods', records, scope))).toEqual(['council replace 0', 'Committees', 'region from medium', 'national add']);
    expect(names(hazardActionRows(3, standing, false, 'floods', records, scope))).toEqual(['council replace 0', 'Committees', 'national replace the high row', 'council at high', 'region from medium', 'national add']);
    expect(hazardActionRows(1, standing, false, 'floods', records, scope)[0].from).toBe('committee');
    // A replacement past the guide's rows is simply added.
    expect(applyActions([row('only')], 'guide', [record('TZ', { topic: 'action', replaces: 5, impact: { en: 'late', sw: '' }, actions: { en: [], sw: [] } }, { hazard: 'floods' })]).map((r) => r.impact.en)).toEqual(['only', 'late']);
  });
});

describe('rows of a vulnerability or coping group', () => {
  it("are the guide's rows, which hold at every band, with the committees' rows for the group applied", () => {
    const guide: IndicatorGuide = { ref: 'coping:wash', title: { en: 'WASH', sw: 'Maji' }, intro: { en: 'measures', sw: 'kinapima' }, rows: [row('wash a'), row('wash b')] };
    const records = [record('TZ', { topic: 'action', group: 'coping:wash', level: 3, replaces: 1, impact: { en: 'pmo wash b at high', sw: '' }, actions: { en: ['p'], sw: [] } })];
    expect(groupActionRows(2, guide, 'coping:wash', records, {}).map((r) => r.impact.en)).toEqual(['wash a', 'wash b']);
    expect(groupActionRows(3, guide, 'coping:wash', records, {}).map((r) => r.impact.en)).toEqual(['wash a', 'pmo wash b at high']);
    expect(groupActionRows(3, null, 'coping:wash', [], {})).toEqual([]);
  });
});
