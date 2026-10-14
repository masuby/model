/**
 * The Guide Book's rows assembled for an area: a hazard at its own level, a group at Level 2 or 3, the
 * council's own rows before the guide's, and the committees' rows standing in place of a guide row or
 * following the rows, the most specific first (docs/RISK_COMMUNICATION_DESIGN.md).
 */
import { describe, expect, it } from 'vitest';
import type { CommitteeRecord, GuidancePayload } from '@/data-layer/types';
import { buildModel } from '@/engine/risk/model';
import { actionRecords, applyActions, groupActionRows, groupsAtLevel, hazardActionRows, scopeOf } from '../actions';
import { levelForScore } from '../alert';
import type { CouncilGuide, GuideLevels, GuideRow, IndicatorGuide } from '../data';

const model = buildModel();

const row = (en: string): GuideRow => ({ impact: { en, sw: `${en} (sw)` }, actions: { en: [`do ${en}`], sw: [`fanya ${en}`] } });
const levels: GuideLevels = { '1': [row('l1 a'), row('l1 b')], '2': [row('l2 a'), row('Warning status')], '3': [row('l3 a'), row('l3 b'), row('l3 c')] };

function record(unitId: string, payload: Partial<GuidancePayload> & { topic: 'action' }, extra: Partial<CommitteeRecord> = {}): CommitteeRecord {
  const level = unitId === 'TZ' ? 'national' : unitId.startsWith('R-') ? 'region' : 'council';
  return {
    id: `${unitId}-${payload.group ?? extra.hazard}-${payload.level ?? 'all'}-${payload.replaces ?? 'new'}`,
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

describe('levels of one indicator group', () => {
  it('follow the hazard list display rule: under 4 Level 1, 4 to under 6 Level 2, 6 and above Level 3', () => {
    expect(levelForScore(0)).toBe(1);
    expect(levelForScore(3.9)).toBe(1);
    expect(levelForScore(4)).toBe(2);
    expect(levelForScore(5.9)).toBe(2);
    expect(levelForScore(6)).toBe(3);
    expect(levelForScore(10)).toBe(3);
    expect(levelForScore(null)).toBeNull();
  });

  it('lists the vulnerability and coping groups of a council at Level 2 or 3, highest first, never a hazard group', () => {
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

describe('rows of a hazard at a level', () => {
  it("are the guide's rows at that level, without the 'keep following updates' row", () => {
    const rows = hazardActionRows(2, levels, null, 'floods', [], { councilId: 'C001', regionId: 'R-dodoma' });
    expect(rows.map((r) => r.impact.en)).toEqual(['l2 a']);
    expect(rows[0].from).toBe('guide');
  });

  it("are the council's own rows when the guide has them (Tabora)", () => {
    const council: CouncilGuide = { name: 'Tabora', hazards: ['floods'], know: [], levels: { '3': [row('own l3')] } };
    expect(hazardActionRows(3, levels, council, 'floods', [], {}).map((r) => [r.impact.en, r.from])).toEqual([['own l3', 'council']]);
    // Another level without own rows falls back to the guide's.
    expect(hazardActionRows(1, levels, council, 'floods', [], {}).map((r) => r.impact.en)).toEqual(['l1 a', 'l1 b']);
  });

  it("apply the committees' rows: a replacement stands in place, additions follow, the council's before the region's before the nation's", () => {
    const scope = { councilId: 'C001', regionId: 'R-dodoma' };
    const records = [
      record('TZ', { topic: 'action', level: 3, impact: { en: 'national add', sw: '' }, actions: { en: ['n'], sw: [] } }, { hazard: 'floods' }),
      record('TZ', { topic: 'action', level: 3, replaces: 0, impact: { en: 'national replace 0', sw: '' }, actions: { en: ['n0'], sw: [] } }, { hazard: 'floods' }),
      record('C001', { topic: 'action', level: 3, replaces: 0, impact: { en: 'council replace 0', sw: '' }, actions: { en: ['c0'], sw: [] } }, { hazard: 'floods' }),
      record('R-dodoma', { topic: 'action', level: null, impact: { en: 'region add every level', sw: '' }, actions: { en: ['r'], sw: [] } }, { hazard: 'floods' }),
      record('C001', { topic: 'action', level: 2, impact: { en: 'council level 2 only', sw: '' }, actions: { en: ['c2'], sw: [] } }, { hazard: 'floods' }),
      record('C999', { topic: 'action', level: 3, impact: { en: 'another council', sw: '' }, actions: { en: ['x'], sw: [] } }, { hazard: 'floods' }),
      record('TZ', { topic: 'action', level: 3, impact: { en: 'other hazard', sw: '' }, actions: { en: ['x'], sw: [] } }, { hazard: 'drought' }),
      record('TZ', { topic: 'action', level: 3, impact: { en: 'pending', sw: '' }, actions: { en: ['x'], sw: [] } }, { hazard: 'floods', status: 'pending' }),
    ];
    expect(actionRecords(records, { hazard: 'floods' }, 3, scope).map((r) => (r.payload as GuidancePayload).impact!.en)).toEqual(['council replace 0', 'region add every level', 'national add', 'national replace 0']);
    const rows = hazardActionRows(3, levels, null, 'floods', records, scope);
    expect(rows.map((r) => [r.impact.en, r.from])).toEqual([
      ['council replace 0', 'committee'],
      ['l3 b', 'guide'],
      ['l3 c', 'guide'],
      ['region add every level', 'committee'],
      ['national add', 'committee'],
    ]);
    // A replacement past the guide's rows is simply added.
    expect(applyActions([row('only')], 'guide', [record('TZ', { topic: 'action', replaces: 5, impact: { en: 'late', sw: '' }, actions: { en: [], sw: [] } }, { hazard: 'floods' })]).map((r) => r.impact.en)).toEqual(['only', 'late']);
  });
});

describe('rows of a vulnerability or coping group', () => {
  it("are the guide's rows, which hold at every level, with the committees' rows for the group applied", () => {
    const guide: IndicatorGuide = { ref: 'coping:wash', title: { en: 'WASH', sw: 'Maji' }, intro: { en: 'measures', sw: 'kinapima' }, rows: [row('wash a'), row('wash b')] };
    const records = [record('TZ', { topic: 'action', group: 'coping:wash', level: 2, replaces: 1, impact: { en: 'pmo wash b', sw: '' }, actions: { en: ['p'], sw: [] } })];
    expect(groupActionRows(2, guide, 'coping:wash', records, {}).map((r) => r.impact.en)).toEqual(['wash a', 'pmo wash b']);
    expect(groupActionRows(3, guide, 'coping:wash', records, {}).map((r) => r.impact.en)).toEqual(['wash a', 'wash b']);
    expect(groupActionRows(3, null, 'coping:wash', [], {})).toEqual([]);
  });
});
