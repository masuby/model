/**
 * benchmark.ts - the Benchmark 2026 institutional dataset (src/data/tanzania-benchmark-2026.json,
 * built by scripts/build-benchmark.py from data-source/benchmark_2026/).
 *
 * The SADC workbook lists template indicators without data (heatwave, lightning, vehicle accidents,
 * sea-level rise, the IPC classification, female-headed households, disability) and carries a few values
 * that failed validation (coastal erosion 0 everywhere, one cyclone unit, food security, displacement,
 * Dodoma's electricity, Ukerewe's landslide). The benchmark supplies, for those indicators, measured
 * values prepared from public and citable datasets, in the shape the data portal produces for an
 * institution's approved values. The engine applies them as approved institutional values: every value
 * shows its lineage, an institution supersedes it through the portal, the quarantine of a workbook value
 * lifts where a benchmark value exists, and the workbook itself is never changed.
 *
 * Activations give the template indicators a Tanzanian definition (unit, keyed level, direction,
 * normalisation and reference range), as the workbook's Metadata sheet does for every indicator in use;
 * `respec` re-resolves a degenerate reference range of an existing indicator (food security 0-149 %).
 */
import file from '@/data/tanzania-benchmark-2026.json';
import type { RawValue } from './rawValues';

export interface BenchmarkActivation {
  name: string;
  /** Set for an indicator added inside a workbook component (not a template indicator): where it sits. */
  dimension?: string;
  category?: string;
  component?: string;
  unit: string;
  keyed_at: string;
  sign: string;
  normalisation: string;
  transform: string;
  outlier: string;
  resolved_min: number;
  resolved_max: number;
  use: string;
  basis: string;
  source: string;
}

export interface BenchmarkRespec {
  resolved_min: number;
  resolved_max: number;
  basis: string;
}

export interface BenchmarkDataset {
  /** The dataset's key in the release file. */
  key: string;
  /** One-line name for the pages (the full definition and source stay in `dataset` and `source`, and in the downloads). */
  title: string;
  indicator: string;
  name: string | null;
  unit: string;
  source: string;
  dataset: string;
  period: string;
  resolution: string;
  method: string;
  institution: string;
  level: 'council' | 'region' | 'national';
  values: number;
  note: string;
}

type BenchmarkDatasetRecord = Omit<BenchmarkDataset, 'key' | 'title'>;

interface BenchmarkFile {
  release: string;
  layer: string;
  built: string;
  at: string;
  note: string;
  activations: Record<string, BenchmarkActivation>;
  respec: Record<string, BenchmarkRespec>;
  datasets: Record<string, BenchmarkDatasetRecord>;
  /** Compact: for each dataset key, the value of every unit (council or region id). */
  values: Record<string, Record<string, number>>;
  /** Short per-value evidence where the source gives one (dataset key → unit id → text). */
  details?: Record<string, Record<string, string>>;
}

const FILE = file as unknown as BenchmarkFile;

/** The one-line names of the datasets as the pages print them; a dataset without one takes its source up to the first bracket. */
const TITLES: Record<string, string> = {
  'coastal-erosion': 'Digital Earth Africa coastlines',
  'coastal-lecz': 'Copernicus DEM, low-elevation coastal zone',
  'cyclone-swath': 'IBTrACS tropical cyclone tracks',
  'heatwave-days': 'ERA5-Land heatwave days',
  'lightning-density': 'WWLLN lightning climatology',
  'road-crashes': 'Police road traffic crash statistics',
  'hazmat-sites': 'OpenStreetMap, 2022 census and NEMC certificates',
  'ipc-phase2plus': 'IPC acute food insecurity analysis',
  'ipc-area-phase': 'IPC area classification',
  'census-electricity': '2022 census regional profiles',
  'census-phone': '2022 census regional profiles',
  'census-literacy': '2022 census regional profiles',
  'census-female-headed': '2022 census regional profiles',
  'census-disability': '2022 census regional profiles',
  'landslide-ukerewe': 'World Bank global landslide hazard map',
  'drr-arrangements': 'PMO-DMD preparedness records',
  'committee-functioning': 'PMO-DMD committee assessment',
  'idmc-idp': 'IDMC internal displacement data',
};
const titleOf = (key: string, d: BenchmarkDatasetRecord): string => TITLES[key] ?? d.source.split(/[(,;]/)[0].trim();
const DATASETS: Readonly<Record<string, BenchmarkDataset>> = Object.fromEntries(Object.entries(FILE.datasets).map(([key, d]) => [key, { ...d, key, title: titleOf(key, d) }]));

/** The full records, rebuilt from the compact file: one RawValue per dataset and unit, stamped with the release. */
function expand(f: BenchmarkFile): RawValue[] {
  const out: RawValue[] = [];
  for (const [key, byUnit] of Object.entries(f.values)) {
    const d = DATASETS[key];
    if (!d) continue;
    for (const [unitId, value] of Object.entries(byUnit)) {
      const detail = f.details?.[key]?.[unitId];
      // The value names its dataset by the one-line title; the full definition stays with the dataset record.
      out.push({ specId: d.indicator, unitId, level: d.level, value, valueType: 'raw', source: d.source, dataset: d.title, period: d.period, institution: d.institution, at: f.at, release: f.release, ...(detail ? { detail } : {}) });
    }
  }
  return out;
}

export const BENCHMARK_RELEASE: string = FILE.release;
/** The date the benchmark values count from (their `at`): a dated version before it has none of them. */
export const BENCHMARK_AT: string = FILE.at;
export const BENCHMARK_NOTE: string = FILE.note;
export const BENCHMARK_ACTIVATIONS: Readonly<Record<string, BenchmarkActivation>> = FILE.activations;
export const BENCHMARK_RESPEC: Readonly<Record<string, BenchmarkRespec>> = FILE.respec;
export const BENCHMARK_DATASETS: Readonly<Record<string, BenchmarkDataset>> = DATASETS;
/** The values, in the data portal's RawValue shape (council or region level, natural units), each carrying the release. */
export const BENCHMARK_VALUES: readonly RawValue[] = expand(FILE);

/** The benchmark dataset behind an indicator, if any. */
export const benchmarkDatasetFor = (specId: string): BenchmarkDataset | null => Object.values(DATASETS).find((d) => d.indicator === specId) ?? null;

/** The indicator ids the benchmark supplies values for. */
export const BENCHMARK_SPEC_IDS: readonly string[] = [...new Set(BENCHMARK_VALUES.map((v) => v.specId))];
