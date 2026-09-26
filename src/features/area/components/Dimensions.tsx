/**
 * The three INFORM dimensions: the unit's own equation as a display line, then the dimensions as three
 * columns separated by vertical rules on wide screens (rows separated by hairlines below lg, each split
 * into summary and categories on tablets). No cards, no coloured strips: colour appears only on data —
 * class badges, tracks, and the dimension letters that tie each column back to the equation.
 */
import { useTranslation } from 'react-i18next';
import { DIMENSION_TEXT } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { DIMENSIONS } from '@/engine/risk/hierarchy';
import { rampColor } from '@/engine/risk/metrics';
import { cn, formatScore } from '@/lib/utils';
import type { AreaView } from '../lib';
import { CompareTrack, DeltaChip, DIM_SHORT, NoDataPill, OutOf10, type TrackRef } from './bits';

/** The unit's own numbers in the INFORM equation: ∛(H × V × LCC) = Risk. */
function Equation({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit } = view;
  const term = (d: (typeof DIMENSIONS)[number]) => (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-sm font-semibold" style={{ color: DIMENSION_TEXT[d.key] }}>
        {DIM_SHORT[d.key]}
      </span>
      <span className="num font-semibold text-foreground">{formatScore(unit.dims[d.key].score)}</span>
    </span>
  );
  const op = (s: string) => <span className="font-display text-muted-foreground">{s}</span>;
  // The label takes its own line on phones and the ∛(…) product never breaks, so the formula can
  // only wrap before "= score".
  return (
    <div className="mb-12 flex flex-wrap items-center gap-x-2.5 gap-y-2 border-y border-border py-5 text-xl sm:gap-x-3 sm:text-2xl">
      <span className="w-full text-base text-muted-foreground sm:w-auto">{t('common:informRisk')}</span>
      <span className="inline-flex items-center gap-x-2.5 whitespace-nowrap sm:gap-x-3">
        {op('=')}
        {op('∛(')}
        {term(DIMENSIONS[0])}
        {op('×')}
        {term(DIMENSIONS[1])}
        {op('×')}
        {term(DIMENSIONS[2])}
        {op(')')}
      </span>
      <span className="inline-flex items-center gap-x-2.5 whitespace-nowrap sm:gap-x-3">
        {op('=')}
        <span className="num font-semibold text-foreground">{formatScore(unit.risk)}</span>
        <ClassBadge value={unit.risk} size="sm" />
      </span>
      {unit.level === 'national' && <span className="w-full text-sm text-muted-foreground sm:ml-auto sm:w-auto">{t('dims.nationalNote')}</span>}
    </div>
  );
}

export function Dimensions({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit, region, national } = view;
  const isNational = unit.level === 'national';

  return (
    <>
      <Equation view={view} />
      {/* From lg the three columns share their rows (subgrid), so headings, scores, category lists and
          descriptions line up across the dimensions whatever their text lengths. */}
      <div className="grid divide-y divide-border lg:grid-cols-3 lg:grid-rows-[auto_auto_auto] lg:divide-x lg:divide-y-0 print:grid-cols-3 print:grid-rows-[auto_auto_auto] print:divide-x print:divide-y-0">
        {DIMENSIONS.map((def, i) => {
          const dim = unit.dims[def.key];
          const cls = classify(dim.score, def.scale);
          const refs: TrackRef[] = [];
          if (region) refs.push({ kind: 'region', label: region.name, value: region.dims[def.key].score });
          if (!isNational) refs.push({ kind: 'national', label: t('breadcrumb.country'), value: national.dims[def.key].score });
          return (
            <article
              key={def.key}
              aria-labelledby={`dim-${def.key}`}
              className={cn(
                // Phones: one column. Tablets: summary | categories. lg+: three aligned columns.
                'grid content-start gap-y-8 py-10 first:pt-0 last:pb-0 md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-x-12 lg:row-span-3 lg:grid-cols-1 lg:grid-rows-subgrid lg:py-0 print:row-span-3 print:grid-cols-1 print:grid-rows-subgrid print:py-0 print:break-inside-avoid',
                i === 0 ? 'lg:pr-10 print:pr-6' : i === 1 ? 'lg:px-10 print:px-6' : 'lg:pl-10 print:pl-6',
              )}
            >
              <div className="md:col-start-1 md:row-start-1">
                {/* Two lines reserved from lg up so the scores line up across the columns. */}
                <h3 id={`dim-${def.key}`} className="text-lg leading-snug font-semibold text-balance lg:min-h-[3.1rem]">
                  <span className="mr-2 text-sm" style={{ color: DIMENSION_TEXT[def.key] }}>
                    {DIM_SHORT[def.key]}
                  </span>
                  {t(`common:dimensions.${def.key}`)}
                </h3>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <span className="num text-5xl leading-none font-semibold tracking-tight">
                    {formatScore(dim.score)}
                    <OutOf10 className="text-sm tracking-normal" />
                  </span>
                  <ClassBadge value={dim.score} scale={def.scale} size="sm" className="self-center" />
                </div>
                {!isNational && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {region && <DeltaChip value={dim.score} reference={region.dims[def.key].score} label={region.name} />}
                    <DeltaChip value={dim.score} reference={national.dims[def.key].score} label={t('breadcrumb.country')} />
                  </div>
                )}
                <CompareTrack className="mt-5" value={dim.score} color={cls?.color ?? NO_DATA_COLOR} refs={refs} />
              </div>

              <div className="md:col-start-2 md:row-span-2 md:row-start-1 lg:col-start-1 lg:row-span-1 lg:row-start-2 print:col-start-1 print:row-start-2">
                <div className="text-sm font-medium text-muted-foreground">{t('dims.categories')}</div>
                <ul className="mt-3 divide-y divide-border border-t border-border">
                  {def.categories.map((cat) => {
                    const v = dim.categories[cat.key]?.score ?? null;
                    const nat = isNational ? null : (national.dims[def.key].categories[cat.key]?.score ?? null);
                    return (
                      <li key={cat.key} className="py-3">
                        <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
                          <span>{t(`common:categories.${cat.key}`)}</span>
                          {v == null ? <NoDataPill /> : <span className="num font-semibold">{formatScore(v)}</span>}
                        </div>
                        <CompareTrack size="sm" value={v} color={rampColor(v)} refs={nat != null ? [{ kind: 'national', label: t('breadcrumb.country'), value: nat }] : []} showLegend={false} />
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground md:col-start-1 md:row-start-2 lg:row-start-3 print:row-start-3">{t(`common:dimensions.${def.key}Desc`)}</p>
            </article>
          );
        })}
      </div>
      <p className="mt-12 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t('dims.scaleNote')}
        {!isNational && (
          <>
            {' '}
            {t(region ? 'dims.arrowsRegion' : 'dims.arrowsNation')} {t('dims.tickNote')}
          </>
        )}
      </p>
    </>
  );
}
