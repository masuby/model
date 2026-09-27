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
}

/** Where an edited value came from (stamped by Data Entry). */
export interface EditStamp {
  value: number | null;
  authority?: AuthorityKey | string;
  dataset?: string;
  note?: string;
  author?: string;
  at: string; // ISO timestamp
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
  /** Physical flood-hazard frequency before exposure (used for the H×E flood term). */
  floodHazard?: number | null;
  floodEvents?: number[];
  facilities?: Facilities;
  drr?: DrrStatus;
  /** Council → its INFORM source unit (170-unit backbone) that supplies Vulnerability & Coping. */
  sourceId?: string;
  sourceName?: string;
  /** Set for the 28 new/split councils that inherit their parent district's data. */
  inheritedFrom?: string | null;
  /** Number of member units (regions only). */
  members?: number;
  /** Indicator refs edited on this unit (after approval), with their provenance. */
  edits: Partial<Record<EditRef, EditStamp>>;
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
}
