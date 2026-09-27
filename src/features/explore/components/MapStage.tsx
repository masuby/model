/** The choropleth (lazy Leaflet) plus the desktop map key overlay. */
import { FilterX, LoaderCircle } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { Metric } from '@/engine/risk/metrics';
import type { Unit } from '@/engine/risk/types';
import { cn } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';
import { MapKey } from './bits';

const RiskMap = React.lazy(() => import('@/components/map/RiskMap'));

/**
 * Leaflet's controls are unlayered CSS, so these overrides need `!`. The zoom control moves to the
 * vertical middle of the left edge (clear of the lens header and the comparison tray) and is hidden
 * on touch-sized screens where pinch-zoom is the norm.
 */
const LEAFLET_TWEAKS =
  '[&_.leaflet-top.leaflet-left]:top-1/2! [&_.leaflet-top.leaflet-left]:-translate-y-1/2! [&_.leaflet-left_.leaflet-control]:ml-4! max-lg:[&_.leaflet-control-zoom]:hidden!';

function MapLoading() {
  const { t } = useTranslation('explore');
  return (
    <div className="flex size-full items-center justify-center bg-[var(--map-bg)]">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        {t('map.loading')}
      </div>
    </div>
  );
}

export function MapStage({ hidden = false }: { hidden?: boolean }) {
  const { t } = useTranslation('explore');
  const { model, state, metric, focusId, isDesktop, actions, compare } = useExplore();
  const selectedIds = React.useMemo(() => [...new Set([...(state.id ? [state.id] : []), ...state.cmp])], [state.id, state.cmp]);
  const onSelect = (u: Unit) => (u.id === state.id ? actions.deselect() : actions.select(u));
  // RiskMap translates `labelKey` inside the namespace ('common' | 'indicators'), but parseMetric's
  // keys carry a namespace prefix for risk ('common.informRisk') and indicators ('indicators.flood'),
  // which would print raw keys in the tooltip and aria-label. Hand RiskMap namespace-relative keys.
  const mapMetric = React.useMemo<Metric>(
    () => ({ ...metric, labelKey: metric.kind === 'risk' ? 'informRisk' : metric.kind === 'indicator' ? (metric.indicator ?? metric.labelKey) : metric.labelKey }),
    [metric],
  );
  return (
    <div inert={hidden} className={cn('absolute inset-0 isolate', LEAFLET_TWEAKS)}>
      <React.Suspense fallback={<MapLoading />}>
        <RiskMap
          model={model}
          level={state.level}
          metric={mapMetric}
          selectedIds={selectedIds}
          onSelect={onSelect}
          filterClass={state.cls}
          focusId={focusId}
          basemap={state.basemap}
          className="size-full"
          tooltipHint={t('map.hint')}
          fitPadding={
            // Keep the target clear of floating UI: lens key (top-left), area card (right) and the
            // comparison tray (bottom) on desktop; the search bar and bottom sheet on phones.
            isDesktop
              ? { topLeft: [48, 104], bottomRight: [state.id && state.view === 'map' ? 416 : 48, compare.length ? 168 : 48] }
              : { topLeft: [16, 72], bottomRight: [16, 190] }
          }
        />
      </React.Suspense>
    </div>
  );
}

/**
 * Compact floating key on the desktop map: the lens name and its colour key. Counts, statistics, the
 * national figure and the class filter live in the panel beside it, so they are not repeated here.
 */
export function LensHeader({ className }: { className?: string }) {
  const { t } = useTranslation(['explore', 'common']);
  const { metric, state, actions, metricLabel } = useExplore();
  return (
    <div className={cn('glass w-[240px] max-w-[calc(100%-2rem)] rounded-lg px-3.5 pt-2.5 pb-3', className)}>
      <div className="text-sm leading-snug font-semibold">{metricLabel(metric)}</div>
      <MapKey className="mt-2" />
      {state.cls && (
        <button type="button" onClick={() => actions.setClass(null)} className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
          <FilterX className="size-3.5" aria-hidden />
          {t('legend.filtered', { cls: t(`common:classes.${state.cls}`) })} · {t('legend.clearFilter')}
        </button>
      )}
    </div>
  );
}
