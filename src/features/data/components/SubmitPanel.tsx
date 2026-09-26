/**
 * Provenance fields (authority, dataset, note) and the submit flow shared by score and measured-value
 * entry: validate → confirm dialog (exact submissions and targets) → `useSubmit` per submission
 * (reviewers apply immediately; sector officers send for review) → toast.
 */
import { Loader2, Send } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, Input, Label, Select, SelectItem, Textarea } from '@/components/ui/primitives';
import { useData, useModel, useSubmit } from '@/data-layer/DataProvider';
import { canReview, canSubmit, type NewSubmission } from '@/data-layer/types';
import type { DimensionKey } from '@/engine/risk/hierarchy';
import { AUTHORITIES, AUTHORITY_KEYS, INDICATOR_SOURCES, sourceFor, type AuthorityKey } from '@/engine/risk/sources';
import type { EditRef, Unit } from '@/engine/risk/types';
import { cn } from '@/lib/utils';
import { errorMessage } from '../lib/batch';
import { buildSubmissions, sharingCouncils, type DraftChange, type Impact } from '../lib/targets';
import { ChangeTable } from './ChangeTable';
import { Callout, LevelBadge } from './common';

export interface MetaState {
  authority: string;
  dataset: string;
  note: string;
}
export const EMPTY_META: MetaState = { authority: '', dataset: '', note: '' };
export const NOTE_MAX = 2000;
const DATASET_MAX = 200;

/** Authorities a contributor can cite (the INFORM baseline and computed products are not sources of new data). */
export const AUTHORITY_OPTIONS = AUTHORITY_KEYS.filter((k) => k !== 'INFORM' && k !== 'CHC');
const KNOWN_DATASETS = [...new Set(Object.values(INDICATOR_SOURCES).map((s) => s!.dataset))].sort();

/** The usual authority for these indicators (most common among them), or null. */
export function suggestAuthority(refs: readonly EditRef[]): AuthorityKey | null {
  const count = new Map<AuthorityKey, number>();
  for (const ref of refs) {
    const [dim, key] = ref.split(':') as [DimensionKey, string];
    const by = sourceFor(dim, key).by;
    if ((AUTHORITY_OPTIONS as readonly string[]).includes(by)) count.set(by, (count.get(by) ?? 0) + 1);
  }
  let best: AuthorityKey | null = null;
  for (const [k, n] of count) if (!best || n > (count.get(best) ?? 0)) best = k;
  return best;
}

export function useAuthorityName() {
  const { t } = useTranslation('data');
  return React.useCallback(
    (key: string | null | undefined) => {
      if (!key) return '—';
      const a = (AUTHORITIES as Record<string, { label: string; full: string }>)[key];
      return a ? `${a.label} · ${t(`authorities.${key}`, { defaultValue: a.full })}` : key;
    },
    [t],
  );
}

export interface MetaErrors {
  authority?: 'required';
  dataset?: 'tooLong';
  note?: 'required' | 'tooLong';
}
export function validateMeta(meta: MetaState, { authority, noteRequired }: { authority: string; noteRequired: boolean }): MetaErrors {
  const e: MetaErrors = {};
  if (!authority) e.authority = 'required';
  if (meta.dataset.length > DATASET_MAX) e.dataset = 'tooLong';
  if (meta.note.length > NOTE_MAX) e.note = 'tooLong';
  else if (noteRequired && !meta.note.trim()) e.note = 'required';
  return e;
}
export const hasErrors = (e: MetaErrors) => Object.keys(e).length > 0;

export function MetaFields({
  idPrefix,
  meta,
  onChange,
  authority,
  suggested,
  noteRequired,
  noteHint,
  errors,
  showErrors,
  columns = false,
}: {
  idPrefix: string;
  meta: MetaState;
  onChange: (patch: Partial<MetaState>) => void;
  authority: string;
  suggested: string | null;
  noteRequired: boolean;
  noteHint?: string;
  errors: MetaErrors;
  showErrors: boolean;
  /** Authority and dataset side by side (note full width) from `sm` up. */
  columns?: boolean;
}) {
  const { t } = useTranslation('data');
  const authName = useAuthorityName();
  const id = (s: string) => `${idPrefix}-${s}`;
  return (
    <div className={columns ? 'grid gap-x-6 gap-y-5 sm:grid-cols-2' : 'space-y-4'}>
      <div>
        <span className="text-sm font-medium">
          {t('meta.authority')} <span className="text-danger" aria-hidden>*</span>
        </span>
        <div className="mt-1.5">
          <Select value={authority} onValueChange={(v) => onChange({ authority: v })} placeholder={t('meta.authorityPlaceholder')} aria-label={t('meta.authority')}>
            {AUTHORITY_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>
                {authName(k)}
              </SelectItem>
            ))}
          </Select>
        </div>
        {!meta.authority && suggested && authority === suggested && <p className="mt-1 text-xs text-muted-foreground">{t('meta.authoritySuggested')}</p>}
        {showErrors && errors.authority && (
          <p role="alert" className="mt-1 text-xs font-medium text-danger">
            {t('meta.errors.authority')}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor={id('dataset')}>
          {t('meta.dataset')} <span className="font-normal text-muted-foreground">({t('meta.optional')})</span>
        </Label>
        <Input
          id={id('dataset')}
          className="mt-1.5"
          list={id('datasets')}
          value={meta.dataset}
          maxLength={DATASET_MAX}
          placeholder={t('meta.datasetPlaceholder')}
          onChange={(e) => onChange({ dataset: e.target.value })}
          aria-invalid={showErrors && !!errors.dataset}
        />
        <datalist id={id('datasets')}>
          {KNOWN_DATASETS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>
      <div className={cn(columns && 'sm:col-span-2')}>
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={id('note')}>
            {t('meta.note')}{' '}
            {noteRequired ? (
              <span className="text-danger" aria-hidden>
                *
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">({t('meta.recommended')})</span>
            )}
          </Label>
          <span className={`num text-xs ${meta.note.length > NOTE_MAX ? 'text-danger' : 'text-muted-foreground'}`}>
            {meta.note.length}/{NOTE_MAX}
          </span>
        </div>
        <Textarea
          id={id('note')}
          className="mt-1.5 min-h-20"
          value={meta.note}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder={t('meta.notePlaceholder')}
          aria-invalid={showErrors && !!errors.note}
          aria-required={noteRequired}
          aria-describedby={id('note-hint')}
        />
        <p id={id('note-hint')} className={`mt-1 text-xs ${noteRequired ? 'text-warning' : 'text-muted-foreground'}`}>
          {noteRequired ? t('meta.noteRequired') : (noteHint ?? t('meta.noteHint'))}
        </p>
        {showErrors && errors.note && (
          <p role="alert" className="mt-1 text-xs font-medium text-danger">
            {t(`meta.errors.note_${errors.note}`, { max: NOTE_MAX })}
          </p>
        )}
      </div>
    </div>
  );
}

/** Confirmation listing exactly which unit receives which change. */
export function ConfirmSubmitDialog({
  open,
  onOpenChange,
  submissions,
  reviewer,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  submissions: readonly NewSubmission[];
  reviewer: boolean;
  busy: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation(['data', 'common']);
  const model = useModel();
  const authName = useAuthorityName();
  const first = submissions[0];
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-2xl" title={t('confirm.title')} description={reviewer ? t('confirm.leadReviewer') : t('confirm.leadSector')}>
        <div className="space-y-7 p-5">
          {submissions.map((s, i) => {
            const unit = model.byId.get(s.unitId);
            const sharing = unit?.level === 'source' ? sharingCouncils(model, unit.id) : [];
            return (
              <section key={`${s.unitId}-${i}`} aria-labelledby={`confirm-${i}`} className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  {submissions.length > 1 && <span className="num text-sm text-muted-foreground">{i + 1}.</span>}
                  <h3 id={`confirm-${i}`} className="font-semibold">
                    {s.unitName}
                  </h3>
                  <LevelBadge unit={unit} />
                </div>
                {sharing.length > 0 && <p className="text-xs text-muted-foreground">{t('confirm.appliesTo', { names: sharing.map((c) => c.name).join(', ') })}</p>}
                <ChangeTable changes={s.changes} caption={s.unitName} />
              </section>
            );
          })}
          {first && (
            <dl className="grid gap-x-6 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">{t('meta.authority')}</dt>
                <dd className="mt-0.5 font-medium">{authName(first.authority)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('meta.dataset')}</dt>
                <dd className="mt-0.5 font-medium">{first.dataset ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">{t('meta.note')}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{first.note ?? '—'}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-elevated px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('common:actions.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {reviewer ? t('confirm.apply', { count: submissions.length }) : t('confirm.send', { count: submissions.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Submit section for one council's drafted changes: the last section of the entry form (heading over a
 * rule, like the dimension sections — no box). Hazard and Vulnerability/Coping changes become two
 * submissions (council vs shared source unit) via `buildSubmissions`. `children` render between the lead
 * and the fields (measured-value entry lists how its values map onto model indicators there).
 */
export function EntrySubmitCard({
  idPrefix,
  council,
  changes,
  impact,
  meta,
  setMeta,
  blocking,
  onSubmitted,
  className,
  children,
}: {
  idPrefix: string;
  council: Unit;
  changes: readonly DraftChange[];
  impact: Impact;
  meta: MetaState;
  setMeta: React.Dispatch<React.SetStateAction<MetaState>>;
  /** Number of invalid fields in the form (blocks submission). */
  blocking: number;
  /** Called with the refs that were submitted successfully. */
  onSubmitted: (refs: EditRef[]) => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation(['data', 'common']);
  const model = useModel();
  const { profile } = useData();
  const reviewer = canReview(profile?.role);
  const allowed = canSubmit(profile?.role);
  const submit = useSubmit();
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const suggested = React.useMemo(() => suggestAuthority(changes.map((c) => c.ref)), [changes]);
  const authority = meta.authority || suggested || (reviewer ? 'PMO' : '');
  const drop = impact.before.risk != null && impact.after.risk != null ? impact.before.risk - impact.after.risk : 0;
  const noteRequired = drop > 1 + 1e-9;
  const errors = validateMeta(meta, { authority, noteRequired });
  const [showErrors, setShowErrors] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const submissions = React.useMemo(
    () => buildSubmissions(model, council, changes, { authority, dataset: meta.dataset, note: meta.note }),
    [model, council, changes, authority, meta.dataset, meta.note],
  );

  const onReview = () => {
    if (!changes.length) return;
    if (blocking > 0 || hasErrors(errors)) {
      setShowErrors(true);
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setBusy(true);
    const done: NewSubmission[] = [];
    try {
      for (const input of submissions) {
        await submit.mutateAsync({ input, applyNow: reviewer });
        done.push(input);
      }
      toast.success(t(reviewer ? 'submit.appliedToast' : 'submit.sentToast', { count: submissions.length }), {
        description: submissions.map((s) => s.unitName).join(' · '),
        action: reviewer
          ? { label: t('context.viewProfile'), onClick: () => navigate(`/area/${council.id}`) }
          : {
              label: t('submit.viewMine'),
              onClick: () =>
                setParams(
                  (p) => {
                    const next = new URLSearchParams(p);
                    next.set('tab', 'mine');
                    return next;
                  },
                  { replace: true },
                ),
            },
      });
      setConfirmOpen(false);
      setShowErrors(false);
      setMeta((m) => ({ ...m, note: '' }));
    } catch (e) {
      toast.error(t('submit.errorToast'), {
        description: done.length ? t('submit.partial', { done: done.length, total: submissions.length, message: errorMessage(e) }) : errorMessage(e),
      });
    } finally {
      setBusy(false);
      if (done.length) onSubmitted(done.flatMap((s) => s.changes.map((c) => c.ref)));
    }
  };

  return (
    <section id={`${idPrefix}-submit`} aria-labelledby={`${idPrefix}-submit-title`} className={cn('min-w-0 scroll-mt-24', className)}>
      <h3 id={`${idPrefix}-submit-title`} className="border-b border-border pb-3 font-display text-xl font-semibold sm:text-[1.4rem]">
        {t('submit.title')}
      </h3>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{reviewer ? t('submit.leadReviewer') : t('submit.leadSector')}</p>
      {children}
      <div className="mt-6 space-y-5">
        <MetaFields
          idPrefix={idPrefix}
          meta={meta}
          onChange={(patch) => setMeta((m) => ({ ...m, ...patch }))}
          authority={authority}
          suggested={suggested}
          noteRequired={noteRequired}
          errors={errors}
          showErrors={showErrors}
          columns
        />
        {showErrors && blocking > 0 && (
          <p role="alert" className="text-sm font-medium text-danger">
            {t('submit.fixErrors', { count: blocking })}
          </p>
        )}
        {submissions.length > 1 && <Callout title={t('submit.splitTitle', { count: submissions.length })}>{t('submit.splitLead')}</Callout>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Button className="w-full sm:w-auto" size="lg" onClick={onReview} disabled={!allowed || !changes.length || busy}>
            <Send aria-hidden />
            {reviewer ? t('submit.reviewApply', { count: changes.length }) : t('submit.reviewSend', { count: changes.length })}
          </Button>
          {!changes.length && <p className="text-sm text-muted-foreground">{t('submit.nothing')}</p>}
        </div>
      </div>
      <ConfirmSubmitDialog open={confirmOpen} onOpenChange={setConfirmOpen} submissions={submissions} reviewer={reviewer} busy={busy} onConfirm={onConfirm} />
    </section>
  );
}
