/**
 * Risk Explorer (/explore) — the flagship screen.
 *
 * Desktop (≥1024 px): a 380 px control panel on the left and a full-bleed map on the right with glass
 * overlays (lens header, view toolbar, area card, comparison tray). Table view swaps the map for a
 * sortable ranking. Mobile: the map fills the screen, controls and the area card live in a non-modal
 * bottom sheet. All view state lives in the query string, so every view is a shareable link.
 */
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useModel } from '@/data-layer/DataProvider';
import { formatScore } from '@/lib/utils';
import { AreaActions, AreaBody, AreaCardOverlay, AreaHeader } from './components/AreaCard';
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

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Area card + comparison tray, positioned inside the current stage (map or table body). */
function StageOverlays({ top }: { top: number }) {
  const { compare, state } = useExplore();
  const [trayRef, trayH] = useElementHeight<HTMLDivElement>();
  // Leave room for the OpenStreetMap attribution when the street basemap is on.
  const trayBottom = state.view === 'map' && state.basemap === 'streets' ? 30 : 16;
  const bottom = compare.length && trayH ? trayBottom + trayH + 12 : 16;
  return (
    <>
      <AreaCardOverlay top={top} bottom={bottom} />
      <div ref={trayRef} className="pointer-events-none absolute inset-x-4 z-20 flex justify-center" style={{ bottom: trayBottom }}>
        <AnimatePresence>{compare.length > 0 && <CompareTray key="tray" className="pointer-events-auto w-full max-w-3xl" />}</AnimatePresence>
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
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        aria-label={t('panel.label')}
        className="relative z-30 flex w-[380px] shrink-0 flex-col border-r border-border bg-card/85 shadow-[var(--shadow-soft)] backdrop-blur-xl"
      >
        <ControlPanel variant="desktop" />
      </motion.aside>

      <section aria-label={t('stage.label')} className="relative min-w-0 flex-1 overflow-hidden">
        <MapStage hidden={state.view === 'table'} />

        <AnimatePresence initial={false}>
          {state.view === 'map' && (
            <motion.div key="map-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pointer-events-none absolute inset-0 z-20">
              <LensHeader className="pointer-events-auto absolute top-4 left-4" />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15, ease: EASE }}
                className="glass pointer-events-auto absolute top-4 right-4 rounded-2xl p-1.5 shadow-lg"
              >
                <ViewToolbar compact={!wide} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.view === 'table' && (
            <RankingTable key="table" overlays={<StageOverlays top={16} />} bottomPad={compare.length ? 196 : 0} rightPad={selected && wide ? 392 : 0} />
          )}
        </AnimatePresence>

        {state.view === 'map' && <StageOverlays top={72} />}
      </section>
    </div>
  );
}

function ControlsPeek() {
  const { t } = useTranslation('explore');
  const { state, metric, stats, metricLabel } = useExplore();
  return (
    <div className="px-4 pb-3">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pt-0.5 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t('lens.label')}>
        <LensChips />
        <IndicatorPicker variant="chip" />
      </div>
      <div className="mt-1.5 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
            <span className="truncate font-semibold">
              {t(`level.${state.level}`)} · {metricLabel(metric)}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {t('stats.mean')} <b className="num text-foreground">{formatScore(stats.mean)}</b>
            </span>
          </div>
          <MiniLegend />
        </div>
        <ScaleInfo align="end" />
      </div>
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
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }} className="absolute inset-x-3 top-3 z-30 flex items-start gap-2">
          <PlaceSearch glass className="min-w-0 flex-1" />
          <div className="glass shrink-0 rounded-xl p-1 shadow-lg">
            <ViewToolbar compact />
          </div>
        </motion.div>
      )}

      <AnimatePresence>{state.view === 'table' && <RankingTable key="table" bottomPad={220} />}</AnimatePresence>

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
          <div key={selected.id} className="px-4 pt-4 pb-10">
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
    <MotionConfig reducedMotion="user">
      <ExploreProvider model={model} isDesktop={isDesktop}>
        <div className="relative overflow-hidden bg-background" style={{ height: `calc(100dvh - ${headerH}px)` }}>
          {isDesktop ? <DesktopExplorer /> : <MobileExplorer />}
        </div>
      </ExploreProvider>
    </MotionConfig>
  );
}
