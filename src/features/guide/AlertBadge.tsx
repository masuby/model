/**
 * The alert category as a coloured mark: a dot (in selectors and lists) or a filled badge (beside the
 * risk class). The badge always names the category, so colour is never the only signal.
 */
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ALERT_COLOR, onAlertColor } from './alert';
import type { AlertLevel } from './data';

export function AlertDot({ level, className }: { level: AlertLevel; className?: string }) {
  // The ring keeps the yellow visible on a light page.
  return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-full ring-1 ring-foreground/30', className)} style={{ background: ALERT_COLOR[level] }} />;
}

export function AlertBadge({ level, size = 'md', title, className }: { level: AlertLevel; size?: 'sm' | 'md'; title?: string; className?: string }) {
  const { t } = useTranslation('guide');
  return (
    <span
      title={title}
      className={cn('inline-flex items-center rounded-full font-semibold whitespace-nowrap', size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm', className)}
      style={{ background: ALERT_COLOR[level], color: onAlertColor(level) }}
    >
      {/* The space sits outside the hidden label, where accessible-name computation keeps it. */}
      <span className="sr-only">{t('alert.label')}:</span> {t(`levels.${level}.name`)}
    </span>
  );
}
