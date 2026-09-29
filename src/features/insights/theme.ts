/**
 * Insights-local chart theme: extends the shared `useChartTheme()` with the surface/ink colours the
 * page needs for mark gaps, rings and SVG-only exports, plus the validated resolution ramp.
 *
 * Charts sit directly on the page (no card), so the surface mirrors `--background`; ink and neutral mirror
 * `--foreground` and `--muted` in `src/styles/index.css` (SVG attributes and PNG export cannot rely on
 * CSS variables).
 */
import * as React from 'react';
import { useChartTheme } from '@/components/charts/theme';
import type { Resolution } from './analytics';

/**
 * Data-locality ramp: one hue (blue) stepped by how local the data is - most local is strongest  - 
 * plus a separate amber for documented overlays (not on the locality scale). Validated with the
 * dataviz palette checker (ordinal: monotone lightness, single hue, light end ≥ 2:1 on the surface).
 */
const RESOLUTION_LIGHT: Record<Resolution, string> = {
  council: '#163a80',
  district: '#2463c0',
  region: '#4f8fe0',
  national: '#86ace0',
  overlay: '#e08a00',
};
const RESOLUTION_DARK: Record<Resolution, string> = {
  council: '#a9d1ff',
  district: '#5fa4f5',
  region: '#2f6fd0',
  national: '#2c4a7a',
  overlay: '#e0a100',
};

export function useInsightTheme() {
  const th = useChartTheme();
  return React.useMemo(
    () => ({
      ...th,
      /** Chart surface (= --background) - used for 2px gaps between touching marks and rings around dots. */
      surface: th.dark ? '#0a0f1a' : '#ffffff',
      /** Primary ink (= --foreground). */
      ink: th.dark ? '#e7ecf5' : '#0b1324',
      /** Neutral fill for empty cells / the diverging midpoint (≈ --muted). */
      neutral: th.dark ? '#1b2640' : '#eef2f7',
      /** Single-series colour. */
      series: th.dark ? '#5fa4f5' : '#2463c0',
      resolution: th.dark ? RESOLUTION_DARK : RESOLUTION_LIGHT,
    }),
    [th],
  );
}

export type InsightTheme = ReturnType<typeof useInsightTheme>;
