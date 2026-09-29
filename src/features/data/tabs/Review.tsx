/** Review (PMO / admin): measured values from institutions first, then direct 0–10 score changes. */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useRawSubmissions } from '@/data-layer/DataProvider';
import { EmptyState, ErrorState, ListSkeleton } from '../components/common';
import { usePendingQueue } from '../hooks';
import { RawReviewList } from './RawReview';
import { ReviewQueue } from './ReviewQueue';

export function Review() {
  const { t } = useTranslation('data');
  const { query, pending } = usePendingQueue();
  const raw = useRawSubmissions();
  const rawPending = React.useMemo(() => (raw.data ?? []).filter((s) => s.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [raw.data]);

  if (query.isLoading || raw.isLoading) return <ListSkeleton rows={3} />;
  if (raw.isError) return <ErrorState error={raw.error} onRetry={() => void raw.refetch()} />;
  if (!pending.length && !rawPending.length && !query.isError) return <EmptyState title={t('review.emptyTitle')} description={t('review.emptyLead')} />;
  if (!rawPending.length) return <ReviewQueue />;

  return (
    <div className="space-y-14">
      <section aria-labelledby="review-measured">
        <h3 id="review-measured" className="font-display text-xl font-semibold">
          {t('workflow.review.measuredTitle', { count: rawPending.length })}
        </h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('workflow.review.measuredLead')}</p>
        <div className="mt-4">
          <RawReviewList items={rawPending} />
        </div>
      </section>
      {(pending.length > 0 || query.isError) && (
        <section aria-labelledby="review-scores">
          <h3 id="review-scores" className="font-display text-xl font-semibold">
            {t('workflow.review.scoresTitle', { count: pending.length })}
          </h3>
          <div className="mt-4">
            <ReviewQueue />
          </div>
        </section>
      )}
    </div>
  );
}
