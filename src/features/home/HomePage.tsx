/**
 * Home — editorial landing page (docs/DESIGN_LANGUAGE.md): serif headline, key figures separated by
 * rules, a lightweight SVG map, and ruled sections instead of card grids. No decorative motion.
 */
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { KeyFigures, PageContainer, Section, SectionHeading } from '@/components/layout/Page';
import { ClassBadge, ClassDot } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import { CLASS_COLORS, CLASS_KEYS, classify, type ClassKey } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import { topDrivers } from '@/engine/risk/model';
import { formatCompact, formatScore } from '@/lib/utils';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));

const MODULES = [
  { to: '/explore', key: 'explore' },
  { to: '/insights', key: 'insights' },
  { to: '/severity', key: 'severity' },
  { to: '/learn', key: 'learn' },
  { to: '/methodology', key: 'methodology' },
  { to: '/data', key: 'data' },
] as const;

const SOURCES = ['NBS 2022 Population and Housing Census', 'CHIRPS v3 rainfall', 'ERA5 climate reanalysis', 'USGS earthquake catalogue', 'TDHS-MIS 2022', 'Household Budget Survey 2017/18', 'IPC / MUCHALI', 'UNHCR', 'INFORM Sub-national SADC 2024'];

const DIMS = ['hazard', 'vulnerability', 'coping'] as const;

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
  const top = React.useMemo(() => [...model.councils].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0)).slice(0, 10), [model]);
  const national = model.national;

  return (
    <div>
      {/* ---------------------------------------------------------------------------------- Hero */}
      <PageContainer className="grid items-center gap-12 pt-12 pb-16 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-16 lg:pt-20 lg:pb-20">
        <div>
          <h1 className="max-w-2xl text-[2.6rem] leading-[1.05] text-balance sm:text-[3.4rem] lg:text-[3.8rem]">{t('title')}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('lead')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/explore">
                {t('ctaExplore')} <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/methodology">{t('cta.secondary')}</Link>
            </Button>
          </div>

          <KeyFigures
            className="mt-14 border-t border-border pt-8"
            items={[
              {
                label: t('figures.national'),
                value: (
                  <span className="flex items-baseline gap-3">
                    {formatScore(national.risk)}
                    <ClassBadge value={national.risk} size="sm" className="-translate-y-[3px]" />
                  </span>
                ),
              },
              { label: t('figures.councils'), value: model.councils.length },
              { label: t('figures.people'), value: formatCompact(population, i18n.language) },
              { label: t('figures.high'), value: highOrAbove, sub: t('kpi.highRiskSub', { pct: Math.round((highOrAbove / model.councils.length) * 100) }) },
            ]}
          />
        </div>

        <figure className="w-full">
          <div className="aspect-[1000/966] w-full">
            <React.Suspense fallback={<div className="size-full rounded-md bg-muted/60" />}>
              <StaticMap model={model} metric={riskMetric} className="size-full" onSelect={(u) => navigate(`/area/${u.id}`)} />
            </React.Suspense>
          </div>
          <figcaption className="mt-4 flex flex-col gap-3 border-t border-border pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{t('mapSource')}</span>
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap" aria-label={t('mapCaption')}>
              <span>{t('common:classes.veryLow')}</span>
              {CLASS_KEYS.map((k) => (
                <span key={k} className="h-2 w-5" style={{ background: CLASS_COLORS[k] }} title={t(`common:classes.${k}`)} />
              ))}
              <span>{t('common:classes.veryHigh')}</span>
            </span>
          </figcaption>
        </figure>
      </PageContainer>

      {/* ---------------------------------------------------------------------- How the index works */}
      <PageContainer>
        <Section>
          <SectionHeading title={t('formula.title')} description={t('formula.lead')} />
          <div className="grid gap-y-8 md:grid-cols-3 md:divide-x md:divide-border">
            {DIMS.map((d, i) => (
              <div key={d} className={i === 0 ? 'md:pr-8' : i === 1 ? 'md:px-8' : 'md:pl-8'}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold">{t(`common:dimensions.${d}`)}</h3>
                  <span className="num flex items-center gap-2 text-sm">
                    <ClassDot value={national.dims[d].score} scale={d} />
                    <span className="font-semibold">{formatScore(national.dims[d].score)}</span>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`common:dimensions.${d}Desc`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 border-t border-border pt-6 font-display text-xl text-balance sm:text-2xl">
            {t('formula.result', {
              h: formatScore(national.dims.hazard.score),
              v: formatScore(national.dims.vulnerability.score),
              c: formatScore(national.dims.coping.score),
              r: formatScore(national.risk),
            })}
            <span className="ml-3 align-middle">
              <ClassBadge value={national.risk} size="sm" />
            </span>
          </p>
        </Section>

        {/* -------------------------------------------------------------------- Highest-risk councils */}
        <Section>
          <SectionHeading
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
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
            <ol className="divide-y divide-border border-y border-border">
              {top.map((u, i) => {
                const driver = topDrivers(u, 1, 'hazard')[0];
                return (
                  <li key={u.id}>
                    <Link to={`/area/${u.id}`} className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 py-3.5 sm:grid-cols-[2rem_1fr_9rem_3rem]">
                      <span className="num text-sm text-muted-foreground">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary group-hover:underline group-hover:underline-offset-4">{u.name}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {u.region}
                          {driver && ` · ${t('top.drivers')}: ${t(`indicators:${driver.key}`)}`}
                        </span>
                      </span>
                      <span className="hidden h-1.5 bg-muted sm:block">
                        <span className="block h-full" style={{ width: `${((u.risk ?? 0) / 10) * 100}%`, background: classify(u.risk)?.color }} />
                      </span>
                      <span className="num text-right font-semibold">{formatScore(u.risk)}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>

            <div>
              <h3 className="text-base font-semibold">{t('top.distribution')}</h3>
              <div className="mt-5 flex h-3 overflow-hidden">
                {CLASS_KEYS.map((k) =>
                  counts[k] ? <div key={k} style={{ width: `${(counts[k] / model.councils.length) * 100}%`, background: CLASS_COLORS[k] }} title={`${t(`common:classes.${k}`)}: ${counts[k]}`} /> : null,
                )}
              </div>
              <table className="mt-5 w-full text-sm">
                <tbody className="divide-y divide-border">
                  {[...CLASS_KEYS].reverse().map((k) => (
                    <tr key={k}>
                      <td className="py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className="size-2.5" style={{ background: CLASS_COLORS[k] }} aria-hidden />
                          {t(`common:classes.${k}`)}
                        </span>
                      </td>
                      <td className="num py-2.5 text-right font-medium">{counts[k]}</td>
                      <td className="num w-14 py-2.5 text-right text-muted-foreground">{Math.round((counts[k] / model.councils.length) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* --------------------------------------------------------------------------- Modules */}
        <Section>
          <SectionHeading title={t('modules.title')} />
          <ul className="grid border-t border-border md:grid-cols-2 md:gap-x-12">
            {MODULES.map((m) => (
              <li key={m.to} className="border-b border-border">
                <Link to={m.to} className="group flex items-start justify-between gap-6 py-5">
                  <span>
                    <span className="block text-base font-semibold group-hover:text-primary">{t(`common:nav.${m.key}`)}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{t(`modules.${m.key}`)}</span>
                  </span>
                  <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* ---------------------------------------------------------------------------- Sources */}
        <Section>
          <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:gap-12">
            <div>
              <h2 className="text-[1.6rem] leading-tight">{t('sources.title')}</h2>
              <p className="mt-3 text-muted-foreground">{t('sources.lead')}</p>
            </div>
            <ul className="columns-1 gap-12 text-sm sm:columns-2">
              {SOURCES.map((s) => (
                <li key={s} className="break-inside-avoid border-b border-border py-2.5">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* -------------------------------------------------------------------------------- Close */}
        <Section className="pb-4">
          <div className="grid items-end gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-[1.8rem] leading-tight text-balance sm:text-[2.3rem]">{t('cta.title')}</h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t('cta.lead')}</p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button size="lg" asChild>
                <Link to="/explore">
                  {t('cta.primary')} <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/learn">{t('ctaLearn')}</Link>
              </Button>
            </div>
          </div>
        </Section>
      </PageContainer>
    </div>
  );
}
