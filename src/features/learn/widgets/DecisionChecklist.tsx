import { ArrowRight, Check, CircleCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
import { CouncilPicker, QuickPicks, useCouncil, WidgetFrame } from '../components/WidgetKit';
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="num font-display text-2xl font-extrabold">{formatScore(unit.risk)}</span>
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
      <div className="flex flex-wrap gap-1.5">
        {drivers.map((d) => (
          <span key={`${d.dim}-${d.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
            {t(`indicators:${d.key}`)}
            <span className="num font-bold">{formatScore(d.value)}</span>
          </span>
        ))}
      </div>
    ),
    data: (
      <ul className="grid gap-1 text-sm">
        <li>
          {t('widgets.decisionChecklist.coverage', { pct: coverage })}{' '}
          <span className={cn('ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold', level === 'good' ? 'bg-success/12 text-success' : level === 'fair' ? 'bg-warning/12 text-warning' : 'bg-danger/12 text-danger')}>
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
      <div className="flex flex-wrap gap-2">
        <Link to={`/area/${unit.id}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary">
          {t('widgets.decisionChecklist.openProfile')} <ArrowRight className="size-3" aria-hidden />
        </Link>
        <Link to="/severity" className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary">
          {t('common:nav.severity')} <ArrowRight className="size-3" aria-hidden />
        </Link>
        <Link to="/data" className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary">
          {t('common:nav.data')} <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
    ),
  };

  return (
    <WidgetFrame title={t('widgets.decisionChecklist.title')} description={t('widgets.decisionChecklist.lead')} footer={t('widgets.decisionChecklist.footer')}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <CouncilPicker className="sm:w-72" value={unit.id} onChange={setId} label={t('widget.pickCouncil')} />
        <QuickPicks names={QUICK} value={unit.id} onPick={setId} label={t('widget.try')} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Progress value={(done.length / STEPS.length) * 100} className="h-2 flex-1" indicatorClassName="bg-success" />
        <span className="num text-xs font-semibold text-muted-foreground">{t('widgets.decisionChecklist.progress', { done: done.length, total: STEPS.length })}</span>
      </div>

      <ol className="grid gap-3">
        {STEPS.map((s, i) => {
          const on = done.includes(s);
          const id = `dc-${s}`;
          return (
            <li key={s} className={cn('rounded-2xl border p-4 transition-colors', on ? 'border-success/40 bg-success/[0.06]' : 'border-border bg-background/50')}>
              <div className="flex items-start gap-3">
                <Checkbox.Root
                  id={id}
                  checked={on}
                  onCheckedChange={(v) => toggle(s, v === true)}
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border-2 border-input bg-card transition-colors data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Checkbox.Indicator>
                    <Check className="size-4" strokeWidth={3} aria-hidden />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className="min-w-0 flex-1">
                  <label htmlFor={id} className="flex cursor-pointer items-baseline gap-2 text-sm font-bold">
                    <span className="num text-muted-foreground">{i + 1}.</span>
                    {t(`widgets.decisionChecklist.steps.${s}.title`)}
                  </label>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(`widgets.decisionChecklist.steps.${s}.hint`)}</p>
                  <div className="mt-3">{findings[s]}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <AnimatePresence>
        {done.length === STEPS.length && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-sm" role="status">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <p>{t('widgets.decisionChecklist.complete', { name: unit.name })}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </WidgetFrame>
  );
}
