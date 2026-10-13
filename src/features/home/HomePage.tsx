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
import { Segmented } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { CLASS_COLORS, CLASS_KEYS, classify } from '@/engine/risk/classes';
import { parseMetric, type Metric } from '@/engine/risk/metrics';
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
  // The map's level: councils (the headline level), regions, or the country as one piece in its own class.
  const [level, setLevel] = React.useState<'national' | 'region' | 'council'>('council');
  const nationalMetric = React.useMemo<Metric>(() => ({ ...riskMetric, get: () => model.national.risk }), [riskMetric, model]);
  const nationalClass = classify(model.national.risk);

  const top = React.useMemo(() => [...model.councils].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0)).slice(0, 10), [model]);
  const national = model.national;

  return (
    <div>
      {/* ---------------------------------------------------------------------------------- Hero */}
      {/* The charts take the room: the map sits a little to the right, into the page margin, and the columns stay closer. */}
      <PageContainer className="grid items-start gap-10 pt-6 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-10 lg:pt-5 lg:pb-12 xl:gap-12">
        <div>
          <h1 className="max-w-2xl text-[2.2rem] leading-[1.05] text-balance sm:text-[2.6rem] lg:text-[2.75rem]">{t('title')}</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground lg:text-[1.05rem]">{t('lead')}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/explore">
                {t('ctaExplore')} <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/methodology">{t('cta.secondary')}</Link>
            </Button>
          </div>

          <NationalCharts model={model} className="mt-5 border-t border-border pt-4" />
        </div>

        {/* The map bleeds into the page margin: the padding (2rem) plus what the viewport leaves beside the 1320 px container, up to 3.25rem, never past the edge. */}
        <figure className="w-full lg:-mr-[var(--bleed)] lg:w-[calc(100%+var(--bleed))] lg:self-center" style={{ ['--bleed' as string]: 'clamp(2rem, calc(2rem + (100vw - 1320px) / 2 - 4px), 3.25rem)' }}>
          {/* The level switch stands in the middle above the map; in national mode the score and class sit at the right (under the switch on phones). */}
          <div className="relative mb-3 flex flex-col items-center gap-2 sm:block">
            <div className="flex justify-center">
              <Segmented
                size="sm"
                value={level}
                onValueChange={(v) => setLevel(v as typeof level)}
                aria-label={t('mapLevel.label')}
                options={[
                  { value: 'national', label: t('mapLevel.national') },
                  { value: 'region', label: t('mapLevel.region') },
                  { value: 'council', label: t('mapLevel.council') },
                ]}
              />
            </div>
            {level === 'national' && nationalClass && (
              <span className="num inline-flex items-center gap-1.5 text-sm sm:absolute sm:top-1/2 sm:right-0 sm:-translate-y-1/2">
                <ClassDot value={model.national.risk} />
                <span className="font-semibold">{formatScore(model.national.risk)}</span>
                <span className="text-muted-foreground">{t(`common:classes.${nationalClass.key}`)}</span>
              </span>
            )}
          </div>
          <div className="aspect-[1000/966] w-full">
            <React.Suspense fallback={<div className="size-full rounded-md bg-muted/60" />}>
              <StaticMap
                key={level}
                model={model}
                level={level === 'council' ? 'council' : 'region'}
                metric={level === 'national' ? nationalMetric : riskMetric}
                hoverCard={level !== 'national'}
                className="size-full"
                aria-label={t(`mapLevel.aria.${level}`)}
                onSelect={(u) => navigate(level === 'national' ? '/area/TZ' : `/area/${u.id}`)}
              />
            </React.Suspense>
          </div>
          <figcaption className="mt-4 flex flex-col gap-3 border-t border-border pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{t(`mapLevel.source.${level}`)}</span>
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
          <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-6 font-display text-xl sm:text-2xl">
            <span className="sm:whitespace-nowrap">
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
