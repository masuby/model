/**
 * Recharts theming helpers. Colours come from CSS variables so charts follow day/night mode.
 * Usage:
 *   const th = useChartTheme();
 *   <CartesianGrid stroke={th.grid} /> <XAxis tick={th.tick} stroke={th.axis} /> <Tooltip content={<ChartTooltip />} />
 */
import * as React from 'react';
import { resolveTheme, usePrefs } from '@/state/prefs';

export const DIMENSION_COLORS = {
  hazard: '#f97316',
  vulnerability: '#8b5cf6',
  coping: '#0ea5e9',
  risk: '#e11d48',
} as const;

/** Accessible TEXT colours per dimension (theme-aware CSS variables) - use for labels, not fills. */
export const DIMENSION_TEXT = {
  hazard: 'var(--dim-hazard-text)',
  vulnerability: 'var(--dim-vulnerability-text)',
  coping: 'var(--dim-coping-text)',
  risk: 'var(--dim-risk-text)',
} as const;

/** Categorical palette (colour-blind-aware) for series that are not INFORM classes. */
export const SERIES = ['#338cf6', '#f97316', '#10b981', '#8b5cf6', '#e11d48', '#eab308', '#06b6d4', '#64748b'];

export function useChartTheme() {
  const theme = resolveTheme(usePrefs((s) => s.theme));
  return React.useMemo(() => {
    const dark = theme === 'dark';
    return {
      dark,
      grid: dark ? 'rgba(226,232,240,0.08)' : 'rgba(15,23,42,0.07)',
      axis: dark ? 'rgba(226,232,240,0.25)' : 'rgba(15,23,42,0.2)',
      text: dark ? '#93a0b8' : '#5b6679',
      tick: { fill: dark ? '#93a0b8' : '#5b6679', fontSize: 11 },
      cursor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
    };
  }, [theme]);
}

interface TooltipPayloadItem {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  payload?: Record<string, unknown>;
  dataKey?: string | number;
}

/** Themed tooltip for Recharts (`<Tooltip content={<ChartTooltip />} />`). */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v: number | string) => (typeof v === 'number' ? (Math.round(v * 10) / 10).toFixed(1) : String(v)),
  labelFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  valueFormatter?: (v: number | string, name?: string | number) => React.ReactNode;
  labelFormatter?: (label: string | number | undefined, payload?: TooltipPayloadItem[]) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-md border border-border bg-elevated px-3 py-2 text-xs shadow-[var(--shadow-lift)]">
      {(label !== undefined || labelFormatter) && <div className="mb-1.5 font-semibold text-foreground">{labelFormatter ? labelFormatter(label, payload) : label}</div>}
      <div className="grid gap-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <i className="inline-block size-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="num font-semibold text-foreground">{Array.isArray(p.value) ? p.value.join('–') : valueFormatter(p.value ?? '', p.name)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
