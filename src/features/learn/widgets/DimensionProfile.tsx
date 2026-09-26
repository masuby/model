/**
 * Shared body for the Vulnerability (lesson 3) and Lack of Coping Capacity (lesson 4) widgets:
 * a council's dimension score on its own class scale, its categories and indicators, and where the
 * data come from.
 */
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { ScoreBar } from '@/components/risk/DimensionBars';
import { useModel } from '@/data-layer/DataProvider';
import { DIMENSION_BY_KEY } from '@/engine/risk/hierarchy';
import { topDrivers } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { formatScore } from '@/lib/utils';
import { IndicatorBar } from '../components/WidgetKit';
import { dataOrigin } from '../decisions';

export function DimensionProfile({ unit, dim, reference }: { unit: Unit; dim: 'vulnerability' | 'coping'; reference?: Unit }) {
  const { t } = useTranslation(['learn', 'common', 'indicators']);
  const model = useModel();
  const def = DIMENSION_BY_KEY[dim];
  const d = unit.dims[dim];
  const top = topDrivers(unit, 1, dim)[0];
  const origin = dataOrigin(unit, model.councils);
  const national = reference ?? model.national;

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background/50 p-4 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <div className="text-xs font-medium text-muted-foreground">{t(`common:dimensions.${dim}`)}</div>
          <div className="mt-1 flex items-center gap-3">
            <span className="num font-display text-4xl font-extrabold tracking-tight">{formatScore(d.score)}</span>
            <ClassBadge value={d.score} scale={def.scale} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <ScoreBar label={unit.name} value={d.score} dim={dim} reference={national.dims[dim].score} referenceLabel={t('learn:widget.national')} />
          <p className="mt-2 text-xs text-muted-foreground">{t('learn:widget.nationalMarker', { value: formatScore(national.dims[dim].score) })}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {def.categories.map((cat) => {
          const c = d.categories[cat.key];
          return (
            <div key={cat.key} className="rounded-2xl border border-border p-3">
              <div className="mb-2 flex items-baseline justify-between px-2">
                <h4 className="text-sm font-bold">{t(`common:categories.${cat.key}`)}</h4>
                <span className="num text-xs text-muted-foreground">
                  {t('common:labels.score')} <span className="font-display text-sm font-bold text-foreground">{formatScore(c?.score)}</span>
                </span>
              </div>
              <div className="grid gap-1">
                {cat.indicators.map((ind) => (
                  <IndicatorBar
                    key={ind.key}
                    label={t(`indicators:${ind.key}`)}
                    value={c?.indicators[ind.key]}
                    highlight={top?.key === ind.key}
                    reference={national.dims[dim].categories[cat.key]?.indicators[ind.key]}
                    referenceLabel={t('learn:widget.national')}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
        {top && (
          <p className="rounded-xl bg-primary/5 px-3 py-2 text-foreground">
            {t('learn:widget.topDriver', { indicator: t(`indicators:${top.key}`), value: formatScore(top.value) })}
          </p>
        )}
        <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {origin === 'inherited'
              ? t('common:labels.inherited', { parent: unit.inheritedFrom ?? '' })
              : origin === 'shared'
                ? t('learn:widget.sharedSource', { source: unit.sourceName ?? '' })
                : t('learn:widget.ownSource', { source: unit.sourceName ?? unit.name })}
          </span>
        </p>
      </div>
    </div>
  );
}
