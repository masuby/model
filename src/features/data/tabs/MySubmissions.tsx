/** My submissions: only what the signed-in person authored, with status, reviewer feedback and the diff. */
import { ChevronDown, PenLine } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import type { Submission, SubmissionStatus } from '@/data-layer/types';
import { cn, NO_VALUE } from '@/lib/utils';
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
    <div className="space-y-5">
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
                <span className="num text-xs text-muted-foreground">{counts[f]}</span>
              </span>
            ),
          }))}
        />
      </div>
      {list.length ? (
        <ul className="divide-y divide-border border-y border-border">
          {list.map((s) => (
            <li key={s.id}>
              <SubmissionItem submission={s} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-y border-border py-8 text-sm text-muted-foreground">{t('mine.noneWithStatus')}</p>
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
    <article className="py-1">
      <button
        type="button"
        className="-mx-3 flex w-[calc(100%+1.5rem)] items-start gap-4 rounded-md px-3 py-4 text-left transition-colors hover:bg-muted/50"
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
          <p className="mt-1 text-sm text-muted-foreground">
            {t('mine.summary', { count: s.changes.length, authority: authName(s.authority) })} ·{' '}
            <time dateTime={s.createdAt} title={dateTime(s.createdAt, i18n.language)}>
              {relativeTime(s.createdAt, i18n.language)}
            </time>
          </p>
        </div>
        <ChevronDown className={cn('mt-1 size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {s.status !== 'pending' && (s.reviewerName || reviewNote) && (
        <div className={cn('mb-4 max-w-3xl border-l-2 pl-4 text-sm', s.status === 'approved' ? 'border-success' : 'border-danger')}>
          <p className="text-xs text-muted-foreground">
            {t(s.status === 'approved' ? 'mine.approvedBy' : 'mine.rejectedBy', { name: s.reviewerName ?? NO_VALUE })}
            {s.reviewedAt && ` · ${dateTime(s.reviewedAt, i18n.language)}`}
          </p>
          {reviewNote && <p className="mt-0.5 leading-relaxed whitespace-pre-wrap">{reviewNote}</p>}
        </div>
      )}
      {open && (
        <div id={panelId} className="space-y-4 pb-5">
          <ChangeTable changes={s.changes} caption={s.unitName} />
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {s.dataset && (
              <div>
                <dt className="text-xs text-muted-foreground">{t('meta.dataset')}</dt>
                <dd className="font-medium">{s.dataset}</dd>
              </div>
            )}
            {s.note && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">{t('meta.note')}</dt>
                <dd className="whitespace-pre-wrap">{s.note}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </article>
  );
}
