import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { mean, riskScore, scaledGeomean } from '@/engine/risk/math';
import { cn, formatScore } from '@/lib/utils';
import { DocSection, P } from '../ui';

function RangeField({ id, label, value, onChange, color }: { id: string; label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <label htmlFor={id} className="text-[13px]">
          {label}
        </label>
        <span className="num text-sm font-semibold">{value.toFixed(1)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'mt-2 h-5 w-full cursor-pointer appearance-none bg-transparent',
          // A hairline track and a solid thumb in the dimension's colour - the same in every browser and theme.
          '[&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-border',
          '[&::-webkit-slider-thumb]:-mt-[6.5px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-[var(--thumb)] [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-[var(--thumb)]',
          '[&::-moz-range-track]:h-[3px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border',
          '[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-[var(--thumb)]',
        )}
        style={{ '--thumb': color } as React.CSSProperties}
      />
    </div>
  );
}

function ResultBar({ label, value, emphasis, extra }: { label: string; value: number | null; emphasis?: boolean; extra?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('text-[13px]', emphasis ? 'font-medium' : 'text-muted-foreground')}>{label}</span>
        <span className="flex items-center gap-2.5">
          {extra}
          <span className={cn('num font-display leading-none font-semibold', emphasis ? 'text-2xl' : 'text-xl text-muted-foreground')}>{formatScore(value)}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-muted">
        <div className={cn('h-full transition-[width] duration-150', emphasis ? 'bg-foreground' : 'bg-muted-foreground/45')} style={{ width: `${((value ?? 0) / 10) * 100}%` }} />
      </div>
    </div>
  );
}

const RISK_PRESETS = { balanced: [5, 5, 5], oneLow: [9, 8, 0.5], oneHigh: [10, 2, 2] } as const;

export function GeometricSection() {
  const { t } = useTranslation(['methodology', 'common']);
  const id = React.useId();
  const [dims, setDims] = React.useState<[number, number, number]>([9, 8, 0.5]);
  const [cats, setCats] = React.useState<[number, number]>([8, 1]);

  const arith = mean(dims);
  const geo = riskScore(dims[0], dims[1], dims[2]);
  const catArith = mean(cats);
  const catGeo = scaledGeomean(cats);
  const keys = ['hazard', 'vulnerability', 'coping'] as const;

  return (
    <DocSection id="geometric" label={t('sections.geometric')} title={t('geometric.title')} lead={t('geometric.lead')}>
      <div className="space-y-5">
        <P>{t('geometric.p1')}</P>
        <P>{t('geometric.p2')}</P>
      </div>

      <div className="mt-12 grid gap-12 border-t border-border lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border">
        <div className="pt-8 lg:pr-10">
          <h3 className="text-base font-semibold">{t('geometric.riskPanel')}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={t('geometric.presets')}>
            <span className="mr-1 text-[13px] text-muted-foreground" aria-hidden>
              {t('geometric.presets')}:
            </span>
            {(Object.keys(RISK_PRESETS) as Array<keyof typeof RISK_PRESETS>).map((k) => {
              const p = RISK_PRESETS[k];
              const on = p.every((x, i) => x === dims[i]);
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDims([p[0], p[1], p[2]])}
                  className={cn(
                    // Same preset-toggle style as the Learn course (WidgetKit Chip).
                    'rounded-md border px-2.5 py-1 text-sm transition-colors duration-150',
                    on ? 'border-foreground/70 bg-muted font-medium text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                  )}
                >
                  {t(`geometric.preset.${k}`)}
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-4">
            {keys.map((k, i) => (
              <RangeField
                key={k}
                id={`${id}-d${i}`}
                label={t(`common:dimensions.${k}`)}
                value={dims[i]}
                color={DIMENSION_COLORS[k]}
                onChange={(v) => setDims((d) => d.map((x, j) => (j === i ? v : x)) as [number, number, number])}
              />
            ))}
          </div>
          <div className="mt-7 space-y-5 border-t border-border pt-5" aria-live="polite">
            <ResultBar label={t('geometric.arithmetic')} value={arith} />
            <ResultBar label={t('geometric.geometric')} value={geo} emphasis extra={<ClassBadge value={geo} size="sm" />} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{t('geometric.riskNote')}</p>
        </div>

        <div className="border-t border-border pt-8 lg:border-t-0 lg:pl-10">
          <h3 className="text-base font-semibold">{t('geometric.dimPanel')}</h3>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{t('geometric.dimHint')}</p>
          <div className="mt-6 space-y-4">
            {(['natural', 'human'] as const).map((k, i) => (
              <RangeField key={k} id={`${id}-c${i}`} label={t(`common:categories.${k}`)} value={cats[i]} color={DIMENSION_COLORS.hazard} onChange={(v) => setCats((c) => (i === 0 ? [v, c[1]] : [c[0], v]))} />
            ))}
          </div>
          <div className="mt-7 space-y-5 border-t border-border pt-5" aria-live="polite">
            <ResultBar label={t('geometric.arithmetic')} value={catArith} />
            <ResultBar label={t('geometric.scaledGeo')} value={catGeo} emphasis extra={<ClassBadge value={catGeo} scale="hazard" size="sm" />} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{t('geometric.dimNote')}</p>
        </div>
      </div>
    </DocSection>
  );
}
