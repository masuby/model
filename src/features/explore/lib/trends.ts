/**
 * Climate trends per area (src/data/tanzania-council-trends.json, scripts/build-trends.py): heatwave days a
 * year and annual rainfall for the councils, the regions and Tanzania. Loaded only when an area's trend
 * panel opens, so the explorer's first download does not carry them.
 */
import { useQuery } from '@tanstack/react-query';
import type { Unit } from '@/engine/risk/types';

export interface TrendSeries {
  /** First and last year. */
  years: [number, number];
  /** Area id (C001…, R-…, TZ) to one value per year. */
  values: Record<string, number[]>;
}

export interface Trends {
  built: string;
  heat: TrendSeries | null;
  rain: TrendSeries | null;
  heavy: TrendSeries | null;
  sources: { heat: string; rain: string };
}

export const loadTrends = (): Promise<Trends> => import('@/data/tanzania-council-trends.json').then((m) => m.default as unknown as Trends);

export function useTrends() {
  return useQuery({ queryKey: ['trends'], queryFn: loadTrends, staleTime: Infinity });
}

/** The id an area's series is kept under: councils and regions by their id, the country as TZ; workbook units have none. */
export const trendKey = (unit: Unit): string | null => (unit.level === 'national' ? 'TZ' : unit.level === 'council' || unit.level === 'region' ? unit.id : null);

/** One area's series with its years, or null. */
export function seriesFor(series: TrendSeries | null | undefined, unit: Unit): Array<{ year: number; value: number }> | null {
  const key = trendKey(unit);
  const values = key && series ? series.values[key] : null;
  if (!series || !values) return null;
  return values.map((value, i) => ({ year: series.years[0] + i, value }));
}

/** The mean over a span of years (inclusive), or null when the series does not cover it. */
export function meanOver(points: ReadonlyArray<{ year: number; value: number }>, from: number, to: number): number | null {
  const sel = points.filter((p) => p.year >= from && p.year <= to);
  return sel.length ? sel.reduce((a, p) => a + p.value, 0) / sel.length : null;
}
