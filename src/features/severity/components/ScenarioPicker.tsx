/** Step 1 — illustrative scenarios (radio cards) plus a blank / custom form. */
import { Check, FlaskConical, Mountain, SlidersHorizontal, Sun, Waves, type LucideIcon } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { computeSeverity } from '@/engine/severity/engine';
import { SEVERITY_SCENARIOS } from '@/engine/severity/scenarios';
import { cn, formatCompact, formatScore } from '@/lib/utils';
import type { ScenarioChoice } from '../lib';
import { SeverityChip } from './bits';

const META: Record<ScenarioChoice, { icon: LucideIcon; tint: string }> = {
  riverineFlood: { icon: Waves, tint: 'from-sky-500/20 to-blue-500/5 text-sky-600 dark:text-sky-400' },
  drought: { icon: Sun, tint: 'from-amber-500/20 to-orange-500/5 text-amber-700 dark:text-amber-400' },
  landslide: { icon: Mountain, tint: 'from-stone-500/20 to-emerald-500/5 text-stone-600 dark:text-stone-300' },
  custom: { icon: SlidersHorizontal, tint: 'from-primary/15 to-primary/5 text-primary' },
};

const cardCls =
  'group relative flex h-full w-full flex-col rounded-2xl border border-border bg-card p-4 text-left shadow-[var(--shadow-soft)] transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:border-primary/60 data-[state=checked]:ring-2 data-[state=checked]:ring-primary/30';

export function ScenarioPicker({ value, onChange }: { value: ScenarioChoice; onChange: (id: ScenarioChoice) => void }) {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const lang = i18n.language;
  const previews = React.useMemo(() => SEVERITY_SCENARIOS.map((s) => ({ s, r: computeSeverity(s.input) })), []);

  return (
    <RadioGroup.Root value={value} onValueChange={(v) => onChange(v as ScenarioChoice)} aria-label={t('scenario.aria')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {previews.map(({ s, r }) => {
        const { icon: Icon, tint } = META[s.id];
        return (
          <RadioGroup.Item key={s.id} value={s.id} className={cardCls}>
            <span className="flex items-start justify-between gap-2">
              <span className={cn('inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br', tint)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-warning/50 bg-warning/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-warning uppercase">
                <FlaskConical className="size-3" aria-hidden />
                {t('illustrative')}
              </span>
            </span>
            <span className="mt-3 block font-display text-base font-bold">{t(`scenario.${s.id}.name`)}</span>
            <span className="mt-1 line-clamp-3 block text-xs leading-relaxed text-muted-foreground">{t(`scenario.${s.id}.blurb`)}</span>
            <span className="mt-3 grid grid-cols-3 gap-1 border-t border-border pt-3 text-center">
              {(
                [
                  ['peopleAffected', 'scenario.affected'],
                  ['displaced', 'scenario.displaced'],
                  ['fatalities', 'scenario.deaths'],
                ] as const
              ).map(([k, label]) => (
                <span key={k} className="block min-w-0">
                  <span className="num block font-display text-sm font-bold">{formatCompact(s.input[k], lang)}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{t(label)}</span>
                </span>
              ))}
            </span>
            <span className="mt-auto flex items-center justify-between gap-2 pt-3">
              <span className="text-xs text-muted-foreground">
                {t('scenario.severity')} <b className="num font-display text-sm text-foreground">{formatScore(r.severity)}</b>
              </span>
              <SeverityChip score={r.severity} size="sm" />
            </span>
            <RadioGroup.Indicator className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Check className="size-3.5" aria-hidden />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        );
      })}
      <RadioGroup.Item value="custom" className={cn(cardCls, 'border-dashed bg-card/60')}>
        <span className={cn('inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br', META.custom.tint)}>
          <SlidersHorizontal className="size-5" aria-hidden />
        </span>
        <span className="mt-3 block font-display text-base font-bold">{t('scenario.custom.name')}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{t('scenario.custom.blurb')}</span>
        <span className="mt-auto block pt-3 text-xs font-semibold text-primary">{t('scenario.custom.cta')} →</span>
        <RadioGroup.Indicator className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Check className="size-3.5" aria-hidden />
        </RadioGroup.Indicator>
      </RadioGroup.Item>
    </RadioGroup.Root>
  );
}
