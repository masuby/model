/**
 * The risk level of an area as a filled badge in its colour band ("High risk" on orange), and a coloured
 * dot for the warning levels of published warnings. The badge always names the INFORM class, so colour
 * is never the only signal.
 */
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ALERT_COLOR, onAlertColor, riskBandFor } from './alert';
import type { AlertLevel } from './data';

/** "Level 2 · Warning" on the level's colour: the Guide Book level of a class or of one hazard's score. */
export function LevelBadge({ level, size = 'md', className }: { level: AlertLevel; size?: 'sm' | 'md'; className?: string }) {
  const { t } = useTranslation('guide');
  return (
    <span
      className={cn('inline-flex items-center rounded-full font-semibold whitespace-nowrap', size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm', className)}
      style={{ background: ALERT_COLOR[level], color: onAlertColor(level) }}
    >
      <span className="sr-only">{t('levels.label')}:</span> <span>{t('levels.badge', { n: level, name: t(`levels.${level}.name`) })}</span>
    </span>
  );
}

export function AlertDot({ level, className }: { level: AlertLevel; className?: string }) {
  // The ring keeps the yellow visible on a light page.
  return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-full ring-1 ring-foreground/30', className)} style={{ background: ALERT_COLOR[level] }} />;
}

/** "{Class} risk" on the class's colour band; nothing without a score. */
export function RiskBandBadge({ risk, size = 'md', className }: { risk: number | null | undefined; size?: 'sm' | 'md'; className?: string }) {
  const { t } = useTranslation(['guide', 'common']);
  const r = riskBandFor(risk);
  if (!r) return null;
  return (
    <span
      className={cn('inline-flex items-center rounded-full font-semibold whitespace-nowrap', size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm', className)}
      style={{ background: r.color, color: onAlertColor(r.band) }}
    >
      {/* The space sits outside the hidden label, where accessible-name computation keeps it. */}
      <span className="sr-only">{t('guide:risk.label')}:</span> <span>{t('guide:risk.badge', { cls: t(`common:classes.${r.cls}`) })}</span>
    </span>
  );
}
