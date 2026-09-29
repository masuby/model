/**
 * Risk Explorer (/explore) - the flagship screen.
 *
 * Desktop (≥1024 px): a 392 px control panel on the left and a full-bleed map on the right with a few
 * solid floating panels (a compact map key, the view toolbar, the area card, the comparison). Table view
 * swaps the map for a sortable ranking; there nothing floats - the area card docks as a column on the
 * right and the comparison docks under the table. Mobile: the map fills the screen, controls and the area
 * card live in a non-modal bottom sheet. All view state lives in the query string, so every view is a
 * shareable link. No animation library: state changes are instant or short CSS transitions.
 */
import { FilterX } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useModel } from '@/data-layer/DataProvider';
import { formatScore } from '@/lib/utils';
import { AreaActions, AreaBody, AreaCardPanel, AreaHeader } from './components/AreaCard';
import { MiniLegend, ScaleInfo } from './components/bits';
import { CompareTray } from './components/CompareTray';
import { ControlPanel } from './components/ControlPanel';
import { IndicatorPicker, LensChips } from './components/LensPicker';
import { LensHeader, MapStage } from './components/MapStage';
import { MobileSheet } from './components/MobileSheet';
import { PlaceSearch } from './components/PlaceSearch';
import { RankingTable } from './components/RankingTable';
import { ViewToolbar } from './components/ViewToolbar';
import { ExploreProvider, useExplore } from './lib/ExploreContext';
import { useElementHeight, useHeaderHeight, useMediaQuery } from './lib/hooks';

/** Map view: the area card and the comparison tray float over the map. */
function MapOverlays() {
  const { compare, state } = useExplore();
  const [trayRef, trayH] = useElementHeight<HTMLDivElement>();
  // Leave room for the OpenStreetMap attribution when the street basemap is on.
  const trayBottom = state.basemap === 'streets' ? 30 : 16;
  const bottom = compare.length && trayH ? trayBottom + trayH + 12 : 16;
  return (
    <>
      <AreaCardPanel placement="floating" style={{ top: 72, bottom }} />
      <div ref={trayRef} className="pointer-events-none absolute inset-x-4 z-20 flex justify-center" style={{ bottom: trayBottom }}>
        {compare.length > 0 && <CompareTray className="pointer-events-auto w-full max-w-3xl" />}
      </div>
    </>
  );
}

function DesktopExplorer() {
  const { t } = useTranslation('explore');
  const { state, selected, compare } = useExplore();
  const wide = useMediaQuery('(min-width: 1280px)');
  return (
    <div className="flex h-full">
      <aside aria-label={t('panel.label')} className="relative z-30 flex w-[392px] shrink-0 flex-col border-r border-border bg-background">
        <ControlPanel variant="desktop" />
      </aside>

      <section aria-label={t('stage.label')} className="relative min-w-0 flex-1 overflow-hidden">
        <MapStage hidden={state.view === 'table'} />

        {state.view === 'map' ? (
          <>
            <div className="pointer-events-none absolute inset-0 z-20">
              {/* On narrower desktops the area card needs the room: the panel already has the full legend. */}
              {!(selected && !wide) && <LensHeader className="pointer-events-auto absolute top-4 left-4" />}
              <div className="glass pointer-events-auto absolute top-4 right-4 rounded-lg p-1">
                <ViewToolbar compact={!wide} />
              </div>
            </div>
            <MapOverlays />
          </>
        ) : (
          <div className="absolute inset-0 z-20">
            <RankingTable
              aside={selected ? <AreaCardPanel placement="docked" /> : null}
              footer={compare.length > 0 ? <CompareTray placement="docked" className="shrink-0" /> : null}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function ControlsPeek() {
  const { t } = useTranslation(['explore', 'common']);
  const { state, metric, stats, metricLabel, actions } = useExplore();
  return (
    <div className="px-4 pb-3">
      {/* The lens tabs scroll sideways; the fade at the right edge says there is more. */}
      <div
        className="-mx-4 flex gap-5 overflow-x-auto border-b border-border px-4 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label={t('lens.label')}
      >
        <LensChips />
        <IndicatorPicker variant="chip" />
        <span aria-hidden className="w-2 shrink-0" />
      </div>
      <div className="mt-3 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium">
              {t(`level.${state.level}`)} · {metricLabel(metric)}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {t('stats.mean')} <b className="num font-semibold text-foreground">{formatScore(stats.mean)}</b>
            </span>
          </div>
          <MiniLegend />
        </div>
        <ScaleInfo align="end" className="mb-5" />
      </div>
      {state.cls && (
        <button type="button" onClick={() => actions.setClass(null)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
          <FilterX className="size-3.5" aria-hidden />
          {t('legend.filtered', { cls: t(`common:classes.${state.cls}`) })} · {t('legend.clearFilter')}
        </button>
      )}
    </div>
  );
}

function MobileExplorer() {
  const { t } = useTranslation('explore');
  const { state, selected, compare, sheetExpanded, actions } = useExplore();
  const [ref, h] = useElementHeight<HTMLDivElement>();
  return (
    <div ref={ref} className="relative h-full">
      <h1 className="sr-only">{t('title')}</h1>
      <MapStage hidden={state.view === 'table'} />

      {state.view === 'map' && (
        <div className="absolute inset-x-3 top-3 z-30 flex items-start gap-2">
          <PlaceSearch glass className="min-w-0 flex-1" />
          <div className="glass shrink-0 rounded-lg p-0.5">
            <ViewToolbar compact />
          </div>
        </div>
      )}

      {state.view === 'table' && (
        <div className="absolute inset-0 z-20">
          <RankingTable bottomPad={220} />
        </div>
      )}

      <MobileSheet
        label={selected ? t('card.label', { name: selected.name }) : t('panel.label')}
        expanded={sheetExpanded}
        onExpandedChange={actions.setSheetExpanded}
        containerHeight={h}
        above={!sheetExpanded && compare.length ? <CompareTray defaultCollapsed /> : null}
        peek={
          selected ? (
            <div className="px-4 pb-3">
              <AreaHeader unit={selected} onClose={actions.deselect} />
              <AreaActions unit={selected} className="mt-3" />
            </div>
          ) : (
            <ControlsPeek />
          )
        }
      >
        {selected ? (
          <div key={selected.id} className="px-4 pt-5 pb-10">
            <AreaBody unit={selected} />
          </div>
        ) : (
          <ControlPanel variant="sheet" />
        )}
      </MobileSheet>
    </div>
  );
}

export default function ExplorePage() {
  const { t } = useTranslation('explore');
  const model = useModel();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const headerH = useHeaderHeight();

  React.useEffect(() => {
    const prev = document.title;
    document.title = `${t('title')} · INFORM Tanzania`;
    return () => {
      document.title = prev;
    };
  }, [t]);

  return (
    <ExploreProvider model={model} isDesktop={isDesktop}>
      <div className="relative overflow-hidden bg-background" style={{ height: `calc(100dvh - ${headerH}px)` }}>
        {isDesktop ? <DesktopExplorer /> : <MobileExplorer />}
      </div>
    </ExploreProvider>
  );
}
