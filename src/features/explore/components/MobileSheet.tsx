/**
 * Non-modal bottom sheet for small screens: a "peek" row that is always visible (the map stays usable)
 * and a body that slides up. Tap or drag the handle to expand/collapse. Plain CSS height transition and
 * pointer events - no animation library. The body is only rendered once the sheet has been opened.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useElementHeight } from '../lib/hooks';

const HANDLE = 24;

export function MobileSheet({
  expanded,
  onExpandedChange,
  peek,
  children,
  above,
  containerHeight,
  label,
}: {
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  peek: React.ReactNode;
  children: React.ReactNode;
  /** Floats just above the sheet (e.g. the comparison tray). */
  above?: React.ReactNode;
  containerHeight: number;
  label: string;
}) {
  const { t } = useTranslation('explore');
  const [peekRef, peekH] = useElementHeight<HTMLDivElement>();
  const bodyId = React.useId();
  const drag = React.useRef<{ y: number; t: number; moved: boolean } | null>(null);
  const suppressClick = React.useRef(false);
  const collapsed = Math.round(peekH + HANDLE);
  const full = Math.max(collapsed, Math.round(containerHeight * 0.82));

  // Render the (below-the-fold) body lazily: only after the first expand, then keep it mounted.
  const [opened, setOpened] = React.useState(expanded);
  if (expanded && !opened) setOpened(true);

  // Animate height changes only after the first measurement, so the sheet does not grow in on load.
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!peekH || ready) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [peekH, ready]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 md:inset-x-auto md:left-1/2 md:w-[42rem] md:-translate-x-1/2">
      {above && <div className="pointer-events-auto absolute inset-x-3 bottom-full mb-2">{above}</div>}
      <div
        role="region"
        aria-label={label}
        style={{ height: expanded ? full : collapsed }}
        className={cn(
          'pointer-events-auto flex flex-col overflow-hidden rounded-t-lg border-t border-border bg-card shadow-[0_-8px_24px_-12px_rgb(15_23_42/0.25)] md:border-x',
          ready && 'transition-[height] duration-200 ease-out',
        )}
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          aria-label={expanded ? t('sheet.collapse') : t('sheet.expand')}
          onPointerDown={(e) => {
            drag.current = { y: e.clientY, t: e.timeStamp, moved: false };
            suppressClick.current = false;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (drag.current && Math.abs(e.clientY - drag.current.y) > 8) drag.current.moved = true;
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            if (!d?.moved) return;
            suppressClick.current = true;
            const dy = e.clientY - d.y;
            const v = (dy / Math.max(1, e.timeStamp - d.t)) * 1000;
            if (dy < -16 || v < -300) onExpandedChange(true);
            else if (dy > 16 || v > 300) onExpandedChange(false);
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onClick={() => {
            if (suppressClick.current) suppressClick.current = false;
            else onExpandedChange(!expanded);
          }}
          className="flex w-full shrink-0 touch-none items-center justify-center"
          style={{ height: HANDLE }}
        >
          <span className="h-1 w-9 rounded-full bg-muted-foreground/40" />
        </button>
        <div ref={peekRef} className="shrink-0">
          {peek}
        </div>
        <div id={bodyId} inert={!expanded} className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border">
          {opened ? children : null}
        </div>
      </div>
    </div>
  );
}
