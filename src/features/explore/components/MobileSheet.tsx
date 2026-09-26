/**
 * Non-modal bottom sheet for small screens: a "peek" row that is always visible (the map stays usable)
 * and a body that slides up. Tap or drag the handle to expand/collapse.
 */
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const panned = React.useRef(false);
  const collapsed = Math.round(peekH + HANDLE);
  const full = Math.max(collapsed, Math.round(containerHeight * 0.82));

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 md:inset-x-auto md:left-1/2 md:w-[42rem] md:-translate-x-1/2">
      {above && <div className="pointer-events-auto absolute inset-x-3 bottom-full mb-2">{above}</div>}
      <motion.div
        role="region"
        aria-label={label}
        initial={false}
        animate={{ height: expanded ? full : collapsed }}
        transition={{ type: 'spring', stiffness: 420, damping: 42 }}
        className="pointer-events-auto flex flex-col overflow-hidden rounded-t-3xl border-t border-border bg-elevated/95 shadow-[0_-16px_40px_-18px_rgb(15_23_42/0.4)] backdrop-blur-xl md:border-x"
      >
        <motion.button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          aria-label={expanded ? t('sheet.collapse') : t('sheet.expand')}
          onPointerDown={() => {
            panned.current = false;
          }}
          onPanStart={() => {
            panned.current = true;
          }}
          onPanEnd={(_, info) => {
            if (info.offset.y < -16 || info.velocity.y < -300) onExpandedChange(true);
            else if (info.offset.y > 16 || info.velocity.y > 300) onExpandedChange(false);
          }}
          onClick={() => {
            if (!panned.current) onExpandedChange(!expanded);
          }}
          className="flex w-full shrink-0 touch-none items-center justify-center"
          style={{ height: HANDLE }}
        >
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/35" />
        </motion.button>
        <div ref={peekRef} className="shrink-0">
          {peek}
        </div>
        <div id={bodyId} inert={!expanded} className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border/60">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
