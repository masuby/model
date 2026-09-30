/**
 * Indicators (/data?tab=indicators): the institutional data workflow.
 *  • Sector officers see the indicators assigned to their institution, with any open request, and open
 *    the entry sheet to send new values or confirm that the current ones still hold.
 *  • PMO reviewers and administrators see every indicator: assign it to an institution, send update or
 *    validation requests with a due date, and open any sheet to enter values themselves.
 * Opening an indicator pushes `?indicator=<id>` so the browser's back button returns to the list.
 */
import { BadgeCheck, ChevronRight, Loader2, Mail, Search, Sparkles, UserCheck, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, Input, Label, Segmented, Select, SelectGroup, SelectItem, Switch, Textarea } from '@/components/ui/primitives';
import { useAssign, useAssignments, useCreateRequests, useRawSubmissions, useRawValues, useRequests, useValidations } from '@/data-layer/DataProvider';
import type { RequestKind } from '@/data-layer/types';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { Checkbox, EmptyState, ErrorState, ListSkeleton, ROW_TINT } from '../components/common';
import { NOTE_MAX } from '../components/SubmitPanel';
import { usePermissions } from '../hooks';
import { errorMessage } from '../lib/batch';
import { matchesQuery } from '../lib/format';
import { unitKey } from '../lib/raw';
import {
  dimensionOf,
  groupKey,
  indicatorStatuses,
  specLabel,
  suggestedOwner,
  WORKFLOW_INDICATORS,
  workflowIndicator,
  type IndicatorStatus,
  type WorkflowIndicator,
} from '../lib/workflow';
import { InstitutionLabel, RequestSummary, useInstitutionMap } from '../workflow/bits';
import { ConfirmValuesDialog } from '../workflow/ConfirmValuesDialog';

const IndicatorSheet = React.lazy(() => import('../workflow/IndicatorSheet').then((m) => ({ default: m.IndicatorSheet })));

type StatusFilter = 'all' | 'unassigned' | 'requested' | 'overdue' | 'pending' | 'never';
const NONE = '__none';

export function Indicators() {
  const [params, setParams] = useSearchParams();
  const open = params.get('indicator');
  const setOpen = React.useCallback(
    (id: string | null) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set('indicator', id);
        else next.delete('indicator');
        return next;
      }),
    [setParams],
  );
  if (open && workflowIndicator(open))
    return (
      <React.Suspense fallback={<ListSkeleton rows={3} />}>
        <IndicatorSheet specId={open} onBack={() => setOpen(null)} />
      </React.Suspense>
    );
  return <IndicatorList onOpen={setOpen} />;
}

function IndicatorList({ onOpen }: { onOpen: (id: string) => void }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const { profile, canReview: reviewer } = usePermissions();
  const assignments = useAssignments();
  const requests = useRequests();
  const rawValues = useRawValues();
  const rawSubmissions = useRawSubmissions();
  const validations = useValidations();
  const institutions = useInstitutionMap();
  const assign = useAssign();

  const [q, setQ] = React.useState('');
  const [dim, setDim] = React.useState<'all' | DimensionKey>('all');
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [bulkOwner, setBulkOwner] = React.useState('');
  const [requestKind, setRequestKind] = React.useState<RequestKind | null>(null);
  const [suggestOpen, setSuggestOpen] = React.useState(false);
  const [confirmSpec, setConfirmSpec] = React.useState<string | null>(null);

  const statuses = React.useMemo(
    () =>
      indicatorStatuses({
        assignments: assignments.data ?? [],
        requests: requests.data ?? [],
        rawValues: rawValues.data ?? [],
        rawSubmissions: rawSubmissions.data ?? [],
        validations: validations.data ?? [],
      }),
    [assignments.data, requests.data, rawValues.data, rawSubmissions.data, validations.data],
  );

  const myInstitution = profile?.institutionKey ?? null;
  const groupName = React.useCallback((w: WorkflowIndicator) => (groupKey(w) ? t(`indicators:${groupKey(w)}`) : ''), [t]);
  const rows = React.useMemo(
    () =>
      WORKFLOW_INDICATORS.filter((w) => {
        const s = statuses.get(w.spec.id)!;
        if (!reviewer) {
          if (!myInstitution || s.owner !== myInstitution) return false;
        } else {
          if (!showAdvanced && !w.core) return false;
          if (dim !== 'all' && dimensionOf(w) !== dim) return false;
          if (status === 'unassigned' && s.owner) return false;
          if (status === 'requested' && !s.openRequest) return false;
          if (status === 'overdue' && !s.overdue) return false;
          if (status === 'pending' && !s.pending) return false;
          if (status === 'never' && s.lastUpdate) return false;
        }
        const owner = s.owner ? institutions.get(s.owner) : undefined;
        return !q || matchesQuery(q, specLabel(t, w.spec.id), w.spec.id, w.spec.name, groupName(w), s.owner, owner?.fullName);
      }),
    [statuses, reviewer, myInstitution, showAdvanced, dim, status, q, t, groupName, institutions],
  );

  const unassignedWithSuggestion = React.useMemo(
    () => WORKFLOW_INDICATORS.filter((w) => !statuses.get(w.spec.id)!.owner && suggestedOwner(w)),
    [statuses],
  );
  const summary = React.useMemo(() => {
    let assigned = 0;
    let open = 0;
    let overdue = 0;
    let pending = 0;
    for (const w of WORKFLOW_INDICATORS.filter((x) => x.core)) {
      const s = statuses.get(w.spec.id)!;
      if (s.owner) assigned++;
      if (s.openRequest) open++;
      if (s.overdue) overdue++;
      pending += s.pending;
    }
    return { assigned, open, overdue, pending };
  }, [statuses]);

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const allSelected = rows.length > 0 && rows.every((w) => selected.has(w.spec.id));
  const toggleAll = (on: boolean) => setSelected(on ? new Set(rows.map((w) => w.spec.id)) : new Set());

  const doAssign = async (specIds: string[], institutionKey: string | null) => {
    try {
      await assign.mutateAsync({ specIds, institutionKey });
      toast.success(institutionKey ? t('workflow.assign.done', { count: specIds.length, institution: institutions.get(institutionKey)?.label ?? institutionKey }) : t('workflow.assign.cleared', { count: specIds.length }));
      return true;
    } catch (e) {
      toast.error(t('workflow.assign.error'), { description: errorMessage(e) });
      return false;
    }
  };

  if (assignments.isLoading || rawValues.isLoading) return <ListSkeleton rows={3} />;
  const failure = assignments.error ?? rawValues.error ?? requests.error ?? rawSubmissions.error ?? validations.error;
  if (failure) return <ErrorState error={failure} onRetry={() => void Promise.all([assignments.refetch(), rawValues.refetch(), requests.refetch(), rawSubmissions.refetch(), validations.refetch()])} />;

  if (!reviewer && !myInstitution) return <EmptyState title={t('workflow.mine.noInstitutionTitle')} description={t('workflow.mine.noInstitutionLead')} />;

  const byDimension = DIMENSIONS.map((d) => ({ d, items: rows.filter((w) => dimensionOf(w) === d.key) })).filter((g) => g.items.length);

  return (
    <div className={cn(reviewer && selected.size > 0 && 'pb-40 md:pb-24')}>
      {reviewer ? (
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t('workflow.list.summary', {
            assigned: formatNumber(summary.assigned, i18n.language),
            total: 53,
            open: formatNumber(summary.open, i18n.language),
            overdue: formatNumber(summary.overdue, i18n.language),
            pending: formatNumber(summary.pending, i18n.language),
          })}
        </p>
      ) : (
        <div className="max-w-3xl">
          <h3 className="font-display text-xl font-semibold">{t('workflow.mine.title', { institution: institutions.get(myInstitution!)?.label ?? myInstitution })}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t('workflow.mine.lead')}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('workflow.list.search')} aria-label={t('workflow.list.search')} className="pl-9" />
        </div>
        {reviewer && (
          <>
            <Segmented
              size="sm"
              aria-label={t('workflow.list.dimension')}
              value={dim}
              onValueChange={setDim}
              options={[
                { value: 'all', label: t('workflow.list.allDimensions') },
                ...DIMENSIONS.map((d) => ({ value: d.key, label: t(`common:dimensions.${d.key}Short`) })),
              ]}
            />
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)} aria-label={t('workflow.list.statusFilter')} className="h-9 lg:w-56">
              {(['all', 'unassigned', 'requested', 'overdue', 'pending', 'never'] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`workflow.list.status.${s}`)}
                </SelectItem>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} aria-label={t('workflow.list.showAdvanced')} />
              {t('workflow.list.showAdvanced')}
            </label>
            {unassignedWithSuggestion.length > 0 && (
              <Button variant="outline" size="sm" className="lg:ml-auto" onClick={() => setSuggestOpen(true)}>
                <Sparkles /> {t('workflow.suggest.button', { count: unassignedWithSuggestion.length })}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Bulk actions float at the bottom of the screen, so ticking a row never moves the rows below it. */}
      {reviewer && selected.size > 0 && (
        <div
          role="region"
          aria-label={t('workflow.list.bulkActions')}
          className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-5xl flex-col gap-3 rounded-md border border-border bg-elevated px-4 py-3 shadow-[var(--shadow-lift)] md:flex-row md:flex-wrap md:items-center"
        >
          <span className="text-sm font-medium" aria-live="polite">
            {t('workflow.list.selected', { count: selected.size })}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={bulkOwner} onValueChange={setBulkOwner} placeholder={t('workflow.assign.choose')} aria-label={t('workflow.assign.choose')} className="h-9 w-56">
              <OwnerOptions />
            </Select>
            <Button
              size="sm"
              disabled={!bulkOwner || assign.isPending}
              onClick={async () => {
                if (await doAssign([...selected], bulkOwner === NONE ? null : bulkOwner)) setSelected(new Set());
              }}
            >
              {assign.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <UserCheck aria-hidden />} {t('workflow.assign.apply')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <Button variant="outline" size="sm" onClick={() => setRequestKind('update')}>
              <Mail /> {t('workflow.request.askUpdate')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRequestKind('validate')}>
              <BadgeCheck /> {t('workflow.request.askValidate')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <X /> {t('workflow.list.clearSelection')}
            </Button>
          </div>
        </div>
      )}

      {!rows.length ? (
        <EmptyState title={reviewer ? t('workflow.list.emptyTitle') : t('workflow.mine.emptyTitle')} description={reviewer ? t('workflow.list.emptyLead') : t('workflow.mine.emptyLead')} />
      ) : (
        <>
          {reviewer && (
            <label className="mt-4 flex items-center gap-2.5 text-sm font-medium">
              <Checkbox checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} aria-label={t('workflow.list.selectAll')} />
              {t('workflow.list.selectAll')}
            </label>
          )}
          {byDimension.map(({ d, items }) => (
            <section key={d.key} aria-labelledby={`dim-${d.key}`} className="mt-8">
              <h3 id={`dim-${d.key}`} className="text-sm font-semibold">
                {t(`common:dimensions.${d.key}`)} <span className="font-normal text-muted-foreground">({items.length})</span>
              </h3>
              <ul className="mt-2 divide-y divide-border border-y border-border">
                {items.map((w) => (
                  <IndicatorRow
                    key={w.spec.id}
                    w={w}
                    status={statuses.get(w.spec.id)!}
                    reviewer={reviewer}
                    selected={selected.has(w.spec.id)}
                    onSelect={(on) => toggle(w.spec.id, on)}
                    onOpen={() => onOpen(w.spec.id)}
                    onConfirm={() => setConfirmSpec(w.spec.id)}
                    onAssign={(key) => doAssign([w.spec.id], key)}
                    assigning={assign.isPending}
                  />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      <RequestDialog
        kind={requestKind}
        specIds={[...selected]}
        owners={statuses}
        onClose={(sent) => {
          setRequestKind(null);
          if (sent) setSelected(new Set());
        }}
      />
      <SuggestDialog open={suggestOpen} items={unassignedWithSuggestion} onClose={() => setSuggestOpen(false)} onAssign={doAssign} />
      <ConfirmValuesDialog specId={confirmSpec} request={confirmSpec ? statuses.get(confirmSpec)?.openRequest ?? null : null} onClose={() => setConfirmSpec(null)} />
    </div>
  );
}

/** The institutions as select options: national institutions first, then global sources. */
function OwnerOptions({ allowNone = true }: { allowNone?: boolean }) {
  const { t } = useTranslation('data');
  const map = useInstitutionMap();
  const list = [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  return (
    <>
      {allowNone && <SelectItem value={NONE}>{t('workflow.unassigned')}</SelectItem>}
      <SelectGroup label={t('workflow.kind.nationalPlural')}>
        {list
          .filter((i) => i.kind === 'national')
          .map((i) => (
            <SelectItem key={i.key} value={i.key} description={i.fullName}>
              {i.label}
            </SelectItem>
          ))}
      </SelectGroup>
      <SelectGroup label={t('workflow.kind.globalPlural')}>
        {list
          .filter((i) => i.kind === 'global')
          .map((i) => (
            <SelectItem key={i.key} value={i.key} description={i.fullName}>
              {i.label}
            </SelectItem>
          ))}
      </SelectGroup>
    </>
  );
}

function IndicatorRow({
  w,
  status: s,
  reviewer,
  selected,
  onSelect,
  onOpen,
  onConfirm,
  onAssign,
  assigning,
}: {
  w: WorkflowIndicator;
  status: IndicatorStatus;
  reviewer: boolean;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onOpen: () => void;
  onConfirm: () => void;
  onAssign: (institutionKey: string | null) => void;
  assigning: boolean;
}) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const name = specLabel(t, w.spec.id);
  const group = groupKey(w);
  const unit = w.spec.unit?.trim() ? t(`units.${unitKey(w.spec.unit)}`, { defaultValue: w.spec.unit.trim() }) : null;
  const coverage = [
    s.coverage.national && t('workflow.status.national'),
    s.coverage.regions > 0 && t('workflow.status.regions', { count: s.coverage.regions }),
    s.coverage.councils > 0 && t('workflow.status.councils', { count: s.coverage.councils }),
  ].filter(Boolean) as string[];
  const validateOpen = s.openRequest?.kind === 'validate' && s.openRequest.status === 'open';

  return (
    <li className={cn('grid gap-x-4 gap-y-3 py-4', reviewer ? 'grid-cols-[auto_minmax(0,1fr)]' : 'grid-cols-1', 'md:items-start', selected && ROW_TINT.changed)}>
      {reviewer && <Checkbox className="mt-1" checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={t('workflow.list.selectOne', { name })} />}
      <div className="grid min-w-0 gap-x-8 gap-y-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="min-w-0">
          <button type="button" onClick={onOpen} className="group text-left font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
            {name}
            <ChevronRight className="ml-0.5 inline size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
          </button>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[unit, w.core ? (group ? t('workflow.feeds', { group: t(`indicators:${group}`) }) : null) : t('workflow.advanced'), !w.scoreable && t('workflow.notScoreable')]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="min-w-0 text-sm">
          <p className="text-xs text-muted-foreground md:hidden">{t('workflow.owner')}</p>
          {reviewer ? (
            <Select value={s.owner ?? NONE} onValueChange={(v) => onAssign(v === NONE ? null : v)} aria-label={t('workflow.ownerOf', { name })} className="h-9" disabled={assigning}>
              <OwnerOptions />
            </Select>
          ) : (
            <InstitutionLabel institutionKey={s.owner} withKind />
          )}
        </div>

        <div className="min-w-0 space-y-1 text-sm">
          {s.openRequest && <RequestSummary request={s.openRequest} className="block" />}
          {s.pending > 0 && <p className="text-muted-foreground">{t('workflow.status.pending', { count: s.pending })}</p>}
          <p className="text-muted-foreground">
            {s.lastUpdate
              ? t('workflow.status.updated', { date: formatDate(s.lastUpdate, i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }), where: coverage.join(', ') })
              : t('workflow.status.never')}
          </p>
          {s.lastValidated && (
            <p className="text-muted-foreground">
              {t('workflow.status.confirmed', { date: formatDate(s.lastValidated.validatedAt, i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }), name: s.lastValidated.validatedByName })}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1.5">
            <Button size="sm" variant={s.openRequest?.kind === 'update' && s.openRequest.status === 'open' ? 'default' : 'outline'} onClick={onOpen}>
              {t('workflow.enterValues')}
            </Button>
            {!reviewer && (
              <Button size="sm" variant={validateOpen ? 'default' : 'ghost'} onClick={onConfirm}>
                <BadgeCheck /> {t('workflow.confirm.button')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Send update or validation requests for the selected indicators (unassigned ones are skipped). */
function RequestDialog({ kind, specIds, owners, onClose }: { kind: RequestKind | null; specIds: string[]; owners: Map<string, IndicatorStatus>; onClose: (sent: boolean) => void }) {
  const { t } = useTranslation(['data', 'common']);
  const create = useCreateRequests();
  const [due, setDue] = React.useState(() => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10));
  const [message, setMessage] = React.useState('');
  const assigned = specIds.filter((id) => owners.get(id)?.owner);
  const skipped = specIds.length - assigned.length;

  const send = async () => {
    if (!kind) return;
    try {
      const n = await create.mutateAsync({ specIds: assigned, kind, dueDate: due || null, message: message.trim() || undefined });
      toast.success(t('workflow.request.sent', { count: n }), skipped ? { description: t('workflow.request.skipped', { count: skipped }) } : undefined);
      setMessage('');
      onClose(true);
    } catch (e) {
      toast.error(t('workflow.request.error'), { description: errorMessage(e) });
    }
  };

  return (
    <Dialog open={kind != null} onOpenChange={(o) => !o && !create.isPending && onClose(false)}>
      <DialogContent title={kind ? t(`workflow.request.title.${kind}`, { count: specIds.length }) : ''} description={kind ? t(`workflow.request.lead.${kind}`) : undefined}>
        <div className="space-y-4 p-5">
          {skipped > 0 && <p className="border-l-2 border-warning pl-3 text-sm">{t('workflow.request.skippedNote', { count: skipped })}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="req-due">{t('workflow.request.dueLabel')}</Label>
            <Input id="req-due" type="date" value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} className="w-48" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-message">{t('workflow.request.messageLabel')}</Label>
            <Textarea id="req-message" value={message} maxLength={NOTE_MAX} onChange={(e) => setMessage(e.target.value)} placeholder={t('workflow.request.messagePlaceholder')} />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onClose(false)} disabled={create.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button onClick={send} disabled={!assigned.length || create.isPending}>
            {create.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />} {t('workflow.request.send', { count: assigned.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Assign every unassigned indicator to its suggested owner, after showing the plan. */
function SuggestDialog({ open, items, onClose, onAssign }: { open: boolean; items: WorkflowIndicator[]; onClose: () => void; onAssign: (ids: string[], key: string | null) => Promise<boolean> }) {
  const { t } = useTranslation(['data', 'common']);
  const map = useInstitutionMap();
  const [busy, setBusy] = React.useState(false);
  const plan = React.useMemo(() => {
    const m = new Map<string, string[]>();
    for (const w of items) {
      const owner = suggestedOwner(w)!;
      if (!m.has(owner)) m.set(owner, []);
      m.get(owner)!.push(w.spec.id);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  const run = async () => {
    setBusy(true);
    for (const [owner, ids] of plan) if (!(await onAssign(ids, owner))) break;
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent title={t('workflow.suggest.title')} description={t('workflow.suggest.lead')}>
        <ul className="divide-y divide-border px-5 py-2 text-sm">
          {plan.map(([owner, ids]) => (
            <li key={owner} className="flex items-baseline justify-between gap-4 py-2">
              <span>
                <span className="font-medium">{map.get(owner)?.label ?? owner}</span> <span className="text-muted-foreground">{map.get(owner)?.fullName}</span>
              </span>
              <span className="num whitespace-nowrap text-muted-foreground">{t('workflow.suggest.count', { count: ids.length })}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t('common:actions.cancel')}
          </Button>
          <Button onClick={run} disabled={busy || !plan.length}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <UserCheck aria-hidden />} {t('workflow.suggest.apply', { count: items.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
