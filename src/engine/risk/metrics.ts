/**
 * Metric resolver: what the map/table/charts are coloured by.
 *   'risk'                → overall INFORM Risk (risk thresholds, the risk palette)
 *   'dim:<dimension>'     → a dimension score (that dimension's own thresholds and palette)
 *   'ind:<dim>:<key>'     → a single indicator (continuous 0–10 ramp in its dimension's palette - INFORM
 *                           defines no classes for leaves)
 */
import { CLASS_KEYS, CLASS_PALETTES, classify, NO_DATA_COLOR, SCALES, type ClassInfo, type Scale } from './classes';
import { DIMENSION_BY_KEY, findIndicator, type DimensionKey } from './hierarchy';
import { indicatorValue } from './model';
import type { Unit } from './types';

export type MetricKey = 'risk' | `dim:${DimensionKey}` | `ind:${DimensionKey}:${string}`;

export interface Metric {
  key: MetricKey;
  kind: 'risk' | 'dimension' | 'indicator';
  dimension: DimensionKey | null;
  indicator: string | null;
  /** Fully-qualified i18n key (`ns:key`), usable with t() from any namespace. */
  labelKey: string;
  /** The classes the metric is read on; null for an indicator, which has none. */
  scale: Scale | null;
  /** The scale whose palette colours the metric: an indicator takes its dimension's. */
  palette: Scale;
  get: (u: Unit) => number | null;
  classOf: (v: number | null | undefined) => ClassInfo | null;
}

export function parseMetric(key: string | null | undefined): Metric {
  if (key?.startsWith('dim:')) {
    const dim = key.slice(4) as DimensionKey;
    if (DIMENSION_BY_KEY[dim]) {
      const scale = DIMENSION_BY_KEY[dim].scale;
      return {
        key: key as MetricKey,
        kind: 'dimension',
        dimension: dim,
        indicator: null,
        labelKey: `common:dimensions.${dim}`,
        scale,
        palette: scale,
        get: (u) => u.dims[dim].score,
        classOf: (v) => classify(v, scale),
      };
    }
  }
  if (key?.startsWith('ind:')) {
    const [, dim, ind] = key.split(':') as [string, DimensionKey, string];
    if (findIndicator(`${dim}:${ind}`)) {
      return {
        key: key as MetricKey,
        kind: 'indicator',
        dimension: dim,
        indicator: ind,
        labelKey: `indicators:${ind}`,
        scale: null,
        palette: DIMENSION_BY_KEY[dim].scale,
        get: (u) => indicatorValue(u, dim, ind),
        classOf: () => null,
      };
    }
  }
  return {
    key: 'risk',
    kind: 'risk',
    dimension: null,
    indicator: null,
    labelKey: 'common:informRisk',
    scale: 'risk',
    palette: 'risk',
    get: (u) => u.risk,
    classOf: (v) => classify(v, 'risk'),
  };
}

/**
 * Continuous 0–10 ramps for indicator lenses and bars: the five class colours of a scale as evenly
 * spaced stops, interpolated in RGB. A hazard indicator is read in the hazard colours, a vulnerability
 * indicator in blue, a coping indicator in green; the risk ramp is for what belongs to no dimension.
 */
const RAMPS = Object.fromEntries(SCALES.map((s) => [s, CLASS_KEYS.map((k) => CLASS_PALETTES[s][k])])) as unknown as Record<Scale, readonly string[]>;

/** The stops of a scale's ramp, for CSS gradients and legends. */
export const rampStops = (scale: Scale = 'risk'): readonly string[] => RAMPS[scale];

/** The ramp colour of a value (`rgb(r, g, b)`); the no-data grey for a missing value. */
export function rampColor(v: number | null | undefined, scale: Scale = 'risk'): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return NO_DATA_COLOR;
  const ramp = RAMPS[scale];
  const t = Math.max(0, Math.min(1, v / 10)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(t));
  const f = t - i;
  const a = hex(ramp[i]);
  const b = hex(ramp[i + 1]);
  const c = a.map((x, j) => Math.round(x + (b[j] - x) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Fill colour for a value under a metric. */
export function metricColor(metric: Metric, v: number | null | undefined): string {
  if (metric.kind === 'indicator') return rampColor(v, metric.palette);
  return metric.classOf(v)?.color ?? NO_DATA_COLOR;
}
