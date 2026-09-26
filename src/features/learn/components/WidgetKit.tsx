/**
 * Small building blocks shared by the lesson widgets: the widget panel (the one bordered box a lesson
 * section may hold), a council picker, an accessible labelled slider, a 0–10 indicator bar that shows
 * "no data" honestly, unboxed figures and flat toggle chips. See docs/DESIGN_LANGUAGE.md.
 */
import { Slider as SliderPrimitive } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectGroup, SelectItem } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { rampColor } from '@/engine/risk/metrics';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';

/* ------------------------------------------------------------------------------------------------ */

/** The single flat panel an interactive lesson widget sits in: title row, body, source line. */
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
  return (
    <figure className={cn('not-prose my-10 rounded-lg border border-border bg-card', className)}>
      <figcaption className="border-b border-border px-5 pt-5 pb-4 sm:px-6">
        <p className="text-sm text-muted-foreground">
          {t('widget.tryIt')} <span aria-hidden>·</span>{' '}
          <span className={cn(kind === 'illustrative' && 'font-medium text-warning')}>{t(`widget.${kind}`)}</span>
        </p>
        <h3 className="mt-1 text-lg leading-snug font-semibold text-balance">{title}</h3>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </figcaption>
      <div className="p-5 sm:p-6">{children}</div>
      {footer && <div className="border-t border-border px-5 py-3.5 text-xs leading-relaxed text-muted-foreground sm:px-6">{footer}</div>}
    </figure>
  );
}

/** A widget's result sentence, set off by a left rule (no tinted box). */
export function Finding({ children, tone = 'neutral', className, ...rest }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning'; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'border-l-2 pl-4 text-sm leading-relaxed text-foreground/90',
        tone === 'success' ? 'border-success' : tone === 'warning' ? 'border-warning' : 'border-border',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
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

/**
 * Council select grouped by region. Memoised: the list holds ~200 items, and the widgets re-render on
 * every slider move, so the picker only re-renders when its own props change.
 */
export const CouncilPicker = React.memo(function CouncilPicker({
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
      <span className="mb-1.5 block text-sm text-muted-foreground">{label}</span>
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
});

/* ------------------------------------------------------------------------------------------------ */

/**
 * Radix slider with a properly labelled thumb (role="slider", aria-label, aria-valuetext),
 * so screen-reader users hear "Hazard & Exposure, 6.2" rather than a bare number.
 * `color` fills the range with a data colour (e.g. a dimension colour); by default it is the control colour.
 */
export function LabeledSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.1,
  valueText,
  color,
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
  color?: string;
  className?: string;
  hint?: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span id={id} className="text-sm font-medium">
          {label}
        </span>
        <span className="flex items-center gap-2.5">
          {hint}
          <span className="num text-lg font-semibold tracking-tight">{valueText}</span>
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
        <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className={cn('absolute h-full rounded-full', !color && 'bg-primary')} style={color ? { background: color } : undefined} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-labelledby={id}
          aria-valuetext={valueText}
          className={cn(
            'block size-[18px] rounded-full border-2 bg-card shadow-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            !color && 'border-primary',
          )}
          style={color ? { borderColor: color } : undefined}
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
    <div className="py-1.5">
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className={cn('min-w-0 truncate', highlight ? 'font-semibold text-foreground' : 'text-foreground/85')}>{label}</span>
        {has ? <span className={cn('num text-sm', highlight ? 'font-semibold' : 'font-medium')}>{formatScore(value)}</span> : <span className="text-[11px] text-muted-foreground">{t('classes.noData')}</span>}
      </div>
      <div className="relative h-1.5 w-full bg-muted">
        {has ? (
          <div className="h-full transition-[width] duration-150" style={{ width: `${(value / 10) * 100}%`, background: rampColor(value) }} />
        ) : (
          <div className="h-full w-full [background:repeating-linear-gradient(45deg,var(--input)_0_4px,transparent_4px_8px)]" />
        )}
        {typeof reference === 'number' && (
          <span title={referenceLabel} className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-foreground/70" style={{ left: `${(reference / 10) * 100}%` }} />
        )}
      </div>
    </div>
  );
}

/** One unboxed figure: small label, a number, an optional unit line. Place several in a ruled row. */
export function Fact({ label, value, sub, className }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="num mt-1 text-xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** A flat toggle button (aria-pressed) for presets and quick picks. */
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-sm transition-colors duration-150',
        active ? 'border-foreground/70 bg-muted font-medium text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
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
      <span className="mr-1 text-sm text-muted-foreground">{label}</span>
      {units.map((u) => (
        <Chip key={u.id} active={u.id === value} onClick={() => onPick(u.id)}>
          {u.name}
        </Chip>
      ))}
    </div>
  );
}
