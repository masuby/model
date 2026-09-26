/**
 * Form and layout controls wrapping Radix primitives (accessible by default): Tabs, Segmented (toggle
 * group), Select, Popover, Switch, Slider, Separator, Progress, Input, Textarea, Label.
 */
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover as PopoverPrimitive,
  Progress as ProgressPrimitive,
  Select as SelectPrimitive,
  Separator as SeparatorPrimitive,
  Slider as SliderPrimitive,
  Switch as SwitchPrimitive,
  Tabs as TabsPrimitive,
  ToggleGroup as ToggleGroupPrimitive,
} from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------- Tabs */
export const Tabs = TabsPrimitive.Root;
/** Underline tabs (editorial) — a hairline baseline with the active tab marked in the text colour. */
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('relative inline-flex max-w-full items-end gap-5 overflow-x-auto border-b border-border text-muted-foreground', className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-px inline-flex items-center justify-center gap-1.5 border-b-2 border-transparent pt-1 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-4 focus-visible:outline-none', className)} {...props} />;
}

/* ---------------------------------------------------------------- Segmented control */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  className,
  size = 'md',
  'aria-label': ariaLabel,
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: Array<{ value: T; label: React.ReactNode; icon?: React.ReactNode }>;
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      aria-label={ariaLabel}
      onValueChange={(v) => v && onValueChange(v as T)}
      className={cn('inline-flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-muted/60 p-0.5', className)}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[5px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:ring-1 data-[state=on]:ring-border [&_svg]:size-4',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
          )}
        >
          {o.icon}
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}

/* ---------------------------------------------------------------- Select */
export function Select({
  value,
  onValueChange,
  children,
  placeholder,
  className,
  'aria-label': ariaLabel,
  disabled,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
  disabled?: boolean;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring data-[placeholder]:text-muted-foreground disabled:opacity-50',
          className,
        )}
      >
        <span className="truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 opacity-60" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[1200] max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-elevated text-foreground shadow-[var(--shadow-lift)]"
        >
          <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        'relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 text-sm outline-none select-none data-[highlighted]:bg-muted data-[state=checked]:font-semibold',
        className,
      )}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5">
        <Check className="size-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
export function SelectGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.Label className="px-2.5 pt-2 pb-1 text-xs font-medium text-muted-foreground">{label}</SelectPrimitive.Label>
      {children}
    </SelectPrimitive.Group>
  );
}

/* ---------------------------------------------------------------- Popover */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export function PopoverContent({ className, align = 'start', ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={8}
        className={cn('z-[1300] w-80 rounded-lg border border-border bg-elevated p-4 text-foreground shadow-[var(--shadow-lift)]', className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

/* ---------------------------------------------------------------- Switch, Slider, Separator, Progress */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn('peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-input transition-colors data-[state=checked]:bg-primary disabled:opacity-50', className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-md transition-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  );
}

export function Slider({ className, thumbLabel, ...props }: React.ComponentProps<typeof SliderPrimitive.Root> & { thumbLabel?: string }) {
  return (
    <SliderPrimitive.Root className={cn('relative flex h-5 w-full touch-none items-center select-none', className)} {...props}>
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={thumbLabel ?? props['aria-label']}
          className="block size-5 rounded-full border-2 border-primary bg-card shadow transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export function Separator({ className, orientation = 'horizontal', ...props }: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return <SeparatorPrimitive.Root orientation={orientation} className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} {...props} />;
}

export function Progress({
  value,
  label,
  className,
  indicatorClassName,
  style,
}: {
  value: number;
  /** Accessible name — required so screen readers announce what the bar measures. */
  label: string;
  className?: string;
  indicatorClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <ProgressPrimitive.Root value={value} aria-label={label} className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <ProgressPrimitive.Indicator className={cn('h-full rounded-full bg-primary transition-[width] duration-500', indicatorClassName)} style={{ width: `${Math.max(0, Math.min(100, value))}%`, ...style }} />
    </ProgressPrimitive.Root>
  );
}

/* ---------------------------------------------------------------- Form bits */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/40 disabled:opacity-50 aria-[invalid=true]:border-danger',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/40',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-foreground', className)} {...props} />;
}
