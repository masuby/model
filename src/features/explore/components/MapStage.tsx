/** The choropleth (lazy Leaflet) plus the desktop lens header overlay. */
import { FilterX, LoaderCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { Metric } from '@/engine/risk/metrics';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';
import { MiniLegend, ScaleInfo } from './bits';

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
      <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        {t('map.loading')}
      </div>
    </div>
  );
}

export function MapStage({ hidden = false }: { hidden?: boolean }) {
  const { t } = useTranslation('explore');
  const { model, state, metric, focusId, isDesktop, actions } = useExplore();
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
          fitPadding={isDesktop ? 40 : 20}
        />
      </React.Suspense>
    </div>
  );
}

/** Glass card on the map: level, active lens, mean vs. national, compact legend / class filter. */
export function LensHeader({ className }: { className?: string }) {
  const { t } = useTranslation(['explore', 'common']);
  const { model, metric, stats, state, units, selected, actions, metricLabel } = useExplore();
  const national = metric.get(model.national);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn(
        'glass w-[300px] rounded-2xl p-4 shadow-lg transition-[max-width] duration-300',
        // Leave room for the 360 px area card on narrower desktops.
        selected ? 'max-w-[calc(100%-360px-3rem)]' : 'max-w-[calc(100%-2rem)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {t(`level.${state.level}`)} · <span className="num">{units.length}</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="mt-1 font-display text-lg leading-tight font-bold"
            >
              {metricLabel(metric)}
            </motion.div>
          </AnimatePresence>
        </div>
        <ScaleInfo className="-mt-1 -mr-1" />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {t('stats.mean')} <b className="num text-foreground">{formatScore(stats.mean)}</b>
        </span>
        <span>
          {t('stats.nationalShort')} <b className="num text-foreground">{formatScore(national)}</b>
        </span>
      </div>
      <MiniLegend className="mt-3" />
      {metric.kind === 'indicator' && <p className="mt-2 text-[10px] leading-snug text-muted-foreground">{t('legend.continuousShort')}</p>}
      {state.cls && (
        <button type="button" onClick={() => actions.setClass(null)} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline">
          <FilterX className="size-3.5" aria-hidden />
          {t('legend.filtered', { cls: t(`common:classes.${state.cls}`) })} · {t('legend.clearFilter')}
        </button>
      )}
    </motion.div>
  );
}
