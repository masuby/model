import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS, DIMENSION_TEXT } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { DIMENSIONS } from '@/engine/risk/hierarchy';
import { rampColor } from '@/engine/risk/metrics';
import { formatScore } from '@/lib/utils';
import type { AreaView } from '../lib';
import { CompareTrack, DeltaChip, DIM_SHORT, NoDataPill, Reveal, type TrackRef } from './bits';

/** The unit's own numbers in the INFORM equation: ∛(H × V × LCC) = Risk. */
function Equation({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit } = view;
  const term = (d: (typeof DIMENSIONS)[number]) => (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: DIMENSION_TEXT[d.key] }}>
        {DIM_SHORT[d.key]}
      </span>
      <span className="num font-display text-lg font-extrabold text-foreground">{formatScore(unit.dims[d.key].score)}</span>
    </span>
  );
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-dashed border-border bg-card/60 px-5 py-4 text-muted-foreground">
      <span className="text-sm font-medium">{t('common:informRisk')}</span>
      <span className="font-display text-lg">=</span>
      <span className="font-display text-xl">∛(</span>
      {term(DIMENSIONS[0])}
      <span className="font-display text-lg">×</span>
      {term(DIMENSIONS[1])}
      <span className="font-display text-lg">×</span>
      {term(DIMENSIONS[2])}
      <span className="font-display text-xl">)</span>
      <span className="font-display text-lg">=</span>
      <span className="num font-display text-2xl font-extrabold text-foreground">{formatScore(unit.risk)}</span>
      <ClassBadge value={unit.risk} size="sm" />
      {unit.level === 'national' && <span className="w-full text-center text-xs sm:w-auto">{t('dims.nationalNote')}</span>}
    </div>
  );
}

export function Dimensions({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit, region, national } = view;
  const isNational = unit.level === 'national';

  return (
    <>
      <Reveal>
        <Equation view={view} />
      </Reveal>
      <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
        {DIMENSIONS.map((def, i) => {
          const dim = unit.dims[def.key];
          const cls = classify(dim.score, def.scale);
          const refs: TrackRef[] = [];
          if (region) refs.push({ kind: 'region', label: region.name, value: region.dims[def.key].score });
          if (!isNational) refs.push({ kind: 'national', label: t('breadcrumb.country'), value: national.dims[def.key].score });
          return (
            <Reveal key={def.key} delay={i * 0.07} className="h-full print:break-inside-avoid">
              <Card className="relative flex h-full flex-col overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: DIMENSION_COLORS[def.key] }} />
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: DIMENSION_TEXT[def.key] }}>
                      {DIM_SHORT[def.key]}
                    </span>
                    <ClassBadge value={dim.score} scale={def.scale} size="sm" />
                  </div>
                  <CardTitle className="mt-2 text-lg">{t(`common:dimensions.${def.key}`)}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="num font-display text-5xl leading-none font-extrabold tracking-tight">{formatScore(dim.score)}</span>
                    <span className="text-sm font-medium text-muted-foreground">/ 10</span>
                  </div>
                  {!isNational && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {region && <DeltaChip value={dim.score} reference={region.dims[def.key].score} label={region.name} />}
                      <DeltaChip value={dim.score} reference={national.dims[def.key].score} label={t('breadcrumb.country')} />
                    </div>
                  )}
                  <CompareTrack className="mt-5" value={dim.score} color={cls?.color ?? NO_DATA_COLOR} refs={refs} />

                  <div className="mt-6 border-t border-border pt-4">
                    <div className="mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t('dims.categories')}</div>
                    <ul className="grid gap-3.5">
                      {def.categories.map((cat) => {
                        const v = dim.categories[cat.key]?.score ?? null;
                        const nat = isNational ? null : (national.dims[def.key].categories[cat.key]?.score ?? null);
                        return (
                          <li key={cat.key}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                              <span className="font-medium">{t(`common:categories.${cat.key}`)}</span>
                              {v == null ? <NoDataPill /> : <span className="num font-display font-bold">{formatScore(v)}</span>}
                            </div>
                            <CompareTrack
                              size="sm"
                              value={v}
                              color={rampColor(v)}
                              refs={nat != null ? [{ kind: 'national', label: t('breadcrumb.country'), value: nat }] : []}
                              showLegend={false}
                            />
                          </li>
                        );
                      })}
                    </ul>
                    {!isNational && <p className="mt-3 text-[11px] text-muted-foreground">{t('dims.tickNote')}</p>}
                  </div>
                  <div className="mt-auto pt-6">
                    <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">{t(`common:dimensions.${def.key}Desc`)}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{t('dims.scaleNote')}</p>
    </>
  );
}
