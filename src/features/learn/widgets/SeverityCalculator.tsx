import { ShieldQuestion } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Segmented } from '@/components/ui/primitives';
import { SEVERITY_CATEGORY_KEYS, SEVERITY_COLORS, SEVERITY_WEIGHTS, type SeverityDimensionKey } from '@/engine/severity/definitions';
import { computeSeverity } from '@/engine/severity/engine';
import { SEVERITY_SCENARIOS, type SeverityScenario } from '@/engine/severity/scenarios';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { Fact, LabeledSlider, WidgetFrame } from '../components/WidgetKit';
import { logSliderToValue, scaleScenario, valueToLogSlider } from '../sim';

const MIN_AFFECTED = 1_000;
const STEPS = 1000;
const DIMS: SeverityDimensionKey[] = ['impact', 'conditions', 'complexity'];

const textOn = (level: number | null) => ((level ?? 0) >= 4 ? '#ffffff' : '#1f2937');

/** Lesson 6 — run the real INFORM Severity engine on an illustrative scenario with one slider. */
export default function SeverityCalculator() {
  const { t, i18n } = useTranslation(['learn', 'common']);
  const [scenarioId, setScenarioId] = React.useState<SeverityScenario['id']>('riverineFlood');
  const scenario = SEVERITY_SCENARIOS.find((s) => s.id === scenarioId) ?? SEVERITY_SCENARIOS[0];
  const max = Math.max(MIN_AFFECTED * 10, scenario.input.peopleInArea ?? MIN_AFFECTED * 10);
  const [affectedBy, setAffectedBy] = React.useState<Record<string, number>>({});
  const affected = affectedBy[scenarioId] ?? scenario.input.peopleAffected ?? MIN_AFFECTED;

  const input = React.useMemo(() => scaleScenario(scenario.input, affected), [scenario, affected]);
  const r = React.useMemo(() => computeSeverity(input), [input]);
  const catKey = r.category;
  const w = SEVERITY_WEIGHTS;

  return (
    <WidgetFrame
      title={t('widgets.severityCalculator.title')}
      description={t('widgets.severityCalculator.lead')}
      kind="illustrative"
      footer={t('widgets.severityCalculator.footer')}
    >
      <Segmented
        value={scenarioId}
        onValueChange={setScenarioId}
        aria-label={t('widgets.severityCalculator.scenario')}
        className="flex w-full flex-wrap sm:inline-flex sm:w-auto"
        options={SEVERITY_SCENARIOS.map((s) => ({ value: s.id, label: t(`widgets.severityCalculator.scenarios.${s.id}.name`) }))}
      />
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t(`widgets.severityCalculator.scenarios.${scenarioId}.desc`, { people: formatNumber(scenario.input.peopleInArea, i18n.language) })}
      </p>

      <LabeledSlider
        className="mt-5"
        label={t('widgets.severityCalculator.slider')}
        value={valueToLogSlider(affected, MIN_AFFECTED, max, STEPS)}
        min={0}
        max={STEPS}
        step={1}
        onChange={(s) => setAffectedBy((m) => ({ ...m, [scenarioId]: logSliderToValue(s, MIN_AFFECTED, max, STEPS) }))}
        valueText={formatNumber(affected, i18n.language)}
        accentClassName="bg-red-500"
        thumbClassName="border-red-500"
      />
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span className="num">{formatNumber(MIN_AFFECTED, i18n.language)}</span>
        <span className="num">{formatNumber(max, i18n.language)}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Fact label={t('widgets.severityCalculator.displaced')} value={formatNumber(r.indicators.displaced?.raw, i18n.language, { notation: 'compact' })} />
        <Fact label={t('widgets.severityCalculator.deaths')} value={formatNumber(r.indicators.fatalities?.raw, i18n.language, { notation: 'compact' })} />
        <Fact label={t('widgets.severityCalculator.inNeed')} value={formatNumber(r.indicators.peopleInNeed?.raw, i18n.language, { notation: 'compact' })} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,14rem)_1fr] md:items-center" aria-live="polite">
        {/* Headline */}
        <div className="flex flex-col items-center rounded-3xl border border-border bg-background/60 p-5 text-center">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t('widgets.severityCalculator.severity')}</div>
          <motion.div key={formatScore(r.severity)} initial={{ scale: 0.92, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="num mt-1 font-display text-5xl font-extrabold tracking-tight">
            {formatScore(r.severity)}
          </motion.div>
          <div className="text-xs text-muted-foreground">{t('widgets.severityCalculator.outOf5')}</div>
          {catKey && (
            <span className="mt-3 rounded-full px-3 py-1 text-xs font-bold" style={{ background: r.color ?? undefined, color: textOn(r.level) }}>
              {t('widgets.severityCalculator.category', { level: r.level, label: t(`common:classes.${catKey}`) })}
            </span>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldQuestion className="size-3.5" aria-hidden />
            {t('widgets.severityCalculator.reliability', { label: t(`common:classes.${r.reliability.key}`), pct: r.reliability.completeness })}
          </span>
        </div>

        {/* Dimensions */}
        <div>
          <div className="grid gap-3">
            {DIMS.map((d) => {
              const v = r.dimensions[d].score;
              return (
                <div key={d}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium">
                      {t(`widgets.severityCalculator.dims.${d}`)}{' '}
                      <span className="text-[11px] text-muted-foreground">{t(`widgets.severityCalculator.weights.${d}`)}</span>
                    </span>
                    <span className="num font-display font-bold">{formatScore(v)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <motion.div className="h-full rounded-full bg-red-500/80" initial={false} animate={{ width: `${((v ?? 0) / 5) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Category scale 1–5 */}
          <div className="mt-5">
            <div className="relative flex h-3 overflow-hidden rounded-full">
              {SEVERITY_CATEGORY_KEYS.map((k) => (
                <div key={k} className="flex-1" style={{ background: SEVERITY_COLORS[k] }} />
              ))}
            </div>
            <div className="relative h-4">
              {typeof r.severity === 'number' && (
                <motion.span className="absolute top-0 -translate-x-1/2 text-[10px] font-bold" initial={false} animate={{ left: `${(r.severity / 5) * 100}%` }}>
                  ▲
                </motion.span>
              )}
            </div>
            <div className="num flex justify-between text-[10px] text-muted-foreground">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={cn('flex-1 text-center', r.level === n && 'font-bold text-foreground')}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-center font-mono text-xs sm:text-sm">
        <span className="whitespace-nowrap">
          {Math.round(w.geo * 100)}% × G({formatScore(r.dimensions.impact.score)}, {formatScore(r.dimensions.conditions.score)}) + {Math.round(w.complexity * 100)}% × {formatScore(r.dimensions.complexity.score)} ={' '}
          <strong className="text-primary">{formatScore(r.severity)}</strong>
        </span>
      </div>
    </WidgetFrame>
  );
}
