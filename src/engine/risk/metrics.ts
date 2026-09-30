/**
 * Metric resolver: what the map/table/charts are coloured by.
 *   'risk'                → overall INFORM Risk (risk thresholds)
 *   'dim:<dimension>'     → a dimension score (that dimension's own thresholds)
 *   'ind:<dim>:<key>'     → a single indicator (continuous 0–10 scale - INFORM defines no classes for leaves)
 */
import { classify, type ClassInfo, type Scale } from './classes';
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
  scale: Scale | null;
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
    get: (u) => u.risk,
    classOf: (v) => classify(v, 'risk'),
  };
}

/** Continuous 0–10 sequential ramp for indicator lenses (light → deep red), interpolated in RGB. */
const RAMP = ['#fff5eb', '#fdd0a2', '#fd8d3c', '#d94801', '#7f2704'];
export function rampColor(v: number | null | undefined): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '#94a3b8';
  const t = Math.max(0, Math.min(1, v / 10)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(t));
  const f = t - i;
  const a = hex(RAMP[i]);
  const b = hex(RAMP[i + 1]);
  const c = a.map((x, j) => Math.round(x + (b[j] - x) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
export const RAMP_STOPS = RAMP;
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Fill colour for a value under a metric. */
export function metricColor(metric: Metric, v: number | null | undefined): string {
  if (metric.kind === 'indicator') return rampColor(v);
  return metric.classOf(v)?.color ?? '#94a3b8';
}
