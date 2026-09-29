/**
 * My submissions: only what the signed-in person authored (indicator scores and measured values), newest
 * first, with status, reviewer feedback and what was sent.
 */
import { ChevronDown, PenLine } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/primitives';
import { useData, useModel, useRawSubmissions } from '@/data-layer/DataProvider';
import type { RawSubmission, Submission, SubmissionStatus } from '@/data-layer/types';
import { isNum } from '@/engine/risk/math';
import { cn, NO_VALUE } from '@/lib/utils';
import { ChangeTable } from '../components/ChangeTable';
import { EmptyState, ErrorState, LevelBadge, ListSkeleton, StatusBadge } from '../components/common';
import { useAuthorityName } from '../components/SubmitPanel';
import { APPLIED_DIRECTLY_NOTE, useMySubmissions } from '../hooks';
import { dateTime, relativeTime } from '../lib/format';
import { specLabel } from '../lib/workflow';
import { formatRaw, LevelTag } from '../workflow/bits';

type Filter = 'all' | SubmissionStatus;

type Item = { kind: 'score'; s: Submission } | { kind: 'raw'; s: RawSubmission };

export function MySubmissions({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation(['data', 'common']);
  const { query, mine } = useMySubmissions();
  const raw = useRawSubmissions();
  const { profile, mode } = useData();
  const [filter, setFilter] = React.useState<Filter>('all');
  const items = React.useMemo<Item[]>(() => {
    // In demo mode all roles share one browser: match the (role-specific) name as well as the id.
    const rawMine = (raw.data ?? []).filter((s) => profile && s.authorId === profile.id && (mode === 'supabase' || s.authorName === profile.fullName));
    return [...mine.map((s) => ({ kind: 'score' as const, s })), ...rawMine.map((s) => ({ kind: 'raw' as const, s }))].sort((a, b) => b.s.createdAt.localeCompare(a.s.createdAt));
  }, [mine, raw.data, profile, mode]);
  const counts = React.useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, pending: 0, approved: 0, rejected: 0 };
    for (const i of items) c[i.s.status]++;
    return c;
  }, [items]);
  const list = filter === 'all' ? items : items.filter((i) => i.s.status === filter);

  if (query.isLoading || raw.isLoading) return <ListSkeleton rows={3} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (raw.isError) return <ErrorState error={raw.error} onRetry={() => void raw.refetch()} />;
  if (!items.length)
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
          {list.map((i) => (
            <li key={`${i.kind}-${i.s.id}`}>{i.kind === 'score' ? <SubmissionItem submission={i.s} /> : <RawSubmissionItem submission={i.s} />}</li>
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

/** A submission of measured values: one indicator, many areas. */
export function RawSubmissionItem({ submission: s }: { submission: RawSubmission }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const lang = i18n.language;
  const model = useModel();
  const [open, setOpen] = React.useState(false);
  const reviewNote = s.reviewNote === APPLIED_DIRECTLY_NOTE ? t('mine.appliedDirectly') : s.reviewNote;
  const panelId = `raw-sub-${s.id}`;
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
            <span className="font-semibold">{specLabel(t, s.specId)}</span>
            <StatusBadge status={s.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('workflow.mineSummary', { count: s.entries.length, dataset: s.dataset })} ·{' '}
            <time dateTime={s.createdAt} title={dateTime(s.createdAt, lang)}>
              {relativeTime(s.createdAt, lang)}
            </time>
          </p>
        </div>
        <ChevronDown className={cn('mt-1 size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {s.status !== 'pending' && (s.reviewerName || reviewNote) && (
        <div className={cn('mb-4 max-w-3xl border-l-2 pl-4 text-sm', s.status === 'approved' ? 'border-success' : 'border-danger')}>
          <p className="text-xs text-muted-foreground">
            {t(s.status === 'approved' ? 'mine.approvedBy' : 'mine.rejectedBy', { name: s.reviewerName ?? NO_VALUE })}
            {s.reviewedAt && ` · ${dateTime(s.reviewedAt, lang)}`}
          </p>
          {reviewNote && <p className="mt-0.5 leading-relaxed whitespace-pre-wrap">{reviewNote}</p>}
        </div>
      )}
      {open && (
        <div id={panelId} className="max-w-3xl space-y-4 pb-5">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{specLabel(t, s.specId)}</caption>
            <tbody>
              {s.entries.map((e) => (
                <tr key={e.unitId} className="border-b border-border">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    {model.byId.get(e.unitId)?.name ?? e.unitId} <LevelTag level={e.level} className="ml-1" />
                  </th>
                  <td className="num py-2 text-right font-medium">{isNum(e.value) ? formatRaw(e.value, lang) : t('workflow.sheet.noDataShort')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(s.period || s.note) && (
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {s.period && (
                <div>
                  <dt className="text-xs text-muted-foreground">{t('workflow.sheet.period')}</dt>
                  <dd className="font-medium">{s.period}</dd>
                </div>
              )}
              {s.note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">{t('meta.note')}</dt>
                  <dd className="whitespace-pre-wrap">{s.note}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
    </article>
  );
}
