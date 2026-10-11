/**
 * Home - editorial landing page (docs/DESIGN_LANGUAGE.md): serif headline, a lightweight SVG map, the
 * national risk picture as charts in the scales' colours, and ruled sections instead of card grids. No
 * decorative motion.
 */
import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import workbookSources from '@/data/inform-workbook-sources.json';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer, Section, SectionHeading } from '@/components/layout/Page';
import { ClassBadge, ClassDot } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import { CLASS_COLORS, CLASS_KEYS, classify } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import { topDrivers } from '@/engine/risk/model';
import { formatScore } from '@/lib/utils';
import { NationalCharts } from './components/NationalCharts';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));

/** The publishers behind the Core, as the INFORM SADC 2024 workbook records them, most-used first; then the census that gives population and facilities. */
const SOURCES = (() => {
  const count = new Map<string, number>();
  for (const c of Object.values((workbookSources as { components: Record<string, { sources: string[] }> }).components)) for (const s of c.sources) count.set(s, (count.get(s) ?? 0) + 1);
  return [...[...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([s]) => s), 'NBS 2022 Population and Housing Census (population, facilities)'];
})();

const DIMS = ['hazard', 'vulnerability', 'coping'] as const;

export default function HomePage() {
  const { t } = useTranslation(['home', 'common', 'indicators']);
  const model = useModel();
  const navigate = useNavigate();
  const riskMetric = React.useMemo(() => parseMetric('risk'), []);

  const top = React.useMemo(() => [...model.councils].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0)).slice(0, 10), [model]);
  const national = model.national;

  return (
    <div>
      {/* ---------------------------------------------------------------------------------- Hero */}
      <PageContainer className="grid items-center gap-12 pt-12 pb-16 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-16 lg:pt-20 lg:pb-20">
        <div>
          <h1 className="max-w-2xl text-[2.6rem] leading-[1.05] text-balance sm:text-[3.4rem] lg:text-[3.8rem]">{t('title')}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('lead', { councils: model.councils.length, regions: model.regions.length })}</p>
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

      {/* ------------------------------------------------------------------ The national risk picture */}
      <PageContainer>
        <Section>
          <SectionHeading title={t('picture.title')} description={t('picture.lead')} />
          <NationalCharts model={model} />
        </Section>

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
          <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-6 font-display text-xl sm:text-2xl">
            <span className="whitespace-nowrap">
              {t('formula.result', {
                h: formatScore(national.dims.hazard.score),
                v: formatScore(national.dims.vulnerability.score),
                c: formatScore(national.dims.coping.score),
                r: formatScore(national.risk),
              })}
            </span>
            <ClassBadge value={national.risk} size="sm" />
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
          <div>
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

          </div>
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

      </PageContainer>
    </div>
  );
}
