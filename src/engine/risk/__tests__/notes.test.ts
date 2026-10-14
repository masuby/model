/**
 * Data notes (the indicator integrity recheck): every note names a real indicator group and reaches real
 * units, a council carries the notes of the workbook unit it is built on, and the facts the notes state
 * still hold in the Core (a workbook update that changes them must change the notes).
 */
import { describe, expect, it } from 'vitest';
import raw from '@/data/inform-baseline-raw.json';
import spec from '@/data/inform-indicator-spec.json';
import { ALL_INDICATORS } from '../hierarchy';
import { buildModel, indicatorValue, placeKey } from '../model';
import { DATA_NOTES, dataNotesFor, dataNotesSummary, isDecision, noteApplies, noteIndicators, noteText, unitDataNotes, worstStatus } from '../notes';

const model = buildModel();
const refs = new Set(ALL_INDICATORS.map((l) => `${l.dimension.key}:${l.indicator.key}`));
const RAW = raw as { units: string[]; values: Record<string, Array<number | null>> };
const rawOf = (id: string, unitName: string) => RAW.values[id][RAW.units.indexOf(model.sources.find((u) => u.name === unitName)!.id)];

describe('data notes', () => {
  it('name real indicator groups and workbook indicators, with text in both languages', () => {
    expect(DATA_NOTES.length).toBeGreaterThanOrEqual(11);
    for (const n of DATA_NOTES) {
      expect(refs.has(n.ref), n.id).toBe(true);
      expect((spec as Record<string, unknown>)[n.indicator], n.id).toBeTruthy();
      expect(['queried', 'artefact', 'decision', 'explained']).toContain(n.status);
      for (const id of noteIndicators(n)) expect((spec as Record<string, unknown>)[id], `${n.id} ${id}`).toBeTruthy();
      expect(n.en.length).toBeGreaterThan(80);
      expect(n.sw.length).toBeGreaterThan(80);
      expect(noteText(n, 'sw')).toBe(n.sw);
      expect(noteText(n, 'en-GB')).toBe(n.en);
    }
    expect(new Set(DATA_NOTES.map((n) => n.id)).size).toBe(DATA_NOTES.length);
  });

  it('reach at least one council each, and never the nation', () => {
    for (const n of DATA_NOTES) {
      const [dim, key] = n.ref.split(':') as ['hazard' | 'vulnerability' | 'coping', string];
      // Reach is a matter of where the note applies; whether it is shown beside a value also depends on the hold.
      const councils = model.councils.filter((c) => noteApplies(n, c, indicatorValue(c, dim, key)));
      expect(councils.length, n.id).toBeGreaterThan(0);
      expect(noteApplies(n, model.national, indicatorValue(model.national, dim, key))).toBe(false);
    }
  });

  it('follow the workbook unit: the five Dar es Salaam councils carry the drought note, every Kagera council the earthquake note, Ubungo Kinondoni\'s flood note', () => {
    const dar = model.councils.filter((c) => placeKey(c.region) === 'daressalaam');
    expect(dar).toHaveLength(5);
    // DN-01 and DN-02 withhold the workbook's drought values; since 14 October 2026 the Benchmark 2026 drought
    // index carries the group everywhere, so the lifted holds are not shown beside the live value.
    for (const c of dar) {
      expect(dataNotesFor(c, 'hazard', 'drought')).toEqual([]);
      expect(DATA_NOTES.filter((n) => n.ref === 'hazard:drought' && noteApplies(n, c, indicatorValue(c, 'hazard', 'drought'))).map((n) => n.id)).toEqual(['DN-01', 'DN-02']);
    }
    const kagera = model.councils.filter((c) => placeKey(c.region) === 'kagera');
    expect(kagera).toHaveLength(8);
    for (const c of kagera) expect(dataNotesFor(c, 'hazard', 'earthquake').map((n) => n.id)).toEqual(['DN-03']); // Kagera's own explanation; the ceiling artefact (DN-10) is lifted by the USGS felt intensity
    const ubungo = model.councils.find((c) => c.name.startsWith('Ubungo'))!;
    expect(ubungo.sourceName).toBe('Kinondoni');
    expect(dataNotesFor(ubungo, 'hazard', 'flood').map((n) => n.id)).toEqual(['DN-11']);
    // The region itself carries a regional note, not a unit note.
    const darRegion = model.regions.find((r) => placeKey(r.name) === 'daressalaam')!;
    expect(dataNotesFor(darRegion, 'hazard', 'drought')).toEqual([]);
    expect(DATA_NOTES.filter((n) => n.ref === 'hazard:drought' && noteApplies(n, darRegion, indicatorValue(darRegion, 'hazard', 'drought'))).map((n) => n.id)).toEqual(['DN-01', 'DN-02']);
    expect(dataNotesFor(darRegion, 'hazard', 'flood')).toEqual([]);
    // Since 14 October 2026 the earthquake artefact note covers every unit, and the USGS felt intensity carries the
    // group everywhere: the note applies, the hold is lifted, nothing is shown beside the live value.
    const kondoa = model.byId.get('C001')!;
    expect(noteApplies(DATA_NOTES.find((n) => n.id === 'DN-10')!, kondoa, indicatorValue(kondoa, 'hazard', 'earthquake'))).toBe(true);
    expect(dataNotesFor(kondoa, 'hazard', 'earthquake')).toEqual([]);
    expect(dataNotesFor(model.councils.find((c) => c.name.startsWith('Ngorongoro'))!, 'hazard', 'earthquake')).toEqual([]);
    // Where the group carries no value the hold stands and the note is shown.
    expect(dataNotesFor(kondoa, 'hazard', 'internalViolence').map((n) => n.id)).toEqual(['DN-12']);
    // Queries come before explanations.
    expect(worstStatus(DATA_NOTES)).toBe('queried');
    expect(unitDataNotes(model.byId.get('C001')!).map((x) => x.note.id)).toContain('DN-08');
  });

  it('withhold internal violence by programme decision: both indicators, every unit, with its own wording', () => {
    const dn12 = DATA_NOTES.find((n) => n.id === 'DN-12')!;
    expect(dn12).toMatchObject({ status: 'decision', quarantine: true, ref: 'hazard:internalViolence', where: { all: true } });
    expect(noteIndicators(dn12)).toEqual(['HA.HUM.VIO-EVE', 'HA.HUM.VIO-FAT']);
    expect(isDecision(dn12)).toBe(true);
    for (const c of model.councils) expect(c.quarantined?.['hazard:internalViolence'], c.name).toBe('DN-12');
    expect(rawOf('HA.HUM.VIO-EVE', 'Kigoma')).toBeGreaterThan(0); // the workbook keeps its ACLED counts
    expect(dn12.en).toMatch(/^Withheld by programme decision/);
  });

  it('withhold conflict intensity and conflict risk by programme decision: every unit (DN-13, DN-14)', () => {
    for (const [id, ref, spec] of [
      ['DN-13', 'hazard:conflictIntensity', 'HA.HUM.CI-CBAR'],
      ['DN-14', 'hazard:conflictRisk', 'HA.HUM.CR-GCRI'],
    ] as const) {
      const note = DATA_NOTES.find((n) => n.id === id)!;
      expect(note).toMatchObject({ status: 'decision', quarantine: true, ref, where: { all: true } });
      expect(noteIndicators(note)).toEqual([spec]);
      for (const c of model.councils) expect(c.quarantined?.[ref], `${c.name} ${ref}`).toBe(id);
      for (const c of model.councils) expect(c.dims.hazard.categories.human?.indicators[ref.split(':')[1]], c.name).toBeNull();
    }
  });

  it('state facts that still hold in the Core', () => {
    expect(rawOf('HA.NAT.DR-FRE', 'Kinondoni')).toBe(19);
    expect(rawOf('HA.NAT.DR-FRE', 'Bariadi')).toBe(5);
    expect(rawOf('HA.NAT.EQ-EXP', 'Bukoba')).toBe(0);
    expect(rawOf('HA.NAT.LS-EXP', 'Ukerewe')).toBe(1);
    expect(rawOf('HA.NAT.CH-ERO', 'Bahi')).toBe(67);
    expect(rawOf('VU.SE.LV-FS', 'Kondoa')).toBe(149);
    expect(rawOf('VU.VG.DP-IDP', 'Kaskazini A')).toBe(30080);
    expect(rawOf('VU.VG.DP-IDP', 'Hanang')).toBe(0);
    expect(rawOf('CC.INF.COM-ELEC', 'Kondoa')).toBe(100);
    expect((spec as Record<string, { resolved_min: number; resolved_max: number }>)['CC.INF.HC-FAC']).toMatchObject({ resolved_min: 0, resolved_max: 0 });
    // The ceiling is a fact of the workbook (the live model withholds the index, DN-10).
    expect(buildModel({}, { workbookOnly: true }).sources.filter((u) => (u.dims.hazard.categories.natural.indicators.earthquake ?? 0) >= 9.95)).toHaveLength(49);
    const s = dataNotesSummary(model);
    // The programme's decisions are counted apart from the recheck's findings.
    expect(s.notes).toBe(DATA_NOTES.filter((n) => !isDecision(n)).length);
    expect(s.decisions).toBe(4);
    expect(s.decided).toBe(3 * 195); // internal violence, conflict intensity and conflict risk stay withheld for every council (DN-12 to DN-14); the drought decision (DN-02) is replaced by the benchmark index everywhere
    expect(s.queried).toBe(DATA_NOTES.filter((n) => n.status === 'queried').length);
    expect(s.queried).toBe(5); // DN-02 and DN-03 explained on 10 October 2026
    expect(s.councils).toBe(195); // the coastal-erosion and food-security notes reach every council
  });
});
