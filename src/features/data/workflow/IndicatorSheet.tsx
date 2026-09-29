/**
 * The entry sheet for one indicator. Every area is listed (the country, each region and, one click
 * away, its councils) with the value that applies there today and where it comes from (a council,
 * regional or national figure, or the INFORM baseline). New values are typed or pasted from a
 * spreadsheet, with a live 0–10 preview; the source is required. Officers send for PMO review;
 * reviewers may apply at once. Values that exist only for some councils, or only for regions, are fine:
 * each council takes its own value, else its region's, else the national one.
 */
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, BadgeCheck, ChevronDown, ChevronRight, ClipboardPaste, Loader2, Search, Send, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kicker } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Input, Label, Segmented, Textarea } from '@/components/ui/primitives';
import { loadBaseline, useAssignments, useCloseRequest, useModel, useRawValues, useRequests, useSubmitRaw } from '@/data-layer/DataProvider';
import { canEnterIndicator } from '@/data-layer/types';
import { isNum } from '@/engine/risk/math';
import { indexRawValues, regionIdOf, scoreRaw } from '@/engine/risk/rawValues';
import type { IndicatorSpec } from '@/engine/risk/standardise';
import type { Unit } from '@/engine/risk/types';
import { cn, formatDate, formatScore, NO_VALUE } from '@/lib/utils';
import { EmptyState, ListSkeleton } from '../components/common';
import { NOTE_MAX } from '../components/SubmitPanel';
import { usePermissions } from '../hooks';
import { errorMessage } from '../lib/batch';
import { increasesRisk, naturalRange, unitKey } from '../lib/raw';
import {
  buildSheet,
  councilsReached,
  draftEntries,
  groupKey,
  parseCell,
  parseRawPaste,
  rangeFlag,
  specLabel,
  workflowIndicator,
  type CurrentValue,
  type PasteLine,
  type PasteMode,
  type SheetRow,
} from '../lib/workflow';
import { formatRaw, InstitutionLabel, LevelTag, RequestSummary, useInstitutionMap } from './bits';
import { ConfirmValuesDialog } from './ConfirmValuesDialog';

const shortDate = (iso: string, lang: string) => formatDate(iso, lang, { day: 'numeric', month: 'short', year: 'numeric' });

export function IndicatorSheet({ specId, onBack }: { specId: string; onBack: () => void }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const lang = i18n.language;
  const w = workflowIndicator(specId)!;
  const spec = w.spec;
  const model = useModel();
  const { profile, canReview: reviewer } = usePermissions();
  const assignments = useAssignments();
  const requests = useRequests();
  const rawValues = useRawValues();
  const baseline = useQuery({ queryKey: ['baseline'], queryFn: loadBaseline, staleTime: Infinity });
  const submit = useSubmitRaw();
  const closeRequest = useCloseRequest();
  const institutions = useInstitutionMap();
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const [drafts, setDrafts] = React.useState<ReadonlyMap<string, string>>(new Map());
  const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(new Set());
  const [find, setFind] = React.useState('');
  const [dataset, setDataset] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [note, setNote] = React.useState('');
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // Land on the sheet's title when it opens from further down the list.
  React.useEffect(() => headingRef.current?.scrollIntoView({ block: 'start' }), []);

  const idx = React.useMemo(() => indexRawValues(rawValues.data ?? []), [rawValues.data]);
  const sheet = React.useMemo(() => buildSheet(model, spec, idx, baseline.data ?? null), [model, spec, idx, baseline.data]);
  const { entries, invalid } = React.useMemo(() => draftEntries(sheet, drafts), [sheet, drafts]);
  const reached = React.useMemo(() => councilsReached(model, idx, specId, entries), [model, idx, specId, entries]);

  const owner = assignments.data?.find((a) => a.specId === specId)?.institutionKey ?? null;
  const canEnter = canEnterIndicator(profile, specId, assignments.data ?? []);
  const openRequest =
    (requests.data ?? []).filter((r) => r.specId === specId && (r.status === 'open' || r.status === 'submitted')).sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null;

  const range = naturalRange(spec);
  const unit = spec.unit?.trim() ? t(`units.${unitKey(spec.unit)}`, { defaultValue: spec.unit.trim() }) : null;
  const group = groupKey(w);
  const name = specLabel(t, specId);

  const setDraft = (unitId: string, text: string) =>
    setDrafts((prev) => {
      const next = new Map(prev);
      if (text) next.set(unitId, text);
      else next.delete(unitId);
      return next;
    });

  const q = find.trim().toLowerCase();
  const matches = (u: Unit) => !q || u.name.toLowerCase().includes(q);
  const visibleRegions = sheet.regions.filter((r) => matches(r.unit) || r.councils.some((c) => matches(c.unit)));
  const isOpen = (id: string) => expanded.has(id) || (!!q && sheet.regions.find((r) => r.unit.id === id)?.councils.some((c) => matches(c.unit)));
  const toggleRegion = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOpen = expanded.size === sheet.regions.length;

  const applyPaste = (lines: PasteLine[]) => {
    setDrafts((prev) => {
      const next = new Map(prev);
      for (const l of lines) if (l.unit) next.set(l.unit.id, l.cell);
      return next;
    });
    const regionsWithCouncils = new Set(lines.filter((l) => l.level === 'council' && l.unit).map((l) => regionIdOf(l.unit!)));
    setExpanded((prev) => new Set([...prev, ...regionsWithCouncils]));
    setPasteOpen(false);
    toast.success(t('workflow.paste.applied', { count: lines.length }));
  };

  const datasetOk = dataset.trim().length >= 2;
  const send = async (applyNow: boolean) => {
    if (!entries.length || invalid.length || !datasetOk) return;
    try {
      await submit.mutateAsync({
        input: { specId, entries, dataset: dataset.trim(), period: period.trim() || undefined, note: note.trim() || undefined, requestId: openRequest?.id ?? null },
        applyNow,
      });
      toast.success(applyNow ? t('workflow.sheet.applied', { count: entries.length }) : t('workflow.sheet.sent', { count: entries.length }));
      setDrafts(new Map());
      setNote('');
    } catch (e) {
      toast.error(t('workflow.sheet.error'), { description: errorMessage(e) });
    }
  };

  const cancelRequest = async () => {
    if (!openRequest) return;
    try {
      await closeRequest.mutateAsync({ id: openRequest.id, status: 'cancelled' });
      toast.success(t('workflow.request.cancelled'));
    } catch (e) {
      toast.error(t('workflow.request.cancelError'), { description: errorMessage(e) });
    }
  };

  if (rawValues.isLoading || baseline.isLoading) return <ListSkeleton rows={3} />;

  const counts = { national: entries.filter((e) => e.level === 'national').length, regions: entries.filter((e) => e.level === 'region').length, councils: entries.filter((e) => e.level === 'council').length };

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
        <ArrowLeft /> {t('workflow.sheet.back')}
      </Button>

      <header className="mt-4 max-w-3xl">
        <Kicker>
          <span className="font-mono">{specId}</span>
        </Kicker>
        <h2 ref={headingRef} className="scroll-mt-24 text-[1.7rem] leading-tight">
          {name}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {[
            unit && t('workflow.sheet.unit', { unit }),
            range && t('workflow.sheet.range', { lo: formatRaw(range[0], lang), hi: formatRaw(range[1], lang) }),
            t(increasesRisk(spec) ? 'workflow.sheet.higherMore' : 'workflow.sheet.higherLess'),
          ]
            .filter(Boolean)
            .join(' ')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {w.core ? (group ? t('workflow.sheet.feeds', { group: t(`indicators:${group}`) }) : null) : t('workflow.sheet.advanced')}
          {!w.scoreable && ` ${t('workflow.sheet.notScoreable')}`}
        </p>
        <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-muted-foreground">{t('workflow.owner')}</dt>
          <dd>
            <InstitutionLabel institutionKey={owner} withKind />
          </dd>
          {openRequest && (
            <>
              <dt className="text-muted-foreground">{t('workflow.sheet.request')}</dt>
              <dd>
                <RequestSummary request={openRequest} />
                <span className="text-muted-foreground"> · {t('workflow.sheet.requestBy', { name: openRequest.createdByName })}</span>
                {reviewer && (
                  <Button variant="ghost" size="sm" className="ml-1 h-7 px-2" onClick={cancelRequest} disabled={closeRequest.isPending}>
                    {closeRequest.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <X aria-hidden />} {t('workflow.request.cancel')}
                  </Button>
                )}
                {openRequest.message && <blockquote className="mt-1.5 border-l-2 border-border pl-3 whitespace-pre-wrap">{openRequest.message}</blockquote>}
              </dd>
            </>
          )}
        </dl>
      </header>

      {!canEnter && (
        <p className="mt-6 max-w-3xl border-l-2 border-border pl-4 text-sm text-muted-foreground">
          {owner ? t('workflow.sheet.readOnlyOwner', { owner: institutions.get(owner)?.label ?? owner }) : t('workflow.sheet.readOnly')}
        </p>
      )}

      {/* Tools */}
      <div className="mt-8 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={find} onChange={(e) => setFind(e.target.value)} placeholder={t('workflow.sheet.find')} aria-label={t('workflow.sheet.find')} className="pl-9" />
        </div>
        <Button variant="ghost" size="sm" className="self-start sm:self-auto" onClick={() => setExpanded(allOpen ? new Set() : new Set(sheet.regions.map((r) => r.unit.id)))}>
          {allOpen ? t('workflow.sheet.collapseAll') : t('workflow.sheet.expandAll')}
        </Button>
        {canEnter && (
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" aria-expanded={pasteOpen} onClick={() => setPasteOpen((o) => !o)}>
              <ClipboardPaste /> {t('workflow.paste.button')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
              <BadgeCheck /> {t('workflow.confirm.button')}
            </Button>
          </div>
        )}
      </div>

      {pasteOpen && canEnter && <PastePanel onApply={applyPaste} />}

      {/* The sheet. On phones the value in use sits under the area name, so the entry column stays in view. */}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm sm:min-w-[640px]">
          <caption className="sr-only">{t('workflow.sheet.caption', { name })}</caption>
          <thead>
            <tr className="border-b border-foreground/25 text-left text-xs font-medium text-muted-foreground">
              <th scope="col" className="py-2.5 pr-3 font-medium">
                {t('workflow.sheet.col.area')}
              </th>
              <th scope="col" className="hidden py-2.5 pr-3 font-medium sm:table-cell">
                {t('workflow.sheet.col.now')}
              </th>
              {canEnter && (
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  {t('workflow.sheet.col.new')}
                </th>
              )}
              <th scope="col" className="py-2.5 text-right font-medium">
                {t('workflow.sheet.col.score')}
              </th>
            </tr>
          </thead>
          <tbody>
            {matches(sheet.national.unit) && <Row row={sheet.national} spec={spec} draft={drafts.get(sheet.national.unit.id)} onDraft={setDraft} canEnter={canEnter} label={t('workflow.sheet.national')} />}
            {visibleRegions.map((r) => {
              const open = isOpen(r.unit.id);
              return (
                <React.Fragment key={r.unit.id}>
                  <Row
                    row={r}
                    spec={spec}
                    draft={drafts.get(r.unit.id)}
                    onDraft={setDraft}
                    canEnter={canEnter}
                    label={
                      <button type="button" className="text-left font-medium hover:text-primary" aria-expanded={open} onClick={() => toggleRegion(r.unit.id)}>
                        {open ? (
                          <ChevronDown className="mr-1 inline size-4 -translate-y-px text-muted-foreground" aria-hidden />
                        ) : (
                          <ChevronRight className="mr-1 inline size-4 -translate-y-px text-muted-foreground" aria-hidden />
                        )}
                        {r.unit.name} <span className="font-normal text-muted-foreground">({t('workflow.sheet.councils', { count: r.councils.length })})</span>
                      </button>
                    }
                    varies={r.varies}
                  />
                  {open &&
                    r.councils
                      .filter((c) => !q || matches(c.unit) || matches(r.unit))
                      .map((c) => <Row key={c.unit.id} row={c} spec={spec} draft={drafts.get(c.unit.id)} onDraft={setDraft} canEnter={canEnter} indent />)}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {!visibleRegions.length && !matches(sheet.national.unit) && <EmptyState title={t('workflow.sheet.noMatch')} />}
      </div>

      {/* Source and send */}
      {canEnter && (
        <section aria-labelledby="sheet-send" className="mt-10 border-t border-border pt-8">
          <h3 id="sheet-send" className="font-display text-xl font-semibold">
            {t('workflow.sheet.sendTitle')}
          </h3>
          <div className="mt-4 grid max-w-3xl gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="sheet-dataset">{t('workflow.sheet.dataset')}</Label>
              <Input id="sheet-dataset" value={dataset} onChange={(e) => setDataset(e.target.value)} maxLength={200} placeholder={t('workflow.sheet.datasetPlaceholder')} aria-required="true" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sheet-period">{t('workflow.sheet.period')}</Label>
              <Input id="sheet-period" value={period} onChange={(e) => setPeriod(e.target.value)} maxLength={40} placeholder="2024" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sheet-note">{t('workflow.sheet.note')}</Label>
              <Textarea id="sheet-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={NOTE_MAX} placeholder={t('workflow.sheet.notePlaceholder')} className="min-h-20" />
            </div>
          </div>

          <p className="mt-5 text-sm" aria-live="polite">
            {entries.length
              ? t('workflow.sheet.summary', {
                  count: entries.length,
                  parts: [
                    counts.national && t('workflow.sheet.partNational'),
                    counts.regions && t('workflow.status.regions', { count: counts.regions }),
                    counts.councils && t('workflow.status.councils', { count: counts.councils }),
                  ]
                    .filter(Boolean)
                    .join(', '),
                  reached,
                })
              : t('workflow.sheet.nothing')}
          </p>
          {invalid.length > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-danger">
              <AlertTriangle className="size-4" aria-hidden /> {t('workflow.sheet.invalid', { count: invalid.length })}
            </p>
          )}
          {entries.length > 0 && !datasetOk && <p className="mt-1 text-sm text-muted-foreground">{t('workflow.sheet.needDataset')}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => send(reviewer)} disabled={!entries.length || invalid.length > 0 || !datasetOk || submit.isPending}>
              {submit.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              {reviewer ? t('workflow.sheet.apply') : t('workflow.sheet.send')}
            </Button>
            {reviewer && (
              <Button variant="outline" onClick={() => send(false)} disabled={!entries.length || invalid.length > 0 || !datasetOk || submit.isPending}>
                {t('workflow.sheet.sendForReview')}
              </Button>
            )}
            {drafts.size > 0 && (
              <Button variant="ghost" onClick={() => setDrafts(new Map())} disabled={submit.isPending}>
                {t('workflow.sheet.clear')}
              </Button>
            )}
          </div>
        </section>
      )}

      <ConfirmValuesDialog specId={confirmOpen ? specId : null} request={openRequest} onClose={() => setConfirmOpen(false)} />
    </div>
  );
}

function Row({
  row,
  spec,
  draft,
  onDraft,
  canEnter,
  label,
  indent,
  varies,
}: {
  row: SheetRow;
  spec: IndicatorSpec;
  draft: string | undefined;
  onDraft: (unitId: string, text: string) => void;
  canEnter: boolean;
  label?: React.ReactNode;
  indent?: boolean;
  varies?: boolean;
}) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const parsed = draft ? parseCell(draft) : null;
  const newValue = parsed?.kind === 'value' ? parsed.value : null;
  const flag = rangeFlag(spec, newValue);
  const inputId = `v-${row.unit.id}`;
  const score = parsed ? (parsed.kind === 'value' ? scoreRaw(spec, parsed.value) : null) : scoreRaw(spec, row.current?.raw ?? null);
  const flagId = `${inputId}-flag`;

  return (
    <tr className={cn('border-b border-border align-top', row.level === 'region' && 'bg-muted/30', parsed && parsed.kind !== 'empty' && 'bg-primary/[0.04]')}>
      <th scope="row" className={cn('py-2.5 pr-3 text-left font-normal', indent && 'pl-7', row.level !== 'council' && 'font-medium')}>
        {label ?? row.unit.name}
        <div className="mt-1 font-normal sm:hidden">
          <Current current={row.current} varies={varies} lang={i18n.language} />
        </div>
      </th>
      <td className="hidden py-2.5 pr-3 sm:table-cell">
        <Current current={row.current} varies={varies} lang={i18n.language} />
      </td>
      {canEnter && (
        <td className="py-2 pr-3">
          <Input
            id={inputId}
            inputMode="decimal"
            autoComplete="off"
            value={draft ?? ''}
            onChange={(e) => onDraft(row.unit.id, e.target.value)}
            aria-label={t('workflow.sheet.newFor', { name: row.unit.name })}
            aria-invalid={parsed?.kind === 'invalid' || undefined}
            aria-describedby={flag || parsed?.kind === 'invalid' ? flagId : undefined}
            className="num h-9 w-24 sm:w-36"
          />
          {parsed?.kind === 'invalid' && (
            <p id={flagId} className="mt-1 text-xs text-danger">
              {t('workflow.sheet.notANumber')}
            </p>
          )}
          {flag && (
            <p id={flagId} className="mt-1 text-xs text-warning">
              {t(flag === 'high' ? 'workflow.sheet.high' : 'workflow.sheet.low')}
            </p>
          )}
          {parsed?.kind === 'noData' && <p className="mt-1 text-xs text-muted-foreground">{t('workflow.sheet.noData')}</p>}
        </td>
      )}
      <td className={cn('num py-2.5 text-right', !parsed && 'text-muted-foreground')}>{isNum(score) ? formatScore(score) : NO_VALUE}</td>
    </tr>
  );
}

function Current({ current, varies, lang }: { current: CurrentValue | null; varies?: boolean; lang: string }) {
  const { t } = useTranslation('data');
  if (!current) return <span className="text-muted-foreground">{varies ? t('workflow.sheet.varies') : NO_VALUE}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="num font-medium">{isNum(current.raw) ? formatRaw(current.raw, lang) : t('workflow.sheet.noDataShort')}</span>
      <LevelTag level={current.level} />
      {current.at && <span className="text-xs text-muted-foreground">{shortDate(current.at, lang)}</span>}
    </span>
  );
}

/** Paste two columns from a spreadsheet (area name, value); matched rows go into the sheet. */
function PastePanel({ onApply }: { onApply: (lines: PasteLine[]) => void }) {
  const { t } = useTranslation('data');
  const model = useModel();
  const [text, setText] = React.useState('');
  const [mode, setMode] = React.useState<PasteMode>('auto');
  const lines = React.useMemo(() => (text.trim() ? parseRawPaste(text, model, mode) : []), [text, model, mode]);
  const good = lines.filter((l) => l.unit && !l.issue);
  const issues = lines.filter((l) => l.issue && l.issue !== 'duplicate');
  const dupes = lines.filter((l) => l.issue === 'duplicate').length;
  const n = { national: good.filter((l) => l.level === 'national').length, regions: good.filter((l) => l.level === 'region').length, councils: good.filter((l) => l.level === 'council').length };

  return (
    <div className="mt-4 max-w-3xl border-l-2 border-border py-1 pl-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{t('workflow.paste.lead')}</p>
      <Segmented
        size="sm"
        className="mt-3"
        aria-label={t('workflow.paste.mode')}
        value={mode}
        onValueChange={setMode}
        options={[
          { value: 'auto', label: t('workflow.paste.auto') },
          { value: 'region', label: t('workflow.paste.regions') },
          { value: 'council', label: t('workflow.paste.councils') },
        ]}
      />
      <Textarea
        className="mt-3 min-h-40 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={t('workflow.paste.area')}
        placeholder={'Arusha\t12.4\nDodoma\t9.1\nKondoa District Council\t10.2'}
        spellCheck={false}
      />
      {lines.length > 0 && (
        <div className="mt-3 space-y-2 text-sm" aria-live="polite">
          <p>
            {t('workflow.paste.ready', { count: good.length })}
            {good.length > 0 &&
              ` (${[n.national && t('workflow.sheet.partNational'), n.regions && t('workflow.status.regions', { count: n.regions }), n.councils && t('workflow.status.councils', { count: n.councils })].filter(Boolean).join(', ')})`}
            {dupes > 0 && ` · ${t('workflow.paste.duplicates', { count: dupes })}`}
          </p>
          {issues.length > 0 && (
            <ul className="space-y-1 text-muted-foreground">
              {issues.slice(0, 12).map((l) => (
                <li key={l.lineNo}>
                  <span className="num text-foreground">{t('workflow.paste.line', { n: l.lineNo })}</span> {l.text.slice(0, 60)}:{' '}
                  <span className="text-danger">{t(`workflow.paste.issue.${l.issue}`)}</span>
                  {l.suggestion && ` ${t('workflow.paste.didYouMean', { name: l.suggestion.name })}`}
                </li>
              ))}
              {issues.length > 12 && <li>{t('workflow.paste.more', { count: issues.length - 12 })}</li>}
            </ul>
          )}
          <Button size="sm" onClick={() => onApply(good)} disabled={!good.length}>
            {t('workflow.paste.apply', { count: good.length })}
          </Button>
        </div>
      )}
    </div>
  );
}
