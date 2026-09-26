import { ArrowRight, ChevronDown, CircleAlert, CircleCheck } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DIMENSION_COLORS, DIMENSION_TEXT } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import { CLASS_COLORS, CLASS_KEYS, THRESHOLDS } from '@/engine/risk/classes';
import { isNum } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { fx } from '../data';
import { deriveUnit, type DimensionStep, type RiskStep } from '../derive';
import { Aligned, DocSection, Fn, Formula, Frac, Line, N, Op, Paren, Root, Sep, V } from '../ui';

const DIM_TAG = { hazard: 'H', vulnerability: 'V', coping: 'LCC' } as const;
/** Indicator values: one decimal when that is exact, otherwise two. */
const val = (v: number) => (Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? v.toFixed(1) : v.toFixed(2));

/** Result of the check against the model: a status line, not a coloured box. */
function Verdict({ ok, model }: { ok: boolean; model: number | null }) {
  const { t } = useTranslation('methodology');
  return (
    <p className={cn('mt-3 flex items-center gap-1.5 text-[13px] font-medium', ok ? 'text-success' : 'text-danger')}>
      {ok ? <CircleCheck className="size-4 shrink-0" aria-hidden /> : <CircleAlert className="size-4 shrink-0" aria-hidden />}
      {t(ok ? 'example.matches' : 'example.mismatch', { value: formatScore(model) })}
    </p>
  );
}

function DimensionColumn({ step, showIndicators }: { step: DimensionStep; showIndicators: boolean }) {
  const { t } = useTranslation(['methodology', 'common', 'indicators']);
  const present = step.categories.filter((c) => isNum(c.scaled));
  const tag = DIM_TAG[step.key];
  const terms = present.map((c, i) => (
    <React.Fragment key={c.key}>
      {i > 0 && <Op>×</Op>}
      <N>{fx(c.scaled)}</N>
    </React.Fragment>
  ));

  const label = t('methodology:example.dimFormula', { dim: tag, cats: present.map((c) => formatScore(c.score)).join(', '), result: formatScore(step.result) });

  return (
    <div className="flex min-w-0 flex-col border-t border-border pt-6 xl:border-t-0 xl:px-7 xl:first:pl-0 xl:last:pr-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: DIMENSION_TEXT[step.key] }}>
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: DIMENSION_COLORS[step.key] }} aria-hidden />
            {tag}
          </p>
          <h4 className="mt-1 text-base font-semibold">{t(`common:dimensions.${step.key}`)}</h4>
        </div>
        <ClassBadge value={step.result} scale={step.scale} showScore size="sm" className="mt-1" />
      </div>

      <p className="mt-5 border-b border-foreground/25 pb-1.5 text-[13px] font-semibold">{t('methodology:example.categories')}</p>
      <ul className="divide-y divide-border">
        {step.categories.map((c) => (
          <li key={c.key} className="py-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{t(`common:categories.${c.key}`)}</span>
              <span className="num font-semibold">{formatScore(c.score)}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('methodology:example.withData', { n: c.withData, total: c.indicators.length })} · {t('methodology:example.mean')} = <span className="num">{fx(c.mean)}</span>
            </p>
            {showIndicators && (
              <dl className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-xs">
                {c.indicators.map((i) => (
                  <React.Fragment key={i.key}>
                    <dt className={cn('min-w-0 truncate', isNum(i.value) ? 'text-foreground/85' : 'text-muted-foreground')} title={t(`indicators:${i.key}`)}>
                      {t(`indicators:${i.key}`)}
                    </dt>
                    <dd className={cn('num text-right', isNum(i.value) ? 'font-medium' : 'text-muted-foreground italic')}>{isNum(i.value) ? val(i.value) : t('methodology:example.noData')}</dd>
                  </React.Fragment>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        <Formula label={label} compact>
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
              <Paren sup={`1/${present.length}`}>{terms}</Paren>
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
    </div>
  );
}

/** Where a score sits on the 0–10 risk scale: the five class bands with a marker at the value. */
function ScalePosition({ value }: { value: number | null }) {
  const bounds = [0, ...THRESHOLDS.risk, 10];
  return (
    <div className="relative mt-5 w-full" aria-hidden>
      <div className="flex h-1.5 gap-px">
        {CLASS_KEYS.map((k, i) => (
          <span key={k} style={{ width: `${(bounds[i + 1] - bounds[i]) * 10}%`, background: CLASS_COLORS[k] }} />
        ))}
      </div>
      {isNum(value) && <span className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 bg-foreground" style={{ left: `${Math.min(10, Math.max(0, value)) * 10}%` }} />}
      <div className="num mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  );
}

function RiskResult({ unit, dims, risk }: { unit: Unit; dims: DimensionStep[]; risk: RiskStep }) {
  const { t } = useTranslation(['methodology', 'common']);
  const [h, v, c] = dims.map((d) => d.result);
  return (
    <div className="mt-12 grid gap-10 border-t border-border pt-8 md:grid-cols-[minmax(0,1fr)_14rem] md:gap-14">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{t('methodology:example.riskStep')}</p>
        <h4 className="mt-1 text-lg font-semibold">
          {t('common:informRisk')} · {unit.name}
        </h4>
        <Formula label={t('methodology:example.riskFormula', { h: formatScore(h), v: formatScore(v), c: formatScore(c), result: formatScore(risk.result) })} className="mt-5" tag={8}>
          <Aligned
            rows={[
              [
                <V key="l">{t('methodology:vars.risk')}</V>,
                <>
                  <Op>=</Op>
                  <Root index={3}>
                    <V>H</V>
                    <Op>×</Op>
                    <V>V</V>
                    <Op>×</Op>
                    <V>LCC</V>
                  </Root>
                </>,
              ],
              [
                null,
                <>
                  <Op>=</Op>
                  <Root index={3}>
                    <N>{formatScore(h)}</N>
                    <Op>×</Op>
                    <N>{formatScore(v)}</N>
                    <Op>×</Op>
                    <N>{formatScore(c)}</N>
                  </Root>
                  <Op>=</Op>
                  <Root index={3}>
                    <N>{fx(risk.product, 3)}</N>
                  </Root>
                </>,
              ],
              [
                null,
                <>
                  <Op>=</Op>
                  <N>{fx(risk.raw, 3)}</N>
                </>,
              ],
              [
                null,
                <>
                  <Op>→</Op>
                  <Fn>round</Fn>
                  <Paren>
                    <N>{fx(risk.raw, 3)}</N>
                    <Sep />
                    <N>1</N>
                  </Paren>
                  <Op>=</Op>
                  <N strong>{formatScore(risk.result)}</N>
                </>,
              ],
            ]}
          />
        </Formula>
        <Verdict ok={risk.matches} model={risk.model} />
      </div>
      <div className="md:border-l md:border-border md:pl-10">
        <p className="text-sm text-muted-foreground">{t('common:informRisk')}</p>
        <p className="mt-1 flex items-baseline gap-3">
          <span className="num font-display text-[3.25rem] leading-none font-semibold tracking-tight">{formatScore(risk.result)}</span>
          <ClassBadge value={risk.result} size="sm" className="-translate-y-1.5" />
        </p>
        <ScalePosition value={risk.result} />
      </div>
    </div>
  );
}

export function WorkedExampleSection() {
  const { t } = useTranslation(['methodology', 'common']);
  const model = useModel();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [showIndicators, setShowIndicators] = React.useState(true);
  const selectId = React.useId();

  const defaultId = React.useMemo(() => model.councils.find((c) => /^kondoa/i.test(c.name))?.id ?? model.councils[0]?.id ?? '', [model]);
  const unitId = selected && model.byId.has(selected) ? selected : defaultId;
  const unit = model.byId.get(unitId);

  const groups = React.useMemo(() => {
    const byRegion = new Map<string, Unit[]>();
    for (const c of model.councils) {
      if (!byRegion.has(c.region)) byRegion.set(c.region, []);
      byRegion.get(c.region)!.push(c);
    }
    return [...byRegion.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([region, list]) => ({ region, list: [...list].sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [model]);

  const derivation = React.useMemo(() => (unit ? deriveUnit(unit) : null), [unit]);
  const anyRounded = derivation?.dims.some((d) => d.categories.some((c) => isNum(c.mean) && isNum(c.score) && Math.abs(c.mean - c.score) > 1e-9)) ?? false;

  if (!unit || !derivation) return null;

  return (
    <DocSection id="worked-example" sub label={t('sections.workedExample')} title={t('example.title')} lead={t('example.lead')}>
      <div className="flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm">
          <label htmlFor={selectId} className="text-sm font-medium">
            {t('example.choose')}
          </label>
          {/* A native select: 195 councils cost nothing to render, and phones get their own picker. */}
          <div className="relative mt-1.5">
            <select
              id={selectId}
              value={unitId}
              onChange={(e) => setSelected(e.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-md border border-input bg-background pr-9 pl-3 text-sm text-foreground transition-colors hover:bg-muted/60"
            >
              {groups.map((g) => (
                <optgroup key={g.region} label={g.region}>
                  {g.list.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowIndicators((s) => !s)}>
            {showIndicators ? t('example.hideIndicators') : t('example.showIndicators')}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/area/${unit.id}`}>
              {t('example.profile')} <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          {unit.region}
          {unit.sourceName && ` · ${t('example.sharedSource', { source: unit.sourceName })}`}
          {` · ${t('example.live')}`}
        </p>
        {unit.inheritedFrom && <p className="border-l-2 border-warning pl-3 text-foreground/85">{t('example.inherited', { parent: unit.inheritedFrom })}</p>}
      </div>

      <p className="sr-only" aria-live="polite">
        {t('example.summary', {
          name: unit.name,
          h: formatScore(derivation.dims[0]?.result),
          v: formatScore(derivation.dims[1]?.result),
          c: formatScore(derivation.dims[2]?.result),
          risk: formatScore(derivation.risk.result),
          check: t(derivation.risk.matches && derivation.dims.every((d) => d.matches) ? 'example.summaryOk' : 'example.summaryDiff'),
        })}
      </p>

      <div className="mt-8 grid items-stretch gap-10 xl:grid-cols-3 xl:gap-0 xl:divide-x xl:divide-border xl:border-t xl:border-border">
        {derivation.dims.map((d) => (
          <DimensionColumn key={`${unit.id}-${d.key}`} step={d} showIndicators={showIndicators} />
        ))}
      </div>
      <RiskResult unit={unit} dims={derivation.dims} risk={derivation.risk} />
      <p className="mt-6 max-w-[72ch] text-[13px] leading-relaxed text-muted-foreground">
        {t('example.footnote')}
        {anyRounded && ` ${t('example.recorded')}`}
      </p>
    </DocSection>
  );
}
