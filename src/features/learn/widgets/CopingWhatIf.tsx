import { ArrowDown, ArrowRight, ArrowUp, Check, Minus, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { DIMENSION_BY_KEY, indicatorRef } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { applyEdits, indicatorValue } from '@/engine/risk/model';
import { sourceFor, sourceLabel } from '@/engine/risk/sources';
import type { EditRef, EditStamp, Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { CouncilPicker, Finding, LabeledSlider, QuickPicks, useCouncil, WidgetFrame } from '../components/WidgetKit';
import { DimensionProfile } from './DimensionProfile';

const QUICK = ['Rufiji District', 'Longido District', 'Kasulu District', 'Hanang District'] as const;
const COPING_KEYS = DIMENSION_BY_KEY.coping.categories.flatMap((c) => c.indicators.map((i) => i.key));

/** Lesson 4 — a council's lack of coping capacity, and a what-if: improve one indicator and recompute. */
export default function CopingWhatIf() {
  const { t } = useTranslation(['learn', 'common', 'indicators']);
  const model = useModel();
  const [unit, setId] = useCouncil(QUICK[0]);
  const [key, setKey] = React.useState('drrImplementation');
  const [edit, setEdit] = React.useState<{ ref: string; value: number } | null>(null);

  const original = indicatorValue(unit, 'coping', key);
  const ref = `${unit.id}:${key}`;
  const target = edit?.ref === ref ? edit.value : original;

  // Best (lowest "lack of") value among all councils — a realistic target.
  const best = React.useMemo(() => {
    let b: { v: number; u: Unit } | null = null;
    for (const u of model.councils) {
      const v = indicatorValue(u, 'coping', key);
      if (isNum(v) && (!b || v < b.v)) b = { v, u };
    }
    return b;
  }, [model, key]);

  // Run the real engine path used by Data Entry: set the indicator, recompute category → dimension → risk.
  const after = React.useMemo(() => {
    if (!isNum(target) || target === original) return unit;
    const clone: Unit = { ...unit, dims: structuredClone(unit.dims), edits: {} };
    const edits: Partial<Record<EditRef, EditStamp>> = {};
    edits[indicatorRef('coping', key)] = { value: target, at: new Date(0).toISOString() };
    applyEdits(clone, edits);
    return clone;
  }, [unit, key, target, original]);

  const changed = after !== unit;
  const dRisk = isNum(after.risk) && isNum(unit.risk) ? Math.round((after.risk - unit.risk) * 10) / 10 : 0;

  return (
    <WidgetFrame
      title={t('widgets.copingWhatIf.title')}
      description={t('widgets.copingWhatIf.lead')}
      kind="engine"
      footer={
        <>
          <span className="font-medium text-foreground/80">{t('common:labels.source')}:</span> {sourceLabel(sourceFor('coping', key))}. {t('widgets.copingWhatIf.footer')}
        </>
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <CouncilPicker className="sm:w-72" value={unit.id} onChange={setId} label={t('widget.pickCouncil')} />
        <QuickPicks names={QUICK} value={unit.id} onPick={setId} label={t('widget.try')} />
      </div>

      <DimensionProfile unit={unit} dim="coping" />

      {unit.drr && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <span className="text-muted-foreground">{t('widgets.copingWhatIf.drrRecords')}</span>
          {(['eprp', 'aa', 'eocc'] as const).map((k) => (
            <span key={k} className={cn('inline-flex items-center gap-1 font-medium', unit.drr![k] ? 'text-success' : 'text-muted-foreground')}>
              {unit.drr![k] ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
              {t(`widgets.copingWhatIf.drr.${k}`)}
              <span className="sr-only">: {unit.drr![k] ? t('common:labels.yes') : t('common:labels.no')}</span>
            </span>
          ))}
        </div>
      )}

      {/* What-if */}
      <div className="mt-8 border-t border-border pt-6">
        <h4 className="text-base font-semibold">{t('widgets.copingWhatIf.whatIf')}</h4>
        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,15rem)_1fr] md:items-end md:gap-8">
          <div>
            <span className="mb-1.5 block text-sm text-muted-foreground">{t('widgets.copingWhatIf.indicator')}</span>
            <Select value={key} onValueChange={setKey} aria-label={t('widgets.copingWhatIf.indicator')}>
              {COPING_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(`indicators:${k}`)}
                </SelectItem>
              ))}
            </Select>
          </div>
          {isNum(target) ? (
            <LabeledSlider
              label={t('widgets.copingWhatIf.slider', { indicator: t(`indicators:${key}`) })}
              value={target}
              onChange={(v) => setEdit({ ref, value: Math.round(v * 10) / 10 })}
              valueText={formatScore(target)}
              color={DIMENSION_COLORS.coping}
              hint={
                changed ? (
                  <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setEdit(null)}>
                    {t('common:actions.reset')}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t('widgets.copingWhatIf.noData')}</p>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t('widgets.copingWhatIf.direction')}</p>
        {best && isNum(target) && (
          <Button variant="outline" size="sm" className="mt-3 h-auto min-h-8 py-1.5 whitespace-normal text-left" onClick={() => setEdit({ ref, value: best.v })}>
            {t('widgets.copingWhatIf.matchBest', { value: formatScore(best.v), council: best.u.name })}
          </Button>
        )}

        <div className="mt-6 grid gap-y-5 border-y border-border py-5 sm:grid-cols-2 sm:divide-x sm:divide-border" aria-live="polite">
          <Compare label={t('common:dimensions.coping')} before={unit.dims.coping.score} after={after.dims.coping.score} scale="coping" className="sm:pr-6" />
          <Compare label={t('common:informRisk')} before={unit.risk} after={after.risk} scale="risk" className="sm:pl-6" />
        </div>
        {changed && (
          <Finding tone={dRisk < 0 ? 'success' : 'neutral'} className="mt-5">
            {dRisk < 0
              ? t('widgets.copingWhatIf.lower', { delta: formatScore(-dRisk) })
              : dRisk > 0
                ? t('widgets.copingWhatIf.higher', { delta: formatScore(dRisk) })
                : t('widgets.copingWhatIf.noChange')}
          </Finding>
        )}
      </div>
    </WidgetFrame>
  );
}

function Compare({ label, before, after, scale, className }: { label: string; before: number | null; after: number | null; scale: 'coping' | 'risk'; className?: string }) {
  const { t } = useTranslation('learn');
  const d = isNum(before) && isNum(after) ? Math.round((after - before) * 10) / 10 : 0;
  const Icon = d < 0 ? ArrowDown : d > 0 ? ArrowUp : Minus;
  return (
    <div className={className}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
        <span className="num text-xl text-muted-foreground">{formatScore(before)}</span>
        <ArrowRight className="size-4 self-center text-muted-foreground" aria-label={t('widgets.copingWhatIf.becomes')} />
        <span className="num font-display text-3xl font-semibold tracking-tight">{formatScore(after)}</span>
        <span className={cn('inline-flex items-center gap-0.5 self-center text-xs font-semibold', d < 0 ? 'text-success' : d > 0 ? 'text-danger' : 'text-muted-foreground')}>
          <Icon className="size-3.5" aria-hidden />
          {formatScore(Math.abs(d))}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <ClassBadge value={before} scale={scale} size="sm" />
        <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
        <ClassBadge value={after} scale={scale} size="sm" />
      </div>
    </div>
  );
}
