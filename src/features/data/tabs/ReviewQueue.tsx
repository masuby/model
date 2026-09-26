/**
 * Review queue (PMO / admin): every pending submission as a card with its target unit, author,
 * provenance, a previous → proposed diff (flagging values that changed since submission) and the
 * class impact on every affected council. Approve / reject one by one or in bulk. The decision is
 * enforced server-side (Supabase `review_submission` re-checks the reviewer role).
 */
import { Check, CheckCheck, Inbox, Loader2, MessageSquareText, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, Input, Progress, Textarea } from '@/components/ui/primitives';
import { useData, useModel, useReview } from '@/data-layer/DataProvider';
import type { Submission } from '@/data-layer/types';
import type { RiskModel } from '@/engine/risk/types';
import { cn } from '@/lib/utils';
import { ChangeTable } from '../components/ChangeTable';
import { Checkbox, EmptyState, ErrorState, LevelBadge, ListSkeleton } from '../components/common';
import { ImpactList } from '../components/ImpactPreview';
import { NOTE_MAX, useAuthorityName } from '../components/SubmitPanel';
import { isOwnSubmission, useBatchOps, usePendingQueue } from '../hooks';
import { errorMessage } from '../lib/batch';
import { dateTime, matchesQuery, relativeTime } from '../lib/format';
import { currentValue, sharingCouncils, submissionImpact } from '../lib/targets';

const PAGE = 20;

export function ReviewQueue() {
  const { t } = useTranslation(['data', 'common']);
  const model = useModel();
  const { query, pending } = usePendingQueue();
  const { reviewMany, progress } = useBatchOps();
  const [q, setQ] = React.useState('');
  const [limit, setLimit] = React.useState(PAGE);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [bulk, setBulk] = React.useState<'approved' | 'rejected' | null>(null);
  const [bulkNote, setBulkNote] = React.useState('');

  const filtered = React.useMemo(() => pending.filter((s) => matchesQuery(q, s.unitName, s.unitId, s.region, s.authorName, s.authority, s.dataset, s.note)), [pending, q]);
  const pendingIds = React.useMemo(() => new Set(pending.map((s) => s.id)), [pending]);
  const selectedIds = [...selected].filter((id) => pendingIds.has(id));
  const visible = filtered.slice(0, limit);
  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.has(s.id));

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const toggleAll = (on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of visible) {
        if (on) next.add(s.id);
        else next.delete(s.id);
      }
      return next;
    });

  const runBulk = async () => {
    if (!bulk) return;
    if (bulk === 'rejected' && !bulkNote.trim()) return;
    try {
      const out = await reviewMany(selectedIds, bulk, bulkNote.trim() || undefined);
      const failed = out.filter((o) => !o.ok).length;
      const ok = out.length - failed;
      if (failed) toast.warning(t('review.bulkPartial', { ok, failed }));
      else toast.success(t(bulk === 'approved' ? 'review.bulkApproved' : 'review.bulkRejected', { count: ok }));
      setSelected(new Set());
      setBulk(null);
      setBulkNote('');
    } catch (e) {
      toast.error(t('review.error'), { description: errorMessage(e) });
    }
  };

  if (query.isLoading) return <ListSkeleton rows={3} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!pending.length) return <EmptyState icon={<Inbox />} title={t('review.emptyTitle')} description={t('review.emptyLead')} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 px-1 text-sm font-medium">
          <Checkbox checked={allVisibleSelected} onChange={(e) => toggleAll(e.target.checked)} aria-label={t('review.selectAll')} />
          <span className="whitespace-nowrap">{selectedIds.length ? t('review.selected', { count: selectedIds.length }) : t('review.selectAll')}</span>
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('review.search')} aria-label={t('review.search')} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="success" size="sm" disabled={!selectedIds.length} onClick={() => setBulk('approved')}>
            <CheckCheck /> {t('review.approveSelected')}
          </Button>
          <Button variant="outline" size="sm" disabled={!selectedIds.length} onClick={() => setBulk('rejected')}>
            <X /> {t('review.rejectSelected')}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t('review.count', { count: filtered.length, total: pending.length })}
      </p>

      <ul className="space-y-4">
        <AnimatePresence initial={false}>
          {visible.map((s) => (
            <motion.li key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.2 }}>
              <ReviewCard submission={s} model={model} selected={selected.has(s.id)} onSelect={(on) => toggle(s.id, on)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {filtered.length > limit && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
            {t('review.more', { count: filtered.length - limit })}
          </Button>
        </div>
      )}

      <Dialog open={bulk != null} onOpenChange={(o) => !o && !progress && setBulk(null)}>
        <DialogContent
          title={bulk === 'approved' ? t('review.bulkApproveTitle', { count: selectedIds.length }) : t('review.bulkRejectTitle', { count: selectedIds.length })}
          description={bulk === 'approved' ? t('review.bulkApproveLead') : t('review.bulkRejectLead')}
        >
          <div className="space-y-3 p-5">
            <label htmlFor="bulk-note" className="text-sm font-medium">
              {bulk === 'rejected' ? t('review.reasonRequired') : t('review.noteOptional')}
            </label>
            <Textarea id="bulk-note" value={bulkNote} maxLength={NOTE_MAX} onChange={(e) => setBulkNote(e.target.value)} placeholder={t('review.notePlaceholder')} />
            {progress && (
              <div aria-live="polite">
                <Progress value={(progress.done / Math.max(1, progress.total)) * 100} />
                <p className="mt-1.5 text-xs text-muted-foreground">{t('review.progress', { done: progress.done, total: progress.total })}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setBulk(null)} disabled={!!progress}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant={bulk === 'approved' ? 'success' : 'danger'} onClick={runBulk} disabled={!!progress || (bulk === 'rejected' && !bulkNote.trim())}>
              {progress ? <Loader2 className="animate-spin" aria-hidden /> : bulk === 'approved' ? <Check aria-hidden /> : <X aria-hidden />}
              {bulk === 'approved' ? t('review.approve') : t('review.reject')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewCard({ submission: s, model, selected, onSelect }: { submission: Submission; model: RiskModel; selected: boolean; onSelect: (on: boolean) => void }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const { profile, mode: dataMode } = useData();
  const review = useReview();
  const authName = useAuthorityName();
  const [mode, setMode] = React.useState<'approved' | 'rejected' | null>(null);
  const [note, setNote] = React.useState('');
  const unit = model.byId.get(s.unitId);
  const sharing = unit?.level === 'source' ? sharingCouncils(model, unit.id) : [];
  const impacts = React.useMemo(() => submissionImpact(model, s.unitId, s.changes), [model, s]);
  const own = !!profile && isOwnSubmission(s, profile, dataMode);
  const busy = review.isPending;
  const noteId = `review-note-${s.id}`;

  const decide = async (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !note.trim()) return;
    try {
      await review.mutateAsync({ id: s.id, decision, note: note.trim() || undefined });
      toast.success(t(decision === 'approved' ? 'review.approvedToast' : 'review.rejectedToast', { name: s.unitName }));
    } catch (e) {
      toast.error(t('review.error'), { description: errorMessage(e) });
    }
  };

  return (
    <Card className={cn('overflow-hidden transition-shadow', selected && 'ring-2 ring-primary/40')}>
      <div className="flex items-start gap-3 px-5 pt-5">
        <Checkbox className="mt-1" checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={t('review.selectOne', { name: s.unitName })} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold">{s.unitName}</h3>
            <LevelBadge unit={unit} />
            {!unit && <Badge variant="warning">{t('review.unknownUnit')}</Badge>}
            {own && <Badge variant="outline">{t('review.own')}</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {s.region} · {t('review.byLine', { author: s.authorName })} ·{' '}
            <time dateTime={s.createdAt} title={dateTime(s.createdAt, i18n.language)}>
              {relativeTime(s.createdAt, i18n.language)}
            </time>
          </p>
          {sharing.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{t('confirm.appliesTo', { names: sharing.map((c) => c.name).join(', ') })}</p>}
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <div>
            <dt className="inline text-muted-foreground">{t('meta.authority')}: </dt>
            <dd className="inline font-medium">{authName(s.authority)}</dd>
          </div>
          {s.dataset && (
            <div>
              <dt className="inline text-muted-foreground">{t('meta.dataset')}: </dt>
              <dd className="inline font-medium">{s.dataset}</dd>
            </div>
          )}
        </dl>
        {s.note && (
          <blockquote className="flex gap-2 rounded-xl border-l-4 border-primary/40 bg-muted/40 px-3 py-2 text-sm">
            <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="whitespace-pre-wrap">{s.note}</span>
          </blockquote>
        )}
        <ChangeTable changes={s.changes} currentOf={unit ? (ref) => currentValue(unit, ref) : undefined} caption={s.unitName} />
        <ImpactList impacts={impacts} />
      </div>

      <div className="border-t border-border bg-muted/20 px-5 py-3">
        {mode ? (
          <div className="space-y-2">
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMode('approved')} disabled={busy}>
              <MessageSquareText /> {t('review.approveWithNote')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMode('rejected')} disabled={busy}>
              <X /> {t('review.reject')}…
            </Button>
            <Button variant="success" size="sm" onClick={() => decide('approved')} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />} {t('review.approve')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
