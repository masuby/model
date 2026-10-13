/**
 * Risk Explorer (/explore) - the flagship screen.
 *
 * Desktop (≥1024 px): a 392 px control panel on the left and a full-bleed map. Selecting an area opens the
 * risk communication panel (RiskPanel), docked as a 400 px column on the right. From 1280 px the left column
 * then shows the area itself (InsightColumn: a map of the area to move around from, and its charts and
 * charts); below 1280 px it folds to a rail and those panels sit inside the risk panel. The controls open
 * again as a drawer over the left column. Table view swaps the map for a sortable ranking with the panel
 * docked beside it and the comparison under it.
 * Mobile: the map fills the screen, controls and the panel live in a non-modal bottom sheet. All view
 * state lives in the query string, so every view is a shareable link.
 */
import { FilterX, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAdvancedModel, useModel } from '@/data-layer/DataProvider';
import { cn, formatScore } from '@/lib/utils';
import { MiniLegend, ScaleInfo } from './components/bits';
import { CompareTray } from './components/CompareTray';
import { InsightColumn } from './components/AreaInsight';
import { ControlPanel } from './components/ControlPanel';
import { IndicatorChips, LensChips } from './components/LensPicker';
import { LensHeader, MapStage } from './components/MapStage';
import { MobileSheet } from './components/MobileSheet';
import { PANEL_WIDTHS, PanelResizer, usePanelWidth } from './components/PanelResizer';
import { PlaceSearch } from './components/PlaceSearch';
import { RankingTable } from './components/RankingTable';
import { RiskPanel, RiskPanelPeek, RiskPanelSheetBody } from './components/RiskPanel';
import { ViewToolbar } from './components/ViewToolbar';
import { ExploreProvider, useExplore } from './lib/ExploreContext';
import { useElementHeight, useHeaderHeight, useMediaQuery } from './lib/hooks';

/** Map view: the comparison tray floats over the map. */
function MapOverlays() {
  const { compare, state } = useExplore();
  // Leave room for the OpenStreetMap attribution when the street basemap is on.
  const trayBottom = state.basemap === 'streets' ? 30 : 16;
  return (
    <div className="pointer-events-none absolute inset-x-4 z-20 flex justify-center" style={{ bottom: trayBottom }}>
      {compare.length > 0 && <CompareTray className="pointer-events-auto w-full max-w-3xl" />}
    </div>
  );
}

/** The control panel folded to a rail while the risk panel is docked: one button opens it again. */
function ControlsRail({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation('explore');
  return (
    <div className="flex h-full flex-col items-center pt-4">
      <Button variant="ghost" size="icon" onClick={onOpen} aria-label={t('riskPanel.rail.open')} title={t('riskPanel.rail.open')}>
        <PanelLeftOpen />
      </Button>
    </div>
  );
}

function DesktopExplorer() {
  const { t } = useTranslation('explore');
  const { state, selected, compare } = useExplore();
  const wide = useMediaQuery('(min-width: 1280px)');
  // With an area open the risk panel docks beside the map. From 1280 px the left column shows the area's
  // map and charts; below that it folds to a rail. Either way the controls open as a drawer over it.
  const docked = !!selected && state.view === 'map';
  const [controlsOpen, setControlsOpen] = React.useState(false);
  React.useEffect(() => {
    if (!docked) setControlsOpen(false);
  }, [docked]);
  const insight = docked && wide;
  const drawer = docked && controlsOpen;
  const narrow = docked && !wide;
  // The left column's width is the reader's (preferences); the insight column starts a little narrower than the controls.
  const { width: leftWidth } = usePanelWidth('left', insight ? 360 : PANEL_WIDTHS.left.normal);
  return (
    <div className="flex h-full">
      <aside
        aria-label={insight && !drawer && selected ? t('insight.label', { name: selected.level === 'national' ? t('riskPanel.country') : selected.name }) : t('panel.label')}
        className={cn('relative z-30 flex shrink-0 flex-col border-r border-border bg-background', narrow && 'w-14')}
        style={narrow ? undefined : { width: leftWidth }}
      >
        {!narrow && <PanelResizer side="left" />}
        {selected && (
          <button
            type="button"
            onClick={() => document.getElementById('risk-panel-heading')?.focus()}
            className="sr-only z-40 rounded-md bg-background px-3 py-2 text-sm font-medium text-primary shadow focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
          >
            {t('riskPanel.skip', { name: selected.level === 'national' ? t('riskPanel.country') : selected.name })}
          </button>
        )}
        {insight && selected && <InsightColumn unit={selected} onOpenControls={() => setControlsOpen(true)} />}
        {narrow && <ControlsRail onOpen={() => setControlsOpen(true)} />}
        {(!docked || drawer) && (
          <div
            className={cn(drawer ? 'absolute inset-y-0 left-0 z-10 flex w-[392px] flex-col border-r border-border bg-background shadow-xl' : 'contents')}
            onKeyDown={
              drawer
                ? (e) => {
                    if (e.key !== 'Escape' || e.defaultPrevented) return;
                    e.preventDefault();
                    setControlsOpen(false);
                  }
                : undefined
            }
          >
            {drawer && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setControlsOpen(false)}
                aria-label={t('riskPanel.rail.close')}
                title={t('riskPanel.rail.close')}
                className="absolute top-3 right-3 z-20"
              >
                <PanelLeftClose />
              </Button>
            )}
            <ControlPanel variant="desktop" />
          </div>
        )}
      </aside>

      <section aria-label={t('stage.label')} className="relative min-w-0 flex-1 overflow-hidden">
        <MapStage hidden={state.view === 'table'} />

        {state.view === 'map' ? (
          <>
            {/* A container query: on a narrow map (wide panels, large text) the toolbar drops under the lens header. */}
            <div className="pointer-events-none absolute inset-0 z-20 @container">
              <LensHeader className="pointer-events-auto absolute top-4 left-4" />
              <div className="glass pointer-events-auto absolute top-4 right-4 rounded-lg p-1 @max-[640px]:top-28">
                <ViewToolbar compact={!wide || docked} />
              </div>
            </div>
            <MapOverlays />
          </>
        ) : (
          <div className="absolute inset-0 z-20">
            <RankingTable aside={selected ? <RiskPanel placement="table" /> : null} footer={compare.length > 0 ? <CompareTray placement="docked" className="shrink-0" /> : null} />
          </div>
        )}
      </section>

      {docked && <RiskPanel placement="docked" withInsight={!wide} />}
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
        <span aria-hidden className="w-2 shrink-0" />
      </div>
      {/* The open dimension's indicator groups, under the lens tabs. */}
      <IndicatorChips />
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
        scrollKey={selected ? `${selected.id}|${state.metric}` : 'controls'}
        expanded={sheetExpanded}
        onExpandedChange={actions.setSheetExpanded}
        containerHeight={h}
        above={!sheetExpanded && compare.length ? <CompareTray defaultCollapsed /> : null}
        peek={selected ? <RiskPanelPeek unit={selected} /> : <ControlsPeek />}
      >
        {selected ? <RiskPanelSheetBody unit={selected} /> : <ControlPanel variant="sheet" />}
      </MobileSheet>
    </div>
  );
}

export default function ExplorePage() {
  const { t } = useTranslation('explore');
  const model = useModel();
  const advanced = useAdvancedModel();
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
    <ExploreProvider model={model} advanced={advanced} isDesktop={isDesktop}>
      <div className="relative overflow-hidden bg-background" style={{ height: `calc(100dvh - ${headerH}px)` }}>
        {isDesktop ? <DesktopExplorer /> : <MobileExplorer />}
      </div>
    </ExploreProvider>
  );
}
