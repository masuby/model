/**
 * The two Tanzanian institutional indicators the Core carries beside the workbook's national ones
 * (decision of 10 October 2026, PMO-DMD): what a council has in place to reduce and respond to disaster
 * risk, recorded by the disaster-management committees through the Data portal over the published
 * PMO-DMD lists, and scored by the engine.
 *
 *   CC.INS.DRR-ARR  DRM arrangements in place (DRR implementation): the share of five arrangements the
 *                   council has: an emergency preparedness and response plan (EPRP), its risk,
 *                   vulnerability and capacity assessment (RVCA), a trained emergency response team
 *                   (ERT; regional), an emergency operations and communication centre (EOCC; regional or
 *                   national) and DRR training of the committee. An arrangement not recorded counts as
 *                   not in place: the registers are PMO-DMD's own, so the score rises as they are kept.
 *   CC.INS.GOV-DMC  Disaster management committee functioning (Governance): the share of the assessed
 *                   criteria the council meets among three: the committee is active, it collaborates
 *                   with stakeholders, and it is involved in DRR issues. The legal framework (the Disaster
 *                   Management Act and Policy) is the same everywhere and is not scored. A council has a
 *                   value only once at least one criterion is assessed.
 *
 * Both decrease risk: 100% scores 0 on the lack-of-coping scale. The Benchmark 2026 ships the values of
 * the published lists (scripts/build-benchmark.py, from data-source/drr_status.csv); an approved
 * committee record supersedes them for its council (DataProvider → institutionalRecordValues).
 */
import type { RawValue } from './rawValues';
import type { DrrRecordsByUnit, DrrStatus } from './types';

export const DRR_ARR = 'CC.INS.DRR-ARR';
export const GOV_DMC = 'CC.INS.GOV-DMC';

/** The five arrangements, in the order the detail lists them. */
export const DRR_CRITERIA = ['eprp', 'rvca', 'ert', 'eocc', 'training'] as const;
/** The three committee criteria. */
export const GOV_CRITERIA = ['committee', 'stakeholders', 'involvement'] as const;
export type DrrCriterion = (typeof DRR_CRITERIA)[number];
export type GovCriterion = (typeof GOV_CRITERIA)[number];

type Flags = Partial<Record<keyof DrrStatus, boolean | number | null | undefined>>;

/** Share (0-100) of the five arrangements in place; an arrangement not recorded is not in place. */
export function arrangementsShare(drr: Flags | null | undefined): number {
  if (!drr) return 0;
  const n = DRR_CRITERIA.filter((k) => drr[k] === true).length;
  return Math.round((100 * n) / DRR_CRITERIA.length * 10) / 10;
}

/** Share (0-100) of the assessed committee criteria met, or null when none is assessed. */
export function committeeShare(drr: Flags | null | undefined): number | null {
  if (!drr) return null;
  const assessed = GOV_CRITERIA.filter((k) => drr[k] === true || drr[k] === false);
  if (!assessed.length) return null;
  const met = assessed.filter((k) => drr[k] === true).length;
  return Math.round((100 * met) / assessed.length * 10) / 10;
}

/** One letter per criterion in the compact codes (the council flags file and the detail codes). */
export const DRR_LETTER: Readonly<Record<DrrCriterion, string>> = { eprp: 'e', rvca: 'r', ert: 't', eocc: 'o', training: 'g' };
export const GOV_LETTER: Readonly<Record<GovCriterion, string>> = { committee: 'c', stakeholders: 's', involvement: 'i' };

/**
 * The detail codes the panel renders (riskPanel.group.detail), kept short because every council carries
 * one: `drr:` followed by the letters of the arrangements in place, a year after e or r when recorded
 * (`drr:e2023r2023tg`; the rest are not in place); `gov:` followed by the letters of the assessed criteria,
 * upper case met, lower case not met (`gov:CSi`).
 */
export function arrangementsDetail(drr: Flags | null | undefined): string {
  const year = (k: DrrCriterion) => (k === 'eprp' ? drr?.eprpYear : k === 'rvca' ? drr?.rvcaYear : null);
  return 'drr:' + DRR_CRITERIA.filter((k) => drr?.[k] === true).map((k) => `${DRR_LETTER[k]}${year(k) ?? ''}`).join('');
}

export function committeeDetail(drr: Flags | null | undefined): string {
  return 'gov:' + GOV_CRITERIA.filter((k) => drr?.[k] === true || drr?.[k] === false).map((k) => (drr?.[k] ? GOV_LETTER[k].toUpperCase() : GOV_LETTER[k])).join('');
}

/** The two halves of a `drr:` code: the arrangements in place (with their years) and those not in place. */
export function parseArrangementsDetail(code: string): { met: Array<{ key: DrrCriterion; year: number | null }>; not: DrrCriterion[] } {
  const met: Array<{ key: DrrCriterion; year: number | null }> = [];
  for (const m of code.replace(/^drr:/, '').matchAll(/([a-z])(\d{4})?/g)) {
    const key = (Object.keys(DRR_LETTER) as DrrCriterion[]).find((k) => DRR_LETTER[k] === m[1]);
    if (key) met.push({ key, year: m[2] ? Number(m[2]) : null });
  }
  return { met, not: DRR_CRITERIA.filter((k) => !met.some((x) => x.key === k)) };
}

/** The assessed criteria of a `gov:` code: met and not met. */
export function parseCommitteeDetail(code: string): { met: GovCriterion[]; not: GovCriterion[] } {
  const met: GovCriterion[] = [];
  const not: GovCriterion[] = [];
  for (const ch of code.replace(/^gov:/, '')) {
    const key = (Object.keys(GOV_LETTER) as GovCriterion[]).find((k) => GOV_LETTER[k] === ch.toLowerCase());
    if (key) (ch === ch.toUpperCase() ? met : not).push(key);
  }
  return { met, not };
}

export interface InstitutionalEntry {
  /** The council's id. */
  id: string;
  drr: Flags | null | undefined;
  /** When the record was approved (ISO). */
  at: string;
  institution: string;
  source: string;
  dataset?: string;
  period?: string;
}

/**
 * The two indicators' values for councils, in the Data portal's shape, from their arrangements: one
 * value per council for DRM arrangements, and one for the committee where a criterion is assessed.
 */
export function institutionalRawValues(entries: readonly InstitutionalEntry[]): RawValue[] {
  const out: RawValue[] = [];
  for (const e of entries) {
    out.push({
      specId: DRR_ARR,
      unitId: e.id,
      level: 'council',
      value: arrangementsShare(e.drr),
      valueType: 'raw',
      source: e.source,
      dataset: e.dataset ?? 'DRM arrangements recorded for the council (EPRP, RVCA, trained ERT, EOCC, DRR training)',
      period: e.period ?? null,
      institution: e.institution,
      at: e.at,
      detail: arrangementsDetail(e.drr),
    });
    const gov = committeeShare(e.drr);
    if (gov != null) {
      out.push({
        specId: GOV_DMC,
        unitId: e.id,
        level: 'council',
        value: gov,
        valueType: 'raw',
        source: e.source,
        dataset: e.dataset ?? 'Disaster management committee assessed for the council (active, stakeholder collaboration, involvement in DRR)',
        period: e.period ?? null,
        institution: e.institution,
        at: e.at,
        detail: committeeDetail(e.drr),
      });
    }
  }
  return out;
}

/** An approved DRR record of a committee, as the engine needs it (the data layer's CommitteeRecord fits). */
export interface ApprovedDrrRecord {
  unitId: string;
  level: 'council' | 'region' | 'national';
  regionId?: string | null;
  payload: DrrRecordsByUnit[string];
  source: string;
  /** The approval date (else the creation date). */
  at: string;
  /** The author's role (ddrrc, rdrrc, ndrrc, pmo, admin): a committee's record is stamped DRRC, PMO-DMD's PMO. */
  authorRole?: string | null;
}

export interface CouncilLike {
  id: string;
  region: string;
  drr?: DrrStatus;
}

/**
 * The indicator values that approved committee records give the councils they cover (a council's own
 * record, or its region's for the regional arrangements), computed over the council's published flags
 * exactly as the model merges them (model.ts drrFor). Each value is dated by the newest record behind it,
 * so it supersedes the Benchmark 2026 value of that council.
 */
export function institutionalRecordValues(
  records: readonly ApprovedDrrRecord[],
  councils: readonly CouncilLike[],
  merge: (published: DrrStatus | undefined, own: DrrRecordsByUnit[string] | undefined, region: DrrRecordsByUnit[string] | undefined) => DrrStatus | undefined,
  regionIdOf: (c: CouncilLike) => string,
): RawValue[] {
  const byUnit = new Map(records.map((r) => [r.unitId, r]));
  const entries: InstitutionalEntry[] = [];
  for (const c of councils) {
    const own = byUnit.get(c.id);
    const region = byUnit.get(regionIdOf(c));
    if (!own && !region) continue;
    const newest = [own, region].filter((r): r is ApprovedDrrRecord => !!r).reduce((a, b) => (b.at > a.at ? b : a));
    const role = newest.authorRole ?? '';
    entries.push({
      id: c.id,
      drr: merge(c.drr, own?.payload, region?.payload),
      at: newest.at,
      institution: role === 'pmo' || role === 'admin' ? 'PMO' : 'DRRC',
      source: [own?.source, region?.source].filter(Boolean).join('; '),
      dataset: own ? 'DRR record of the district disaster management committee, approved through the Data portal' : 'DRR record of the regional disaster management committee, approved through the Data portal',
    });
  }
  return institutionalRawValues(entries);
}
