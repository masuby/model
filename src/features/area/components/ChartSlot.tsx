/**
 * The area charts pull in Recharts (the largest vendor chunk), so they load on demand: the module is
 * fetched when a chart section nears the viewport (or while the browser is idle), cached, and printing
 * waits for it so paper copies are always complete.
 */
import * as React from 'react';
import type { AreaView } from '../lib';
import type * as ChartsNs from './Charts';

type ChartsModule = typeof ChartsNs;
let chartsModule: ChartsModule | null = null;
let pending: Promise<ChartsModule> | null = null;

/** Load (once) and cache the charts module. */
export function loadCharts(): Promise<ChartsModule> {
  if (chartsModule) return Promise.resolve(chartsModule);
  pending ??= import('./Charts').then((m) => (chartsModule = m));
  return pending;
}

/** Warm the charts module when the browser is idle, without competing with first render. */
export function usePrefetchCharts() {
  React.useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => void loadCharts(), { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => void loadCharts(), 2000);
    return () => window.clearTimeout(id);
  }, []);
}

type ChartName = 'CategoryChart' | 'DistributionChart' | 'IndicatorChart';

/** Renders one area chart once its module is available (synchronously if already cached). */
export function ChartSlot({ name, view, minHeight }: { name: ChartName; view: AreaView; minHeight?: number }) {
  const [mod, setMod] = React.useState<ChartsModule | null>(chartsModule);
  React.useEffect(() => {
    if (!mod) void loadCharts().then(setMod);
  }, [mod]);
  if (!mod) return <div aria-busy="true" style={{ minHeight: minHeight ?? 320 }} />;
  const Chart = mod[name];
  return <Chart view={view} />;
}
