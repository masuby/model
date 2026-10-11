import type { DimensionKey, IndicatorRef } from './hierarchy';
import type { AuthorityKey } from './sources';

/** Administrative resolution of a unit. */
export type Level = 'council' | 'region' | 'national' | 'source';

export interface CategoryValues {
  /** Category score = arithmetic mean of its indicators (unrounded, like the workbook). */
  score: number | null;
  indicators: Record<string, number | null>;
}

export interface DimensionValues {
  /** Dimension score = ROUND(scaled geometric mean of categories, 1). */
  score: number | null;
  categories: Record<string, CategoryValues>;
}

export interface Exposure {
  index: number | null;
  population: number | null;
  density: number | null;
  areaKm2?: number | null;
  source?: string;
}

export interface Facilities {
  health: number;
  education: number;
  water: number;
  boreholes: number;
}

export interface DrrStatus {
  eprp: boolean;
  aa: boolean;
  eocc: boolean;
  /** Recorded by the committees through the Data portal, or in the PMO-DMD lists where they carry them. */
  ert?: boolean;
  rvca?: boolean;
  /** DRR training delivered to the disaster management committee. */
  training?: boolean;
  /** Committee criteria (governance): true met, false not met, absent not assessed. */
  committee?: boolean;
  stakeholders?: boolean;
  involvement?: boolean;
  eprpYear?: number;
  rvcaYear?: number;
}

/** Approved DRR capacity records by unit id (council or region): flags, null = not known; years as recorded. */
export type DrrRecordsByUnit = Record<string, Partial<Record<Exclude<keyof DrrStatus, 'eprpYear' | 'rvcaYear'>, boolean | null>> & { eprpYear?: number | null; rvcaYear?: number | null }>;

/** Level at which a measured value was recorded ('district' = the 2022 district, copied to its councils), or 'baseline' for the INFORM workbook value. */
export type ValueLevel = 'national' | 'region' | 'district' | 'council' | 'baseline';

/** One workbook indicator behind a recomputed indicator group, with where its value came from. */
export interface LeafInput {
  specId: string;
  /** Measured value in the indicator's natural unit (null = no data). */
  raw: number | null;
  /** Its 0–10 score (null when there is no value or it cannot be scored). */
  score: number | null;
  level: ValueLevel;
  /** Unit the value was recorded for (a council, region, 'TZ', or the INFORM district for the baseline). */
  unitId?: string;
  dataset?: string | null;
  period?: string | null;
  institution?: string | null;
  at?: string;
  /** 'score' when the institution deposited a 0–10 score computed with the INFORM method (the value is the score). */
  valueType?: 'raw' | 'score';
  /** Citable source of a deposited value (publication, dataset or official letter). */
  source?: string | null;
  /** True when the workbook value of this indicator is withheld by a data note (treated as missing). */
  withheld?: boolean;
  /** The dated release the value comes from (the Benchmark 2026), when it was not submitted through the portal. */
  release?: string | null;
  /** Short evidence the source gives with the value (see RawValue.detail). */
  detail?: string | null;
}

/** Where an edited value came from (stamped by Data Entry). */
export interface EditStamp {
  value: number | null;
  authority?: AuthorityKey | string;
  dataset?: string;
  note?: string;
  author?: string;
  at: string; // ISO timestamp
  /** Set when the value was recomputed from measured values: every indicator behind it. */
  inputs?: LeafInput[];
  /**
   * Set when every submitted value behind the stamp comes from a dated release prepared from public
   * datasets (the Benchmark 2026, e.g. 'bm-2026.10'), not from an institution through the Data portal.
   * See stamps.ts: such a stamp is part of the Core as shipped and is never counted as an update.
   */
  release?: string;
}

/** Edits keyed by unit id, then by indicator ref (`hazard:flood`) or `hazard:exposure`. */
export type EditRef = IndicatorRef | 'hazard:exposure';
export type Overrides = Record<string, Partial<Record<EditRef, EditStamp>>>;

export interface Unit {
  id: string;
  level: Level;
  name: string;
  region: string;
  dims: Record<DimensionKey, DimensionValues>;
  risk: number | null;
  exposure?: Exposure;
  facilities?: Facilities;
  drr?: DrrStatus;
  /** Council → its INFORM source unit (170-unit backbone) that supplies Vulnerability & Coping. */
  sourceId?: string;
  sourceName?: string;
  /** Set for councils created or split after the workbook's boundaries: they inherit this unit's data. */
  inheritedFrom?: string | null;
  /** Former name of a renamed council whose workbook unit still carries the old name. */
  formerly?: string | null;
  /** Number of member units (regions only). */
  members?: number;
  /** Indicator refs edited on this unit (after approval), with their provenance. */
  edits: Partial<Record<EditRef, EditStamp>>;
  /**
   * Indicator groups whose workbook value is withheld from the live model (the quarantined data notes of
   * the integrity recheck), by the note that withholds it; an approved edit on the same ref lifts it.
   */
  quarantined?: Partial<Record<EditRef, string>>;
}

export interface RiskModel {
  councils: Unit[];
  regions: Unit[];
  national: Unit;
  sources: Unit[];
  byId: Map<string, Unit>;
  /** Councils grouped by normalised region key. */
  councilsByRegion: Map<string, Unit[]>;
  asOf: string;
  editCount: number;
  /** The approved DRR capacity records the model was built with (kept so a rebuild can carry them). */
  drrRecords?: DrrRecordsByUnit;
}
