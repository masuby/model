import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Segmented } from '@/components/ui/primitives';
import { SEVERITY_CATEGORY_KEYS, SEVERITY_COLORS, SEVERITY_WEIGHTS, type SeverityDimensionKey } from '@/engine/severity/definitions';
import { computeSeverity } from '@/engine/severity/engine';
import { SEVERITY_SCENARIOS, type SeverityScenario } from '@/engine/severity/scenarios';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { Fact, LabeledSlider, WidgetFrame } from '../components/WidgetKit';
import { SEVERITY_PART_COLORS } from '../palette';
import { logSliderToValue, scaleScenario, valueToLogSlider } from '../sim';

const MIN_AFFECTED = 1_000;
const STEPS = 1000;
const DIMS: SeverityDimensionKey[] = ['impact', 'conditions', 'complexity'];

/** Readable text on a severity category fill (the two darkest take white). */
const textOn = (level: number | null) => ((level ?? 0) >= 4 ? '#ffffff' : '#1f2937');

/** Lesson 6 — run the real INFORM Severity engine on an illustrative scenario with one slider. */
export default function SeverityCalculator() {
  const { t, i18n } = useTranslation(['learn', 'common']);
  const lang = i18n.language;
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
    <WidgetFrame title={t('widgets.severityCalculator.title')} description={t('widgets.severityCalculator.lead')} kind="illustrative" footer={t('widgets.severityCalculator.footer')}>
      <Segmented
        value={scenarioId}
        onValueChange={setScenarioId}
        aria-label={t('widgets.severityCalculator.scenario')}
        className="flex w-full flex-wrap sm:inline-flex sm:w-auto"
        options={SEVERITY_SCENARIOS.map((s) => ({ value: s.id, label: t(`widgets.severityCalculator.scenarios.${s.id}.name`) }))}
      />
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t(`widgets.severityCalculator.scenarios.${scenarioId}.desc`, { people: formatNumber(scenario.input.peopleInArea, lang) })}
      </p>

      <LabeledSlider
        className="mt-6"
        label={t('widgets.severityCalculator.slider')}
        value={valueToLogSlider(affected, MIN_AFFECTED, max, STEPS)}
        min={0}
        max={STEPS}
        step={1}
        onChange={(s) => setAffectedBy((m) => ({ ...m, [scenarioId]: logSliderToValue(s, MIN_AFFECTED, max, STEPS) }))}
        valueText={formatNumber(affected, lang)}
      />
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span className="num">{formatNumber(MIN_AFFECTED, lang)}</span>
        <span className="num">{formatNumber(max, lang)}</span>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-border border-y border-border py-4">
        <Fact className="pr-3" label={t('widgets.severityCalculator.displaced')} value={formatNumber(r.indicators.displaced?.raw, lang, { notation: 'compact' })} />
        <Fact className="px-3 sm:px-5" label={t('widgets.severityCalculator.deaths')} value={formatNumber(r.indicators.fatalities?.raw, lang, { notation: 'compact' })} />
        <Fact className="pl-3 sm:pl-5" label={t('widgets.severityCalculator.inNeed')} value={formatNumber(r.indicators.peopleInNeed?.raw, lang, { notation: 'compact' })} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,12rem)_1fr] md:gap-0 md:divide-x md:divide-border" aria-live="polite">
        {/* Headline */}
        <div className="md:pr-7">
          <div className="text-sm text-muted-foreground">{t('widgets.severityCalculator.severity')}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num font-display text-6xl leading-none font-semibold tracking-tight">{formatScore(r.severity)}</span>
            <span className="text-sm text-muted-foreground">{t('widgets.severityCalculator.outOf5')}</span>
          </div>
          {catKey && (
            <span className="mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: r.color ?? undefined, color: textOn(r.level) }}>
              {t('widgets.severityCalculator.category', { level: r.level, label: t(`common:classes.${catKey}`) })}
            </span>
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t('widgets.severityCalculator.reliability', { label: t(`common:classes.${r.reliability.key}`), pct: r.reliability.completeness })}
          </p>
        </div>

        {/* Dimensions */}
        <div className="md:pl-7">
          <div className="grid gap-3.5">
            {DIMS.map((d) => {
              const v = r.dimensions[d].score;
              return (
                <div key={d}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {t(`widgets.severityCalculator.dims.${d}`)} <span className="ml-1 text-xs font-normal text-muted-foreground">{t(`widgets.severityCalculator.weights.${d}`)}</span>
                    </span>
                    <span className="num font-semibold">{formatScore(v)}</span>
                  </div>
                  <div className="h-1.5 bg-muted">
                    <div className="h-full transition-[width] duration-150" style={{ width: `${((v ?? 0) / 5) * 100}%`, background: SEVERITY_PART_COLORS[d] }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Category scale 1–5 */}
          <div className="mt-6" aria-hidden>
            <div className="relative">
              <div className="flex h-2 gap-px">
                {SEVERITY_CATEGORY_KEYS.map((k) => (
                  <div key={k} className="flex-1" style={{ background: SEVERITY_COLORS[k] }} />
                ))}
              </div>
              {typeof r.severity === 'number' && (
                <span className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 bg-foreground transition-[left] duration-150" style={{ left: `${(r.severity / 5) * 100}%` }} />
              )}
            </div>
            <div className="num mt-1.5 flex text-[11px] text-muted-foreground">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={cn('flex-1 text-center', r.level === n && 'font-semibold text-foreground')}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 overflow-x-auto border-y border-border py-4 text-center font-display text-base sm:text-lg">
        <span className="num whitespace-nowrap">
          {Math.round(w.geo * 100)}% × G({formatScore(r.dimensions.impact.score)}, {formatScore(r.dimensions.conditions.score)}) + {Math.round(w.complexity * 100)}% × {formatScore(r.dimensions.complexity.score)} ={' '}
          <strong className="font-semibold">{formatScore(r.severity)}</strong>
        </span>
      </div>
    </WidgetFrame>
  );
}
