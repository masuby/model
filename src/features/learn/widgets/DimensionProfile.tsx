/**
 * Shared body for the Vulnerability (lesson 3) and Lack of Coping Capacity (lesson 4) widgets:
 * a council's dimension score on its own class scale, its categories and indicators, and where the
 * data come from. Laid out with rules — no nested boxes.
 */
import { useTranslation } from 'react-i18next';
import { ScoreBar } from '@/components/risk/DimensionBars';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { useModel } from '@/data-layer/DataProvider';
import { DIMENSION_BY_KEY } from '@/engine/risk/hierarchy';
import { topDrivers } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
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
      <div className="grid gap-5 border-y border-border py-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8">
        <div>
          <div className="text-sm text-muted-foreground">{t(`common:dimensions.${dim}`)}</div>
          <div className="mt-1 flex items-center gap-3">
            <span className="num font-display text-4xl font-semibold tracking-tight">{formatScore(d.score)}</span>
            <ClassBadge value={d.score} scale={def.scale} />
          </div>
        </div>
        <div className="min-w-0">
          <ScoreBar label={unit.name} value={d.score} dim={dim} reference={national.dims[dim].score} referenceLabel={t('learn:widget.national')} />
          <p className="mt-2 text-xs text-muted-foreground">{t('learn:widget.nationalMarker', { value: formatScore(national.dims[dim].score) })}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-y-6 md:grid-cols-2 md:divide-x md:divide-border">
        {def.categories.map((cat, i) => {
          const c = d.categories[cat.key];
          return (
            <div key={cat.key} className={cn(i === 0 ? 'md:pr-6' : 'md:pl-6')}>
              <div className="mb-1 flex items-baseline justify-between gap-3 border-b border-border pb-2">
                <h4 className="text-sm font-semibold">{t(`common:categories.${cat.key}`)}</h4>
                <span className="num text-xs text-muted-foreground">
                  {t('common:labels.score')} <span className="text-sm font-semibold text-foreground">{formatScore(c?.score)}</span>
                </span>
              </div>
              <div>
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

      <div className="mt-6 grid gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        {top && <p className="font-medium text-foreground">{t('learn:widget.topDriver', { indicator: t(`indicators:${top.key}`), value: formatScore(top.value) })}</p>}
        <p>
          {origin === 'inherited'
            ? t('common:labels.inherited', { parent: unit.inheritedFrom ?? '' })
            : origin === 'shared'
              ? t('learn:widget.sharedSource', { source: unit.sourceName ?? '' })
              : t('learn:widget.ownSource', { source: unit.sourceName ?? unit.name })}
        </p>
      </div>
    </div>
  );
}
