/**
 * Review of measured values (PMO / admin). Each submission is one indicator across many areas: the
 * table shows what applies today and what is proposed, with the 0–10 scores, and the councils whose
 * scores would move once approved (computed with the real pipeline). Approval runs server-side in
 * `review_raw_submission`, which re-checks the reviewer's role and closes the linked request.
 */
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, MessageSquareText, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/primitives';
import { baseModel, loadBaseline, useData, useModel, useOverrides, useRawValues, useRequests, useReviewRaw } from '@/data-layer/DataProvider';
import type { RawSubmission } from '@/data-layer/types';
import { isNum } from '@/engine/risk/math';
import { indexRawValues, scoreRaw } from '@/engine/risk/rawValues';
import { cn, formatScore, NO_VALUE } from '@/lib/utils';
import { ImpactList } from '../components/ImpactPreview';
import { NOTE_MAX } from '../components/SubmitPanel';
import { errorMessage } from '../lib/batch';
import { dateTime, relativeTime } from '../lib/format';
import { buildSheet, councilsReached, rawImpact, specLabel, workflowIndicator, type SheetRow } from '../lib/workflow';
import { formatRaw, InstitutionLabel, LevelTag, RequestSummary } from '../workflow/bits';

export function RawReviewList({ items }: { items: RawSubmission[] }) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((s) => (
        <li key={s.id}>
          <RawReviewItem submission={s} />
        </li>
      ))}
    </ul>
  );
}

function RawReviewItem({ submission: s }: { submission: RawSubmission }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const lang = i18n.language;
  const { profile } = useData();
  const model = useModel();
  const explicit = useOverrides();
  const rawValues = useRawValues();
  const requests = useRequests();
  const baseline = useQuery({ queryKey: ['baseline'], queryFn: loadBaseline, staleTime: Infinity });
  const review = useReviewRaw();
  const [mode, setMode] = React.useState<'approved' | 'rejected' | null>(null);
  const [note, setNote] = React.useState('');
  const w = workflowIndicator(s.specId);
  const spec = w?.spec;
  const own = !!profile && s.authorId === profile.id && s.authorName === profile.fullName;
  const request = s.requestId ? (requests.data ?? []).find((r) => r.id === s.requestId) : undefined;

  const idx = React.useMemo(() => indexRawValues(rawValues.data ?? []), [rawValues.data]);
  const rows = React.useMemo(() => {
    if (!spec) return new Map<string, SheetRow>();
    const sheet = buildSheet(model, spec, idx, baseline.data ?? null);
    const m = new Map<string, SheetRow>([[sheet.national.unit.id, sheet.national]]);
    for (const r of sheet.regions) {
      m.set(r.unit.id, r);
      for (const c of r.councils) m.set(c.unit.id, c);
    }
    return m;
  }, [model, spec, idx, baseline.data]);
  const reached = React.useMemo(() => councilsReached(model, idx, s.specId, s.entries), [model, idx, s]);
  const impacts = React.useMemo(
    () =>
      w?.core && explicit.data && rawValues.data && baseline.data
        ? rawImpact({ explicit: explicit.data, raw: rawValues.data, base: baseModel(), baseline: baseline.data, current: model }, s.specId, s.entries)
        : [],
    [w, explicit.data, rawValues.data, baseline.data, model, s],
  );

  const decide = async (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !note.trim()) return;
    try {
      await review.mutateAsync({ id: s.id, decision, note: note.trim() || undefined });
      toast.success(t(decision === 'approved' ? 'workflow.review.approved' : 'workflow.review.rejected', { name: specLabel(t, s.specId) }));
    } catch (e) {
      toast.error(t('review.error'), { description: errorMessage(e) });
    }
  };
  const noteId = `raw-review-note-${s.id}`;
  const busy = review.isPending;

  return (
    <article aria-labelledby={`raw-review-${s.id}`} className="py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={`raw-review-${s.id}`} className="text-base font-semibold">
          {specLabel(t, s.specId)}
        </h3>
        <span className="font-mono text-xs text-muted-foreground">{s.specId}</span>
        {!w?.core && <Badge variant="outline">{t('workflow.advancedShort')}</Badge>}
        {own && <Badge variant="outline">{t('review.own')}</Badge>}
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {t('review.byLine', { author: s.authorName })} ·{' '}
        <time dateTime={s.createdAt} title={dateTime(s.createdAt, lang)}>
          {relativeTime(s.createdAt, lang)}
        </time>
      </p>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <dt className="inline text-muted-foreground">{t('workflow.owner')}: </dt>
          <dd className="inline">
            <InstitutionLabel institutionKey={s.institutionKey} withKind />
          </dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">{t('meta.dataset')}: </dt>
          <dd className="inline font-medium">
            {s.dataset}
            {s.period && ` (${s.period})`}
          </dd>
        </div>
        {request && (
          <div>
            <dt className="inline text-muted-foreground">{t('workflow.sheet.request')}: </dt>
            <dd className="inline">
              <RequestSummary request={request} />
            </dd>
          </div>
        )}
      </dl>
      {s.note && <blockquote className="mt-3 max-w-3xl border-l-2 border-border pl-4 text-sm leading-relaxed whitespace-pre-wrap">{s.note}</blockquote>}

      <div className={cn('mt-5 grid gap-6', impacts.length > 0 && 'xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-10')}>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-muted-foreground">{t('workflow.review.values', { count: s.entries.length, reached })}</h4>
          <div className="mt-1.5 max-h-96 overflow-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <caption className="sr-only">{specLabel(t, s.specId)}</caption>
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    {t('workflow.sheet.col.area')}
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    {t('workflow.sheet.col.now')}
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    {t('workflow.review.proposed')}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    {t('workflow.sheet.col.score')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {s.entries.map((e) => {
                  const row = rows.get(e.unitId);
                  const before = row?.current?.raw ?? null;
                  const sBefore = spec ? scoreRaw(spec, before) : null;
                  const sAfter = spec ? scoreRaw(spec, e.value) : null;
                  return (
                    <tr key={e.unitId} className="border-b border-border">
                      <th scope="row" className="py-2 pr-3 text-left font-normal">
                        <span className="font-medium">{row?.unit.name ?? e.unitId}</span> <LevelTag level={e.level} className="ml-1" />
                      </th>
                      <td className="num py-2 pr-3 text-muted-foreground">
                        {isNum(before) ? formatRaw(before, lang) : NO_VALUE}
                        {row?.current && row.current.level !== e.level && <span className="ml-1 text-xs">({t(`common:valueLevel.${row.current.level}`)})</span>}
                      </td>
                      <td className="num py-2 pr-3 font-medium">{isNum(e.value) ? formatRaw(e.value, lang) : t('workflow.sheet.noDataShort')}</td>
                      <td className="num py-2 text-right">
                        <span className="text-muted-foreground">{isNum(sBefore) ? formatScore(sBefore) : NO_VALUE}</span> → {isNum(sAfter) ? formatScore(sAfter) : NO_VALUE}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <ImpactList impacts={impacts} />
      </div>

      <div className="mt-5">
        {mode ? (
          <div className="max-w-2xl space-y-2">
            <label htmlFor={noteId} className="text-sm font-medium">
              {mode === 'rejected' ? t('review.reasonRequired') : t('review.noteOptional')}
            </label>
            <Textarea id={noteId} autoFocus value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} placeholder={t('review.notePlaceholder')} className="min-h-20" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setMode(null)} disabled={busy}>
                {t('common:actions.cancel')}
              </Button>
              <Button variant={mode === 'approved' ? 'success' : 'danger'} size="sm" onClick={() => decide(mode)} disabled={busy || (mode === 'rejected' && !note.trim())}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : mode === 'approved' ? <Check aria-hidden /> : <X aria-hidden />}
                {mode === 'approved' ? t('review.approve') : t('review.reject')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="success" size="sm" onClick={() => decide('approved')} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />} {t('review.approve')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMode('rejected')} disabled={busy}>
              <X /> {t('review.reject')}…
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMode('approved')} disabled={busy}>
              <MessageSquareText /> {t('review.approveWithNote')}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
