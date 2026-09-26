/** Activity (reviewers): the audit trail — submissions, approvals, rejections, reverts, imports, resets. */
import { CheckCircle2, History, RotateCcw, Send, Trash2, Upload, XCircle, type LucideIcon } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { useAudit } from '@/data-layer/DataProvider';
import type { AuditEntry } from '@/data-layer/types';
import { cn, formatDate } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton } from '../components/common';
import { APPLIED_DIRECTLY_NOTE } from '../hooks';
import { dateTime, dayKey, relativeTime } from '../lib/format';

const ICONS: Record<AuditEntry['action'], { icon: LucideIcon; cls: string }> = {
  submitted: { icon: Send, cls: 'bg-primary/10 text-primary' },
  approved: { icon: CheckCircle2, cls: 'bg-success/10 text-success' },
  rejected: { icon: XCircle, cls: 'bg-danger/10 text-danger' },
  reverted: { icon: RotateCcw, cls: 'bg-warning/10 text-warning' },
  imported: { icon: Upload, cls: 'bg-primary/10 text-primary' },
  reset: { icon: Trash2, cls: 'bg-danger/10 text-danger' },
};

export function ActivityLog() {
  const { t, i18n } = useTranslation(['data', 'common']);
  const q = useAudit(300);
  const days = React.useMemo(() => {
    const m = new Map<string, AuditEntry[]>();
    for (const e of q.data ?? []) {
      const k = dayKey(e.at);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return [...m.entries()];
  }, [q.data]);

  if (q.isLoading) return <ListSkeleton rows={2} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  if (!days.length) return <EmptyState icon={<History />} title={t('activity.emptyTitle')} description={t('activity.emptyLead')} />;

  return (
    <div className="space-y-6">
      {days.map(([day, entries]) => (
        <section key={day} aria-labelledby={`day-${day}`}>
          <h3 id={`day-${day}`} className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {formatDate(entries[0].at, i18n.language, { dateStyle: 'full' })}
          </h3>
          <Card>
            <ol className="divide-y divide-border">
              {entries.map((e) => {
                const { icon: Icon, cls } = ICONS[e.action] ?? ICONS.submitted;
                const detail = e.detail === APPLIED_DIRECTLY_NOTE ? t('mine.appliedDirectly') : e.detail;
                return (
                  <li key={e.id} className="flex gap-3 px-5 py-3">
                    <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', cls)}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{e.actor}</span> {t(`activity.actions.${e.action}`)}{' '}
                        {(e.unitName || e.unitId) && <span className="font-medium">{e.unitName ?? e.unitId}</span>}
                      </p>
                      {detail && <p className="mt-0.5 text-xs break-words text-muted-foreground">{detail}</p>}
                    </div>
                    <time dateTime={e.at} title={dateTime(e.at, i18n.language)} className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(e.at, i18n.language)}
                    </time>
                  </li>
                );
              })}
            </ol>
          </Card>
        </section>
      ))}
    </div>
  );
}
