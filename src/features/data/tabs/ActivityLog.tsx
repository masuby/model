/** Activity (reviewers): the audit trail, from submissions and approvals to assignments, requests and validations. */
import { Archive, BadgeCheck, CheckCircle2, Mail, RotateCcw, Send, Trash2, Upload, UserCheck, XCircle, type LucideIcon } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAudit } from '@/data-layer/DataProvider';
import type { AuditEntry } from '@/data-layer/types';
import { cn, formatDate } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton } from '../components/common';
import { dateTime, dayKey, relativeTime } from '../lib/format';
import { localiseDetail } from '../lib/activity';
import { isSpecId, specLabel } from '../lib/workflow';

/** A small status glyph per action, coloured only where the colour means something (approve / reject). */
const ICONS: Record<AuditEntry['action'], { icon: LucideIcon; cls: string }> = {
  submitted: { icon: Send, cls: 'text-muted-foreground' },
  approved: { icon: CheckCircle2, cls: 'text-success' },
  rejected: { icon: XCircle, cls: 'text-danger' },
  reverted: { icon: RotateCcw, cls: 'text-warning' },
  imported: { icon: Upload, cls: 'text-muted-foreground' },
  reset: { icon: Trash2, cls: 'text-danger' },
  assigned: { icon: UserCheck, cls: 'text-muted-foreground' },
  requested: { icon: Mail, cls: 'text-muted-foreground' },
  validated: { icon: BadgeCheck, cls: 'text-success' },
  closed: { icon: Archive, cls: 'text-muted-foreground' },
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
  if (!days.length) return <EmptyState title={t('activity.emptyTitle')} description={t('activity.emptyLead')} />;

  return (
    <div className="space-y-10">
      {days.map(([day, entries]) => (
        <section key={day} aria-labelledby={`day-${day}`}>
          <h3 id={`day-${day}`} className="mb-2 text-sm font-semibold">
            {formatDate(entries[0].at, i18n.language, { dateStyle: 'full' })}
          </h3>
          <ol className="divide-y divide-border border-y border-border">
            {entries.map((e) => {
              const { icon: Icon, cls } = ICONS[e.action] ?? ICONS.submitted;
              const detail = localiseDetail(e, t);
              const subject = e.unitId && isSpecId(e.unitId) ? specLabel(t, e.unitId) : (e.unitName ?? e.unitId);
              return (
                <li key={e.id} className="flex gap-3 py-3">
                  <Icon className={cn('mt-0.5 size-4 shrink-0', cls)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{e.actor}</span> {t(`activity.actions.${e.action}`)}{' '}
                      {subject && <span className="font-medium">{subject}</span>}
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
        </section>
      ))}
    </div>
  );
}
