/**
 * Report title block: breadcrumb, serif name, context line and actions on the left; the headline
 * score set as type on the right behind a vertical rule (a serif numeral, one line of class and date,
 * and a thin class-band scale); key figures in a ruled row beneath; and any notes about how this
 * unit's data were built, set off by a left rule. No boxes, no widgets, no decoration.
 */
import { ChevronDown, ChevronRight, Compass, FileText, GitCompareArrows, Link2, Printer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { KeyFigures, Kicker, Note, PageContainer } from '@/components/layout/Page';
import { ClassDot } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { CLASS_COLORS, CLASS_KEYS, classify, THRESHOLDS } from '@/engine/risk/classes';
import { findIndicator } from '@/engine/risk/hierarchy';
import { authorityLabel } from '@/engine/risk/sources';
import type { WarningPayload } from '@/data-layer/types';
import { ALERT_COLOR } from '@/features/guide/alert';
import { useAreaRecords } from '@/features/guide/data';
import { cn, formatCompact, formatDate, formatNumber, formatScore, NO_VALUE } from '@/lib/utils';
import { compareHref, editList, explorerHref, type AreaView } from '../lib';
import { OutOf10, useMediaQuery } from './bits';
import { useDeferred } from './Deferred';

function Breadcrumb({ view }: { view: AreaView }) {
  const { t } = useTranslation('area');
  const { unit, region } = view;
  const crumbs: Array<{ label: string; to?: string }> = [{ label: t('breadcrumb.country'), to: unit.level === 'national' ? undefined : '/area/TZ' }];
  if (unit.level === 'region') crumbs.push({ label: unit.name });
  if (unit.level === 'council' || unit.level === 'source') {
    crumbs.push({ label: unit.region, to: region ? `/area/${region.id}` : undefined });
    crumbs.push({ label: unit.name });
  }
  return (
    <nav aria-label={t('breadcrumb.label')} className="no-print">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.to && !last ? (
                <Link to={c.to} className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn(last && 'text-foreground')}>
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 opacity-50" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Official warnings in force for this area (recorded by the NDRRC or PMO-DMD from TMA bulletins): the
 * warning's colour, hazard, areas, validity and issuer. The level itself (1 to 3) stays in the record and
 * sets the colour; no level wording is shown anywhere on the site (user decision of 10 October 2026).
 * Nothing is shown when none is in force.
 */
function ActiveWarningBanner({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['guide', 'area', 'data']);
  const { unit, model } = view;
  const { warnings } = useAreaRecords(unit);
  if (!warnings.length) return null;
  return (
    <div className="mt-8 grid max-w-3xl gap-3" role="status">
      {warnings.map((r) => {
        const w = r.payload as WarningPayload;
        const names = (w.areas ?? []).map((id) => (id === 'TZ' ? t('data:committee.warning.wholeCountry') : (model.byId.get(id)?.name ?? id)));
        return (
          <div key={r.id} className="border-l-4 py-1 pl-4" style={{ borderColor: ALERT_COLOR[w.alertLevel] }}>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="size-3 rounded-full" style={{ background: ALERT_COLOR[w.alertLevel] }} aria-hidden />
              {t('guide:banner.title', { hazard: r.hazard ? t(`guide:hazards.${r.hazard}`) : '' })}
              {w.title && <span className="font-normal text-muted-foreground">· {w.title}</span>}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(r.validTo ? 'guide:banner.detail' : 'guide:banner.detailOpen', {
                areas: names.join(', '),
                from: r.validFrom ? formatDate(r.validFrom, i18n.language) : '',
                to: r.validTo ? formatDate(r.validTo, i18n.language) : '',
                issuer: w.issuer,
              })}
              {w.bulletin && ` · ${w.bulletin}`}
              {' · '}
              <a href="#actions" className="font-medium text-primary underline-offset-4 hover:underline">
                {t('guide:banner.actions')}
              </a>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Notes on how this unit's figures were built (aggregation, shared data, reviewed edits). */
function Notices({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common', 'indicators']);
  const { unit, model } = view;
  const phone = useMediaQuery('(max-width: 639px)');
  const { printing } = useDeferred();
  const items = React.useMemo(() => {
    const out: Array<{ key: string; body: React.ReactNode }> = [];
    if (unit.level === 'national') out.push({ key: 'aggregate', body: t('notices.nationalAggregate', { count: model.councils.length }) });
    if (unit.level === 'region') out.push({ key: 'agg', body: t('notices.aggregated', { count: unit.members ?? 0 }) });
    if (unit.level === 'source') {
      const n = model.councils.filter((c) => c.sourceId === unit.id).length;
      out.push({ key: 'src', body: t('notices.sourceUnit', { count: n, total: model.sources.length }) });
    }
    if (unit.level === 'council' && unit.inheritedFrom) out.push({ key: 'inh', body: t('notices.inherited', { parent: unit.inheritedFrom }) });
    if (unit.level === 'council' && unit.sourceId) {
      const shared = model.councils.filter((c) => c.sourceId === unit.sourceId).length;
      // Stamps the council did not take from its unit: values recorded for this council itself.
      const unitEdits = (model.byId.get(unit.sourceId)?.edits ?? {}) as Record<string, unknown>;
      const own = Object.entries(unit.edits).filter(([ref, stamp]) => stamp && unitEdits[ref] !== stamp).length;
      out.push({
        key: 'shared',
        body: (
          <>
            {t('notices.shared', { count: shared })}{' '}
            <Link to={`/area/${unit.sourceId}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {unit.sourceName}
            </Link>
            {own ? t('notices.ownValues', { count: own }) : '.'}
          </>
        ),
      });
    }
    const benchmark = editList(unit, 'benchmark').filter((e) => e.ref !== 'hazard:exposure');
    if (benchmark.length) out.push({ key: 'benchmark', body: t(unit.level === 'region' ? 'notices.benchmarkMembers' : 'notices.benchmark', { count: benchmark.length }) });
    const edits = editList(unit, 'portal');
    if (edits.length) {
      const latest = edits[0];
      const [dim, key] = latest.ref.split(':');
      const name = key === 'exposure' ? t('indicators:exposure') : findIndicator(`${dim}:${key}`) ? t(`indicators:${key}`) : latest.ref;
      out.push({
        key: 'edits',
        body: (
          <>
            <span className="text-foreground">{t(unit.level === 'region' ? 'notices.editsMembers' : 'notices.edits', { count: edits.length })}</span>{' '}
            {t('notices.latestEdit', {
              indicator: name,
              authority: authorityLabel(String(latest.stamp.authority ?? '')) || t('notices.unknownAuthority'),
              date: formatDate(latest.stamp.at, i18n.language),
            })}
          </>
        ),
      });
    }
    return out;
  }, [unit, model, t, i18n.language]);

  if (!items.length) return null;
  const list = (
    <div className="grid max-w-3xl gap-3">
      {items.map((it) => (
        <Note key={it.key}>{it.body}</Note>
      ))}
    </div>
  );
  // On a phone the notes fold behind one line, so the guidance stays within the first screens (UX-01).
  if (!phone) return <div className="mt-8">{list}</div>;
  return (
    <details open={printing || undefined} className="group mt-6 max-w-3xl">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        {t('notices.title', { count: items.length })}
      </summary>
      <div className="mt-4">{list}</div>
    </details>
  );
}

/** The 0–10 risk scale as five flat class bands (widths follow the thresholds), ticked at the score. */
function ScoreScale({ value, className }: { value: number | null | undefined; className?: string }) {
  const bounds = [0, ...THRESHOLDS.risk, 10];
  return (
    <div aria-hidden className={cn('relative', className)}>
      <div className="flex h-1.5 gap-px">
        {CLASS_KEYS.map((k, i) => (
          <span key={k} className="h-full basis-0" style={{ flexGrow: bounds[i + 1] - bounds[i], background: CLASS_COLORS[k] }} />
        ))}
      </div>
      {typeof value === 'number' && (
        <span className="absolute -top-1 h-3.5 w-[3px] -translate-x-1/2 bg-foreground ring-2 ring-background" style={{ left: `${Math.max(0, Math.min(100, value * 10))}%` }} />
      )}
    </div>
  );
}

/**
 * The headline score, set as type: label, serif numeral, one line of class and date, the preparedness
 * priority that class sets (a link to "What to do"), the scale.
 */
function Score({ view, className }: { view: AreaView; className?: string }) {
  const { t } = useTranslation(['area', 'common', 'guide']);
  const { unit, model } = view;
  const cls = classify(unit.risk);
  return (
    <div className={className}>
      <div className="text-sm font-medium text-muted-foreground">{t('common:informRisk')}</div>
      <div className="mt-1 flex items-baseline">
        <span className="num font-display text-[3.5rem] leading-none font-semibold tracking-tight sm:text-[4rem]">{formatScore(unit.risk)}</span>
        <OutOf10 className="text-xl" />
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        <ClassDot value={unit.risk} className="mr-0.5" />
        <span className="font-semibold">{cls ? t(`common:classes.${cls.key}`) : t('common:classes.noData')}</span>
        <span className="text-muted-foreground">
          <span aria-hidden>· </span>
          {t('common:labels.asOf', { date: model.asOf })}
          {unit.level === 'national' && <> · {t('common:labels.aggregate')}</>}
        </span>
      </p>
      <ScoreScale value={unit.risk} className="mt-4" />
    </div>
  );
}

/** Rank, population, area and coverage: in the hero from tablets up, under "What to do" on a phone (UX-01). */
export function AreaFigures({ view, className }: { view: AreaView; className?: string }) {
  const { t, i18n } = useTranslation(['area', 'common']);
  const { unit, coverage, population, area, density, rank, model } = view;
  const lang = i18n.language;
  const peers = t(`peers.${unit.level}`);

  const above = React.useMemo(() => {
    if (unit.level !== 'national' || typeof unit.risk !== 'number') return null;
    const r = unit.risk;
    return { councils: model.councils.filter((c) => (c.risk ?? -1) > r).length, regions: model.regions.filter((c) => (c.risk ?? -1) > r).length };
  }, [unit, model]);

  const of = (n: number, total: number) => (
    <>
      {n}
      <span className="text-[0.55em] font-medium text-muted-foreground">
        {' '}
        / {total}
      </span>
    </>
  );

  const figures = [
    rank
      ? { label: t('figures.rank', { peers }), value: of(rank.rank, rank.total), sub: t('figures.rankSub', { pct: rank.percentile, peers }) }
      : above
        ? { label: t('figures.councilsAbove'), value: of(above.councils, model.councils.length), sub: t('figures.regionsAbove', { n: above.regions, total: model.regions.length }) }
        : { label: t('figures.rank', { peers }), value: NO_VALUE },
    {
      label: t('common:labels.population'),
      // Ten-million-plus totals (the nation) are shown compactly so the row never overflows.
      value: population != null && population >= 1e7 ? formatCompact(population, lang) : formatNumber(population, lang),
      sub: t('facts.census'),
    },
    {
      label: t('common:labels.area'),
      value: area ? (
        <>
          {formatNumber(Math.round(area), lang)}
          <span className="text-[0.55em] font-medium text-muted-foreground"> {t('common:units.km2')}</span>
        </>
      ) : (
        NO_VALUE
      ),
      sub: density != null ? t('figures.density', { value: formatNumber(density, lang, { maximumFractionDigits: 0 }) }) : undefined,
    },
    { label: t('common:labels.coverage'), value: `${coverage.pct}%`, sub: t('facts.coverageSub', { have: coverage.have, total: coverage.total }) },
  ];
  return <KeyFigures className={className} items={figures} />;
}

export function AreaHero({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { print } = useDeferred();
  const { unit, region } = view;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('actions.copied'));
    } catch {
      toast.error(t('actions.copyFailed'));
    }
  };

  const subtitle =
    unit.level === 'council' || unit.level === 'source' ? (
      <>
        {t(`levelOf.${unit.level}`)}{' '}
        {region ? (
          <Link to={`/area/${region.id}`} className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary">
            {t('levelOf.regionName', { region: unit.region })}
          </Link>
        ) : (
          <span className="text-foreground">{t('levelOf.regionName', { region: unit.region })}</span>
        )}
      </>
    ) : (
      t(`levelOf.${unit.level}`)
    );

  return (
    <header aria-labelledby="area-title">
      <PageContainer className="pt-6 pb-8 sm:pt-10 sm:pb-14 print:pt-2 print:pb-6">
        <Breadcrumb view={view} />
        {/*
          Title, score and actions share one grid: stacked on phones (score before the actions), and from
          md up the score takes the right column, its bottom edge level with the action row.
        */}
        <div className="mt-6 grid gap-y-6 sm:mt-10 sm:gap-y-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-12 lg:mt-12 print:mt-4 print:grid-cols-[minmax(0,1fr)_auto] print:gap-x-8">
          <div className="min-w-0 md:col-start-1 md:row-start-1 print:col-start-1 print:row-start-1">
            <Kicker>{t('eyebrow')}</Kicker>
            <h1 id="area-title" className="mt-2 text-[2.2rem] leading-[1.06] text-balance sm:mt-3 sm:text-[3.4rem] xl:text-[4rem]">
              {unit.name}
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">{subtitle}</p>
          </div>

          <Score
            view={view}
            className="max-w-xs md:col-start-2 md:row-span-2 md:row-start-1 md:w-72 md:self-end md:border-l md:border-border md:pl-10 lg:pl-12 print:col-start-2 print:row-start-1 print:w-60 print:max-w-none print:self-end print:border-l print:border-border print:pl-8"
          />

          {/* On a phone the secondary actions keep their icon only, so the row stays one line (UX-01). */}
          <div className="no-print flex flex-wrap items-center gap-2 md:col-start-1 md:row-start-2">
            <Button variant="outline" onClick={print}>
              <Printer /> {t('actions.print')}
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/area/${unit.id}/card?lang=sw`}>
                <FileText /> {t('actions.card')}
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to={`/area/${unit.id}/card/detailed?lang=sw`} aria-label={t('actions.cardDetailed')}>
                <FileText /> <span className="hidden sm:inline">{t('actions.cardDetailed')}</span>
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => void copyLink()} aria-label={t('actions.copy')}>
              <Link2 /> <span className="hidden sm:inline">{t('actions.copy')}</span>
            </Button>
            <Button variant="ghost" asChild>
              <Link to={explorerHref(unit)} aria-label={t('actions.explore')}>
                <Compass /> <span className="hidden sm:inline">{t('actions.explore')}</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to={compareHref(unit)} aria-label={t('actions.compare')}>
                <GitCompareArrows /> <span className="hidden sm:inline">{t('actions.compare')}</span>
              </Link>
            </Button>
          </div>
        </div>

        <AreaFigures view={view} className="mt-12 hidden border-t border-border pt-8 sm:grid md:flex [&_dd:first-of-type]:text-[1.65rem] lg:[&_dd:first-of-type]:text-[2.1rem] print:mt-6 print:flex" />

        <ActiveWarningBanner view={view} />
        <Notices view={view} />
      </PageContainer>
    </header>
  );
}
