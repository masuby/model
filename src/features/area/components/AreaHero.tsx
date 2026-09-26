import { Building2, ChevronRight, Compass, Database, Flag, GitCompareArrows, Info, Landmark, Layers, Link2, Map as MapIcon, PencilLine, Printer, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/Page';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { ScoreGauge } from '@/components/risk/ScoreGauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/primitives';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { findIndicator } from '@/engine/risk/hierarchy';
import { authorityLabel } from '@/engine/risk/sources';
import type { Level } from '@/engine/risk/types';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { compareHref, editList, explorerHref, type AreaView } from '../lib';

const LEVEL_ICON: Record<Level, React.ComponentType<{ className?: string }>> = {
  council: Building2,
  region: MapIcon,
  source: Database,
  national: Flag,
};

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
    <nav aria-label={t('breadcrumb.label')}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.to && !last ? (
                <Link to={c.to} className="rounded-md font-medium transition-colors hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn(last && 'font-semibold text-foreground')}>
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

function Fact({ label, value, sub, children }: { label: string; value?: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        {value != null && <div className="num font-display text-xl font-extrabold tracking-tight sm:text-2xl">{value}</div>}
        {children}
        {sub && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>}
      </dd>
    </div>
  );
}

function Notice({ icon: Icon, tone = 'default', children }: { icon: React.ComponentType<{ className?: string }>; tone?: 'default' | 'primary'; children: React.ReactNode }) {
  return (
    <li className={cn('flex items-start gap-2.5 rounded-xl border px-3 py-2 text-sm leading-snug', tone === 'primary' ? 'border-primary/25 bg-primary/5' : 'border-border bg-card/70')}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', tone === 'primary' ? 'text-primary' : 'text-muted-foreground')} />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function Notices({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common', 'indicators']);
  const { unit, model } = view;
  const edits = editList(unit);
  const items: React.ReactNode[] = [];

  if (unit.level === 'national') items.push(<Notice key="official" icon={Landmark}>{t('notices.official')}</Notice>);
  if (unit.level === 'region') items.push(<Notice key="agg" icon={Layers}>{t('notices.aggregated', { count: unit.members ?? 0 })}</Notice>);
  if (unit.level === 'source') {
    const n = model.councils.filter((c) => c.sourceId === unit.id).length;
    items.push(<Notice key="src" icon={Database}>{t('notices.sourceUnit', { count: n, total: model.sources.length })}</Notice>);
  }
  if (unit.level === 'council' && unit.inheritedFrom) {
    items.push(<Notice key="inh" icon={Info}>{t('notices.inherited', { parent: unit.inheritedFrom })}</Notice>);
  }
  if (unit.level === 'council' && unit.sourceId) {
    const shared = model.councils.filter((c) => c.sourceId === unit.sourceId).length;
    items.push(
      <Notice key="shared" icon={Link2}>
        {t('notices.shared', { count: shared })}{' '}
        <Link to={`/area/${unit.sourceId}`} className="font-semibold text-primary underline-offset-4 hover:underline">
          {unit.sourceName}
        </Link>
      </Notice>,
    );
  }
  if (edits.length) {
    const latest = edits[0];
    const [dim, key] = latest.ref.split(':');
    const name = key === 'exposure' ? t('indicators:exposure') : findIndicator(`${dim}:${key}`) ? t(`indicators:${key}`) : latest.ref;
    items.push(
      <Notice key="edits" icon={PencilLine} tone="primary">
        {t(unit.level === 'region' ? 'notices.editsMembers' : 'notices.edits', { count: edits.length })}{' '}
        <span className="text-muted-foreground">
          {t('notices.latestEdit', {
            indicator: name,
            authority: authorityLabel(String(latest.stamp.authority ?? '')) || t('notices.unknownAuthority'),
            date: formatDate(latest.stamp.at, i18n.language),
          })}
        </span>
      </Notice>,
    );
  }
  if (!items.length) return null;
  return <ul className="mt-6 grid gap-2">{items}</ul>;
}

function ScorePanel({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit, rank, model } = view;
  const cls = classify(unit.risk);
  const peers = t(`peers.${unit.level}`);
  const above = React.useMemo(() => {
    if (unit.level !== 'national' || typeof unit.risk !== 'number') return null;
    const r = unit.risk;
    return { councils: model.councils.filter((c) => (c.risk ?? -1) > r).length, regions: model.regions.filter((c) => (c.risk ?? -1) > r).length };
  }, [unit, model]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-lift)] lg:w-[380px] print:w-[320px] print:shadow-none">
      <div className="pointer-events-none absolute inset-x-8 -top-28 h-48 rounded-full opacity-25 blur-3xl print:hidden" style={{ background: cls?.color ?? NO_DATA_COLOR }} />
      <div className="relative flex flex-col items-center px-6 pt-6 pb-6 text-center">
        <div className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t('common:informRisk')}</div>
        <ScoreGauge value={unit.risk} size={220} className="mt-4" label={t('hero.outOf10')} />
        <ClassBadge value={unit.risk} size="lg" className="mt-4" />

        {rank ? (
          <>
            <dl className="mt-6 grid w-full grid-cols-2 divide-x divide-border border-t border-border pt-5">
              <div className="px-2">
                <dt className="sr-only">{t('common:labels.rank')}</dt>
                <dd className="num font-display text-3xl font-extrabold tracking-tight">
                  {rank.rank}
                  <span className="text-base font-bold text-muted-foreground">/{rank.total}</span>
                </dd>
                <dd className="mt-1 text-[11px] leading-snug text-muted-foreground">{t('hero.rankLabel', { peers })}</dd>
              </div>
              <div className="px-2">
                <dt className="sr-only">{t('hero.percentile')}</dt>
                <dd className="num font-display text-3xl font-extrabold tracking-tight">{rank.percentile}%</dd>
                <dd className="mt-1 text-[11px] leading-snug text-muted-foreground">{t('hero.percentileLabel', { peers })}</dd>
              </div>
            </dl>
            <div className="mt-5 w-full" aria-hidden>
              <div className="relative h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-primary/30 to-primary" style={{ width: `${rank.percentile}%` }} />
                <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow" style={{ left: `${rank.percentile}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>{t('hero.lowerRisk')}</span>
                <span>{t('hero.higherRisk')}</span>
              </div>
            </div>
          </>
        ) : above ? (
          <dl className="mt-6 grid w-full grid-cols-2 divide-x divide-border border-t border-border pt-5">
            <div className="flex flex-col-reverse px-2">
              <dt className="mt-1 text-[11px] leading-snug text-muted-foreground">{t('hero.councilsAbove')}</dt>
              <dd className="num font-display text-3xl font-extrabold tracking-tight">
                {above.councils}
                <span className="text-base font-bold text-muted-foreground">/{model.councils.length}</span>
              </dd>
            </div>
            <div className="flex flex-col-reverse px-2">
              <dt className="mt-1 text-[11px] leading-snug text-muted-foreground">{t('hero.regionsAbove')}</dt>
              <dd className="num font-display text-3xl font-extrabold tracking-tight">
                {above.regions}
                <span className="text-base font-bold text-muted-foreground">/{model.regions.length}</span>
              </dd>
            </div>
          </dl>
        ) : null}
        <p className="mt-5 text-[11px] text-muted-foreground">
          {t('common:labels.asOf', { date: model.asOf })}
          {unit.level === 'national' && <> · {t('common:labels.official')}</>}
        </p>
      </div>
    </div>
  );
}

export function AreaHero({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common']);
  const { unit, region, coverage, population, area, density } = view;
  const lang = i18n.language;
  const cls = classify(unit.risk);
  const LevelIcon = LEVEL_ICON[unit.level];

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
          <Link to={`/area/${region.id}`} className="font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary">
            {t('levelOf.regionName', { region: unit.region })}
          </Link>
        ) : (
          <span className="font-semibold text-foreground">{t('levelOf.regionName', { region: unit.region })}</span>
        )}
      </>
    ) : (
      t(`levelOf.${unit.level}`)
    );

  return (
    <section className="relative overflow-hidden border-b border-border bg-card/40 print:border-none print:bg-transparent" aria-labelledby="area-title">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_25%,transparent_70%)] print:hidden" />
      <div className="pointer-events-none absolute -top-40 -right-32 size-[520px] rounded-full opacity-[0.14] blur-3xl print:hidden" style={{ background: cls?.color ?? NO_DATA_COLOR }} />
      <div className="pointer-events-none absolute -bottom-52 -left-40 size-[440px] rounded-full bg-primary/10 blur-3xl print:hidden" />

      <PageContainer className="relative py-8 sm:py-12 print:py-2">
        <Breadcrumb view={view} />
        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto] print:grid-cols-[minmax(0,1fr)_auto] print:gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="area-reveal min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="px-3 py-1">
                <LevelIcon className="size-3.5" />
                {t(`common:levels.${unit.level}`)}
              </Badge>
              <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t('eyebrow')}</span>
            </div>
            <h1 id="area-title" className="mt-4 text-4xl leading-[1.05] font-extrabold text-balance sm:text-5xl xl:text-6xl">
              {unit.name}
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">{subtitle}</p>

            <div className="no-print mt-6 flex flex-wrap gap-2">
              <Button onClick={() => window.print()}>
                <Printer /> {t('actions.print')}
              </Button>
              <Button variant="outline" onClick={() => void copyLink()}>
                <Share2 /> {t('actions.copy')}
              </Button>
              <Button variant="outline" asChild>
                <Link to={explorerHref(unit)}>
                  <Compass /> {t('actions.explore')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={compareHref(unit)}>
                  <GitCompareArrows /> {t('actions.compare')}
                </Link>
              </Button>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 sm:grid-cols-4">
              <Fact label={t('common:labels.population')} value={formatNumber(population, lang)} sub={t('facts.census')} />
              <Fact label={t('common:labels.area')} value={area ? `${formatNumber(Math.round(area), lang)}` : '—'} sub={t('common:units.km2')} />
              <Fact label={t('common:labels.density')} value={formatNumber(density, lang, { maximumFractionDigits: 0 })} sub={t('facts.perKm2')} />
              <Fact label={t('common:labels.coverage')} sub={t('facts.coverageSub', { have: coverage.have, total: coverage.total })}>
                <div className="num font-display text-xl font-extrabold tracking-tight sm:text-2xl">{coverage.pct}%</div>
                <Progress value={coverage.pct} className="mt-1.5 h-1.5" indicatorClassName={coverage.pct >= 85 ? 'bg-success' : coverage.pct >= 60 ? 'bg-warning' : 'bg-danger'} />
              </Fact>
            </dl>

            <Notices view={view} />
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.1 }} className="area-reveal">
            <ScorePanel view={view} />
          </motion.div>
        </div>
      </PageContainer>
    </section>
  );
}
