/**
 * Enter scores: pick a council, type new 0–10 values (or mark "no data") for any of the 32 indicators
 * and the exposure index, see the live effect on H / V / LCC / Risk, and submit. Vulnerability & Coping
 * rows are clearly marked as shared with the council's INFORM source unit (and its sibling councils).
 */
import { Ban, Info, ListFilter, MapPinned, RotateCcw, Share2, Users } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Switch, Tooltip } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { DIMENSIONS, type DimensionDef } from '@/engine/risk/hierarchy';
import { authorityLabel, sourceFor, sourceLabel } from '@/engine/risk/sources';
import type { EditRef, Unit } from '@/engine/risk/types';
import { cn, formatDate, formatScore } from '@/lib/utils';
import { Callout, Delta, EmptyState } from '../components/common';
import { CouncilContextCard, DiscardDialog } from '../components/CouncilPicker';
import { ImpactPreview } from '../components/ImpactPreview';
import { EMPTY_META, EntrySubmitCard, type MetaState } from '../components/SubmitPanel';
import { useMySubmissions } from '../hooks';
import { countDirty, evaluateRow, isRowDirty, type DraftRows, type RowDraft, type RowEval } from '../lib/draft';
import { listNames } from '../lib/format';
import { scoreDelta } from '../lib/scores';
import { EDITABLE_FIELDS, EXPOSURE_REF, impactOf, siblingsOf, sourceValues, type DraftChange, type ValueMap } from '../lib/targets';

const EMPTY: DraftRows = {};

export function ScoreEntry({ councilId, onCouncilChange }: { councilId: string | null; onCouncilChange: (id: string) => void }) {
  const { t } = useTranslation('data');
  const model = useModel();
  const council = councilId ? (model.byId.get(councilId) ?? null) : null;
  const [draft, setDraft] = React.useState<{ councilId: string | null; rows: DraftRows }>({ councilId: null, rows: EMPTY });
  const rows = draft.councilId === councilId ? draft.rows : EMPTY;
  const [meta, setMeta] = React.useState<MetaState>(EMPTY_META);
  const [switchTo, setSwitchTo] = React.useState<string | null>(null);
  const dirty = countDirty(rows);

  const requestSwitch = (id: string) => {
    if (id === councilId) return;
    if (dirty) setSwitchTo(id);
    else onCouncilChange(id);
  };
  const setRow = React.useCallback(
    (ref: EditRef, patch: Partial<RowDraft> | null) =>
      setDraft((d) => {
        const base = d.councilId === councilId ? d.rows : EMPTY;
        const next = { ...base };
        if (patch === null) delete next[ref];
        else next[ref] = { text: '', noData: false, ...base[ref], ...patch };
        return { councilId, rows: next };
      }),
    [councilId],
  );
  const clearRefs = React.useCallback(
    (refs: EditRef[] | 'all') =>
      setDraft((d) => {
        if (refs === 'all' || d.councilId !== councilId) return { councilId, rows: EMPTY };
        const next = { ...d.rows };
        for (const r of refs) delete next[r];
        return { councilId, rows: next };
      }),
    [councilId],
  );

  return (
    <div className="space-y-5">
      <CouncilContextCard idPrefix="scores" council={council} onChange={requestSwitch} title={t('scores.pickTitle')} description={t('scores.pickLead')} />
      {council ? (
        <ScoreForm council={council} rows={rows} setRow={setRow} clearRefs={clearRefs} meta={meta} setMeta={setMeta} />
      ) : (
        <EmptyState icon={<MapPinned />} title={t('scores.emptyTitle')} description={t('scores.emptyLead')} />
      )}
      <DiscardDialog
        open={switchTo != null}
        count={dirty}
        onCancel={() => setSwitchTo(null)}
        onConfirm={() => {
          setDraft({ councilId: null, rows: EMPTY });
          if (switchTo) onCouncilChange(switchTo);
          setSwitchTo(null);
        }}
      />
    </div>
  );
}

function ScoreForm({
  council,
  rows,
  setRow,
  clearRefs,
  meta,
  setMeta,
}: {
  council: Unit;
  rows: DraftRows;
  setRow: (ref: EditRef, patch: Partial<RowDraft> | null) => void;
  clearRefs: (refs: EditRef[] | 'all') => void;
  meta: MetaState;
  setMeta: React.Dispatch<React.SetStateAction<MetaState>>;
}) {
  const { t } = useTranslation(['data', 'common']);
  const model = useModel();
  const [changedOnly, setChangedOnly] = React.useState(false);
  const siblings = React.useMemo(() => siblingsOf(model, council), [model, council]);
  const pendingRefs = usePendingRefs(council);

  const evals = React.useMemo(() => new Map(EDITABLE_FIELDS.map((f) => [f.ref, evaluateRow(f, council, rows[f.ref])])), [council, rows]);
  const changes = React.useMemo<DraftChange[]>(() => [...evals.values()].flatMap((e) => (e.change ? [e.change] : [])), [evals]);
  const errorCount = React.useMemo(() => [...evals.values()].filter((e) => e.error).length, [evals]);
  const values = React.useMemo<ValueMap>(() => Object.fromEntries(changes.map((c) => [c.ref, c.value])), [changes]);
  const impact = React.useMemo(() => impactOf(council, values), [council, values]);
  const siblingImpacts = React.useMemo(() => {
    const vc = sourceValues(values);
    return Object.keys(vc).length ? siblings.map((s) => ({ unit: s, ...impactOf(s, vc) })) : [];
  }, [siblings, values]);
  const dirty = countDirty(rows);

  return (
    <div className={cn('grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]', changes.length > 0 && 'pb-24 lg:pb-0')}>
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {changes.length ? t('scores.changeCount', { count: changes.length }) : t('scores.hint')}
            {errorCount > 0 && <span className="ml-2 font-medium text-danger">{t('scores.errorCount', { count: errorCount })}</span>}
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={changedOnly} onCheckedChange={setChangedOnly} aria-label={t('scores.changedOnly')} />
              <span className="inline-flex items-center gap-1">
                <ListFilter className="size-4 text-muted-foreground" aria-hidden /> {t('scores.changedOnly')}
              </span>
            </label>
            {dirty > 0 && (
              <Button variant="ghost" size="sm" onClick={() => clearRefs('all')}>
                <RotateCcw /> {t('scores.clearAll')}
              </Button>
            )}
          </div>
        </div>
        {changedOnly && dirty === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t('scores.noneChanged')}</p>}
        {DIMENSIONS.map((d, i) => (
          <DimensionCard
            key={d.key}
            index={i}
            def={d}
            council={council}
            siblings={siblings}
            evals={evals}
            changedOnly={changedOnly}
            before={impact.before[d.key]}
            after={impact.after[d.key]}
            hasChanges={changes.some((c) => c.ref.startsWith(`${d.key}:`))}
            setRow={setRow}
            floodEdited={!!evals.get('hazard:flood')?.change}
            pendingRefs={pendingRefs}
          />
        ))}
      </div>

      <aside id="score-submit" className="scroll-mt-24 space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1" aria-label={t('preview.eyebrow')}>
        <ImpactPreview unitName={council.name} impact={impact} count={changes.length} siblings={siblingImpacts} />
        <EntrySubmitCard idPrefix="scores" council={council} changes={changes} impact={impact} meta={meta} setMeta={setMeta} blocking={errorCount} onSubmitted={(refs) => clearRefs(refs)} />
      </aside>

      <MobileSubmitBar count={changes.length} before={impact.before.risk} after={impact.after.risk} target="score-submit" />
    </div>
  );
}

/** Phone-only sticky summary that jumps to the preview/submit panel. */
export function MobileSubmitBar({ count, before, after, target }: { count: number; before: number | null; after: number | null; target: string }) {
  const { t } = useTranslation('data');
  if (!count) return null;
  return (
    <div className="glass fixed inset-x-3 bottom-3 z-40 flex animate-fade-up items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-[var(--shadow-lift)] lg:hidden">
      <div className="min-w-0 text-sm">
        <div className="font-semibold">{t('scores.changeCount', { count })}</div>
        <div className="num flex items-center gap-1.5 text-xs text-muted-foreground">
          {t('common:informRisk')} {formatScore(before)} → <span className="font-semibold text-foreground">{formatScore(after)}</span>
          <Delta value={scoreDelta(before, after)} />
        </div>
      </div>
      <Button size="sm" onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
        {t('scores.reviewNow')}
      </Button>
    </div>
  );
}

function DimensionCard({
  index,
  def,
  council,
  siblings,
  evals,
  changedOnly,
  before,
  after,
  hasChanges,
  setRow,
  floodEdited,
  pendingRefs,
}: {
  index: number;
  def: DimensionDef;
  council: Unit;
  siblings: Unit[];
  evals: Map<EditRef, RowEval>;
  changedOnly: boolean;
  before: number | null;
  after: number | null;
  hasChanges: boolean;
  setRow: (ref: EditRef, patch: Partial<RowDraft> | null) => void;
  floodEdited: boolean;
  pendingRefs: ReadonlySet<string>;
}) {
  const { t } = useTranslation(['data', 'common']);
  const shared = def.key !== 'hazard';
  const visible = (ref: EditRef) => !changedOnly || isRowDirty(evals.get(ref)?.draft);
  const cats = def.categories.map((c) => ({ key: c.key, refs: c.indicators.map((i) => `${def.key}:${i.key}` as EditRef).filter(visible) })).filter((c) => c.refs.length);
  const showExposure = def.key === 'hazard' && visible(EXPOSURE_REF);
  if (!cats.length && !showExposure) return null;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{['H', 'V', 'LCC'][index]}</div>
          <h3 className="text-lg font-bold">{t(`common:dimensions.${def.key}`)}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <ClassBadge value={before} scale={def.scale} showScore size="sm" className={cn(hasChanges && before !== after && 'opacity-60')} />
          {hasChanges && before !== after && (
            <>
              <span className="text-muted-foreground" aria-hidden>
                →
              </span>
              <ClassBadge value={after} scale={def.scale} showScore size="sm" />
            </>
          )}
        </div>
      </div>
      {shared && (
        <Callout className="mx-5 mt-4" icon={<Share2 />} title={t('scores.sharedTitle', { source: council.sourceName ?? council.name })}>
          {siblings.length
            ? t('scores.sharedSiblings', { count: siblings.length, names: listNames(siblings.map((s) => s.name), 4, (n) => t('context.andMore', { count: n })) })
            : t('scores.sharedAlone', { council: council.name })}
        </Callout>
      )}
      {cats.map((c) => (
        <fieldset key={c.key} className="mt-2">
          <legend className="px-5 pt-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t(`common:categories.${c.key}`)}</legend>
          <ul className="divide-y divide-border">
            {c.refs.map((ref) => (
              <IndicatorRow key={ref} ev={evals.get(ref)!} council={council} shared={shared} siblings={siblings.length} setRow={setRow} pending={pendingRefs.has(ref)} />
            ))}
          </ul>
        </fieldset>
      ))}
      {showExposure && (
        <fieldset className="mt-2 border-t border-border">
          <legend className="px-5 pt-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t('scores.exposureGroup')}</legend>
          <ul>
            <IndicatorRow
              ev={evals.get(EXPOSURE_REF)!}
              council={council}
              shared={false}
              siblings={0}
              setRow={setRow}
              pending={pendingRefs.has(EXPOSURE_REF)}
              note={floodEdited ? t('scores.exposureFloodEdited') : t('scores.exposureNote')}
            />
          </ul>
        </fieldset>
      )}
      <div className="h-2" />
    </Card>
  );
}

interface IndicatorRowProps {
  ev: RowEval;
  council: Unit;
  shared: boolean;
  siblings: number;
  setRow: (ref: EditRef, patch: Partial<RowDraft> | null) => void;
  pending: boolean;
  note?: string;
}

/** Rows only re-render when their own draft/value changes (typing in one row must stay instant). */
const sameRow = (a: IndicatorRowProps, b: IndicatorRowProps) =>
  a.council === b.council &&
  a.shared === b.shared &&
  a.siblings === b.siblings &&
  a.setRow === b.setRow &&
  a.note === b.note &&
  a.pending === b.pending &&
  a.ev.draft === b.ev.draft &&
  a.ev.current === b.ev.current &&
  a.ev.error === b.ev.error &&
  a.ev.change?.value === b.ev.change?.value;

const IndicatorRow = React.memo(function IndicatorRow({ ev, council, shared, siblings, setRow, pending, note }: IndicatorRowProps) {
  const { t, i18n } = useTranslation(['data', 'common', 'indicators']);
  const { field, current, draft, error, change } = ev;
  const ref = field.ref;
  const id = `score-${ref.replace(':', '-')}`;
  const errId = `${id}-error`;
  const name = t(`indicators:${field.key}`);
  const isExposure = ref === EXPOSURE_REF;
  const stamp = council.edits[ref];
  const src = sourceFor(field.dim, field.key);
  const provenance = stamp
    ? t('scores.updatedBy', { authority: authorityLabel(stamp.authority) || stamp.author || '—', date: formatDate(stamp.at, i18n.language) })
    : sourceLabel(src);
  const noData = !!draft?.noData;
  const dirty = isRowDirty(draft);
  const desc = isExposure ? t('scores.exposureDesc') : t(`indicators:desc.${field.key}`, { defaultValue: '' });

  return (
    <li
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto_auto]',
        change && 'bg-primary/[0.05]',
        error && 'bg-danger/[0.05]',
      )}
    >
      <div className="col-span-2 min-w-0 sm:col-span-1">
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className="truncate text-sm font-medium">
            {name}
          </label>
          {desc && (
            <Tooltip content={desc}>
              <button type="button" className="shrink-0 rounded text-muted-foreground hover:text-foreground" aria-label={t('scores.about', { name })}>
                <Info className="size-3.5" />
              </button>
            </Tooltip>
          )}
          {shared && (
            <Tooltip content={siblings ? t('scores.sharedTip', { count: siblings }) : t('scores.sharedTipAlone')}>
              <Badge variant="secondary" className="shrink-0 cursor-default gap-1 px-2 text-[10px]" tabIndex={0}>
                <Users aria-hidden /> {t('scores.shared')}
              </Badge>
            </Tooltip>
          )}
          {stamp && (
            <Badge variant="success" className="shrink-0 px-2 text-[10px]">
              {t('common:labels.edited')}
            </Badge>
          )}
          {pending && (
            <Badge variant="warning" className="shrink-0 px-2 text-[10px]" title={t('scores.pendingTip')}>
              {t('scores.pending')}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground" title={provenance}>
          {provenance}
        </div>
        {note && <div className="mt-0.5 text-xs text-muted-foreground">{note}</div>}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-12 text-right" title={t('scores.current')}>
          <span className="sr-only">{t('scores.current')}: </span>
          <span className={cn('num text-sm font-semibold', current == null && 'text-xs font-normal text-muted-foreground italic')}>{current == null ? t('common:classes.noData') : formatScore(current)}</span>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-primary/50" style={{ width: `${((current ?? 0) / 10) * 100}%` }} />
          </div>
        </div>
        <span className="text-muted-foreground" aria-hidden>
          →
        </span>
        <div className="relative">
          <Input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="next"
            className="num h-9 w-20 text-center"
            value={noData ? '' : (draft?.text ?? '')}
            placeholder={noData ? t('common:classes.noData') : formatScore(current)}
            disabled={noData}
            onChange={(e) => setRow(ref, { text: e.target.value, noData: false })}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && dirty) {
                e.preventDefault();
                setRow(ref, null);
              }
            }}
            aria-invalid={!!error}
            aria-describedby={error ? errId : undefined}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        {change ? <Delta value={change.value == null ? null : scoreDelta(current, change.value)} className="mr-1" /> : null}
        {!isExposure && (
          <Tooltip content={noData ? t('scores.noDataOn') : t('scores.noDataOff')}>
            <Button
              variant={noData ? 'secondary' : 'ghost'}
              size="icon-sm"
              aria-pressed={noData}
              aria-label={t('scores.markNoData', { name })}
              onClick={() => setRow(ref, noData ? null : { noData: true, text: '' })}
              className={cn(noData && 'text-warning')}
            >
              <Ban />
            </Button>
          </Tooltip>
        )}
        <Button variant="ghost" size="icon-sm" aria-label={t('scores.resetRow', { name })} onClick={() => setRow(ref, null)} className={cn(!dirty && 'invisible')} tabIndex={dirty ? 0 : -1}>
          <RotateCcw />
        </Button>
      </div>

      {error && (
        <p id={errId} role="alert" className="col-span-2 text-xs font-medium text-danger sm:col-span-3">
          {t(`scores.errors.${error}`)}
        </p>
      )}
    </li>
  );
}, sameRow);

/** Refs this person already has pending for the council (or its shared source unit). */
export function usePendingRefs(council: Unit): ReadonlySet<string> {
  const { mine } = useMySubmissions();
  return React.useMemo(() => {
    const set = new Set<string>();
    for (const s of mine)
      if (s.status === 'pending' && (s.unitId === council.id || s.unitId === council.sourceId)) for (const c of s.changes) set.add(c.ref);
    return set;
  }, [mine, council.id, council.sourceId]);
}
