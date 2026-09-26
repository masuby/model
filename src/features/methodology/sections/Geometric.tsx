import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Card } from '@/components/ui/card';
import { mean, riskScore, scaledGeomean } from '@/engine/risk/math';
import { cn, formatScore } from '@/lib/utils';
import { fadeIn } from '../tokens';
import { DocSection, P } from '../ui';

function RangeField({ id, label, value, onChange, color }: { id: string; label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <span className="num font-display text-sm font-bold">{value.toFixed(1)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-5 w-full cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function ResultBar({ label, value, emphasis, extra }: { label: string; value: number | null; emphasis?: boolean; extra?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('text-xs', emphasis ? 'font-semibold' : 'text-muted-foreground')}>{label}</span>
        <span className="flex items-center gap-2">
          {extra}
          <span className={cn('num font-display font-extrabold', emphasis ? 'text-xl' : 'text-lg text-muted-foreground')}>{formatScore(value)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-300', emphasis ? 'bg-primary' : 'bg-muted-foreground/45')} style={{ width: `${((value ?? 0) / 10) * 100}%` }} />
      </div>
    </div>
  );
}

const RISK_PRESETS = {
  balanced: [5, 5, 5],
  oneLow: [9, 8, 0.5],
  oneHigh: [10, 2, 2],
} as const;

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
    <DocSection id="geometric" number="04" eyebrow={t('sections.geometric')} title={t('geometric.title')} lead={t('geometric.lead')}>
      <div className="space-y-5">
        <P>{t('geometric.p1')}</P>
        <P>{t('geometric.p2')}</P>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <motion.div {...fadeIn}>
          <Card className="h-full p-5 sm:p-6">
            <div className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{t('geometric.tryIt')}</div>
            <h3 className="mt-1 text-lg font-bold">{t('geometric.riskPanel')}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t('geometric.presets')}>
              {(Object.keys(RISK_PRESETS) as Array<keyof typeof RISK_PRESETS>).map((k) => {
                const p = RISK_PRESETS[k];
                const on = p.every((x, i) => x === dims[i]);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDims([p[0], p[1], p[2]])}
                    className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground')}
                  >
                    {t(`geometric.preset.${k}`)}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 space-y-4">
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
            <div className="mt-6 space-y-4 rounded-xl border border-border bg-muted/30 p-4" aria-live="polite">
              <ResultBar label={t('geometric.arithmetic')} value={arith} />
              <ResultBar label={t('geometric.geometric')} value={geo} emphasis extra={<ClassBadge value={geo} size="sm" />} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t('geometric.riskNote')}</p>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.06 }}>
          <Card className="h-full p-5 sm:p-6">
            <div className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{t('geometric.tryIt')}</div>
            <h3 className="mt-1 text-lg font-bold">{t('geometric.dimPanel')}</h3>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('geometric.dimHint')}</p>
            <div className="mt-5 space-y-4">
              {(['natural', 'human'] as const).map((k, i) => (
                <RangeField
                  key={k}
                  id={`${id}-c${i}`}
                  label={t(`common:categories.${k}`)}
                  value={cats[i]}
                  color={DIMENSION_COLORS.hazard}
                  onChange={(v) => setCats((c) => (i === 0 ? [v, c[1]] : [c[0], v]))}
                />
              ))}
            </div>
            <div className="mt-6 space-y-4 rounded-xl border border-border bg-muted/30 p-4" aria-live="polite">
              <ResultBar label={t('geometric.arithmetic')} value={catArith} />
              <ResultBar label={t('geometric.scaledGeo')} value={catGeo} emphasis extra={<ClassBadge value={catGeo} scale="hazard" size="sm" />} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t('geometric.dimNote')}</p>
          </Card>
        </motion.div>
      </div>
    </DocSection>
  );
}
