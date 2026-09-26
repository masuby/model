import { Check } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { useModel } from '@/data-layer/DataProvider';
import { CLASS_COLORS, CLASS_KEYS, classify, NO_DATA_COLOR, THRESHOLDS } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum, mean, riskScore, round1 } from '@/engine/risk/math';
import { cn, formatScore } from '@/lib/utils';
import { Chip, CouncilPicker, LabeledSlider, WidgetFrame } from '../components/WidgetKit';

type Dims = Record<DimensionKey, number>;
type Loaded = { kind: 'national' } | { kind: 'council'; id: string } | { kind: 'preset'; key: string };
const SHORT: Record<DimensionKey, string> = { hazard: 'H', vulnerability: 'V', coping: 'LCC' };
const PRESETS: Array<{ key: string; dims: Dims }> = [
  { key: 'extreme', dims: { hazard: 9, vulnerability: 1, coping: 1 } },
  { key: 'balanced', dims: { hazard: 5, vulnerability: 5, coping: 5 } },
  { key: 'allHigh', dims: { hazard: 8, vulnerability: 8, coping: 8 } },
];

/** Lesson 5 — INFORM Risk playground: three sliders → riskScore() live, and geometric vs arithmetic mean. */
export default function RiskPlayground() {
  const { t } = useTranslation(['learn', 'common']);
  const model = useModel();
  const nationalDims = React.useMemo<Dims>(
    () => ({ hazard: model.national.dims.hazard.score ?? 0, vulnerability: model.national.dims.vulnerability.score ?? 0, coping: model.national.dims.coping.score ?? 0 }),
    [model],
  );
  const [dims, setDims] = React.useState<Dims>(nationalDims);
  const [loaded, setLoaded] = React.useState<Loaded | null>({ kind: 'national' });
  // Empty until a council is loaded, and cleared when the sliders move — so any council can be (re)loaded.
  const [councilId, setCouncilId] = React.useState('');

  const risk = riskScore(dims.hazard, dims.vulnerability, dims.coping);
  const arith = round1(mean([dims.hazard, dims.vulnerability, dims.coping]) ?? 0);
  const product = dims.hazard * dims.vulnerability * dims.coping;
  const gap = isNum(risk) ? Math.round((arith - risk) * 10) / 10 : 0;

  // One polite announcement once the sliders settle (not one per 0.1 step on top of the slider's own value).
  const riskCls = classify(risk, 'risk');
  const announcement = useSettled(`${t('common:informRisk')} ${formatScore(risk)}${riskCls ? `, ${t(`common:classes.${riskCls.key}`)}` : ''}`, 400);

  const loadedUnit = loaded?.kind === 'council' ? model.byId.get(loaded.id) : loaded?.kind === 'national' ? model.national : null;
  const matches = loadedUnit && DIMENSIONS.every((d) => loadedUnit.dims[d.key].score === dims[d.key]) && isNum(loadedUnit.risk) && loadedUnit.risk === risk ? loadedUnit : null;

  const applyPreset = (d: Dims, l: Loaded) => {
    setDims(d);
    setLoaded(l);
    setCouncilId('');
  };

  // Stable, so the memoised council picker does not re-render on every slider move.
  const loadCouncil = React.useCallback(
    (id: string) => {
      const u = model.byId.get(id);
      setCouncilId(id);
      if (!u) return;
      setDims({ hazard: u.dims.hazard.score ?? 0, vulnerability: u.dims.vulnerability.score ?? 0, coping: u.dims.coping.score ?? 0 });
      setLoaded({ kind: 'council', id });
    },
    [model],
  );

  return (
    <WidgetFrame title={t('widgets.riskPlayground.title')} description={t('widgets.riskPlayground.lead')} kind="engine" footer={t('widgets.riskPlayground.footer')}>
      {/* Presets & council loader */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('widgets.riskPlayground.presets')}>
          <Chip active={loaded?.kind === 'national'} onClick={() => applyPreset(nationalDims, { kind: 'national' })}>
            {t('widgets.riskPlayground.preset.national')}
          </Chip>
          {PRESETS.map((p) => (
            <Chip key={p.key} active={loaded?.kind === 'preset' && loaded.key === p.key} onClick={() => applyPreset(p.dims, { kind: 'preset', key: p.key })}>
              {t(`widgets.riskPlayground.preset.${p.key}`)}
            </Chip>
          ))}
        </div>
        <CouncilPicker className="sm:max-w-xs" value={councilId} onChange={loadCouncil} label={t('widgets.riskPlayground.load')} placeholder={t('widgets.riskPlayground.choose')} />
      </div>

      <div className="mt-7 grid gap-8 border-t border-border pt-7 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] md:gap-0 md:divide-x md:divide-border">
        <div className="grid gap-6 md:pr-8">
          {DIMENSIONS.map((d) => (
            <LabeledSlider
              key={d.key}
              label={
                <span>
                  {t(`common:dimensions.${d.key}`)} <span className="font-normal text-muted-foreground">({SHORT[d.key]})</span>
                </span>
              }
              value={dims[d.key]}
              onChange={(v) => {
                setDims((s) => ({ ...s, [d.key]: Math.round(v * 10) / 10 }));
                setLoaded((l) => (l?.kind === 'preset' ? null : l));
                setCouncilId('');
              }}
              valueText={formatScore(dims[d.key])}
              color={DIMENSION_COLORS[d.key]}
              hint={<ClassBadge value={dims[d.key]} scale={d.scale} size="sm" />}
            />
          ))}
        </div>

        <div className="border-t border-border pt-6 md:border-t-0 md:pt-0 md:pl-8">
          <p role="status" className="sr-only">
            {announcement}
          </p>
          <div className="text-sm text-muted-foreground">{t('common:informRisk')}</div>
          <div className="mt-1 flex items-center gap-3">
            <span className="num font-display text-6xl leading-none font-semibold tracking-tight">{formatScore(risk)}</span>
            <ClassBadge value={risk} />
          </div>
          <ClassScale value={risk} className="mt-5" />
          {matches && (
            <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-success">
              <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{t('widgets.riskPlayground.matches', { name: matches.name, score: formatScore(matches.risk) })}</span>
            </p>
          )}
        </div>
      </div>

      {/* The formula with live numbers */}
      <div className="mt-7 overflow-x-auto border-y border-border py-4 text-center font-display text-lg">
        <span className="num whitespace-nowrap">
          ∛({formatScore(dims.hazard)} × {formatScore(dims.vulnerability)} × {formatScore(dims.coping)}) = ∛{product.toFixed(1)} = <strong className="font-semibold">{formatScore(risk)}</strong>
        </span>
      </div>

      {/* Geometric vs arithmetic */}
      <div className="mt-7">
        <h4 className="text-base font-semibold">{t('widgets.riskPlayground.whyTitle')}</h4>
        <div className="mt-4 grid gap-4">
          <MeanBar label={t('widgets.riskPlayground.geo')} sub="∛(H × V × LCC)" value={risk} strong />
          <MeanBar label={t('widgets.riskPlayground.arith')} sub="(H + V + LCC) ÷ 3" value={arith} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">
          {gap >= 0.5
            ? t('widgets.riskPlayground.gapBig', { gap: formatScore(gap) })
            : gap > 0
              ? t('widgets.riskPlayground.gapSmall', { gap: formatScore(gap) })
              : t('widgets.riskPlayground.gapNone')}
        </p>
      </div>
    </WidgetFrame>
  );
}

/** The 0–10 risk scale cut at the workbook's class thresholds, with a marker at the score. */
function ClassScale({ value, className }: { value: number | null; className?: string }) {
  const bounds = [0, ...THRESHOLDS.risk, 10];
  return (
    <div className={className} aria-hidden>
      <div className="relative">
        <div className="flex h-2 gap-px">
          {CLASS_KEYS.map((k, i) => (
            <div key={k} style={{ width: `${((bounds[i + 1] - bounds[i]) / 10) * 100}%`, background: CLASS_COLORS[k] }} />
          ))}
        </div>
        {isNum(value) && <span className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 bg-foreground transition-[left] duration-150" style={{ left: `${(value / 10) * 100}%` }} />}
      </div>
      <div className="num mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  );
}

/**
 * Returns `value` once it has stopped changing for `delay` ms. Starts empty, so nothing is announced
 * on page load — only after the learner has moved something.
 */
function useSettled(value: string, delay: number): string {
  const [settled, setSettled] = React.useState('');
  const first = React.useRef(value);
  React.useEffect(() => {
    if (value === first.current && settled === '') return;
    const h = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(h);
  }, [value, delay, settled]);
  return settled;
}

/** One of the two means: label with its formula beneath, class and score on the label's line, and a bar. */
function MeanBar({ label, sub, value, strong = false }: { label: string; sub: string; value: number | null; strong?: boolean }) {
  const { t } = useTranslation('common');
  const c = classify(value, 'risk');
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0">
          <span className={cn('block', strong ? 'font-semibold' : 'font-medium text-foreground/85')}>{label}</span>
          <span className="block text-xs text-muted-foreground">{sub}</span>
        </span>
        <span className="flex shrink-0 items-baseline gap-2">
          <span className="text-xs text-muted-foreground">{c ? t(`classes.${c.key}`) : ''}</span>
          <span className={cn('num text-lg tracking-tight', strong ? 'font-semibold' : 'font-medium')}>{formatScore(value)}</span>
        </span>
      </div>
      {/* Both bars in the full class colour; INFORM's own mean is drawn heavier. */}
      <div className={cn('bg-muted', strong ? 'h-2.5' : 'h-1.5')}>
        <div className="h-full transition-[width] duration-150" style={{ width: `${((value ?? 0) / 10) * 100}%`, background: c?.color ?? NO_DATA_COLOR }} />
      </div>
    </div>
  );
}
