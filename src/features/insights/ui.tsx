/**
 * Small building blocks shared by the Insights sections (docs/DESIGN_LANGUAGE.md): the section heading,
 * the plain figure note under each chart, a ruled side column, tooltip card, legends, axis ticks, lens
 * labels and a media-query hook. No boxes, no entrance motion.
 */
import * as React from 'react';
import { SectionHeading } from '@/components/layout/Page';
import { cn } from '@/lib/utils';
import type { LensKey } from './analytics';

/** Translation keys for each lens, long and short form (shared by several sections). */
export const LENS_LABEL: Record<LensKey, string> = {
  risk: 'common:informRisk',
  hazard: 'common:dimensions.hazard',
  vulnerability: 'common:dimensions.vulnerability',
  coping: 'common:dimensions.coping',
};
export const LENS_SHORT: Record<LensKey, string> = {
  risk: 'insights:lens.risk',
  hazard: 'common:dimensions.hazardShort',
  vulnerability: 'common:dimensions.vulnerabilityShort',
  coping: 'common:dimensions.copingShort',
};

/** Classes for a story section: a hairline rule above (except the first) and room for the sticky nav. */
export const sectionClass = (ruled = true) => cn('scroll-mt-32 py-14 sm:py-16', ruled && 'border-t border-border');

/**
 * The heading and body of a story section: serif title and lead (no kicker - the sticky section nav
 * already names every section). The `<section>` element itself (id, rule) is rendered by the page so
 * every anchor exists before the section's code has loaded.
 */
export function InsightSection({
  id,
  title,
  lead,
  actions,
  children,
}: {
  id: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <SectionHeading className="mb-10" title={<span id={`${id}-title`}>{title}</span>} description={lead} actions={actions} />
      {children}
    </>
  );
}

/** A side column that sits level with a neighbouring figure: hairline above, plain title. */
export function Aside({ title, className, children }: { title: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('border-t border-border pt-5', className)}>
      <h3 className="text-base leading-snug font-semibold">{title}</h3>
      {children}
    </div>
  );
}

/** Small plain-case sub-heading inside a column. */
export function SubHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h4 className={cn('text-sm font-normal text-muted-foreground', className)}>{children}</h4>;
}

/** Plain-language note placed under a chart, set like a figure note in a printed report. */
export function FigureNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mt-5 max-w-3xl text-sm leading-relaxed text-pretty text-muted-foreground', className)}>{children}</p>;
}

/** Themed container for custom Recharts tooltips (matches the shared ChartTooltip). */
export function TooltipCard({ title, subtitle, children }: { title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="max-w-72 min-w-44 rounded-md border border-border bg-elevated px-3 py-2.5 text-xs shadow-[var(--shadow-lift)]">
      <div className="font-semibold text-foreground">{title}</div>
      {subtitle && <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>}
      {children && <div className="mt-2 grid gap-1">{children}</div>}
    </div>
  );
}

/** One "label … value" row in a tooltip, keyed by a short line of the series colour. */
export function TooltipRow({ color, label, value, strong }: { color?: string; label: React.ReactNode; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color && <i className="inline-block h-0.5 w-3" style={{ background: color }} aria-hidden />}
        {label}
      </span>
      <span className={cn('num text-foreground', strong ? 'font-bold' : 'font-semibold')}>{value}</span>
    </div>
  );
}

export interface LegendEntry {
  key: string;
  color: string;
  label: React.ReactNode;
  value?: React.ReactNode;
  shape?: 'square' | 'dot' | 'line';
}

/** Inline legend (always present for ≥ 2 series); the swatch mirrors the mark, text stays in ink. */
export function Legend({ items, className, 'aria-label': ariaLabel }: { items: LegendEntry[]; className?: string; 'aria-label'?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground', className)} aria-label={ariaLabel}>
      {items.map((it) => (
        <li key={it.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn('inline-block shrink-0', it.shape === 'dot' ? 'size-2.5 rounded-full' : it.shape === 'line' ? 'h-0.5 w-4' : 'size-2.5 rounded-[2px]')}
            style={{ background: it.color }}
          />
          <span className="text-foreground">{it.label}</span>
          {it.value !== undefined && <span className="num text-muted-foreground">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Truncate a label for an axis, keeping the full text in an SVG <title> (hover) for sighted users. */
export function truncate(label: string, max: number): string {
  return label.length > max ? `${label.slice(0, Math.max(1, max - 1)).trimEnd()}…` : label;
}

interface TickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: unknown };
}

/** Y-axis category tick that truncates long names and optionally translates the raw value. */
export function CategoryTick({ x, y, payload, fill, maxChars, labelOf, weight }: TickProps & { fill: string; maxChars: number; labelOf?: (raw: string) => string; weight?: number }) {
  const raw = String(payload?.value ?? '');
  const label = labelOf ? labelOf(raw) : raw;
  const short = truncate(label, maxChars);
  return (
    <text x={Number(x)} y={Number(y)} dy={4} textAnchor="end" fill={fill} fontSize={11} fontWeight={weight}>
      {short !== label && <title>{label}</title>}
      {short}
    </text>
  );
}

/**
 * Phone layout for horizontal bar charts: the category name sits on its own line above the bar, starting
 * at the plot's left edge (`left`, px), so long names get the full width instead of a truncated axis column.
 * Use with `<YAxis width={1}>` and rows of about 36px with bars of 12px or less.
 */
export function AboveBarTick({ y, payload, fill, maxChars, labelOf, left = 1 }: TickProps & { fill: string; maxChars: number; labelOf?: (raw: string) => string; left?: number }) {
  const raw = String(payload?.value ?? '');
  const label = labelOf ? labelOf(raw) : raw;
  const short = truncate(label, maxChars);
  return (
    <text x={left} y={Number(y)} dy={-10} textAnchor="start" fill={fill} fontSize={11}>
      {short !== label && <title>{label}</title>}
      {short}
    </text>
  );
}

interface ValueLabelProps {
  viewBox?: unknown;
  offset?: number | string;
  value?: unknown;
  position?: unknown;
  fill?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
}

/**
 * `content` for a Recharts `<LabelList position="right" | "top">`: the value sits on a small backing in
 * the page colour (invisible as a shape), so a reference or grid line passing behind a label is
 * interrupted instead of striking through the digits. Positioned from the mark's `viewBox` (Recharts
 * hands custom content the mark's own x/y). Create once per theme with `useMemo`.
 */
export function backedValueLabel(surface: string) {
  return function BackedValueLabel({ viewBox, offset = 6, value, position, fill, fontSize = 11, fontWeight }: ValueLabelProps) {
    const text = value === null || value === undefined ? '' : String(value);
    const vb = viewBox as { x?: number; y?: number; width?: number; height?: number } | undefined;
    if (!text || !vb || ![vb.x, vb.y, vb.width, vb.height].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
    const { x = 0, y = 0, width = 0, height = 0 } = vb;
    const gap = Number(offset) || 0;
    const size = Number(fontSize) || 11;
    const w = text.length * size * 0.6 + 4;
    const h = size + 4;
    const top = position === 'top';
    // Anchor: right of a horizontal bar (vertically centred), or centred above a column.
    const px = top ? x + width / 2 : x + width + gap;
    const py = top ? y - gap : y + height / 2;
    return (
      <g className="recharts-label">
        <rect x={top ? px - w / 2 : px - 2} y={top ? py - h : py - h / 2} width={w} height={h} fill={surface} />
        <text x={px} y={top ? py - 3 : py} dy={top ? undefined : '0.35em'} textAnchor={top ? 'middle' : 'start'} fill={fill} fontSize={size} fontWeight={fontWeight}>
          {text}
        </text>
      </g>
    );
  };
}

/** Subscribe to a CSS media query (SSR-safe). */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
