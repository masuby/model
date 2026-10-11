/**
 * Provenance layer: where a value comes from, and who is responsible for keeping it current. The two
 * are kept apart on purpose:
 *
 *   • `sourceFor` says where the CURRENT Core value of an indicator group comes from. In the Core that
 *     is always the INFORM Sub-national SADC 2024 workbook, so the answer is the workbook's own
 *     metadata: the datasets, publishers, years and resolution of the indicators behind the group
 *     (src/data/inform-workbook-sources.json, exported from the workbook's Metadata sheet).
 *   • `editSource` says where an APPROVED value from the Data portal comes from: the institution that
 *     submitted it, its dataset, and the level it was recorded at.
 *   • `custodianFor` names the Tanzanian institution responsible for an indicator group: who is asked
 *     for updates. It is never shown as the source of a value the institution did not supply.
 */
import workbookSources from '@/data/inform-workbook-sources.json';
import { DIMENSIONS, type DimensionKey, type IndicatorRef } from './hierarchy';
import type { EditStamp, Level } from './types';

export interface Authority {
  label: string;
  full: string;
}

export const AUTHORITIES = {
  NBS: { label: 'NBS', full: 'National Bureau of Statistics' },
  OCGS: { label: 'OCGS', full: 'Office of the Chief Government Statistician (Zanzibar)' },
  PMO: { label: 'PMO-DMD', full: "Prime Minister's Office, Disaster Management Department" },
  PORALG: { label: 'PO-RALG', full: "President's Office, Regional Administration and Local Government" },
  DRRC: { label: 'DRRC', full: 'Regional and District Disaster Management Committee' },
  TMA: { label: 'TMA', full: 'Tanzania Meteorological Authority' },
  NEMC: { label: 'NEMC', full: 'National Environment Management Council' },
  GST: { label: 'GST', full: 'Geological Survey of Tanzania' },
  TFS: { label: 'TFS', full: 'Tanzania Forest Services Agency' },
  MOA: { label: 'MoA', full: 'Ministry of Agriculture' },
  MOW: { label: 'MoW', full: 'Ministry of Water' },
  MOH: { label: 'MoH', full: 'Ministry of Health' },
  MOLHHSD: { label: 'MLHHSD', full: 'Ministry of Lands, Housing and Human Settlements Development' },
  MOEST: { label: 'MoEST', full: 'Ministry of Education, Science and Technology' },
  MOWORKS: { label: 'MoWT', full: 'Ministry of Works and Transport' },
  MOFP: { label: 'MoFP', full: 'Ministry of Finance and Planning' },
  MOHA: { label: 'MoHA', full: 'Ministry of Home Affairs' },
  TCRA: { label: 'TCRA', full: 'Tanzania Communications Regulatory Authority' },
  TANROADS: { label: 'TANROADS', full: 'Tanzania National Roads Agency' },
  TARURA: { label: 'TARURA', full: 'Tanzania Rural and Urban Roads Agency' },
  TPF: { label: 'TPF', full: 'Tanzania Police Force (Traffic)' },
  TACAIDS: { label: 'TACAIDS', full: 'Tanzania Commission for AIDS' },
  NMCP: { label: 'NMCP', full: 'National Malaria Control Programme' },
  TFNC: { label: 'TFNC', full: 'Tanzania Food and Nutrition Centre' },
  MUCHALI: { label: 'MUCHALI/IPC', full: 'Tanzania Food Security and Nutrition Analysis System (IPC)' },
  TRCS: { label: 'TRCS', full: 'Tanzania Red Cross Society' },
  UNHCR: { label: 'UNHCR', full: 'UNHCR, the UN Refugee Agency' },
  WFP: { label: 'WFP', full: 'World Food Programme' },
  FEWSNET: { label: 'FEWS NET', full: 'Famine Early Warning Systems Network' },
  CHC: { label: 'CHIRPS/ERA5', full: 'CHIRPS v3 rainfall and ERA5 temperature (computed)' },
  USGS: { label: 'USGS', full: 'U.S. Geological Survey earthquake catalogue' },
  INFORM: { label: 'INFORM SADC', full: 'INFORM Sub-national SADC 2024 baseline' },
} as const satisfies Record<string, Authority>;

export type AuthorityKey = keyof typeof AUTHORITIES;
export const AUTHORITY_KEYS = Object.keys(AUTHORITIES) as AuthorityKey[];
export const isAuthorityKey = (k: unknown): k is AuthorityKey => typeof k === 'string' && k in AUTHORITIES;

/** How local a value is; `none` = no indicator with data in the workbook (the group is left out of the averages). */
export type Resolution = 'council' | 'district' | 'region' | 'national' | 'none';

export interface SourceInfo {
  by: AuthorityKey;
  also?: AuthorityKey[];
  dataset: string;
  method: string;
  resolution: Resolution;
}

/* ------------------------------------------------------------------------------------------------ */
/* Where the Core value comes from: the workbook's metadata                                          */
/* ------------------------------------------------------------------------------------------------ */

export interface WorkbookIndicatorSource {
  id: string;
  name: string;
  component: string;
  source: string;
  url: string;
  resolution: 'district' | 'region' | 'national';
  year: string;
  unit: string;
}
interface WorkbookComponentSource {
  component: string;
  indicators: string[];
  sources: string[];
  years: string[];
  resolution: 'district' | 'region' | 'national';
}
const WORKBOOK = workbookSources as unknown as { indicators: Record<string, WorkbookIndicatorSource>; components: Record<string, WorkbookComponentSource> };

/** Component names are matched like `leafForWorkbookComponent`: case and punctuation do not count. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const COMPONENT_BY_NAME = new Map(Object.values(WORKBOOK.components).map((c) => [norm(c.component), c]));
const COMPONENT_BY_REF = new Map<string, WorkbookComponentSource>();
for (const dim of DIMENSIONS)
  for (const cat of dim.categories)
    for (const ind of cat.indicators) {
      const comp = [...ind.workbook, ind.en].map((n) => COMPONENT_BY_NAME.get(norm(n))).find(Boolean);
      if (comp) COMPONENT_BY_REF.set(`${dim.key}:${ind.key}`, comp);
    }

export const WORKBOOK_METHOD = 'INFORM Sub-national SADC 2024 workbook';

/** Groups that have no indicator with data in the workbook (empty for every Tanzanian unit). */
export const EMPTY_IN_WORKBOOK: SourceInfo = { by: 'INFORM', dataset: 'No indicator with data in the workbook', method: WORKBOOK_METHOD, resolution: 'none' };
export const DEFAULT_SOURCE = EMPTY_IN_WORKBOOK;

/** Where the Core value of an indicator group comes from: the workbook's datasets, years and resolution. */
export function sourceFor(dim: DimensionKey, key: string): SourceInfo {
  const c = COMPONENT_BY_REF.get(`${dim}:${key}`);
  if (!c) return EMPTY_IN_WORKBOOK;
  return { by: 'INFORM', dataset: `${c.sources.join(', ')} (${c.years.join('; ')})`, method: WORKBOOK_METHOD, resolution: c.resolution };
}

/** The workbook indicators (with their own metadata) behind an indicator group. */
export function workbookIndicatorsFor(dim: DimensionKey, key: string): WorkbookIndicatorSource[] {
  const c = COMPONENT_BY_REF.get(`${dim}:${key}`);
  return c ? c.indicators.map((id) => WORKBOOK.indicators[id]).filter(Boolean) : [];
}

/* ------------------------------------------------------------------------------------------------ */
/* Where an approved value comes from: the edit stamp                                                */
/* ------------------------------------------------------------------------------------------------ */

/** Provenance of a value approved through the Data portal, from its stamp. */
export function editSource(edit: EditStamp, level: Level): SourceInfo {
  const by = isAuthorityKey(edit.authority) ? edit.authority : 'PMO';
  const measured = edit.inputs?.find((i) => i.level !== 'baseline');
  const measuredLevel = measured && measured.level !== 'baseline' ? measured.level : null;
  const resolution: Resolution = measuredLevel ?? (level === 'council' ? 'council' : level === 'region' ? 'region' : level === 'national' ? 'national' : 'district');
  return {
    by,
    dataset: edit.dataset || (measured ? 'Measured values submitted through the Data portal' : 'Score submitted through the Data portal'),
    method: measured ? 'Measured values standardised with the workbook method' : 'Direct 0–10 entry, approved by PMO-DMD',
    resolution,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Who is responsible for keeping a group current                                                    */
/* ------------------------------------------------------------------------------------------------ */

export interface Custodian {
  by: AuthorityKey;
  also: AuthorityKey[];
}

const custodian = (by: AuthorityKey, also: AuthorityKey[] = []): Custodian => ({ by, also });

/** The Tanzanian institution responsible for each indicator group (the one asked for updates). */
export const CUSTODIANS: Partial<Record<IndicatorRef, Custodian>> = {
  'hazard:coastalHazards': custodian('TMA', ['NEMC']),
  'hazard:drought': custodian('TMA', ['MOA']),
  'hazard:earthquake': custodian('GST'),
  'hazard:environmentalDegradation': custodian('NEMC', ['TFS']),
  'hazard:flood': custodian('MOW', ['TMA', 'PMO']),
  'hazard:heatwave': custodian('TMA'),
  'hazard:landslide': custodian('GST', ['TMA']),
  'hazard:lightning': custodian('TMA'),
  'hazard:stormsCyclone': custodian('TMA'),
  'hazard:volcano': custodian('GST'),
  'hazard:wildfire': custodian('TFS', ['TMA']),
  'hazard:zoonoses': custodian('MOA', ['MOH']),
  'hazard:conflictIntensity': custodian('MOHA'),
  'hazard:conflictRisk': custodian('MOHA'),
  'hazard:hazardousMaterial': custodian('NEMC'),
  'hazard:internalViolence': custodian('TPF', ['MOHA']),
  'hazard:vehicleAccidents': custodian('TPF'),
  'vulnerability:developmentPoverty': custodian('NBS'),
  'vulnerability:economicDependency': custodian('MOFP', ['NBS']),
  'vulnerability:habitat': custodian('NBS', ['MOLHHSD']),
  'vulnerability:livelihoods': custodian('MUCHALI', ['MOA']),
  'vulnerability:displacedPeople': custodian('MOHA', ['UNHCR', 'PMO']),
  'vulnerability:healthConditions': custodian('MOH', ['TACAIDS', 'NMCP']),
  'vulnerability:childrenHealthNutrition': custodian('MOH', ['NBS', 'TFNC']),
  'vulnerability:economic': custodian('NBS'),
  'coping:accessHealth': custodian('MOH'),
  'coping:economicCapacity': custodian('NBS', ['MOFP']),
  'coping:wash': custodian('MOW', ['NBS']),
  'coping:communication': custodian('TCRA', ['NBS']),
  'coping:education': custodian('MOEST', ['NBS']),
  'coping:drrImplementation': custodian('PMO', ['DRRC']),
  'coping:governance': custodian('PMO', ['PORALG']),
};

export function custodianFor(dim: DimensionKey, key: string): Custodian {
  return CUSTODIANS[`${dim}:${key}` as IndicatorRef] ?? custodian('PMO');
}

/* ------------------------------------------------------------------------------------------------ */
/* Labels                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

/** International agencies and global datasets, as opposed to Tanzanian institutions. */
export const GLOBAL_AUTHORITIES: ReadonlySet<string> = new Set<AuthorityKey>(['UNHCR', 'WFP', 'FEWSNET', 'CHC', 'USGS', 'INFORM']);
export const authorityKind = (key: string | null | undefined): 'national' | 'global' => (key && GLOBAL_AUTHORITIES.has(key) ? 'global' : 'national');

export function authorityLabel(key: string | undefined | null): string {
  if (!key) return '';
  return (AUTHORITIES as Record<string, Authority>)[key]?.label ?? key;
}

/** e.g. "INFORM SADC · Global Data Lab, OPHI (2022; 2012-2021)" or "NBS · TDHS-MIS 2022" */
export function sourceLabel(src: Pick<SourceInfo, 'by' | 'also' | 'dataset'> | null | undefined): string {
  if (!src) return '';
  const lead = authorityLabel(src.by);
  const extra = (src.also ?? []).map(authorityLabel).join(', ');
  const who = extra ? `${lead} (+${extra})` : lead;
  return src.dataset ? `${who} · ${src.dataset}` : who;
}

/** e.g. "TMA (+MoA)" */
export function custodianLabel(c: Custodian): string {
  const extra = c.also.map(authorityLabel).join(', ');
  return extra ? `${authorityLabel(c.by)} (+${extra})` : authorityLabel(c.by);
}
