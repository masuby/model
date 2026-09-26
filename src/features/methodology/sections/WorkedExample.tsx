import { ArrowRight, CircleAlert, CircleCheck, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { ScoreGauge } from '@/components/risk/ScoreGauge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectGroup, SelectItem } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { isNum } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { fx } from '../data';
import { deriveUnit, type DimensionStep, type RiskStep } from '../derive';
import { fadeIn } from '../tokens';
import { DocSection, Fn, Formula, Frac, Line, N, Op, Paren, Root, V } from '../ui';

const DIM_TAG = { hazard: 'H', vulnerability: 'V', coping: 'LCC' } as const;
/** Indicator values: one decimal when that is exact, otherwise two. */
const val = (v: number) => (Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? v.toFixed(1) : v.toFixed(2));

function Verdict({ ok, model }: { ok: boolean; model: number | null }) {
  const { t } = useTranslation('methodology');
  return (
    <div className={cn('mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium', ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
      {ok ? <CircleCheck className="size-4 shrink-0" aria-hidden /> : <CircleAlert className="size-4 shrink-0" aria-hidden />}
      {t(ok ? 'example.matches' : 'example.mismatch', { value: formatScore(model) })}
    </div>
  );
}

function DimensionPanel({ step, showIndicators }: { step: DimensionStep; showIndicators: boolean }) {
  const { t } = useTranslation(['methodology', 'common', 'indicators']);
  const present = step.categories.filter((c) => isNum(c.scaled));
  const color = DIMENSION_COLORS[step.key];
  const tag = DIM_TAG[step.key];
  const terms = present.map((c, i) => (
    <React.Fragment key={c.key}>
      {i > 0 && <Op>×</Op>}
      <N>{fx(c.scaled)}</N>
    </React.Fragment>
  ));

  const label = t('methodology:example.dimFormula', {
    dim: tag,
    cats: present.map((c) => formatScore(c.score)).join(', '),
    result: formatScore(step.result),
  });

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="h-1" style={{ background: color }} aria-hidden />
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <span className="font-display text-xs font-extrabold tracking-wider" style={{ color }}>
            {tag}
          </span>
          <h4 className="text-base font-bold">{t(`common:dimensions.${step.key}`)}</h4>
        </div>
        <ClassBadge value={step.result} scale={step.scale} showScore size="sm" className="mt-1" />
      </div>

      <div className="px-5 pt-3">
        <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t('methodology:example.categories')}</div>
        <ul className="mt-2 space-y-2.5">
          {step.categories.map((c) => (
            <li key={c.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{t(`common:categories.${c.key}`)}</span>
                <span className="num font-display font-bold">{formatScore(c.score)}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {t('methodology:example.withData', { n: c.withData, total: c.indicators.length })} · {t('methodology:example.mean')} = <span className="num">{fx(c.mean)}</span>
              </div>
              {showIndicators && (
                <ul className="mt-2 flex flex-wrap gap-1">
                  {c.indicators.map((i) => (
                    <li
                      key={i.key}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]',
                        isNum(i.value) ? 'border-border bg-background' : 'border-dashed border-border text-muted-foreground',
                      )}
                    >
                      <span>{t(`indicators:${i.key}`)}</span>
                      <span className={cn('num', isNum(i.value) && 'font-semibold')}>{isNum(i.value) ? val(i.value) : t('methodology:example.noData')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto px-5 pt-4 pb-5">
        <Formula label={label}>
          {present.map((c, i) => (
            <Line key={c.key}>
              <V sub={i + 1}>y</V>
              <Op>=</Op>
              <Frac
                num={
                  <>
                    <N>10</N>
                    <Op>−</Op>
                    <N>{formatScore(c.score)}</N>
                  </>
                }
                den={<N>10</N>}
              />
              <Op>·</Op>
              <N>9</N>
              <Op>+</Op>
              <N>1</N>
              <Op>=</Op>
              <N>{fx(c.scaled)}</N>
            </Line>
          ))}
          <Line>
            <Fn>geomean</Fn>
            <Op>=</Op>
            {present.length === 2 || present.length === 3 ? (
              <Root index={present.length === 3 ? 3 : 2}>{terms}</Root>
            ) : present.length > 3 ? (
              <>
                <Paren>{terms}</Paren>
                <sup className="-ml-1 self-start text-[0.68em]">1/{present.length}</sup>
              </>
            ) : (
              <N>{fx(present[0]?.scaled)}</N>
            )}
            <Op>=</Op>
            <N>{fx(step.geomean, 3)}</N>
          </Line>
          <Line>
            <V>{tag}</V>
            <Op>=</Op>
            <Frac
              num={
                <>
                  <N>10</N>
                  <Op>−</Op>
                  <N>{fx(step.geomean, 3)}</N>
                </>
              }
              den={<N>9</N>}
            />
            <Op>·</Op>
            <N>10</N>
            <Op>=</Op>
            <N>{fx(step.raw, 3)}</N>
            <Op>→</Op>
            <N strong>{formatScore(step.result)}</N>
          </Line>
        </Formula>
        <Verdict ok={step.matches} model={step.model} />
      </div>
    </Card>
  );
}

function RiskPanel({ unit, dims, risk }: { unit: Unit; dims: DimensionStep[]; risk: RiskStep }) {
  const { t } = useTranslation(['methodology', 'common']);
  const [h, v, c] = dims.map((d) => d.result);
  return (
    <Card className="relative overflow-hidden border-primary/25">
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative grid items-center gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{t('methodology:example.riskStep')}</div>
          <h4 className="mt-1 text-lg font-bold">
            {t('common:informRisk')} · {unit.name}
          </h4>
          <Formula label={t('methodology:example.riskFormula', { h: formatScore(h), v: formatScore(v), c: formatScore(c), result: formatScore(risk.result) })} className="mt-4">
            <Line>
              <V>{t('methodology:vars.risk')}</V>
              <Op>=</Op>
              <Root index={3}>
                <V>H</V>
                <Op>×</Op>
                <V>V</V>
                <Op>×</Op>
                <V>LCC</V>
              </Root>
              <Op>=</Op>
              <Root index={3}>
                <N>{formatScore(h)}</N>
                <Op>×</Op>
                <N>{formatScore(v)}</N>
                <Op>×</Op>
                <N>{formatScore(c)}</N>
              </Root>
            </Line>
            <Line>
              <Op>=</Op>
              <Root index={3}>
                <N>{fx(risk.product, 3)}</N>
              </Root>
              <Op>=</Op>
              <N>{fx(risk.raw, 3)}</N>
              <Op>→</Op>
              <Fn>round</Fn>
              <Paren>
                <N>{fx(risk.raw, 3)}</N>, <N>1</N>
              </Paren>
              <Op>=</Op>
              <N strong>{formatScore(risk.result)}</N>
            </Line>
          </Formula>
          <Verdict ok={risk.matches} model={risk.model} />
        </div>
        <div className="flex flex-col items-center justify-self-center">
          <ScoreGauge value={risk.result} size={170} label={t('common:informRisk')} />
          <ClassBadge value={risk.result} className="mt-2" />
        </div>
      </div>
    </Card>
  );
}

export function WorkedExampleSection() {
  const { t } = useTranslation(['methodology', 'common']);
  const model = useModel();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [showIndicators, setShowIndicators] = React.useState(true);

  const defaultId = React.useMemo(() => model.councils.find((c) => /^kondoa/i.test(c.name))?.id ?? model.councils[0]?.id ?? '', [model]);
  const unitId = selected && model.byId.has(selected) ? selected : defaultId;
  const unit = model.byId.get(unitId);

  const groups = React.useMemo(() => {
    const byRegion = new Map<string, Unit[]>();
    for (const c of model.councils) {
      if (!byRegion.has(c.region)) byRegion.set(c.region, []);
      byRegion.get(c.region)!.push(c);
    }
    return [...byRegion.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([region, list]) => ({ region, list: [...list].sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [model]);

  const derivation = React.useMemo(() => (unit ? deriveUnit(unit) : null), [unit]);
  const anyRounded = derivation?.dims.some((d) => d.categories.some((c) => isNum(c.mean) && isNum(c.score) && Math.abs(c.mean - c.score) > 1e-9)) ?? false;

  if (!unit || !derivation) return null;

  return (
    <DocSection id="worked-example" number="03" sub eyebrow={t('sections.workedExample')} title={t('example.title')} lead={t('example.lead')}>
      <motion.div {...fadeIn} className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="w-full max-w-sm">
          <div className="text-xs font-semibold text-muted-foreground" aria-hidden>
            {t('example.choose')}
          </div>
          <Select value={unitId} onValueChange={setSelected} aria-label={t('example.choose')} className="mt-1.5">
            {groups.map((g) => (
              <SelectGroup key={g.region} label={g.region}>
                {g.list.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <Radio className="size-3.5" aria-hidden />
            {t('example.live')}
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowIndicators((s) => !s)} aria-pressed={showIndicators}>
            {showIndicators ? t('example.hideIndicators') : t('example.showIndicators')}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/area/${unit.id}`}>
              {t('example.profile')} <ArrowRight />
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
        <p>
          {unit.region}
          {unit.sourceName && ` · ${t('example.sharedSource', { source: unit.sourceName })}`}
        </p>
        {unit.inheritedFrom && <p className="text-warning">{t('example.inherited', { parent: unit.inheritedFrom })}</p>}
      </div>

      <div className="mt-6 grid items-stretch gap-4 xl:grid-cols-3" aria-live="polite">
        {derivation.dims.map((d) => (
          <DimensionPanel key={`${unit.id}-${d.key}`} step={d} showIndicators={showIndicators} />
        ))}
      </div>
      <div className="mt-4">
        <RiskPanel unit={unit} dims={derivation.dims} risk={derivation.risk} />
      </div>
      <p className="mt-4 max-w-[72ch] text-xs leading-relaxed text-muted-foreground">
        {t('example.footnote')}
        {anyRounded && ` ${t('example.recorded')}`}
      </p>
    </DocSection>
  );
}
