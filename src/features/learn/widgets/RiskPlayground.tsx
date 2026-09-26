import { CircleCheck, Scale } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { ScoreGauge } from '@/components/risk/ScoreGauge';
import { useModel } from '@/data-layer/DataProvider';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum, mean, riskScore, round1 } from '@/engine/risk/math';
import { cn, formatScore } from '@/lib/utils';
import { CouncilPicker, LabeledSlider, WidgetFrame } from '../components/WidgetKit';

type Dims = Record<DimensionKey, number>;
type Loaded = { kind: 'national' } | { kind: 'council'; id: string } | { kind: 'preset'; key: string };
const SHORT: Record<DimensionKey, string> = { hazard: 'H', vulnerability: 'V', coping: 'LCC' };
const ACCENT: Record<DimensionKey, { bar: string; thumb: string }> = {
  hazard: { bar: 'bg-amber-500', thumb: 'border-amber-500' },
  vulnerability: { bar: 'bg-rose-500', thumb: 'border-rose-500' },
  coping: { bar: 'bg-emerald-500', thumb: 'border-emerald-500' },
};
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

  const loadedUnit = loaded?.kind === 'council' ? model.byId.get(loaded.id) : loaded?.kind === 'national' ? model.national : null;
  const matches = loadedUnit && DIMENSIONS.every((d) => loadedUnit.dims[d.key].score === dims[d.key]) && isNum(loadedUnit.risk) && loadedUnit.risk === risk ? loadedUnit : null;

  const applyPreset = (d: Dims, l: Loaded) => {
    setDims(d);
    setLoaded(l);
    setCouncilId('');
  };

  const loadCouncil = (id: string) => {
    const u = model.byId.get(id);
    setCouncilId(id);
    if (!u) return;
    setDims({ hazard: u.dims.hazard.score ?? 0, vulnerability: u.dims.vulnerability.score ?? 0, coping: u.dims.coping.score ?? 0 });
    setLoaded({ kind: 'council', id });
  };

  return (
    <WidgetFrame title={t('widgets.riskPlayground.title')} description={t('widgets.riskPlayground.lead')} kind="engine" footer={t('widgets.riskPlayground.footer')}>
      {/* Presets & council loader */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('widgets.riskPlayground.presets')}>
          <PresetButton active={loaded?.kind === 'national'} onClick={() => applyPreset(nationalDims, { kind: 'national' })}>
            {t('widgets.riskPlayground.preset.national')}
          </PresetButton>
          {PRESETS.map((p) => (
            <PresetButton key={p.key} active={loaded?.kind === 'preset' && loaded.key === p.key} onClick={() => applyPreset(p.dims, { kind: 'preset', key: p.key })}>
              {t(`widgets.riskPlayground.preset.${p.key}`)}
            </PresetButton>
          ))}
        </div>
        <CouncilPicker className="lg:ml-auto lg:w-64" value={councilId} onChange={loadCouncil} label={t('widgets.riskPlayground.load')} placeholder={t('widgets.riskPlayground.choose')} />
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] md:items-center">
        <div className="grid gap-6">
          {DIMENSIONS.map((d) => (
            <LabeledSlider
              key={d.key}
              label={
                <span>
                  <span className="mr-1.5 inline-flex h-5 min-w-8 items-center justify-center rounded-md bg-muted px-1 font-mono text-[11px] font-bold">{SHORT[d.key]}</span>
                  {t(`common:dimensions.${d.key}`)}
                </span>
              }
              value={dims[d.key]}
              onChange={(v) => {
                setDims((s) => ({ ...s, [d.key]: Math.round(v * 10) / 10 }));
                setLoaded((l) => (l?.kind === 'preset' ? null : l));
                setCouncilId('');
              }}
              valueText={formatScore(dims[d.key])}
              accentClassName={ACCENT[d.key].bar}
              thumbClassName={ACCENT[d.key].thumb}
              hint={<ClassBadge value={dims[d.key]} scale={d.scale} size="sm" />}
            />
          ))}
        </div>

        <div className="flex flex-col items-center rounded-3xl border border-border bg-background/60 p-4 text-center" aria-live="polite">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t('common:informRisk')}</div>
          <ScoreGauge value={risk} size={190} className="mt-1" />
          <ClassBadge value={risk} size="lg" className="mt-2" />
          {matches && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-start gap-1.5 text-left text-xs text-success">
              <CircleCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{t('widgets.riskPlayground.matches', { name: matches.name, score: formatScore(matches.risk) })}</span>
            </motion.p>
          )}
        </div>
      </div>

      {/* The formula with live numbers */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-center font-mono text-sm">
        <span className="whitespace-nowrap">
          ∛({formatScore(dims.hazard)} × {formatScore(dims.vulnerability)} × {formatScore(dims.coping)}) = ∛{product.toFixed(1)} = <strong className="text-primary">{formatScore(risk)}</strong>
        </span>
      </div>

      {/* Geometric vs arithmetic */}
      <div className="mt-6 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-transparent p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Scale className="size-4 text-violet-600 dark:text-violet-400" aria-hidden />
          {t('widgets.riskPlayground.whyTitle')}
        </div>
        <div className="mt-4 grid gap-3">
          <MeanBar label={t('widgets.riskPlayground.geo')} sub="∛(H × V × LCC)" value={risk} strong />
          <MeanBar label={t('widgets.riskPlayground.arith')} sub="(H + V + LCC) ÷ 3" value={arith} />
        </div>
        <p className="mt-4 text-sm leading-relaxed">
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

function PresetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
        active ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function MeanBar({ label, sub, value, strong = false }: { label: string; sub: string; value: number | null; strong?: boolean }) {
  const { t } = useTranslation('common');
  const c = classify(value, 'risk');
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className={cn(strong ? 'font-bold' : 'font-medium text-muted-foreground')}>
          {label} <span className="ml-1 font-mono text-[11px] text-muted-foreground">{sub}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{c ? t(`classes.${c.key}`) : ''}</span>
          <span className="num font-display text-lg font-extrabold">{formatScore(value)}</span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full rounded-full" initial={false} animate={{ width: `${((value ?? 0) / 10) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} style={{ background: c?.color ?? NO_DATA_COLOR, opacity: strong ? 1 : 0.55 }} />
      </div>
    </div>
  );
}
