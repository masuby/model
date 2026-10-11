/**
 * The width of an explorer side panel, for reading with room: a handle on the panel's inner edge that
 * drags (pointer) or steps (arrow keys, Home and End to the limits, Enter or a double click back to the
 * default), and a button that widens the panel to a reading width or back. The width is kept in the
 * preferences (`panelWidths`), per side, and the map always keeps `MAP_MIN` px.
 */
import { ChevronsLeftRight, ChevronsRightLeft } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePrefs, type PanelSide } from '@/state/prefs';

/** Default, reading and limit widths of each side, in px. */
export const PANEL_WIDTHS: Record<PanelSide, { normal: number; wide: number; min: number; max: number }> = {
  left: { normal: 392, wide: 520, min: 300, max: 640 },
  right: { normal: 400, wide: 560, min: 340, max: 720 },
};
/** The map keeps at least this width between the panels. */
export const MAP_MIN = 360;
const STEP = 16;

/** The width of a side as set (or its default), clamped so the map keeps its minimum on this screen. */
export function usePanelWidth(side: PanelSide, fallback = PANEL_WIDTHS[side].normal): { width: number; isDefault: boolean; isWide: boolean; set: (px: number | null) => void; max: number } {
  const stored = usePrefs((s) => s.panelWidths[side]);
  const other = usePrefs((s) => s.panelWidths[side === 'left' ? 'right' : 'left']);
  const setPanelWidth = usePrefs((s) => s.setPanelWidth);
  const limits = PANEL_WIDTHS[side];
  const otherWidth = other ?? PANEL_WIDTHS[side === 'left' ? 'right' : 'left'].normal;
  const viewport = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const max = Math.max(limits.min, Math.min(limits.max, viewport - otherWidth - MAP_MIN));
  const width = Math.max(limits.min, Math.min(max, stored ?? fallback));
  return {
    width,
    isDefault: stored == null,
    isWide: stored != null && stored >= limits.wide,
    max,
    set: (px) => setPanelWidth(side, px == null ? null : Math.round(Math.max(limits.min, Math.min(max, px)))),
  };
}

/** The drag handle on the inner edge of a panel (the right edge of the left panel, the left edge of the right one). */
export function PanelResizer({ side, className }: { side: PanelSide; className?: string }) {
  const { t } = useTranslation('explore');
  const { width, set, max } = usePanelWidth(side);
  const limits = PANEL_WIDTHS[side];
  const start = React.useRef<{ x: number; width: number } | null>(null);
  const label = t('riskPanel.width.handle', { name: t(`riskPanel.width.${side}`) });
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={limits.min}
      aria-valuemax={max}
      aria-valuenow={width}
      tabIndex={0}
      title={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        start.current = { x: e.clientX, width };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        set(start.current.width + (side === 'left' ? dx : -dx));
      }}
      onPointerUp={(e) => {
        start.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
      onDoubleClick={() => set(null)}
      onKeyDown={(e) => {
        const grow = side === 'left' ? 'ArrowRight' : 'ArrowLeft';
        const shrink = side === 'left' ? 'ArrowLeft' : 'ArrowRight';
        if (e.key === grow) set(width + STEP);
        else if (e.key === shrink) set(width - STEP);
        else if (e.key === 'Home') set(limits.min);
        else if (e.key === 'End') set(max);
        else if (e.key === 'Enter') set(null);
        else return;
        e.preventDefault();
      }}
      className={cn(
        'group absolute inset-y-0 z-20 w-2 cursor-col-resize touch-none select-none outline-none',
        side === 'left' ? '-right-1' : '-left-1',
        'focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
    </div>
  );
}

/** One button: the reading width, or back to the default. */
export function PanelWidthButton({ side, className }: { side: PanelSide; className?: string }) {
  const { t } = useTranslation('explore');
  const { isWide, set } = usePanelWidth(side);
  const label = isWide ? t('riskPanel.width.narrow') : t('riskPanel.width.widen');
  return (
    <Button variant="ghost" size="icon-sm" aria-pressed={isWide} aria-label={label} title={label} onClick={() => set(isWide ? null : PANEL_WIDTHS[side].wide)} className={className}>
      {isWide ? <ChevronsRightLeft /> : <ChevronsLeftRight />}
    </Button>
  );
}
