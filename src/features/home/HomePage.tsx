import { ArrowRight, BookOpen, Compass, Database, FileText, Gauge, LineChart, MapPinned, ShieldAlert, Users } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { ScoreGauge } from '@/components/risk/ScoreGauge';
import { PageContainer, SectionHeading, Stat } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { CLASS_COLORS, CLASS_KEYS, classify, type ClassKey } from '@/engine/risk/classes';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { parseMetric } from '@/engine/risk/metrics';
import { topDrivers } from '@/engine/risk/model';
import { usedSpecs } from '@/engine/risk/standardise';
import { formatCompact, formatScore } from '@/lib/utils';

const RiskMap = React.lazy(() => import('@/components/map/RiskMap'));

const MODULES = [
  { to: '/explore', key: 'explore', icon: Compass, tint: 'from-sky-500/15 to-blue-500/5 text-sky-600 dark:text-sky-400' },
  { to: '/insights', key: 'insights', icon: LineChart, tint: 'from-violet-500/15 to-indigo-500/5 text-violet-600 dark:text-violet-400' },
  { to: '/severity', key: 'severity', icon: Gauge, tint: 'from-rose-500/15 to-orange-500/5 text-rose-600 dark:text-rose-400' },
  { to: '/learn', key: 'learn', icon: BookOpen, tint: 'from-emerald-500/15 to-green-500/5 text-emerald-600 dark:text-emerald-400' },
  { to: '/methodology', key: 'methodology', icon: FileText, tint: 'from-amber-500/15 to-yellow-500/5 text-amber-600 dark:text-amber-400' },
  { to: '/data', key: 'data', icon: Database, tint: 'from-cyan-500/15 to-teal-500/5 text-cyan-600 dark:text-cyan-400' },
] as const;

const SOURCES = ['NBS · 2022 Census', 'CHIRPS v3', 'ERA5', 'USGS', 'TDHS-MIS 2022', 'HBS 2017/18', 'IPC / MUCHALI', 'UNHCR', 'INFORM SADC 2024'];

const fade = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.5 } };

export default function HomePage() {
  const { t, i18n } = useTranslation(['home', 'common', 'indicators']);
  const model = useModel();
  const navigate = useNavigate();
  const riskMetric = React.useMemo(() => parseMetric('risk'), []);

  const counts = React.useMemo(() => {
    const c = Object.fromEntries(CLASS_KEYS.map((k) => [k, 0])) as Record<ClassKey, number>;
    for (const u of model.councils) {
      const k = classify(u.risk)?.key;
      if (k) c[k]++;
    }
    return c;
  }, [model]);
  const highOrAbove = counts.high + counts.veryHigh;
  const population = model.councils.reduce((s, c) => s + (c.exposure?.population ?? 0), 0);
  const top = React.useMemo(() => [...model.councils].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0)).slice(0, 8), [model]);
  const groups = new Set(usedSpecs().map((s) => s.component)).size;

  return (
    <div>
      {/* ------------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 size-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
        <PageContainer className="relative grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-xs backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {t('eyebrow')}
            </div>
            <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold text-balance sm:text-5xl xl:text-6xl">{t('title')}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('lead')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/explore">
                  <MapPinned /> {t('ctaExplore')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/learn">
                  {t('ctaLearn')} <ArrowRight />
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-6">
              <div>
                <dt className="text-xs text-muted-foreground">{t('kpi.councils')}</dt>
                <dd className="num font-display text-2xl font-extrabold">{model.councils.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('kpi.regions')}</dt>
                <dd className="num font-display text-2xl font-extrabold">{model.regions.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('kpi.population')}</dt>
                <dd className="num font-display text-2xl font-extrabold">{formatCompact(population, i18n.language)}</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
            <div className="relative aspect-[1/1.02] overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-lift)]">
              <React.Suspense fallback={<Skeleton className="size-full rounded-none" />}>
                <RiskMap model={model} level="council" metric={riskMetric} className="size-full" showZoom={false} fitPadding={24} onSelect={(u) => navigate(`/area/${u.id}`)} />
              </React.Suspense>
              <div className="glass absolute top-4 left-4 z-[450] flex items-center gap-4 rounded-2xl p-3 pr-4 shadow-lg">
                <ScoreGauge value={model.national.risk} size={112} />
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{t('nationalRisk')}</div>
                  <ClassBadge value={model.national.risk} className="mt-1.5" />
                  <div className="mt-1.5 max-w-36 text-[11px] leading-snug text-muted-foreground">{t('nationalNote')}</div>
                </div>
              </div>
              <div className="glass absolute right-4 bottom-4 z-[450] rounded-xl px-3 py-2 text-xs font-medium shadow-lg">
                <div className="mb-1.5 text-muted-foreground">{t('mapCaption')}</div>
                <div className="flex gap-1">
                  {CLASS_KEYS.map((k) => (
                    <span key={k} className="h-2 w-7 rounded-full first:rounded-l-full" style={{ background: CLASS_COLORS[k] }} title={t(`common:classes.${k}`)} />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{t('common:classes.veryLow')}</span>
                  <span>{t('common:classes.veryHigh')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ KPIs */}
      <PageContainer className="relative z-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t('kpi.councils')} value={model.councils.length} sub={`${model.regions.length} ${t('kpi.regions').toLowerCase()}`} icon={<MapPinned />} />
          <Stat label={t('kpi.indicators')} value={ALL_INDICATORS.length} sub={t('kpi.indicatorsSub', { used: usedSpecs().length, groups })} icon={<LineChart />} />
          <Stat label={t('kpi.population')} value={formatCompact(population, i18n.language)} sub={t('kpi.populationSub')} icon={<Users />} />
          <Stat label={t('kpi.highRisk')} value={highOrAbove} sub={t('kpi.highRiskSub', { pct: Math.round((highOrAbove / model.councils.length) * 100) })} icon={<ShieldAlert />} />
        </div>
      </PageContainer>

      {/* ------------------------------------------------------------------ Formula */}
      <PageContainer className="py-20">
        <motion.div {...fade}>
          <SectionHeading eyebrow={t('formula.eyebrow')} title={t('formula.title')} description={t('formula.lead')} />
        </motion.div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.1fr] lg:items-stretch">
          {(['hazard', 'vulnerability', 'coping'] as const).map((d, i) => (
            <React.Fragment key={d}>
              <motion.div {...fade} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{['H', 'V', 'LCC'][i]}</span>
                      <ClassBadge value={model.national.dims[d].score} scale={d} showScore size="sm" />
                    </div>
                    <CardTitle className="mt-2 text-lg">{t(`common:dimensions.${d}`)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-muted-foreground">{t(`common:dimensions.${d}Desc`)}</CardContent>
                </Card>
              </motion.div>
              {i < 2 && <div className="hidden items-center justify-center font-display text-3xl font-bold text-muted-foreground/50 lg:flex" aria-hidden>×</div>}
            </React.Fragment>
          ))}
          <div className="hidden items-center justify-center font-display text-3xl font-bold text-muted-foreground/50 lg:flex" aria-hidden>=</div>
          <motion.div {...fade} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="relative h-full overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <span className="text-xs font-semibold tracking-wider text-primary uppercase">{t('formula.national')}</span>
                <CardTitle className="text-lg">{t('common:informRisk')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ScoreGauge value={model.national.risk} size={170} />
                <ClassBadge value={model.national.risk} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-4 text-center font-mono text-sm text-muted-foreground">{t('formula.equation')}</p>
      </PageContainer>

      {/* ------------------------------------------------------------------ Top councils */}
      <section className="border-y border-border bg-card/40 py-20">
        <PageContainer>
          <SectionHeading
            eyebrow={t('top.eyebrow')}
            title={t('top.title')}
            description={t('top.lead')}
            actions={
              <Button variant="outline" asChild>
                <Link to="/explore?view=table">
                  {t('top.all')} <ArrowRight />
                </Link>
              </Button>
            }
          />
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card>
              <ol className="divide-y divide-border">
                {top.map((u, i) => {
                  const driver = topDrivers(u, 1, 'hazard')[0];
                  return (
                    <li key={u.id}>
                      <Link to={`/area/${u.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/60">
                        <span className="num w-6 text-sm font-bold text-muted-foreground">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold group-hover:text-primary">{u.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {u.region}
                            {driver && ` · ${t('top.drivers')}: ${t(`indicators:${driver.key}`)}`}
                          </div>
                        </div>
                        <div className="hidden w-40 sm:block">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${((u.risk ?? 0) / 10) * 100}%`, background: classify(u.risk)?.color }} />
                          </div>
                        </div>
                        <span className="num w-10 text-right font-display text-lg font-bold">{formatScore(u.risk)}</span>
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('top.distribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-5 overflow-hidden rounded-full">
                  {CLASS_KEYS.map((k) =>
                    counts[k] ? <div key={k} style={{ width: `${(counts[k] / model.councils.length) * 100}%`, background: CLASS_COLORS[k] }} title={`${t(`common:classes.${k}`)}: ${counts[k]}`} /> : null,
                  )}
                </div>
                <ul className="mt-6 grid gap-3">
                  {[...CLASS_KEYS].reverse().map((k) => (
                    <li key={k} className="flex items-center gap-3">
                      <span className="size-3 rounded-[4px]" style={{ background: CLASS_COLORS[k] }} />
                      <span className="flex-1 text-sm">{t(`common:classes.${k}`)}</span>
                      <span className="num text-sm font-semibold">{counts[k]}</span>
                      <span className="num w-12 text-right text-xs text-muted-foreground">{Math.round((counts[k] / model.councils.length) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ Modules */}
      <PageContainer className="py-20">
        <SectionHeading eyebrow={t('modules.eyebrow')} title={t('modules.title')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <motion.div key={m.to} {...fade} transition={{ duration: 0.45, delay: i * 0.05 }}>
              <Link to={m.to} className="group block h-full">
                <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
                  <CardContent className="p-6 sm:p-6">
                    <div className={`inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${m.tint}`}>
                      <m.icon className="size-5" />
                    </div>
                    <h3 className="mt-4 flex items-center gap-2 text-lg font-bold">
                      {t(`common:nav.${m.key}`)}
                      <ArrowRight className="size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(`modules.${m.key}`)}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageContainer>

      {/* ------------------------------------------------------------------ Sources */}
      <PageContainer>
        <div className="rounded-3xl border border-border bg-card/60 px-6 py-8 text-center">
          <h3 className="text-lg font-bold">{t('sources.title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('sources.lead')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SOURCES.map((s) => (
              <span key={s} className="rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      </PageContainer>

      {/* ------------------------------------------------------------------ CTA */}
      <PageContainer className="pt-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-6 py-14 text-white sm:px-12">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-tz-gold/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-extrabold text-balance sm:text-4xl">{t('cta.title')}</h2>
            <p className="mt-4 text-lg text-white/80">{t('cta.lead')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-brand-900 hover:bg-white/90" asChild>
                <Link to="/explore">
                  {t('cta.primary')} <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10" asChild>
                <Link to="/methodology">{t('cta.secondary')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
