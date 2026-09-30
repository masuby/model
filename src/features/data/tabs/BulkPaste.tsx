/**
 * Bulk paste: one indicator × many units, straight from a spreadsheet. Pick the indicator and the level
 * (council / region / nation), paste "name <tab , ; |> value" lines (or values only, in template order),
 * check the live preview (matching, issues, class changes), then submit in batches.
 */
import { CheckCircle2, ClipboardCopy, Download, Eraser, Loader2, Send, XCircle } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, Progress, Segmented, Select, SelectGroup, SelectItem, Textarea } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import type { NewSubmission } from '@/data-layer/types';
import { classify } from '@/engine/risk/classes';
import { DIMENSIONS } from '@/engine/risk/hierarchy';
import { sourceFor, sourceLabel } from '@/engine/risk/sources';
import type { EditRef } from '@/engine/risk/types';
import { cn, downloadText, formatNumber, NO_VALUE, toCsv } from '@/lib/utils';
import { Callout, Delta, EmptyState, ScoreValue } from '../components/common';
import { hasErrors, MetaFields, suggestAuthority, useAuthorityName, validateMeta, EMPTY_META, type MetaState } from '../components/SubmitPanel';
import { usePermissions, useBatchOps } from '../hooks';
import { errorMessage } from '../lib/batch';
import { buildPastePlan, type PasteIssue, type PasteLevel, type PlanTarget } from '../lib/paste';
import { scoreDelta } from '../lib/scores';
import { currentValue, EDITABLE_FIELDS, fieldFor, sharingCouncils, simulate, targetKind } from '../lib/targets';

const PREVIEW_ROWS = 30;

export function BulkPaste() {
  const { t, i18n } = useTranslation(['data', 'common', 'indicators']);
  const model = useModel();
  const { canReview: reviewer } = usePermissions();
  const { submitMany, progress } = useBatchOps();
  const authName = useAuthorityName();
  const [ref, setRef] = React.useState<EditRef>('hazard:drought');
  const [level, setLevel] = React.useState<PasteLevel>('council');
  const [text, setText] = React.useState('');
  const [meta, setMeta] = React.useState<MetaState>(EMPTY_META);
  const [showAll, setShowAll] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [failures, setFailures] = React.useState<string[]>([]);
  const deferred = React.useDeferredValue(text);
  const field = fieldFor(ref)!;
  const indicatorName = t(`indicators:${field.key}`);

  const plan = React.useMemo(() => buildPastePlan(deferred, level, ref, model), [deferred, level, ref, model]);

  const summary = React.useMemo(() => {
    let councils = 0;
    let up = 0;
    let down = 0;
    let maxDrop = 0;
    for (const tg of plan.ready) {
      const affected = tg.level === 'council' ? [model.byId.get(tg.unitId)!] : sharingCouncils(model, tg.unitId);
      for (const c of affected) {
        if (!c) continue;
        councils++;
        const after = simulate(c, { [ref]: tg.value }).risk;
        const a = classify(after)?.index;
        const b = classify(c.risk)?.index;
        if (a != null && b != null && a > b) up++;
        if (a != null && b != null && a < b) down++;
        if (c.risk != null && after != null) maxDrop = Math.max(maxDrop, c.risk - after);
      }
    }
    return { councils, up, down, maxDrop };
  }, [plan, model, ref]);

  const suggested = suggestAuthority([ref]);
  const authority = meta.authority || suggested || (reviewer ? 'PMO' : '');
  const noteRequired = summary.maxDrop > 1 + 1e-9;
  const errors = validateMeta(meta, { authority, noteRequired });
  const statusCount = (s: PlanTarget['status']) => plan.targets.filter((x) => x.status === s).length;
  const errorIssues = plan.issues.filter((i) => i.severity === 'error').length;

  const inputs = React.useMemo<NewSubmission[]>(
    () =>
      plan.ready.map((tg) => ({
        unitId: tg.unitId,
        unitName: tg.unitName,
        region: tg.region,
        changes: [{ ref, value: tg.value, previous: tg.previous }],
        authority,
        ...(meta.dataset.trim() ? { dataset: meta.dataset.trim() } : {}),
        ...(meta.note.trim() ? { note: meta.note.trim() } : {}),
      })),
    [plan.ready, ref, authority, meta.dataset, meta.note],
  );

  const onReview = () => {
    if (!inputs.length) return;
    if (hasErrors(errors)) {
      setShowErrors(true);
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setFailures([]);
    try {
      const out = await submitMany(inputs, reviewer);
      const failed = out.filter((o) => !o.ok);
      const ok = out.length - failed.length;
      setConfirmOpen(false);
      if (!failed.length) {
        toast.success(t(reviewer ? 'paste.appliedToast' : 'paste.sentToast', { count: ok }), { description: indicatorName });
        setText('');
        setShowErrors(false);
        setMeta((m) => ({ ...m, note: '' }));
      } else {
        setFailures(failed.map((f) => `${f.item.unitName}: ${errorMessage(f.ok ? null : f.error)}`));
        toast.warning(t('paste.partialToast', { ok, failed: failed.length }));
      }
    } catch (e) {
      toast.error(t('submit.errorToast'), { description: errorMessage(e) });
    }
  };

  const templateUnits = level === 'region' ? model.regions : model.councils;
  const copyNames = async () => {
    try {
      await navigator.clipboard.writeText(templateUnits.map((u) => u.name).join('\n'));
      toast.success(t('paste.copied', { count: templateUnits.length }));
    } catch {
      toast.error(t('paste.copyFailed'));
    }
  };
  const downloadTemplate = () => {
    const rows: Array<Array<string | number | null>> = [[t(`paste.levels.${level}`), t('common:labels.region'), `${indicatorName} (${t('paste.current')})`, t('paste.newValue')]];
    const units = level === 'nation' ? [model.national] : templateUnits;
    for (const u of units) rows.push([u.name, u.level === 'council' ? u.region : '', currentValue(u, ref), '']);
    downloadText(`inform-template-${field.key}-${level}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  };

  const sorted = React.useMemo(() => {
    const order = { conflict: 0, ready: 1, unchanged: 2 } as const;
    return [...plan.targets].sort((a, b) => order[a.status] - order[b.status]);
  }, [plan.targets]);
  const visible = showAll ? sorted : sorted.slice(0, PREVIEW_ROWS);
  const busy = progress != null;
  const shared = targetKind(ref) === 'source';

  return (
    <div className="space-y-12">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-12">
        {/* ------------------------------------------------------------ Setup (one flat form panel) */}
        <Card className="self-start p-5 sm:p-6">
          <h3 className="text-lg font-semibold">{t('paste.setupTitle')}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('paste.setupLead')}</p>
          <div className="mt-6 space-y-5">
            <div>
              <span className="text-sm font-medium">{t('paste.indicator')}</span>
              <div className="mt-1.5">
                <Select value={ref} onValueChange={(v) => setRef(v as EditRef)} aria-label={t('paste.indicator')}>
                  {DIMENSIONS.map((d) => (
                    <SelectGroup key={d.key} label={t(`common:dimensions.${d.key}`)}>
                      {EDITABLE_FIELDS.filter((f) => f.dim === d.key).map((f) => (
                        <SelectItem key={f.ref} value={f.ref}>
                          {t(`indicators:${f.key}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </Select>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{sourceLabel(sourceFor(field.dim, field.key))}</p>
            </div>
            <div>
              <span className="text-sm font-medium" id="paste-level-label">
                {t('paste.level')}
              </span>
              <div className="mt-1.5">
                <Segmented
                  aria-label={t('paste.level')}
                  value={level}
                  onValueChange={setLevel}
                  options={(['council', 'region', 'nation'] as const).map((l) => ({ value: l, label: t(`paste.levels.${l}`) }))}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t(`paste.levelHelp.${level}`)}</p>
            </div>
            <Callout>{shared ? t('paste.targetShared') : t('paste.targetCouncil')}</Callout>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="paste-text" className="text-sm font-medium">
                  {t('paste.data')}
                </label>
                <div className="flex flex-wrap gap-1">
                  {level !== 'nation' && (
                    <Button variant="ghost" size="sm" onClick={copyNames}>
                      <ClipboardCopy /> {t('paste.copyNames')}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                    <Download /> {t('paste.template')}
                  </Button>
                </div>
              </div>
              <Textarea
                id="paste-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                rows={12}
                className="mt-1.5 min-h-64 font-mono text-[13px] leading-relaxed"
                placeholder={t(`paste.placeholder.${level}`)}
                aria-describedby="paste-help"
              />
              <p id="paste-help" className="mt-1.5 text-xs text-muted-foreground">
                {t('paste.help')}
              </p>
              {text && (
                <Button variant="ghost" size="sm" className="mt-1" onClick={() => setText('')}>
                  <Eraser /> {t('common:actions.clear')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------ Preview */}
        <div className="min-w-0 space-y-6">
          {!deferred.trim() ? (
            <EmptyState className="border-t border-border pt-6" title={t('paste.emptyTitle')} description={t('paste.emptyLead')} />
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-y-5 border-y border-border py-5 sm:grid-cols-4 sm:divide-x sm:divide-border" aria-live="polite">
                <Figure label={t('paste.chips.ready')} value={statusCount('ready')} />
                <Figure label={t('paste.chips.unchanged')} value={statusCount('unchanged')} />
                <Figure label={t('paste.chips.conflicts')} value={statusCount('conflict')} danger={statusCount('conflict') > 0} />
                <Figure label={t('paste.chips.issues')} value={plan.issues.length} danger={errorIssues > 0} />
              </dl>
              {plan.ready.length > 0 && (
                <Callout tone={summary.up ? 'warning' : 'info'} title={t('paste.impactTitle', { count: summary.councils })}>
                  {summary.up || summary.down ? t('paste.impactClasses', { up: summary.up, down: summary.down }) : t('paste.impactNoClass')}
                </Callout>
              )}
              {plan.positional && <Callout tone="warning">{t('paste.positional', { count: plan.targets.length, level: t(`paste.levels.${level}`).toLowerCase() })}</Callout>}
              {plan.issues.length > 0 && <IssueList issues={plan.issues} />}
              {plan.targets.length > 0 && (
                <div>
                  {/* `relative` keeps the sr-only caption inside the scroll box; below `sm` the status moves next
                      to the unit name so every column fits a phone. */}
                  <div className="relative overflow-x-auto border-y border-border">
                    <table className="w-full text-sm sm:min-w-[560px]">
                      <caption className="sr-only">{t('paste.previewCaption', { indicator: indicatorName })}</caption>
                      <thead className="text-xs text-muted-foreground">
                        <tr className="border-b border-border">
                          <th scope="col" className="py-2.5 pr-2 text-left font-medium sm:pr-3">
                            {t('paste.cols.unit')}
                          </th>
                          <th scope="col" className="px-2 py-2.5 text-right font-medium sm:px-3">
                            {t('paste.cols.current')}
                          </th>
                          <th scope="col" className="px-2 py-2.5 text-right font-medium sm:px-3">
                            {t('paste.cols.new')}
                          </th>
                          <th scope="col" className="py-2.5 pl-2 text-right font-medium sm:px-3">
                            {t('changes.delta')}
                          </th>
                          <th scope="col" className="hidden py-2.5 pl-3 text-right font-medium sm:table-cell">
                            {t('paste.cols.status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {visible.map((tg) => (
                          <TargetRow key={tg.unitId} target={tg} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sorted.length > PREVIEW_ROWS && (
                    <div className="pt-2 text-center">
                      <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                        {showAll ? t('common:actions.showLess') : t('paste.showAll', { count: sorted.length })}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ Submit (a ruled section, as in the entry tabs) */}
      <section aria-labelledby="paste-submit-title">
        <h3 id="paste-submit-title" className="border-b border-border pb-3 font-display text-xl font-semibold sm:text-[1.4rem]">
          {t('submit.title')}
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{reviewer ? t('paste.leadReviewer') : t('paste.leadSector')}</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border">
          <div className="lg:pr-12">
            <MetaFields
              idPrefix="paste"
              meta={meta}
              onChange={(patch) => setMeta((m) => ({ ...m, ...patch }))}
              authority={authority}
              suggested={suggested}
              noteRequired={noteRequired}
              noteHint={t('paste.noteHint')}
              errors={errors}
              showErrors={showErrors}
            />
          </div>
          <div className="flex flex-col gap-6 border-t border-border pt-6 lg:border-t-0 lg:pt-0 lg:pl-12">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('paste.indicator')}</dt>
                <dd className="mt-1 font-semibold">{indicatorName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('paste.level')}</dt>
                <dd className="mt-1 font-semibold">{t(`paste.levels.${level}`)}</dd>
              </div>
              <div className="border-t border-border pt-4">
                <dt className="text-muted-foreground">{t('paste.submissions')}</dt>
                <dd className="num mt-1 text-3xl font-semibold tracking-tight">{formatNumber(inputs.length, i18n.language)}</dd>
              </div>
              <div className="border-t border-border pt-4">
                <dt className="text-muted-foreground">{t('paste.councilsAffected')}</dt>
                <dd className="num mt-1 text-3xl font-semibold tracking-tight">{formatNumber(summary.councils, i18n.language)}</dd>
              </div>
            </dl>
            {progress && (
              <div aria-live="polite">
                <Progress value={(progress.done / Math.max(1, progress.total)) * 100} label={`${progress.done} / ${progress.total}`} />
                <p className="mt-1.5 text-xs text-muted-foreground">{t('paste.progress', { done: progress.done, total: progress.total })}</p>
              </div>
            )}
            {failures.length > 0 && (
              <div role="alert" className="max-h-40 overflow-y-auto border-l-2 border-danger pl-4 text-xs">
                <p className="font-semibold text-danger">{t('paste.failures', { count: failures.length })}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                  {failures.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button size="lg" className="w-full sm:w-auto sm:self-start" onClick={onReview} disabled={!inputs.length || busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              {reviewer ? t('paste.applyButton', { count: inputs.length }) : t('paste.sendButton', { count: inputs.length })}
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <DialogContent title={t('paste.confirmTitle')} description={reviewer ? t('confirm.leadReviewer') : t('confirm.leadSector')}>
          <div className="space-y-4 p-5 text-sm">
            <p>{t('paste.confirmLead', { count: inputs.length, indicator: indicatorName, councils: summary.councils })}</p>
            <dl className="grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">{t('meta.authority')}</dt>
                <dd className="mt-0.5 font-medium">{authName(authority)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('meta.dataset')}</dt>
                <dd className="mt-0.5 font-medium">{meta.dataset.trim() || NO_VALUE}</dd>
              </div>
            </dl>
            {progress && (
              <div aria-live="polite">
                <Progress value={(progress.done / Math.max(1, progress.total)) * 100} label={`${progress.done} / ${progress.total}`} />
                <p className="mt-1.5 text-xs text-muted-foreground">{t('paste.progress', { done: progress.done, total: progress.total })}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>
              {t('common:actions.cancel')}
            </Button>
            <Button onClick={onConfirm} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              {reviewer ? t('paste.applyButton', { count: inputs.length }) : t('paste.sendButton', { count: inputs.length })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** One count in the preview's figure row (a rule between figures, no box). Danger colour only for problems. */
function Figure({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="px-0 odd:pr-4 even:border-l even:border-border even:pl-4 sm:border-l-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn('num mt-1 text-2xl font-semibold tracking-tight', danger && 'text-danger')}>{value}</dd>
    </div>
  );
}

function TargetRow({ target: tg }: { target: PlanTarget }) {
  const { t } = useTranslation(['data', 'common']);
  return (
    <tr className={cn('align-top', tg.status === 'conflict' && 'bg-danger/[0.05]', tg.status === 'unchanged' && 'text-muted-foreground')}>
      <td className="py-2.5 pr-2 sm:pr-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-foreground">{tg.unitName}</span>
          <span className={cn('text-xs font-medium sm:hidden', tg.status === 'ready' ? 'text-success' : tg.status === 'conflict' ? 'text-danger' : 'text-muted-foreground')}>
            {t(`paste.status.${tg.status}`)}
          </span>
          {tg.level === 'source' && <Badge variant="secondary" className="px-2 text-[11px]">{t('levels.source')}</Badge>}
          {tg.loose && (
            <Badge variant="warning" className="px-2 text-[11px]">
              {t('paste.loose')}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {tg.region}
          {tg.level === 'source' && ` · ${t('paste.via', { names: tg.via.join(', ') })}`}
          {` · ${t('paste.line', { count: tg.lineNos.length, lines: tg.lineNos.join(', ') })}`}
        </div>
      </td>
      <td className="px-2 py-2.5 text-right sm:px-3">
        <ScoreValue value={tg.previous} className="font-normal" />
      </td>
      <td className="px-2 py-2.5 text-right sm:px-3">
        {tg.status === 'conflict' ? (
          <span className="num text-xs text-danger">{tg.conflictValues?.map((v) => (v == null ? NO_VALUE : v.toFixed(1))).join(' / ')}</span>
        ) : (
          <ScoreValue value={tg.value} />
        )}
        {tg.rounded && <div className="text-xs text-muted-foreground">{t('paste.rounded')}</div>}
      </td>
      <td className="py-2.5 pl-2 text-right sm:px-3">{tg.status === 'ready' ? <Delta value={scoreDelta(tg.previous, tg.value)} /> : null}</td>
      <td className="hidden py-2.5 pl-3 text-right sm:table-cell">
        {tg.status === 'ready' && (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 aria-hidden /> {t('paste.status.ready')}
          </Badge>
        )}
        {tg.status === 'unchanged' && <Badge variant="secondary">{t('paste.status.unchanged')}</Badge>}
        {tg.status === 'conflict' && (
          <Badge variant="danger" className="gap-1">
            <XCircle aria-hidden /> {t('paste.status.conflict')}
          </Badge>
        )}
      </td>
    </tr>
  );
}

function IssueList({ issues }: { issues: PasteIssue[] }) {
  const { t } = useTranslation('data');
  const [open, setOpen] = React.useState(false);
  const shown = open ? issues : issues.slice(0, 6);
  return (
    <section aria-labelledby="paste-issues-title">
      <h4 id="paste-issues-title" className="text-sm font-semibold">
        {t('paste.issuesTitle', { count: issues.length })}
      </h4>
      <ul className="mt-2 divide-y divide-border border-y border-border text-sm">
        {shown.map((i) => (
          <li key={`${i.lineNo}-${i.kind}`} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-2.5">
            <span className={cn('num pt-px text-xs font-semibold', i.severity === 'error' ? 'text-danger' : 'text-warning')}>{t('paste.lineShort', { n: i.lineNo })}</span>
            <div className="min-w-0">
              <p>
                {t(`paste.issues.${i.kind}`, { suggestion: i.suggestion ?? '', candidates: (i.candidates ?? []).join(', ') })}
                {i.kind === 'unmatched' && i.suggestion && <span className="text-muted-foreground"> {t('paste.didYouMean', { name: i.suggestion })}</span>}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">{i.text}</p>
            </div>
          </li>
        ))}
      </ul>
      {issues.length > 6 && (
        <div className="pt-2 text-center">
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
            {open ? t('common:actions.showLess') : t('paste.showAllIssues', { count: issues.length })}
          </Button>
        </div>
      )}
    </section>
  );
}
