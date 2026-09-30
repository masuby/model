/** Approved data: measured values from institutions, then direct 0–10 score changes. */
import { useTranslation } from 'react-i18next';
import { useOverrides, useRawValues } from '@/data-layer/DataProvider';
import { ListSkeleton } from '../components/common';
import { ApprovedChanges } from './ApprovedChanges';
import { ApprovedMeasured } from './ApprovedMeasured';

export function Approved() {
  const { t } = useTranslation('data');
  const raw = useRawValues();
  const ov = useOverrides();
  if (raw.isLoading || ov.isLoading) return <ListSkeleton rows={2} />;
  const measured = raw.data?.length ?? 0;
  // Nothing measured yet: the score changes (with their own empty state) are the whole story.
  if (!measured) return <ApprovedChanges />;
  const hasScores = Object.values(ov.data ?? {}).some((refs) => refs && Object.values(refs).some(Boolean));

  return (
    <div className="space-y-14">
      <section aria-labelledby="approved-measured">
        <h3 id="approved-measured" className="font-display text-xl font-semibold">
          {t('workflow.approved.measuredTitle', { count: measured })}
        </h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('workflow.approved.measuredLead')}</p>
        <div className="mt-4">
          <ApprovedMeasured />
        </div>
      </section>
      {hasScores && (
        <section aria-labelledby="approved-scores">
          <h3 id="approved-scores" className="font-display text-xl font-semibold">
            {t('workflow.approved.scoresTitle')}
          </h3>
          <div className="mt-4">
            <ApprovedChanges />
          </div>
        </section>
      )}
    </div>
  );
}
