import { ArrowRight, Check } from 'lucide-react';
import { Checkbox } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DimensionBars } from '@/components/risk/DimensionBars';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Progress } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { classify } from '@/engine/risk/classes';
import { DIMENSION_BY_KEY } from '@/engine/risk/hierarchy';
import { dataCoverage, topDrivers } from '@/engine/risk/model';
import { cn, formatScore } from '@/lib/utils';
import { CouncilPicker, Finding, QuickPicks, useCouncil, WidgetFrame } from '../components/WidgetKit';
import { coverageLevel, dataOrigin, driverCategory, driverDimension } from '../decisions';

const QUICK = ['Hanang District', 'Kibiti District', 'Kasulu District', 'Kinondoni Municipal'] as const;
const STEPS = ['risk', 'driver', 'indicators', 'data', 'action', 'next'] as const;
type Step = (typeof STEPS)[number];

/** Lesson 7 — a decision brief for any council: six checks, auto-filled from the live model. */
export default function DecisionChecklist() {
  const { t } = useTranslation(['learn', 'common', 'indicators']);
  const model = useModel();
  const [unit, setId] = useCouncil(QUICK[0]);
  const [ticked, setTicked] = React.useState<{ id: string; steps: Step[] }>({ id: unit.id, steps: [] });
  const done = ticked.id === unit.id ? ticked.steps : [];
  const toggle = (s: Step, on: boolean) => setTicked({ id: unit.id, steps: on ? [...new Set([...done, s])] : done.filter((x) => x !== s) });

  const rank = React.useMemo(() => [...model.councils].sort((a, b) => (b.risk ?? -1) - (a.risk ?? -1)).findIndex((c) => c.id === unit.id) + 1, [model, unit]);
  const driver = driverDimension(unit);
  const driverCls = driver ? classify(unit.dims[driver].score, DIMENSION_BY_KEY[driver].scale) : null;
  const cat = driver ? driverCategory(unit, driver) : null;
  const drivers = topDrivers(unit, 3);
  const coverage = dataCoverage(unit);
  const level = coverageLevel(coverage);
  const origin = dataOrigin(unit, model.councils);

  const findings: Record<Step, React.ReactNode> = {
    risk: (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="num font-display text-2xl font-semibold">{formatScore(unit.risk)}</span>
        <ClassBadge value={unit.risk} />
        <span className="text-xs text-muted-foreground">{t('widgets.decisionChecklist.rank', { rank, n: model.councils.length })}</span>
      </div>
    ),
    driver: (
      <div>
        <p className="mb-3 text-sm">
          {driver && driverCls
            ? t('widgets.decisionChecklist.driverIs', { dim: t(`common:dimensions.${driver}`), cls: t(`common:classes.${driverCls.key}`) })
            : t('common:classes.noData')}
        </p>
        <DimensionBars unit={unit} compare={model.national} compact />
      </div>
    ),
    indicators: (
      <ul className="divide-y divide-border border-y border-border text-sm">
        {drivers.map((d) => (
          <li key={`${d.dim}-${d.key}`} className="flex items-baseline justify-between gap-3 py-1.5">
            <span>{t(`indicators:${d.key}`)}</span>
            <span className="num font-semibold">{formatScore(d.value)}</span>
          </li>
        ))}
      </ul>
    ),
    data: (
      <ul className="grid gap-1 text-sm">
        <li>
          {t('widgets.decisionChecklist.coverage', { pct: coverage })}{' '}
          <span className={cn('ml-1 font-semibold', level === 'good' ? 'text-success' : level === 'fair' ? 'text-warning' : 'text-danger')}>
            {t(`widgets.decisionChecklist.coverageLevel.${level}`)}
          </span>
        </li>
        <li className="text-muted-foreground">
          {origin === 'inherited'
            ? t('common:labels.inherited', { parent: unit.inheritedFrom ?? '' })
            : origin === 'shared'
              ? t('widget.sharedSource', { source: unit.sourceName ?? '' })
              : t('widget.ownSource', { source: unit.sourceName ?? unit.name })}
        </li>
        <li className="text-muted-foreground">{t('widgets.decisionChecklist.resolution')}</li>
      </ul>
    ),
    action: (
      <p className="text-sm leading-relaxed">
        {cat ? (
          <>
            <span className="font-semibold">{t(`common:categories.${cat}`)}:</span> {t(`widgets.decisionChecklist.actions.${cat}`)}
          </>
        ) : (
          t('common:classes.noData')
        )}
      </p>
    ),
    next: (
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {[
          { to: `/area/${unit.id}`, label: t('widgets.decisionChecklist.openProfile') },
          { to: '/severity', label: t('common:nav.severity') },
          { to: '/data', label: t('common:nav.data') },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="group inline-flex items-center gap-1 font-medium text-primary hover:underline hover:underline-offset-4">
            {l.label} <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    ),
  };

  return (
    <WidgetFrame title={t('widgets.decisionChecklist.title')} description={t('widgets.decisionChecklist.lead')} footer={t('widgets.decisionChecklist.footer')}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <CouncilPicker className="sm:w-72" value={unit.id} onChange={setId} label={t('widget.pickCouncil')} />
        <QuickPicks names={QUICK} value={unit.id} onPick={setId} label={t('widget.try')} />
      </div>

      <div className="mb-2 flex items-center gap-4">
        <Progress
          value={(done.length / STEPS.length) * 100}
          label={t('widgets.decisionChecklist.progress', { done: done.length, total: STEPS.length })}
          className="h-1 flex-1 rounded-none"
          indicatorClassName={cn('rounded-none', done.length === STEPS.length ? 'bg-success' : 'bg-foreground/70')}
        />
        <span className="num text-sm text-muted-foreground">{t('widgets.decisionChecklist.progress', { done: done.length, total: STEPS.length })}</span>
      </div>

      <ol className="divide-y divide-border border-b border-border">
        {STEPS.map((s, i) => {
          const on = done.includes(s);
          const id = `dc-${s}`;
          return (
            <li key={s} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 py-5">
              <Checkbox.Root
                id={id}
                checked={on}
                onCheckedChange={(v) => toggle(s, v === true)}
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-input bg-card transition-colors duration-150 data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Checkbox.Indicator>
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <div className="min-w-0">
                <label htmlFor={id} className="flex cursor-pointer items-baseline gap-2 font-semibold">
                  <span className="num text-sm font-normal text-muted-foreground">{i + 1}.</span>
                  <span>{t(`widgets.decisionChecklist.steps.${s}.title`)}</span>
                </label>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t(`widgets.decisionChecklist.steps.${s}.hint`)}</p>
                <div className="mt-3">{findings[s]}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <div role="status" aria-live="polite">
        {done.length === STEPS.length && (
          <Finding tone="success" className="mt-5">
            {t('widgets.decisionChecklist.complete', { name: unit.name })}
          </Finding>
        )}
      </div>
    </WidgetFrame>
  );
}
