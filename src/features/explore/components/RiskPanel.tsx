/**
 * The risk communication panel of the Risk explorer (docs/EXPLORER_RISK_PANEL_PLAN.md). It opens when an
 * area is selected and follows two selections, both in the URL:
 *
 *   an area (`id`)                         its risk level with what it means for residents and for those
 *                                          who plan, build or invest there; its hazards from the Risk
 *                                          Action Guide Book and the INFORM scores, name and score only;
 *                                          warnings in force; the nature of the area; how the score is built
 *   an area and an indicator-group lens    the evidence for that group here: the measured values with
 *   (`metric=ind:<dim>:<group>`)           their source, period and origin, where the area sits, what the
 *                                          guide says, warnings for that hazard
 *
 * Choosing a hazard sets the map's lens, so the map and the panel always show the same thing. Standing
 * risk only: no warning level is derived, and no advice is given. Placements: docked beside the map on
 * desktops, beside the ranking table, and the bottom sheet on phones (peek and body).
 */
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, FileText, GitCompareArrows, Link2, MapPinned, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useModel } from '@/data-layer/DataProvider';
import { DataNoteLine, DataNoteMark } from '@/components/risk/DataNoteMark';
import { Button } from '@/components/ui/button';
import type { WarningPayload } from '@/data-layer/types';
import { CLASS_COLORS, CLASS_KEYS, classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { DIMENSION_BY_KEY, DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { rampColor, type Metric } from '@/engine/risk/metrics';
import { indicatorValue, placeKey } from '@/engine/risk/model';
import { dataNotesFor, isWithheld } from '@/engine/risk/notes';
import type { CommitteeRecord } from '@/data-layer/types';
import type { Unit } from '@/engine/risk/types';
import { useAreaCommunication } from '@/features/guide/actions';
import { GroupActions, HazardActions } from '@/features/guide/ActionRows';
import { ALERT_COLOR, planMessage, riskBandFor } from '@/features/guide/alert';
import { guideHazardName, isCoastal, reconciledHazards } from '@/features/guide/crosswalk';
import { RiskBandBadge } from '@/features/guide/AlertBadge';
import { useAreaGuide, useAreaRecords, type HazardKey } from '@/features/guide/data';
import { cn, formatDate, formatScore, NO_VALUE } from '@/lib/utils';
import { MAX_COMPARE } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';
import { coarseOf, dimensionGroups, evidenceFor, groupRanks, guideKeysFor, memberSpread, type TopGroup } from '../lib/riskPanel';
import { EvidenceItem } from './Evidence';
import { PanelResizer, PanelWidthButton, usePanelWidth } from './PanelResizer';
import { AreaBody } from './AreaCard';
import { AreaCharts, AreaNavMap } from './AreaInsight';
import { SectionTitle } from './bits';

export type RiskPanelPlacement = 'docked' | 'table';

/** Groups of a dimension shown before "Show all". */
const TOP_FIRST = 3;
const pct = (v: number | null | undefined) => (typeof v === 'number' ? Math.max(0, Math.min(100, v * 10)) : 0);

/** The indicator group a lens shows (`dim:group`), or null for risk and dimension lenses. */
export const groupRefOf = (metric: Metric): `${DimensionKey}:${string}` | null =>
  metric.kind === 'indicator' && metric.dimension && metric.indicator ? `${metric.dimension}:${metric.indicator}` : null;

/* ------------------------------------------------------------------------------------------------ */
/* The panel (desktop placements)                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export function RiskPanel({ placement, withInsight = false }: { placement: RiskPanelPlacement; withInsight?: boolean }) {
  const { t } = useTranslation(['explore', 'common']);
  const { selected, metric, actions, selectSeq, focusedSeq } = useExplore();
  const { width: rightWidth } = usePanelWidth('right');
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const returnMetric = React.useRef<string>('risk');
  const internal = React.useRef(false);
  const groupRef = groupRefOf(metric);

  const takeFocus = React.useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body && !panelRef.current?.contains(active)) returnFocus.current = active;
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  // A selection someone made moves focus to the panel (a link that opens with a selection does not). The
  // router applies the URL as a transition, so the counter can arrive before the selection: claim the
  // focus only once the panel shows the selected area.
  const selectedId = selected?.id ?? null;
  React.useEffect(() => {
    if (!selectedId || selectSeq <= focusedSeq.current) return;
    focusedSeq.current = selectSeq;
    takeFocus();
  }, [selectSeq, selectedId, focusedSeq, takeFocus]);
  // Opening a hazard from the panel, or going back, keeps focus in the panel.
  React.useEffect(() => {
    if (!internal.current) return;
    internal.current = false;
    takeFocus();
  }, [groupRef, takeFocus]);
  // Closing unmounts the panel with the selection. Focus then returns to where the selection started or,
  // when that is gone (the search folds into the rail while the panel is open), to the place search.
  const closing = React.useRef<{ to: HTMLElement | null } | null>(null);
  React.useEffect(() => {
    const request = closing;
    return () => {
      const pending = request.current;
      if (!pending) return;
      requestAnimationFrame(() => {
        if (pending.to?.isConnected) pending.to.focus();
        else document.querySelector<HTMLElement>('[data-place-search]')?.focus();
      });
    };
  }, []);

  if (!selected) return null;

  const close = () => {
    closing.current = { to: returnFocus.current };
    actions.deselect();
  };
  const openGroup = (key: string) => {
    if (metric.kind !== 'indicator') returnMetric.current = metric.key;
    internal.current = true;
    actions.setMetric(key);
  };
  const back = () => {
    internal.current = true;
    actions.setMetric(returnMetric.current);
  };

  return (
    <aside
      ref={panelRef}
      data-risk-panel
      aria-label={t('card.label', { name: selected.name })}
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || e.defaultPrevented) return;
        e.preventDefault();
        if (groupRef) back();
        else close();
      }}
      className={cn(
        'relative flex flex-col bg-background',
        placement === 'docked' && 'h-full shrink-0 border-l border-border',
        placement === 'table' && 'w-[340px] shrink-0 border-l border-border xl:w-[380px]',
      )}
      style={placement === 'docked' ? { width: rightWidth } : undefined}
    >
      {placement === 'docked' && <PanelResizer side="right" />}
      <div className="shrink-0 border-b border-border px-5 pt-4 pb-4">
        <PanelHeader unit={selected} headingRef={headingRef} onClose={close} />
      </div>
      <div key={`${selected.id}|${groupRef ?? ''}`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6">
        <React.Suspense fallback={<BodySkeleton />}>
          <PanelBody unit={selected} groupRef={groupRef} onOpenGroup={openGroup} onBack={back} withInsight={withInsight} />
        </React.Suspense>
      </div>
      <div className="shrink-0 border-t border-border px-4 py-3">
        <PanelActions unit={selected} groupRef={groupRef} />
      </div>
    </aside>
  );
}

/** While texts load inside the panel: a quiet placeholder, so the page and its map never suspend. */
function BodySkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-3 w-1/3 animate-pulse bg-muted" />
      <div className="h-3 w-5/6 animate-pulse bg-muted" />
      <div className="h-3 w-2/3 animate-pulse bg-muted" />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Header: where the area sits, its name and its risk level                                          */
/* ------------------------------------------------------------------------------------------------ */

function Breadcrumb({ unit }: { unit: Unit }) {
  const { t } = useTranslation('explore');
  const { model, actions } = useExplore();
  if (unit.level === 'national') return null;
  const trail: Unit[] = [model.national];
  if (unit.level === 'council' || unit.level === 'source') {
    const region = model.byId.get(`R-${placeKey(unit.region)}`);
    if (region) trail.push(region);
  }
  return (
    <nav aria-label={t('riskPanel.breadcrumb')}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {trail.map((u, i) => (
          <li key={u.id} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
            <button type="button" onClick={() => actions.select(u, { focus: true })} className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
              {u.level === 'national' ? t('riskPanel.country') : u.name}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PanelHeader({ unit, headingRef, onClose, compact = false }: { unit: Unit; headingRef?: React.Ref<HTMLHeadingElement>; onClose: () => void; compact?: boolean }) {
  const { t } = useTranslation(['explore', 'common', 'guide']);
  const risk = riskBandFor(unit.risk);
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        {compact ? (
          unit.level !== 'national' && <p className="truncate text-sm text-muted-foreground">{unit.level === 'region' ? t('common:levels.region') : unit.region}</p>
        ) : (
          <Breadcrumb unit={unit} />
        )}
        <h2 ref={headingRef} id="risk-panel-heading" tabIndex={-1} className="mt-0.5 text-[1.4rem] leading-tight text-balance focus:outline-none">
          {unit.level === 'national' ? t('riskPanel.country') : unit.name}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <RiskBandBadge risk={unit.risk} size="sm" />
          {risk && <span className="num text-xs text-muted-foreground">{t('guide:risk.basis', { cls: t(`common:classes.${risk.cls}`), score: formatScore(unit.risk) })}</span>}
        </div>
        {unit.inheritedFrom && <p className="mt-1 text-xs text-muted-foreground">{t('common:labels.inherited', { parent: unit.inheritedFrom })}</p>}
      </div>
      <div className="-mt-1 -mr-2 flex shrink-0 items-center">
        {!compact && <PanelWidthButton side="right" />}
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('card.close')}>
          <X />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Body                                                                                               */
/* ------------------------------------------------------------------------------------------------ */

export function PanelBody({ unit, groupRef, onOpenGroup, onBack, withInsight = false }: { unit: Unit; groupRef: string | null; onOpenGroup: (metricKey: string) => void; onBack: () => void; withInsight?: boolean }) {
  if (groupRef) {
    const [dim, key] = groupRef.split(':') as [DimensionKey, string];
    return <GroupView unit={unit} dim={dim} groupKey={key} onBack={onBack} />;
  }
  return <AreaView unit={unit} onOpenGroup={onOpenGroup} withInsight={withInsight} />;
}

function AreaView({ unit, onOpenGroup, withInsight }: { unit: Unit; onOpenGroup: (metricKey: string) => void; withInsight: boolean }) {
  return (
    <div className="divide-y divide-border">
      <RiskCommunication unit={unit} />
      <TopGroups unit={unit} onOpen={onOpenGroup} />
      <Warnings unit={unit} />
      {unit.level !== 'national' && <Nature unit={unit} />}
      {withInsight && <InsightFolds unit={unit} />}
      <Scores unit={unit} />
    </div>
  );
}

/** What the area's own data say: sentences generated from its scores, hazards, vulnerability, coping gaps and people. */

/** Without the left column (narrow screens, phones): the map of the area and its charts, folded. */
function InsightFolds({ unit }: { unit: Unit }) {
  const { t } = useTranslation('explore');
  const name = unit.level === 'national' ? t('riskPanel.country') : unit.name;
  return (
    <section className="py-6">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold">{t('insight.map.title', { name })}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <AreaNavMap unit={unit} className="mt-3" />
      </details>
      <details className="group/charts mt-4 border-t border-border pt-4" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold">{t('insight.charts.title')}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open/charts:rotate-180" aria-hidden />
        </summary>
        <div className="mt-3">
          <AreaCharts unit={unit} />
        </div>
      </details>
    </section>
  );
}


/** Risk communication: the two messages of the area's risk level, for residents and for those who plan, build or invest here. */
/** The hazards and the groups the panel shows with their rows; the profile and the cards show more. */
const PANEL_HAZARDS = 3;
const PANEL_GROUPS = 2;

/**
 * Risk communication, in INFORM's terms: the two standing messages of the area's class, then the Guide
 * Book's rows for the top hazards (each by its own score) and for the vulnerability and coping groups that
 * score medium or above (docs/RISK_COMMUNICATION_DESIGN.md).
 */
function RiskCommunication({ unit }: { unit: Unit }) {
  const { t } = useTranslation(['explore', 'guide', 'common', 'indicators']);
  const guide = useAreaGuide(unit);
  const items = React.useMemo(() => reconciledHazards(unit, guide.hazards), [unit, guide.hazards]);
  const comm = useAreaCommunication(unit, items, guide);
  const risk = comm.risk;
  if (!risk) return null;
  const vars = { cls: t(`common:classes.${risk.cls}`).toLowerCase(), name: unit.name };
  const plan = planMessage(unit, risk);
  const planVars = plan.hazard ? { ...vars, hazard: t(`indicators:${plan.hazard.key}`).toLowerCase(), score: formatScore(plan.hazard.score) } : vars;
  const hazards = comm.hazards.slice(0, PANEL_HAZARDS);
  const groups = comm.groups.slice(0, PANEL_GROUPS);
  return (
    <section aria-labelledby="risk-communication-title" className="pb-6">
      <SectionTitle as="h3" id="risk-communication-title" className="mb-2">
        {t('guide:risk.communication')}
      </SectionTitle>
      <dl className="space-y-3 border-l-4 pl-3 text-sm leading-relaxed" style={{ borderColor: risk.color }}>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('guide:risk.live')}</dt>
          <dd className="mt-1">{t(`guide:risk.band.${risk.band}.live`, vars)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('guide:risk.plan')}</dt>
          <dd className="mt-1">{t(`guide:${plan.key}`, planVars)}</dd>
        </div>
      </dl>
      {!comm.loading && hazards.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('guide:actions.title')}</h4>
          <div className="mt-2 space-y-4">
            {hazards.map((h) => (
              <HazardActions key={h.item.key} hazard={h} coastal={isCoastal(unit)} first={2} />
            ))}
          </div>
        </div>
      )}
      {!comm.loading && groups.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('guide:groups.title')}</h4>
          <div className="mt-2 space-y-4">
            {groups.map((g) => (
              <GroupActions key={g.ref} group={g} first={1} intro={false} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** The highest-scoring indicator groups of each dimension, each one click from its evidence. */
function TopGroups({ unit, onOpen }: { unit: Unit; onOpen: (metricKey: string) => void }) {
  const { t } = useTranslation('explore');
  return (
    <section aria-labelledby="risk-top-title" className="py-6">
      <SectionTitle as="h3" id="risk-top-title" className="mb-3">
        {t('riskPanel.top.title')}
      </SectionTitle>
      <div className="space-y-4">
        {DIMENSIONS.map((d) => (
          <DimensionBlock key={d.key} unit={unit} dim={d.key} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function DimensionBlock({ unit, dim, onOpen }: { unit: Unit; dim: DimensionKey; onOpen: (metricKey: string) => void }) {
  const { t } = useTranslation(['explore', 'common']);
  const [all, setAll] = React.useState(false);
  const groups = React.useMemo(() => dimensionGroups(unit, dim), [unit, dim]);
  const shown = all ? groups : groups.slice(0, TOP_FIRST);
  const score = unit.dims[dim].score;
  const scale = DIMENSION_BY_KEY[dim].scale;
  return (
    <div>
      <p className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full" style={{ background: classify(score, scale)?.color ?? NO_DATA_COLOR }} aria-hidden />
          <span className="truncate">{t(`common:dimensions.${dim}`)}</span>
        </span>
        <span className="num">{formatScore(score)}</span>
      </p>
      {groups.length ? (
        <ul className="-mx-2 mt-0.5">
          {shown.map((g) => (
            <GroupRow key={g.key} unit={unit} group={g} onOpen={onOpen} />
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">{t('riskPanel.top.empty')}</p>
      )}
      {groups.length > TOP_FIRST && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <ChevronDown className={cn('size-4 transition-transform', all && 'rotate-180')} aria-hidden />
          {all ? t('riskPanel.top.less') : t('riskPanel.top.more', { count: groups.length })}
        </button>
      )}
    </div>
  );
}

function GroupRow({ unit, group, onOpen }: { unit: Unit; group: TopGroup; onOpen: (metricKey: string) => void }) {
  const { t } = useTranslation(['explore', 'indicators']);
  const name = t(`indicators:${group.key}`);
  const notes = dataNotesFor(unit, group.dim, group.key);
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(group.metricKey)}
        aria-label={t('riskPanel.top.open', { name, score: formatScore(group.score) })}
        className="w-full rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-muted/70"
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm">{name}</span>
          <span className="num inline-flex items-center gap-1 text-sm font-semibold">
            {formatScore(group.score)}
            <DataNoteMark notes={notes} focusable={false} />
          </span>
        </span>
        <span className="mt-1.5 block h-1 bg-muted">
          <span className="block h-full" style={{ width: `${pct(group.score)}%`, background: rampColor(group.score, DIMENSION_BY_KEY[group.dim].scale) }} />
        </span>
        {group.coarse && (
          <span className="mt-1 inline-block rounded-sm border border-border px-1 py-px text-xs text-muted-foreground" title={t(`riskPanel.coarse.${group.coarse}Title`)}>
            {t(`riskPanel.coarse.${group.coarse}`)}
          </span>
        )}
      </button>
    </li>
  );
}

/** Warnings the committees published that are in force for the area (colour, hazard, areas, validity, issuer; no level wording). */
function Warnings({ unit, hazards }: { unit: Unit; hazards?: readonly HazardKey[] }) {
  // The data portal's texts load on demand: wait for them here rather than suspend the page and its map.
  const { t, i18n, ready } = useTranslation(['explore', 'guide', 'data'], { useSuspense: false });
  const { model } = useExplore();
  const { warnings } = useAreaRecords(unit);
  const list = hazards ? warnings.filter((r) => r.hazard && hazards.includes(r.hazard as HazardKey)) : warnings;
  if (!ready || !list.length) return null;
  return (
    <section aria-labelledby="risk-warnings-title" className="py-6">
      <SectionTitle as="h3" id="risk-warnings-title" className="mb-2">
        {hazards ? t('riskPanel.group.warnings') : t('riskPanel.warnings.title')}
      </SectionTitle>
      <ul className="space-y-3">
        {list.map((r) => (
          <WarningItem key={r.id} record={r} names={(r.payload as WarningPayload).areas?.map((id) => (id === 'TZ' ? t('data:committee.warning.wholeCountry') : (model.byId.get(id)?.name ?? id))) ?? []} lang={i18n.language} />
        ))}
      </ul>
    </section>
  );
}

function WarningItem({ record, names, lang }: { record: CommitteeRecord; names: string[]; lang: string }) {
  const { t } = useTranslation(['guide']);
  const model = useModel();
  const w = record.payload as WarningPayload;
  return (
    <li className="border-l-4 pl-3 text-sm" style={{ borderColor: ALERT_COLOR[w.alertLevel] }}>
      <p className="font-medium">{t('guide:banner.title', { hazard: record.hazard ? guideHazardName(t, record.hazard, isCoastal(model.byId.get(record.unitId) ?? model.national)) : '' })}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t(record.validTo ? 'guide:banner.detail' : 'guide:banner.detailOpen', {
          areas: names.join(', '),
          from: record.validFrom ? formatDate(record.validFrom, lang) : '',
          to: record.validTo ? formatDate(record.validTo, lang) : '',
          issuer: w.issuer,
        })}
      </p>
    </li>
  );
}

/** The guide's statements about the place (no advice), folded. */
function Nature({ unit }: { unit: Unit }) {
  const { t } = useTranslation(['explore', 'guide']);
  const guide = useAreaGuide(unit);
  const council = unit.level === 'council';
  const councils = council ? [] : guide.entries;
  // A council's hazards are listed above; the Guide Book's statements are not repeated here.
  if (council || (!guide.loading && !councils.length)) return null;
  return (
    <section className="py-6">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold">{t('riskPanel.nature.title')}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <p className="mt-2 text-xs font-medium text-muted-foreground">{t('riskPanel.nature.councils')}</p>
        <ul className="mt-1 space-y-1.5 text-sm">
          {councils.slice(0, 4).map((e) => (
            <li key={e.council.id}>
              <Link to={`/area/${e.council.id}#actions`} className="font-medium hover:underline">
                {e.council.name}
              </Link>
              <span className="text-muted-foreground"> · {e.guide.hazards.map((h) => guideHazardName(t, h, isCoastal(e.council))).join(', ')}</span>
            </li>
          ))}
        </ul>
        {councils.length > 4 && <p className="mt-1 text-xs text-muted-foreground">{t('riskPanel.nature.more', { count: councils.length - 4 })}</p>}
      </details>
    </section>
  );
}

/** Rank, dimensions, drivers, people and data coverage (the analysis), folded under a one-line summary. */
function Scores({ unit }: { unit: Unit }) {
  const { t } = useTranslation(['explore', 'common']);
  const summary = DIMENSIONS.map((d) => `${t(`common:dimensions.${d.key}Short`)} ${formatScore(unit.dims[d.key].score)}`).join(' · ');
  return (
    <section className="pt-6">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-semibold">{t('riskPanel.scores.title')}</span>
            <span className="num mt-0.5 block text-xs text-muted-foreground">{summary}</span>
          </span>
          <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-4">
          {unit.level === 'national' ? <NationalScores /> : <AreaBody unit={unit} />}
        </div>
      </details>
    </section>
  );
}

function NationalScores() {
  const { t } = useTranslation(['explore', 'common']);
  const { model } = useExplore();
  const n = model.national;
  const counts = CLASS_KEYS.map((k) => ({ k, n: model.councils.filter((c) => classify(c.risk, 'risk')?.key === k).length }));
  return (
    <div className="space-y-5">
      <ul>
        {DIMENSIONS.map((d) => {
          const v = n.dims[d.key].score;
          const c = classify(v, d.scale);
          return (
            <li key={d.key} className="py-2">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{t(`common:dimensions.${d.key}`)}</span>
                <span className="num text-sm font-semibold">{formatScore(v)}</span>
              </span>
              <span className="mt-1.5 block h-1 bg-muted">
                <span className="block h-full" style={{ width: `${pct(v)}%`, background: c?.color ?? NO_DATA_COLOR }} />
              </span>
            </li>
          );
        })}
      </ul>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{t('riskPanel.scores.councilsByClass')}</p>
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {[...counts].reverse().map(({ k, n: count }) => (
            <li key={k} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px]" style={{ background: CLASS_COLORS[k] }} aria-hidden />
              {t(`common:classes.${k}`)} <span className="num font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* One indicator group of the area: the evidence                                                     */
/* ------------------------------------------------------------------------------------------------ */

function GroupView({ unit, dim, groupKey, onBack }: { unit: Unit; dim: DimensionKey; groupKey: string; onBack: () => void }) {
  const { t, i18n } = useTranslation(['explore', 'guide', 'indicators', 'common', 'data'], { useSuspense: false });
  const { model } = useExplore();
  const ref = `${dim}:${groupKey}`;
  const name = t(`indicators:${groupKey}`);
  const value = indicatorValue(unit, dim, groupKey);
  const region = unit.level === 'council' || unit.level === 'source' ? (model.byId.get(`R-${placeKey(unit.region)}`) ?? null) : null;
  const ranks = groupRanks(model, unit, dim, groupKey);
  const evidence = React.useMemo(() => evidenceFor(unit, dim, groupKey), [unit, dim, groupKey]);
  const spread = unit.level === 'region' || unit.level === 'national' ? memberSpread(model, unit, dim, groupKey) : null;
  const coarse = coarseOf(unit, ref);
  const keys = guideKeysFor(ref);
  const notes = dataNotesFor(unit, dim, groupKey);
  const compare: Array<{ key: string; label: string; v: number | null }> = [
    { key: 'self', label: unit.level === 'national' ? t('riskPanel.country') : unit.name, v: value },
    ...(region ? [{ key: 'region', label: t('riskPanel.group.compareRegion', { name: region.name }), v: indicatorValue(region, dim, groupKey) }] : []),
    ...(unit.level !== 'national' ? [{ key: 'national', label: t('riskPanel.group.compareNational'), v: indicatorValue(model.national, dim, groupKey) }] : []),
  ];
  return (
    <div className="divide-y divide-border">
      <section className="pb-6">
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden />
          {t('riskPanel.group.back', { name: unit.level === 'national' ? t('riskPanel.country') : unit.name })}
        </button>
        <h3 className="text-lg leading-snug font-semibold">{name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t(`common:dimensions.${dim}`)}</p>
        <ul className="mt-4 space-y-2.5">
          {compare.map((c) => (
            <li key={c.key}>
              <span className="flex items-baseline justify-between gap-2 text-sm">
                <span className={cn('truncate', c.key === 'self' ? 'font-semibold' : 'text-muted-foreground')}>{c.label}</span>
                <span className={cn('num', c.key === 'self' ? 'text-base font-semibold' : 'font-medium')}>{c.v == null ? NO_VALUE : formatScore(c.v)}</span>
              </span>
              <span className={cn('mt-1 block bg-muted', c.key === 'self' ? 'h-1.5' : 'h-1')}>
                <span className="block h-full" style={{ width: `${pct(c.v)}%`, background: c.v == null ? NO_DATA_COLOR : rampColor(c.v, dim) }} />
              </span>
            </li>
          ))}
        </ul>
        {(ranks.level || ranks.region) && (
          <p className="num mt-3 text-xs text-muted-foreground">
            {[
              ranks.level && t('riskPanel.group.rankLevel', { rank: ranks.level.rank, of: ranks.level.of, level: t(`riskPanel.group.levels.${unit.level}`) }),
              ranks.region && t('riskPanel.group.rankRegion', { rank: ranks.region.rank, of: ranks.region.of, region: ranks.region.name }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {coarse && !isWithheld(unit, dim, groupKey) && (
          <p className="mt-3 text-xs text-muted-foreground" title={t(`riskPanel.coarse.${coarse}Title`)}>
            {t(`riskPanel.coarse.${coarse}`)}
          </p>
        )}
        {notes.length > 0 && <DataNoteLine notes={notes} withheld={isWithheld(unit, dim, groupKey)} className="mt-3" />}
      </section>

      <section aria-labelledby="risk-evidence-title" className="py-6">
        <SectionTitle as="h3" id="risk-evidence-title" className="mb-2">
          {spread ? (unit.level === 'national' ? t('riskPanel.group.evidenceNational') : t('riskPanel.group.evidenceRegion')) : t('riskPanel.group.evidence')}
        </SectionTitle>
        {spread ? (
          spread.withData ? (
            <>
              <p className="text-sm text-muted-foreground">{t('riskPanel.group.spread', { withData: spread.withData, total: spread.total })}</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {spread.top.map((m) => (
                  <li key={m.unit.id} className="flex items-baseline justify-between gap-2">
                    <span className="truncate">{m.unit.name}</span>
                    <span className="num font-semibold">{formatScore(m.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('riskPanel.group.noEvidence')}</p>
          )
        ) : evidence.length ? (
          <ul className="divide-y divide-border">
            {evidence.map((line) => (
              <EvidenceItem key={line.specId} line={line} lang={i18n.language} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('riskPanel.group.noEvidence')}</p>
        )}
      </section>

      {dim === 'hazard' && keys.length > 0 && <Warnings unit={unit} hazards={keys} />}

    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Actions                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

export function PanelActions({ unit, groupRef, className }: { unit: Unit; groupRef: string | null; className?: string }) {
  const { t } = useTranslation('explore');
  const { state, actions } = useExplore();
  const inCompare = state.cmp.includes(unit.id);
  const full = !inCompare && state.cmp.length >= MAX_COMPARE;
  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="flex-1">
          <Link to={groupRef ? `/area/${unit.id}?view=analysis#indicators` : `/area/${unit.id}`}>
            {groupRef ? t('riskPanel.group.indicatorTable') : t('card.viewProfile')} <ArrowRight />
          </Link>
        </Button>
        {unit.level !== 'national' && (
          <Button
            variant={inCompare ? 'secondary' : 'outline'}
            aria-pressed={inCompare}
            onClick={() => actions.toggleCompare(unit)}
            title={full ? t('compare.fullHint') : undefined}
            className={cn(full && 'opacity-60')}
          >
            <GitCompareArrows /> {inCompare ? t('card.comparing') : t('card.compare')}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/area/${unit.id}/card`}>
            <FileText /> {t('riskPanel.actions.card')}
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/area/${unit.id}/card/detailed`}>
            <FileText /> {t('riskPanel.actions.cardDetailed')}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={actions.copyLink}>
          <Link2 /> {t('riskPanel.actions.copy')}
        </Button>
        {state.view === 'table' && unit.level !== 'national' && (
          <Button variant="ghost" size="sm" onClick={() => actions.setView('map', { focusSelection: true })}>
            <MapPinned /> {t('view.showOnMap')}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Phones: the bottom sheet's peek and body                                                          */
/* ------------------------------------------------------------------------------------------------ */

export function RiskPanelPeek({ unit }: { unit: Unit }) {
  const { t } = useTranslation(['explore', 'indicators']);
  const { metric, actions } = useExplore();
  const groupRef = groupRefOf(metric);
  const value = groupRef ? indicatorValue(unit, metric.dimension!, metric.indicator!) : null;
  return (
    <div className="px-4 pb-3">
      <PanelHeader unit={unit} onClose={actions.deselect} compact />
      {groupRef && (
        <p className="mt-2 flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate font-medium">{t(`indicators:${metric.indicator}`)}</span>
          <span className="num font-semibold">{value == null ? NO_VALUE : formatScore(value)}</span>
        </p>
      )}
      <PanelActions unit={unit} groupRef={groupRef} className="mt-3" />
    </div>
  );
}

export function RiskPanelSheetBody({ unit }: { unit: Unit }) {
  const { metric, actions } = useExplore();
  const groupRef = groupRefOf(metric);
  const returnMetric = React.useRef<string>('risk');
  return (
    <div key={`${unit.id}|${groupRef ?? ''}`} className="px-4 pt-5 pb-10">
      <React.Suspense fallback={<BodySkeleton />}>
        <PanelBody
          unit={unit}
          withInsight
          groupRef={groupRef}
          onOpenGroup={(key) => {
            if (metric.kind !== 'indicator') returnMetric.current = metric.key;
            actions.setMetric(key);
            // Show the map coloured by the hazard; the peek keeps the hazard's score.
            actions.setSheetExpanded(false);
          }}
          onBack={() => actions.setMetric(returnMetric.current)}
        />
      </React.Suspense>
    </div>
  );
}
