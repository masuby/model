/**
 * Explorer state + actions, shared by every panel, overlay and sheet of the Risk Explorer.
 * The query string is the single source of truth (level, metric, selection, class filter, view,
 * comparison, basemap, sort) so any view can be shared as a link.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { ClassKey } from '@/engine/risk/classes';
import { parseMetric, type Metric } from '@/engine/risk/metrics';
import { unitsAt } from '@/engine/risk/model';
import type { RiskModel, Unit } from '@/engine/risk/types';
import {
  computeStats,
  EXPLORE_LEVELS,
  MAX_COMPARE,
  rankUnits,
  readExploreState,
  translateSelection,
  writeExploreState,
  type Basemap,
  type ExploreLevel,
  type ExploreState,
  type ExploreView,
  type MetricStats,
  type SortKey,
} from './explore';
import { useMetricLabel } from './hooks';

export interface ExploreActions {
  select: (u: Unit, opts?: { focus?: boolean }) => void;
  deselect: () => void;
  setLevel: (level: ExploreLevel) => void;
  setMetric: (key: string) => void;
  setClass: (cls: ClassKey | null) => void;
  setView: (view: ExploreView, opts?: { focusSelection?: boolean }) => void;
  setBasemap: (b: Basemap) => void;
  setSort: (key: SortKey) => void;
  toggleCompare: (u: Unit) => void;
  removeCompare: (id: string) => void;
  clearCompare: () => void;
  copyLink: () => void;
  setSheetExpanded: (open: boolean) => void;
}

export interface ExploreApi {
  model: RiskModel;
  state: ExploreState;
  metric: Metric;
  /** Units of the current level. */
  units: Unit[];
  stats: MetricStats;
  /** Rank of each current-level unit under the active metric. */
  ranks: Map<string, number>;
  selected: Unit | null;
  compare: Unit[];
  focusId: string | null;
  isDesktop: boolean;
  sheetExpanded: boolean;
  metricLabel: ReturnType<typeof useMetricLabel>;
  actions: ExploreActions;
}

const Ctx = React.createContext<ExploreApi | null>(null);

export function useExplore(): ExploreApi {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useExplore must be used inside <ExploreProvider>');
  return v;
}

const isExplorable = (u: Unit) => EXPLORE_LEVELS.includes(u.level as ExploreLevel);

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function ExploreProvider({ model, isDesktop, children }: { model: RiskModel; isDesktop: boolean; children: React.ReactNode }) {
  const { t } = useTranslation('explore');
  const metricLabel = useMetricLabel();
  const [params, setParams] = useSearchParams();
  const lookup = React.useCallback((id: string) => model.byId.get(id), [model]);
  const state = React.useMemo(() => readExploreState(params, lookup), [params, lookup]);

  const [focusId, setFocusId] = React.useState<string | null>(() => state.id);
  const [sheetExpanded, setSheetExpanded] = React.useState(false);

  const update = React.useCallback(
    (patch: Partial<ExploreState>) => setParams((prev) => writeExploreState({ ...readExploreState(prev, lookup), ...patch }), { replace: true }),
    [setParams, lookup],
  );

  const metric = React.useMemo(() => parseMetric(state.metric), [state.metric]);
  const units = React.useMemo(() => unitsAt(model, state.level), [model, state.level]);
  const stats = React.useMemo(() => computeStats(units, metric), [units, metric]);
  const ranks = React.useMemo(() => rankUnits(units, metric), [units, metric]);
  const selected = React.useMemo(() => (state.id ? (model.byId.get(state.id) ?? null) : null), [model, state.id]);
  const compare = React.useMemo(() => state.cmp.map((id) => model.byId.get(id)).filter((u): u is Unit => !!u), [model, state.cmp]);

  // Keep the latest state in a ref so the action callbacks stay referentially stable.
  const live = React.useRef(state);
  React.useLayoutEffect(() => {
    live.current = state;
  }, [state]);

  const actions = React.useMemo<ExploreActions>(
    () => ({
      select: (u, opts) => {
        if (!isExplorable(u)) return;
        const s = live.current;
        update({ id: u.id, level: u.level === s.level ? s.level : (u.level as ExploreLevel) });
        if (opts?.focus) setFocusId(u.id);
        setSheetExpanded(false);
      },
      deselect: () => update({ id: null }),
      setLevel: (level) => {
        const s = live.current;
        if (level === s.level) return;
        const id = translateSelection(model, s.id, level);
        update({ level, id });
        if (id) setFocusId(id);
      },
      setMetric: (key) => {
        const m = parseMetric(key);
        update({ metric: m.key, ...(m.kind === 'indicator' ? { cls: null } : {}) });
      },
      setClass: (cls) => update({ cls }),
      setView: (view, opts) => {
        update({ view });
        if (opts?.focusSelection && live.current.id) setFocusId(live.current.id);
      },
      setBasemap: (basemap) => update({ basemap }),
      setSort: (key) => {
        const s = live.current;
        if (key === s.sort) update({ dir: s.dir === 'asc' ? 'desc' : 'asc' });
        else update({ sort: key, dir: key === 'name' || key === 'region' ? 'asc' : 'desc' });
      },
      toggleCompare: (u) => {
        const s = live.current;
        if (s.cmp.includes(u.id)) update({ cmp: s.cmp.filter((x) => x !== u.id) });
        else if (s.cmp.length >= MAX_COMPARE) toast.warning(t('compare.full', { max: MAX_COMPARE }), { description: t('compare.fullHint') });
        else update({ cmp: [...s.cmp, u.id] });
      },
      removeCompare: (id) => update({ cmp: live.current.cmp.filter((x) => x !== id) }),
      clearCompare: () => update({ cmp: [] }),
      copyLink: () => {
        const url = `${window.location.origin}${window.location.pathname}?${writeExploreState(live.current).toString()}`;
        void copyText(url).then((ok) =>
          ok ? toast.success(t('share.copied'), { description: t('share.copiedDesc') }) : toast.error(t('share.failed'), { description: url }),
        );
      },
      setSheetExpanded,
    }),
    [model, update, t],
  );

  const value = React.useMemo<ExploreApi>(
    () => ({ model, state, metric, units, stats, ranks, selected, compare, focusId, isDesktop, sheetExpanded, metricLabel, actions }),
    [model, state, metric, units, stats, ranks, selected, compare, focusId, isDesktop, sheetExpanded, metricLabel, actions],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
