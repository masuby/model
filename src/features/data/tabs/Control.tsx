/**
 * Data control (administrators and PMO-DMD): one screen for the distribution of data-serving
 * responsibilities and for the lineage of every live value.
 *  • The summary: institutions serving, indicators assigned, requests open and overdue, submissions
 *    waiting, values withheld after validation.
 *  • The institutions: each with its indicators, requests and submissions; assign its usual indicators,
 *    request updates for all of them, open any indicator's entry sheet.
 *  • The values: for each of the 32 indicator groups, how many councils carry the workbook's value, an
 *    approved institutional value, a withheld value or none, with the data notes.
 * Everything acts through the same repository as the Indicators tab, so the institutions see the result
 * on their own list and in their inbox.
 */
import { ChevronDown, Download, Loader2, Mail, Sparkles } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, Input, Label, Textarea } from '@/components/ui/primitives';
import { dataNotesSummary } from '@/engine/risk/notes';
import { useAssign, useAssignments, useCreateRequests, useInstitutions, useModel, useRawSubmissions, useRawValues, useRequests, useValidations } from '@/data-layer/DataProvider';
import { exportFileName, exportPreamble, exportStamp } from '@/lib/exports';
import { cn, downloadText, formatDate, formatNumber, toCsv } from '@/lib/utils';
import { ErrorState, ListSkeleton } from '../components/common';
import { errorMessage } from '../lib/batch';
import { TemplateIO } from '../components/TemplateIO';
import { distribution, valuesControl, type InstitutionRow } from '../lib/control';
import { groupKey, specLabel, WORKFLOW_INDICATORS, type IndicatorStatus, type WorkflowIndicator } from '../lib/workflow';

const NOTE_MAX = 1000;

/** Every Core indicator (the workbook's in use and the Benchmark 2026 activations): the Office imports any of them. */
const CORE_SPEC_IDS: readonly string[] = WORKFLOW_INDICATORS.filter((w) => w.core).map((w) => w.spec.id);

export function Control() {
  const { t, i18n } = useTranslation(['data', 'common', 'indicators']);
  const model = useModel();
  const institutions = useInstitutions();
  const assignments = useAssignments();
  const requests = useRequests();
  const rawValues = useRawValues();
  const rawSubmissions = useRawSubmissions();
  const validations = useValidations();
  const assign = useAssign();
  const [open, setOpen] = React.useState<ReadonlySet<string>>(new Set());
  const [requestFor, setRequestFor] = React.useState<InstitutionRow | null>(null);

  const dist = React.useMemo(
    () =>
      distribution(
        {
          assignments: assignments.data ?? [],
          requests: requests.data ?? [],
          rawValues: rawValues.data ?? [],
          rawSubmissions: rawSubmissions.data ?? [],
          validations: validations.data ?? [],
        },
        institutions.data ?? [],
      ),
    [assignments.data, requests.data, rawValues.data, rawSubmissions.data, validations.data, institutions.data],
  );
  const values = React.useMemo(() => valuesControl(model), [model]);
  const withheld = React.useMemo(() => values.reduce((n, g) => n + g.withheld, 0), [values]);
  // The quarantined council values an approved value (the Benchmark 2026 or an institution's) has lifted.
  const workbookWithheld = React.useMemo(() => (model ? dataNotesSummary(model).replaced : 0), [model]);

  const doAssign = async (specIds: string[], institutionKey: string, label: string) => {
    try {
      await assign.mutateAsync({ specIds, institutionKey });
      toast.success(t('control.actions.assigned', { count: specIds.length, institution: label }));
      return true;
    } catch (e) {
      toast.error(t('workflow.assign.error'), { description: errorMessage(e) });
      return false;
    }
  };
  const assignAll = async () => {
    let n = 0;
    for (const row of dist.rows) {
      if (!row.suggested.length) continue;
      if (!(await doAssign(row.suggested.map((w) => w.spec.id), row.key, row.label))) break;
      n += row.suggested.length;
    }
    if (n) toast.success(t('control.actions.assignedAll', { count: n }));
  };

  const exportCsv = () => {
    const header = [t('control.csv.institution'), t('control.csv.kind'), t('control.csv.indicator'), t('control.csv.group'), t('control.csv.core'), t('control.csv.status'), t('control.csv.lastUpdate')];
    const body: string[][] = [];
    for (const row of dist.rows)
      for (const w of row.assigned) {
        const s = dist.statuses.get(w.spec.id)!;
        body.push([row.label, t(`control.institutions.kind.${row.kind}`), `${w.spec.id} ${specLabel(t, w.spec.id)}`, groupKey(w) ? t(`indicators:${groupKey(w)}`) : '', w.core ? t('common:labels.yes') : t('common:labels.no'), statusWord(t, s), s.lastUpdate ? formatDate(s.lastUpdate, i18n.language) : '']);
      }
    for (const w of dist.unassigned) body.push(['', '', `${w.spec.id} ${specLabel(t, w.spec.id)}`, groupKey(w) ? t(`indicators:${groupKey(w)}`) : '', w.core ? t('common:labels.yes') : t('common:labels.no'), t('workflow.list.status.unassigned'), '']);
    const stamp = exportStamp(t('control.title'));
    downloadText(exportFileName('data-control', stamp), toCsv([...exportPreamble(t, stamp), header, ...body]), 'text/csv;charset=utf-8');
  };

  if (institutions.isLoading || assignments.isLoading || rawValues.isLoading) return <ListSkeleton rows={4} />;
  const failure = institutions.error ?? assignments.error ?? requests.error ?? rawValues.error ?? rawSubmissions.error ?? validations.error;
  if (failure) return <ErrorState error={failure} onRetry={() => void Promise.all([institutions.refetch(), assignments.refetch(), requests.refetch(), rawValues.refetch(), rawSubmissions.refetch(), validations.refetch()])} />;

  const n = (x: number) => formatNumber(x, i18n.language);
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const serving = dist.rows.filter((r) => r.assigned.length > 0 || r.suggested.length > 0);

  return (
    <div>
      <div className="max-w-3xl">
        <h3 className="font-display text-xl font-semibold">{t('control.title')}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t('control.lead')}</p>
      </div>

      {/* The summary */}
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 sm:grid-cols-4 lg:grid-cols-7">
        {(
          [
            ['serving', `${n(dist.totals.serving)} / ${n(dist.totals.institutions)}`],
            ['assigned', `${n(dist.totals.assigned)} / ${n(dist.totals.total)}`],
            ['core', `${n(dist.totals.core)} / ${n(dist.totals.coreTotal)}`],
            ['unassigned', n(dist.unassigned.length)],
            ['open', n(dist.totals.openRequests)],
            ['overdue', n(dist.totals.overdue)],
            ['pending', n(dist.totals.pending)],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{t(`control.summary.${k}`)}</dt>
            <dd className={cn('num mt-1 text-2xl font-semibold tracking-tight', (k === 'overdue' && dist.totals.overdue > 0) || (k === 'unassigned' && dist.unassigned.length > 0) ? 'text-warning' : '')}>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {dist.unassigned.length > 0 && (
          <Button size="sm" className="h-auto min-h-8 max-w-full whitespace-normal text-left" onClick={() => void assignAll()} disabled={assign.isPending}>
            {assign.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} {t('control.actions.assignAll')}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download /> {t('control.actions.export')}
        </Button>
      </div>

      {/* The institutions */}
      <section aria-labelledby="control-institutions" className="mt-10">
        <h3 id="control-institutions" className="text-base font-semibold">
          {t('control.institutions.title')}
        </h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('control.institutions.lead')}</p>
        {!serving.length ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('control.institutions.none')}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2.5 pr-3 font-medium">
                    {t('control.institutions.col.institution')}
                  </th>
                  {(['assigned', 'requests', 'overdue', 'pending', 'updated'] as const).map((c) => (
                    <th key={c} scope="col" className="px-3 py-2.5 text-right font-medium">
                      {t(`control.institutions.col.${c}`)}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    {t('control.institutions.col.lastUpdate')}
                  </th>
                  <th scope="col" className="py-2.5 pl-3 font-medium">
                    {t('control.institutions.col.actions')}
                  </th>
                </tr>
              </thead>
              {serving.map((row) => {
                const isOpen = open.has(row.key);
                return (
                  <tbody key={row.key} className="border-b border-border align-top">
                    <tr>
                      <th scope="row" className="py-3 pr-3 text-left font-normal">
                        <button type="button" aria-expanded={isOpen} onClick={() => toggle(row.key)} className="group inline-flex items-start gap-2 text-left">
                          <ChevronDown className={cn('mt-1 size-4 shrink-0 text-muted-foreground transition-transform', !isOpen && '-rotate-90')} aria-hidden />
                          <span>
                            <span className="font-semibold group-hover:text-primary">{row.label}</span>
                            <span className="block text-xs text-muted-foreground">
                              {row.fullName} · {t(`control.institutions.kind.${row.kind}`)}
                            </span>
                            {row.suggested.length > 0 && <span className="mt-0.5 block text-xs text-warning">{t('control.institutions.suggested', { count: row.suggested.length })}</span>}
                          </span>
                        </button>
                      </th>
                      <td className="num px-3 py-3 text-right">
                        {n(row.assigned.length)}
                        {row.advanced > 0 && <span className="block text-xs text-muted-foreground">{t('control.institutions.advanced', { count: row.advanced })}</span>}
                      </td>
                      <td className="num px-3 py-3 text-right">{n(row.openRequests)}</td>
                      <td className={cn('num px-3 py-3 text-right', row.overdue > 0 && 'font-semibold text-warning')}>{n(row.overdue)}</td>
                      <td className="num px-3 py-3 text-right">{n(row.pending)}</td>
                      <td className="num px-3 py-3 text-right">
                        {n(row.updated)} / {n(row.assigned.length)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{row.lastUpdate ? formatDate(row.lastUpdate, i18n.language) : '–'}</td>
                      <td className="py-3 pl-3">
                        <div className="flex flex-wrap gap-1.5">
                          {row.suggested.length > 0 && (
                            <Button variant="outline" size="sm" disabled={assign.isPending} onClick={() => void doAssign(row.suggested.map((w) => w.spec.id), row.key, row.label)}>
                              <Sparkles /> {t('control.actions.assignSuggested')}
                            </Button>
                          )}
                          {row.assigned.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setRequestFor(row)}>
                              <Mail /> {t('control.actions.request')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="pb-4 pl-7">
                          <ul className="divide-y divide-border border-y border-border">
                            {[...row.assigned, ...row.suggested].map((w) => (
                              <IndicatorLine key={w.spec.id} w={w} status={dist.statuses.get(w.spec.id)!} suggested={!dist.statuses.get(w.spec.id)!.owner} />
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </table>
          </div>
        )}
      </section>

      {/* A filled collection tool (xlsx) or template (csv) for any indicator: one pending submission per indicator */}
      <section aria-labelledby="control-import" className="mt-12">
        <h3 id="control-import" className="text-base font-semibold">
          {t('control.import.title')}
        </h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('control.import.lead')}</p>
        <TemplateIO specIds={CORE_SPEC_IDS} institution="PMO-DMD" allowAll />
      </section>

      {/* The values */}
      <section aria-labelledby="control-values" className="mt-12">
        <h3 id="control-values" className="text-base font-semibold">
          {t('control.values.title')}
        </h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('control.values.lead')}</p>
        <p className="mt-2 text-sm">
          <span className="text-muted-foreground">{t('control.summary.withheld')}:</span> <span className="num font-semibold">{n(withheld)}</span>
          <span className="text-muted-foreground"> · {t('control.values.workbookWithheld', { n: n(workbookWithheld) })}</span>
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  {t('control.values.col.group')}
                </th>
                {(['workbook', 'benchmark', 'institutional', 'withheld', 'empty'] as const).map((c) => (
                  <th key={c} scope="col" className="px-3 py-2.5 text-right font-medium">
                    {t(`control.values.col.${c}`)}
                  </th>
                ))}
                <th scope="col" className="py-2.5 pl-3 font-medium">
                  {t('control.values.col.notes')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {values.map((g) => (
                <tr key={`${g.dim}:${g.key}`}>
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    {t(`indicators:${g.key}`)} <span className="text-xs text-muted-foreground">· {t(`common:dimensions.${g.dim}Short`)}</span>
                  </th>
                  <td className="num px-3 py-2 text-right">{n(g.workbook)}</td>
                  <td className="num px-3 py-2 text-right">{n(g.benchmark)}</td>
                  <td className={cn('num px-3 py-2 text-right', g.institutional > 0 && 'font-semibold text-primary')}>{n(g.institutional)}</td>
                  <td className={cn('num px-3 py-2 text-right', g.withheld > 0 && 'font-semibold text-warning')}>{n(g.withheld)}</td>
                  <td className="num px-3 py-2 text-right text-muted-foreground">{n(g.empty)}</td>
                  <td className="py-2 pl-3 text-xs text-muted-foreground">{g.notes.map((x) => `${x.id} (${t(`common:dataNote.status.${x.status}`)})`).join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">{t('control.values.note')}</p>
      </section>

      <RequestAll row={requestFor} onClose={() => setRequestFor(null)} />
    </div>
  );
}

function statusWord(t: (k: string, o?: Record<string, unknown>) => string, s: IndicatorStatus): string {
  if (s.overdue) return t('control.indicator.overdue');
  if (s.openRequest) return t('control.indicator.request');
  if (s.pending) return t('control.indicator.pending', { count: s.pending });
  return s.lastUpdate ? t('control.indicator.updated', { date: s.lastUpdate.slice(0, 10) }) : t('control.indicator.never');
}

function IndicatorLine({ w, status, suggested }: { w: WorkflowIndicator; status: IndicatorStatus; suggested: boolean }) {
  const { t, i18n } = useTranslation(['data', 'common', 'indicators']);
  const word = status.overdue
    ? t('control.indicator.overdue')
    : status.openRequest
      ? t('control.indicator.request')
      : status.pending
        ? t('control.indicator.pending', { count: status.pending })
        : status.lastUpdate
          ? t('control.indicator.updated', { date: formatDate(status.lastUpdate, i18n.language) })
          : t('control.indicator.never');
  return (
    <li className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2">
      <span className="min-w-0 flex-1">
        <span className={cn('font-medium', suggested && 'text-muted-foreground')}>{specLabel(t, w.spec.id)}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {w.spec.id}
          {groupKey(w) && ` · ${t(`indicators:${groupKey(w)}`)}`}
          {!w.core && ` · ${t('workflow.advancedShort')}`}
        </span>
      </span>
      <span className={cn('text-xs', status.overdue ? 'font-medium text-warning' : 'text-muted-foreground')}>{suggested ? t('workflow.list.status.unassigned') : word}</span>
      <Link to={`/data?tab=indicators&indicator=${encodeURIComponent(w.spec.id)}`} className="text-xs font-medium text-primary underline-offset-4 hover:underline">
        {t('control.actions.open')}
      </Link>
    </li>
  );
}

/** Update requests for every indicator of one institution. */
function RequestAll({ row, onClose }: { row: InstitutionRow | null; onClose: () => void }) {
  const { t } = useTranslation(['data', 'common']);
  const create = useCreateRequests();
  const [due, setDue] = React.useState(() => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10));
  const [message, setMessage] = React.useState('');
  const count = row?.assigned.length ?? 0;
  const send = async () => {
    if (!row) return;
    try {
      const sent = await create.mutateAsync({ specIds: row.assigned.map((w) => w.spec.id), kind: 'update', dueDate: due || null, message: message.trim() || undefined });
      toast.success(t('control.request.sent', { count: sent }));
      setMessage('');
      onClose();
    } catch (e) {
      toast.error(t('control.request.error'), { description: errorMessage(e) });
    }
  };
  return (
    <Dialog open={row != null} onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent title={row ? t('control.request.title', { institution: row.label }) : ''} description={t('control.request.lead')}>
        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="ctl-due">{t('control.request.due')}</Label>
            <Input id="ctl-due" type="date" value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} className="w-48" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctl-message">{t('control.request.message')}</Label>
            <Textarea id="ctl-message" value={message} maxLength={NOTE_MAX} onChange={(e) => setMessage(e.target.value)} placeholder={t('control.request.placeholder')} />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button onClick={() => void send()} disabled={!count || create.isPending}>
            {create.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />} {t('control.request.send', { count })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
