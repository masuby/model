/** My submissions: only what the signed-in person authored, with status, reviewer feedback and the diff. */
import { ChevronDown, FileClock, MessageSquareReply, PenLine } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Segmented } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import type { Submission, SubmissionStatus } from '@/data-layer/types';
import { cn } from '@/lib/utils';
import { ChangeTable } from '../components/ChangeTable';
import { EmptyState, ErrorState, LevelBadge, ListSkeleton, StatusBadge } from '../components/common';
import { useAuthorityName } from '../components/SubmitPanel';
import { APPLIED_DIRECTLY_NOTE, useMySubmissions } from '../hooks';
import { dateTime, relativeTime } from '../lib/format';

type Filter = 'all' | SubmissionStatus;

export function MySubmissions({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation(['data', 'common']);
  const { query, mine } = useMySubmissions();
  const [filter, setFilter] = React.useState<Filter>('all');
  const counts = React.useMemo(() => {
    const c: Record<Filter, number> = { all: mine.length, pending: 0, approved: 0, rejected: 0 };
    for (const s of mine) c[s.status]++;
    return c;
  }, [mine]);
  const list = filter === 'all' ? mine : mine.filter((s) => s.status === filter);

  if (query.isLoading) return <ListSkeleton rows={3} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!mine.length)
    return (
      <EmptyState
        icon={<FileClock />}
        title={t('mine.emptyTitle')}
        description={t('mine.emptyLead')}
        action={
          <Button onClick={onStart}>
            <PenLine /> {t('mine.start')}
          </Button>
        }
      />
    );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Segmented
          aria-label={t('mine.filter')}
          value={filter}
          onValueChange={setFilter}
          options={(['all', 'pending', 'approved', 'rejected'] as const).map((f) => ({
            value: f,
            label: (
              <span className="inline-flex items-center gap-1.5">
                {f === 'all' ? t('mine.all') : t(`status.${f}`)}
                <span className="num rounded-full bg-muted px-1.5 text-[10px] font-semibold">{counts[f]}</span>
              </span>
            ),
          }))}
        />
      </div>
      {list.length ? (
        <ul className="space-y-3">
          {list.map((s, i) => (
            <motion.li key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}>
              <SubmissionItem submission={s} />
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t('mine.noneWithStatus')}</p>
      )}
    </div>
  );
}

export function SubmissionItem({ submission: s }: { submission: Submission }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const model = useModel();
  const authName = useAuthorityName();
  const [open, setOpen] = React.useState(false);
  const unit = model.byId.get(s.unitId);
  const reviewNote = s.reviewNote === APPLIED_DIRECTLY_NOTE ? t('mine.appliedDirectly') : s.reviewNote;
  const panelId = `sub-${s.id}`;
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{s.unitName}</span>
            <LevelBadge unit={unit} />
            <StatusBadge status={s.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('mine.summary', { count: s.changes.length, authority: authName(s.authority) })} ·{' '}
            <time dateTime={s.createdAt} title={dateTime(s.createdAt, i18n.language)}>
              {relativeTime(s.createdAt, i18n.language)}
            </time>
          </p>
        </div>
        <ChevronDown className={cn('mt-1 size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {s.status !== 'pending' && (s.reviewerName || reviewNote) && (
        <div className={cn('mx-5 mb-4 flex gap-2 rounded-xl border px-3 py-2 text-sm', s.status === 'approved' ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5')}>
          <MessageSquareReply className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {t(s.status === 'approved' ? 'mine.approvedBy' : 'mine.rejectedBy', { name: s.reviewerName ?? '—' })}
              {s.reviewedAt && ` · ${dateTime(s.reviewedAt, i18n.language)}`}
            </p>
            {reviewNote && <p className="mt-0.5 whitespace-pre-wrap">{reviewNote}</p>}
          </div>
        </div>
      )}
      {open && (
        <div id={panelId} className="space-y-3 border-t border-border px-5 py-4">
          <ChangeTable changes={s.changes} caption={s.unitName} />
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            {s.dataset && (
              <div>
                <dt className="text-muted-foreground">{t('meta.dataset')}</dt>
                <dd className="font-medium">{s.dataset}</dd>
              </div>
            )}
            {s.note && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">{t('meta.note')}</dt>
                <dd className="whitespace-pre-wrap">{s.note}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </Card>
  );
}
