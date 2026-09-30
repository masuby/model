/**
 * Provenance layer: the responsible authority, dataset and method behind every indicator.
 * A Data-Entry edit stamps its own source, which supersedes the baseline on view.
 */
import type { DimensionKey, IndicatorRef } from './hierarchy';

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

export interface SourceInfo {
  by: AuthorityKey;
  also?: AuthorityKey[];
  dataset: string;
  method: string;
  /** How local the data is - shown honestly in the UI. */
  resolution: 'council' | 'district' | 'region' | 'national' | 'overlay';
}

export const INDICATOR_SOURCES: Partial<Record<IndicatorRef | 'hazard:exposure', SourceInfo>> = {
  'hazard:drought': { by: 'TMA', also: ['MOA', 'CHC'], dataset: 'CHIRPS v3 (1991–2024) + ERA5 t2m', method: 'SPI-12/SPEI-12 frequency, aridity and season failure', resolution: 'council' },
  'hazard:flood': { by: 'PMO', also: ['TMA', 'MOW'], dataset: 'CHIRPS v3 daily + recorded flood events', method: '>50 / >100 mm event counts and recorded events × exposure', resolution: 'council' },
  'hazard:landslide': { by: 'TMA', also: ['PMO', 'GST'], dataset: 'World Bank global landslide hazard + documented events', method: 'hazard rank, documented overlay', resolution: 'district' },
  'hazard:coastalHazards': { by: 'TMA', also: ['PMO'], dataset: 'Coastal strip exposure', method: 'documented overlay', resolution: 'overlay' },
  'hazard:stormsCyclone': { by: 'TMA', also: ['PMO'], dataset: 'Cyclone Hidaya 2024, Lindi 1952, Zanzibar 1872', method: 'documented cyclone/storm exposure (coastal)', resolution: 'overlay' },
  'hazard:heatwave': { by: 'TMA', also: ['CHC'], dataset: 'ERA5 t2m climatology', method: 'temperature-based heat exposure', resolution: 'council' },
  'hazard:lightning': { by: 'TMA', dataset: 'NASA LIS/OTD flash density (Lake Victoria basin)', method: 'documented lightning-hotspot overlay', resolution: 'overlay' },
  'hazard:volcano': { by: 'GST', also: ['PMO'], dataset: 'Ol Doinyo Lengai, Rungwe, Kilimanjaro/Meru', method: 'documented volcanism overlay', resolution: 'overlay' },
  'hazard:zoonoses': { by: 'MOA', also: ['MOH'], dataset: '2020 desert locust, armyworm, livestock disease', method: 'documented overlay', resolution: 'overlay' },
  'hazard:earthquake': { by: 'GST', also: ['USGS'], dataset: 'USGS catalogue M≥4.5, 1960–2024 (554 events)', method: 'maximum estimated shaking per district', resolution: 'district' },
  'hazard:wildfire': { by: 'TFS', also: ['TMA'], dataset: 'Miombo dry-season fire regime', method: 'documented overlay (MODIS/VIIRS pending)', resolution: 'overlay' },
  'hazard:vehicleAccidents': { by: 'TPF', also: ['PMO'], dataset: 'Highway corridors and urban traffic', method: 'documented overlay', resolution: 'overlay' },
  'hazard:hazardousMaterial': { by: 'NEMC', also: ['PMO'], dataset: 'Industrial, mining and petroleum sites', method: 'documented overlay', resolution: 'overlay' },
  'hazard:exposure': { by: 'NBS', dataset: '2022 Population and Housing Census', method: 'council population ÷ council area (log-scaled)', resolution: 'council' },
  'vulnerability:developmentPoverty': { by: 'NBS', dataset: 'Household Budget Survey 2017/18', method: 'poverty headcount', resolution: 'region' },
  'vulnerability:childrenHealthNutrition': { by: 'MOH', also: ['NBS', 'TFNC'], dataset: 'TDHS-MIS 2022', method: 'under-5 stunting', resolution: 'region' },
  'vulnerability:healthConditions': { by: 'MOH', also: ['TACAIDS', 'NMCP'], dataset: 'THIS 2022-23 (HIV) + TDHS-MIS 2022 (malaria)', method: 'disease-burden min–max blend', resolution: 'region' },
  'vulnerability:displacedPeople': { by: 'UNHCR', also: ['PMO'], dataset: 'UNHCR 2024, Nyarugusu and Nduta camps', method: 'refugee burden, scaled', resolution: 'district' },
  'vulnerability:livelihoods': { by: 'MUCHALI', also: ['MOA'], dataset: 'IPC / MUCHALI acute food-insecurity rounds', method: 'food-insecurity phase', resolution: 'district' },
  'vulnerability:habitat': { by: 'NBS', dataset: '2022 PHC housing', method: 'housing and services', resolution: 'district' },
  'coping:wash': { by: 'MOW', dataset: '2022 PHC water points and boreholes', method: 'resource availability (rank-normalised)', resolution: 'district' },
  'coping:accessHealth': { by: 'MOH', dataset: '2022 PHC health facilities', method: 'resource availability', resolution: 'district' },
  'coping:education': { by: 'MOEST', also: ['NBS'], dataset: '2022 PHC schools', method: 'resource availability', resolution: 'district' },
  'coping:drrImplementation': { by: 'PMO', also: ['DRRC'], dataset: 'EPRP / EOCC / anticipatory-action records', method: 'DRM investment overlay', resolution: 'district' },
  'coping:governance': { by: 'PMO', dataset: 'INFORM SADC governance', method: 'baseline', resolution: 'national' },
};

export const DEFAULT_SOURCE: SourceInfo = { by: 'INFORM', dataset: 'INFORM Sub-national SADC 2024', method: 'baseline', resolution: 'national' };

export function sourceFor(dim: DimensionKey, key: string): SourceInfo {
  return INDICATOR_SOURCES[`${dim}:${key}` as IndicatorRef] ?? DEFAULT_SOURCE;
}

/** International agencies and global datasets, as opposed to Tanzanian institutions. */
export const GLOBAL_AUTHORITIES: ReadonlySet<string> = new Set<AuthorityKey>(['UNHCR', 'WFP', 'FEWSNET', 'CHC', 'USGS', 'INFORM']);
export const authorityKind = (key: string | null | undefined): 'national' | 'global' => (key && GLOBAL_AUTHORITIES.has(key) ? 'global' : 'national');

export function authorityLabel(key: string | undefined | null): string {
  if (!key) return '';
  return (AUTHORITIES as Record<string, Authority>)[key]?.label ?? key;
}

/** e.g. "TMA (+MoA, CHIRPS/ERA5) · CHIRPS v3 (1991–2024) + ERA5 t2m" */
export function sourceLabel(src: Pick<SourceInfo, 'by' | 'also' | 'dataset'> | null | undefined): string {
  if (!src) return '';
  const lead = authorityLabel(src.by);
  const extra = (src.also ?? []).map(authorityLabel).join(', ');
  const who = extra ? `${lead} (+${extra})` : lead;
  return src.dataset ? `${who} · ${src.dataset}` : who;
}
