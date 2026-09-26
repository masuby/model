/**
 * Small building blocks shared by the lesson widgets: the widget frame, a council picker, an
 * accessible labelled slider and a 0–10 indicator bar that shows "no data" honestly.
 */
import { Database, FlaskConical, MousePointerClick } from 'lucide-react';
import { motion } from 'motion/react';
import { Slider as SliderPrimitive } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectGroup, SelectItem } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { rampColor } from '@/engine/risk/metrics';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';

/* ------------------------------------------------------------------------------------------------ */

export function WidgetFrame({
  title,
  description,
  kind = 'live',
  children,
  footer,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  kind?: 'live' | 'illustrative' | 'engine';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation('learn');
  const kindBadge =
    kind === 'live' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-semibold text-success">
        <Database className="size-3" aria-hidden /> {t('widget.live')}
      </span>
    ) : kind === 'engine' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
        <Database className="size-3" aria-hidden /> {t('widget.engine')}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/12 px-2 py-0.5 text-[11px] font-semibold text-warning">
        <FlaskConical className="size-3" aria-hidden /> {t('widget.illustrative')}
      </span>
    );
  return (
    <motion.figure
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
      className={cn('not-prose my-8 overflow-hidden rounded-3xl border border-primary/25 bg-card shadow-[var(--shadow-lift)]', className)}
    >
      <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-primary/[0.03] to-transparent px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-primary-foreground uppercase">
            <MousePointerClick className="size-3" aria-hidden /> {t('widget.tryIt')}
          </span>
          {kindBadge}
        </div>
        <figcaption>
          <h3 className="mt-2.5 text-lg font-bold">{title}</h3>
          {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </figcaption>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      {footer && <div className="border-t border-border bg-muted/40 px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-6">{footer}</div>}
    </motion.figure>
  );
}

/* ------------------------------------------------------------------------------------------------ */

/** Find a council by (part of) its name, falling back to a given index — used for sensible defaults. */
export function findCouncil(model: RiskModel, name: string, fallback = 0): Unit {
  const n = name.toLowerCase();
  return model.councils.find((c) => c.name.toLowerCase() === n) ?? model.councils.find((c) => c.name.toLowerCase().includes(n)) ?? model.councils[fallback];
}

/** Keep a selected council id valid when the model changes. */
export function useCouncil(defaultName: string): [Unit, (id: string) => void] {
  const model = useModel();
  const [id, setId] = React.useState<string>(() => findCouncil(model, defaultName).id);
  const unit = model.byId.get(id) ?? findCouncil(model, defaultName);
  return [unit, setId];
}

export function CouncilPicker({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const model = useModel();
  const groups = React.useMemo(() => {
    const m = new Map<string, Unit[]>();
    for (const c of model.councils) {
      if (!m.has(c.region)) m.set(c.region, []);
      m.get(c.region)!.push(c);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([region, list]) => [region, [...list].sort((a, b) => a.name.localeCompare(b.name))] as const);
  }, [model]);
  return (
    <div className={cn('min-w-0', className)}>
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange} aria-label={label} placeholder={placeholder}>
        {groups.map(([region, list]) => (
          <SelectGroup key={region} label={region}>
            {list.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </Select>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */

/**
 * Radix slider with a properly labelled thumb (role="slider", aria-label, aria-valuetext),
 * so screen-reader users hear "Hazard & Exposure, 6.2" rather than a bare number.
 */
export function LabeledSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.1,
  valueText,
  accentClassName = 'bg-primary',
  thumbClassName = 'border-primary',
  className,
  hint,
}: {
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  valueText: string;
  accentClassName?: string;
  thumbClassName?: string;
  className?: string;
  hint?: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span id={id} className="text-sm font-semibold">
          {label}
        </span>
        <span className="flex items-center gap-2">
          {hint}
          <span className="num font-display text-lg font-extrabold">{valueText}</span>
        </span>
      </div>
      <SliderPrimitive.Root
        className="relative flex h-6 w-full touch-none items-center select-none"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      >
        <SliderPrimitive.Track className="relative h-2 grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className={cn('absolute h-full rounded-full', accentClassName)} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-labelledby={id}
          aria-valuetext={valueText}
          className={cn('block size-5 rounded-full border-2 bg-card shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', thumbClassName)}
        />
      </SliderPrimitive.Root>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */

/** A 0–10 indicator bar coloured on the continuous indicator ramp; missing data is shown as such. */
export function IndicatorBar({ label, value, highlight = false, reference, referenceLabel }: { label: string; value: number | null | undefined; highlight?: boolean; reference?: number | null; referenceLabel?: string }) {
  const { t } = useTranslation('common');
  const has = typeof value === 'number' && Number.isFinite(value);
  return (
    <div className={cn('rounded-xl px-2 py-1.5 transition-colors', highlight && 'bg-primary/[0.06] ring-1 ring-primary/20')}>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className={cn('min-w-0 truncate font-medium', highlight && 'font-semibold')}>{label}</span>
        {has ? (
          <span className="num font-display text-sm font-bold">{formatScore(value)}</span>
        ) : (
          <span className="rounded-full border border-dashed border-border px-1.5 text-[10px] font-semibold text-muted-foreground">{t('classes.noData')}</span>
        )}
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-muted">
        {has ? (
          <motion.div className="h-full rounded-full" initial={false} animate={{ width: `${(value / 10) * 100}%` }} transition={{ duration: 0.5 }} style={{ background: rampColor(value) }} />
        ) : (
          <div className="h-full w-full rounded-full [background:repeating-linear-gradient(45deg,var(--input)_0_4px,transparent_4px_8px)]" />
        )}
        {typeof reference === 'number' && (
          <span title={referenceLabel} className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-foreground/60" style={{ left: `${(reference / 10) * 100}%` }} />
        )}
      </div>
    </div>
  );
}

/** Small key/value tile. */
export function Fact({ label, value, sub, className }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-background/60 p-3', className)}>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="num mt-0.5 font-display text-xl font-extrabold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** "Try:" chips that jump the picker to councils that tell a story. */
export function QuickPicks({ names, value, onPick, label, className }: { names: readonly string[]; value: string; onPick: (id: string) => void; label: string; className?: string }) {
  const model = useModel();
  const units = React.useMemo(() => {
    const seen = new Set<string>();
    return names.map((n) => findCouncil(model, n)).filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)));
  }, [model, names]);
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="mr-1 text-xs font-medium text-muted-foreground">{label}</span>
      {units.map((u) => (
        <button
          key={u.id}
          type="button"
          aria-pressed={u.id === value}
          onClick={() => onPick(u.id)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
            u.id === value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
          )}
        >
          {u.name}
        </button>
      ))}
    </div>
  );
}
