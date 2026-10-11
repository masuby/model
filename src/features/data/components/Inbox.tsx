/**
 * The institution's inbox (DE-07): the requests sent to it, the due-date reminders and the decisions on
 * its submissions, newest first, each opening the indicator it concerns. Reviewers see every
 * institution's. E-mail delivery is the Office's sender (migration 0011); until it is configured the
 * inbox is the channel and each item says so.
 */
import { Bell, Check, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMarkNotificationRead, useNotifications } from '@/data-layer/DataProvider';
import type { Notification } from '@/data-layer/types';
import { cn, formatDate } from '@/lib/utils';
import { usePermissions } from '../hooks';
import { relativeTime } from '../lib/format';

const SHOWN = 12;

export function Inbox({ onOpen }: { onOpen: (specId: string) => void }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const { canReview } = usePermissions();
  const q = useNotifications();
  const mark = useMarkNotificationRead();
  const [all, setAll] = React.useState(false);
  const items = React.useMemo(() => [...(q.data ?? [])].sort((a, b) => Number(!!a.readAt) - Number(!!b.readAt) || b.createdAt.localeCompare(a.createdAt)), [q.data]);
  if (!items.length) return null;
  const unread = items.filter((n) => !n.readAt);
  const shown = all ? items : items.slice(0, SHOWN);
  const kindTone: Record<Notification['kind'], string> = { request: 'text-primary', reminder: 'text-warning', decision: 'text-foreground' };
  return (
    <section aria-labelledby="inbox-title" className="mt-6 border-y border-border py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="inbox-title" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Bell className="size-4 text-muted-foreground" aria-hidden /> {t('inbox.title')}
          {unread.length > 0 && <Badge variant="secondary">{t('inbox.unread', { count: unread.length })}</Badge>}
        </h3>
        {unread.length > 1 && !canReview && (
          <Button variant="ghost" size="sm" disabled={mark.isPending} onClick={() => unread.forEach((n) => mark.mutate(n.id))}>
            <Check /> {t('inbox.markAll')}
          </Button>
        )}
      </div>
      <ul className="mt-3 divide-y divide-border">
        {shown.map((n) => (
          <li key={n.id} className={cn('grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center', n.readAt && 'text-muted-foreground')}>
            <div className="min-w-0">
              <p className="text-sm">
                <span className={cn('text-xs font-semibold tracking-wide uppercase', kindTone[n.kind])}>{t(`inbox.kinds.${n.kind}`)}</span>
                <span className="mx-2 text-muted-foreground" aria-hidden>
                  ·
                </span>
                <span className={cn(!n.readAt && 'font-medium')}>{n.title}</span>
                {canReview && <span className="ml-2 text-xs text-muted-foreground">{n.institutionKey}</span>}
              </p>
              {n.body && <p className="mt-0.5 text-sm leading-relaxed">{n.body}</p>}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {relativeTime(n.createdAt, i18n.language)}
                {n.dueDate && ` · ${t('inbox.due', { date: formatDate(n.dueDate, i18n.language) })}`}
                {` · ${t(`inbox.email.${n.emailStatus}`)}`}
              </p>
            </div>
            <div className="no-print flex flex-wrap items-center gap-2">
              {n.specId && (
                <Button variant="outline" size="sm" onClick={() => onOpen(n.specId!)}>
                  {t('inbox.open')} <ChevronRight />
                </Button>
              )}
              {!n.readAt && !canReview && (
                <Button variant="ghost" size="sm" disabled={mark.isPending} onClick={() => mark.mutate(n.id)}>
                  <Check /> {t('inbox.markRead')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {items.length > SHOWN && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAll((v) => !v)}>
          {all ? t('inbox.showFewer') : t('inbox.showAll', { count: items.length })}
        </Button>
      )}
    </section>
  );
}
