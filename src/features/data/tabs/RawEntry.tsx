/**
 * Enter measured values: the officer keys actual values in their natural units for the 53 workbook
 * indicators; each is standardised live to 0–10 exactly as the INFORM workbook, rolled up into its
 * workbook component and mapped onto the model leaf - then submitted with its raw provenance.
 * Same layout as score entry: rows, then the submit section; the live preview sticks beside both.
 */
import { CircleSlash, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import type { IndicatorSpec } from '@/engine/risk/standardise';
import type { EditRef, Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { Callout, Delta, EmptyState, ROW_TINT, ScoreValue } from '../components/common';
import { CouncilContextCard, DiscardDialog } from '../components/CouncilPicker';
import { ImpactPreview } from '../components/ImpactPreview';
import { EMPTY_META, EntrySubmitCard, type MetaState } from '../components/SubmitPanel';
import { componentScores, encodeRaw, increasesRisk, isComputable, naturalRange, parseRawNumber, rawGroups, specKey, standardiseRaw, unitKey, type RawComponent } from '../lib/raw';
import { sameScore, scoreDelta } from '../lib/scores';
import { currentValue, impactOf, siblingsOf, sourceValues, targetKind, type DraftChange, type ValueMap } from '../lib/targets';
import { MobileSubmitBar, PreviewAside, usePendingRefs } from './ScoreEntry';

const GROUPS = rawGroups();
const SPEC_TO_REF = new Map<string, EditRef>(GROUPS.flatMap((g) => g.components.flatMap((c) => (c.ref ? c.specs.map((s) => [s.id, c.ref!] as const) : []))));
type RawRows = Readonly<Record<string, string>>;
const EMPTY: RawRows = {};

export function RawEntry({ councilId, onCouncilChange }: { councilId: string | null; onCouncilChange: (id: string) => void }) {
  const { t } = useTranslation('data');
  const model = useModel();
  const council = councilId ? (model.byId.get(councilId) ?? null) : null;
  const [draft, setDraft] = React.useState<{ councilId: string | null; rows: RawRows }>({ councilId: null, rows: EMPTY });
  const rows = draft.councilId === councilId ? draft.rows : EMPTY;
  const [meta, setMeta] = React.useState<MetaState>(EMPTY_META);
  const [switchTo, setSwitchTo] = React.useState<string | null>(null);
  const dirty = Object.values(rows).filter((v) => v.trim()).length;

  const setRow = React.useCallback(
    (id: string, text: string) =>
      setDraft((d) => {
        const base = d.councilId === councilId ? d.rows : EMPTY;
        const next = { ...base };
        if (text === '') delete next[id];
        else next[id] = text;
        return { councilId, rows: next };
      }),
    [councilId],
  );
  const clearRefs = React.useCallback(
    (refs: EditRef[] | 'all') =>
      setDraft((d) => {
        if (refs === 'all' || d.councilId !== councilId) return { councilId, rows: EMPTY };
        const drop = new Set(refs);
        return { councilId, rows: Object.fromEntries(Object.entries(d.rows).filter(([id]) => !drop.has(SPEC_TO_REF.get(id)!))) };
      }),
    [councilId],
  );

  return (
    <div className="space-y-8">
      <CouncilContextCard
        idPrefix="raw"
        council={council}
        onChange={(id) => (id === councilId ? undefined : dirty ? setSwitchTo(id) : onCouncilChange(id))}
        title={t('raw.pickTitle')}
        description={t('raw.pickLead')}
      />
      {council ? (
        <RawForm council={council} rows={rows} setRow={setRow} clearRefs={clearRefs} meta={meta} setMeta={setMeta} />
      ) : (
        <EmptyState className="pt-2" title={t('scores.emptyTitle')} description={t('raw.emptyLead')} />
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

interface SpecEval {
  text: string;
  value: number | null;
  error: 'notNumber' | null;
  score: number | null;
  /** Shown when separators were interpreted ("989,030" → 989030). */
  readsAs: string | null;
}

function RawForm({
  council,
  rows,
  setRow,
  clearRefs,
  meta,
  setMeta,
}: {
  council: Unit;
  rows: RawRows;
  setRow: (id: string, text: string) => void;
  clearRefs: (refs: EditRef[] | 'all') => void;
  meta: MetaState;
  setMeta: React.Dispatch<React.SetStateAction<MetaState>>;
}) {
  const { t, i18n } = useTranslation(['data', 'common', 'indicators']);
  const model = useModel();
  const siblings = React.useMemo(() => siblingsOf(model, council), [model, council]);
  const pendingRefs = usePendingRefs(council);

  const evals = React.useMemo(() => {
    const m = new Map<string, SpecEval>();
    for (const g of GROUPS)
      for (const c of g.components)
        for (const s of c.specs) {
          const text = rows[s.id] ?? '';
          if (!text.trim()) continue;
          const n = parseRawNumber(text);
          const ok = Number.isFinite(n);
          m.set(s.id, {
            text,
            value: ok ? n : null,
            error: ok ? null : 'notNumber',
            score: ok ? standardiseRaw(s, n) : null,
            readsAs: ok && (/[,\s]/.test(text.trim()) || (text.match(/\./g)?.length ?? 0) > 1) ? formatNumber(n, i18n.language, { maximumFractionDigits: 6 }) : null,
          });
        }
    return m;
  }, [rows, i18n.language]);

  const comps = React.useMemo(() => {
    const rawById: Record<string, number> = {};
    for (const [id, e] of evals) if (e.value != null) rawById[id] = e.value;
    return componentScores(rawById, GROUPS);
  }, [evals]);
  const compByName = React.useMemo(() => new Map(comps.map((c) => [c.component, c])), [comps]);
  const changes = React.useMemo<DraftChange[]>(
    () => comps.filter((c) => !sameScore(c.score, currentValue(council, c.ref))).map((c) => ({ ref: c.ref, value: c.score, raw: encodeRaw(c.inputs) })),
    [comps, council],
  );
  const errorCount = [...evals.values()].filter((e) => e.error).length;
  const values = React.useMemo<ValueMap>(() => Object.fromEntries(changes.map((c) => [c.ref, c.value])), [changes]);
  const impact = React.useMemo(() => impactOf(council, values), [council, values]);
  const siblingImpacts = React.useMemo(() => {
    const vc = sourceValues(values);
    return Object.keys(vc).length ? siblings.map((s) => ({ unit: s, ...impactOf(s, vc) })) : [];
  }, [siblings, values]);
  const filled = [...evals.values()].filter((e) => e.value != null).length;
  const total = GROUPS.reduce((s, g) => s + g.components.reduce((a, c) => a + c.specs.length, 0), 0);

  return (
    <div className={cn('grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:gap-x-14', changes.length > 0 && 'pb-24 lg:pb-0')}>
      <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-1">
        <div className="space-y-5">
          <Callout title={t('raw.introTitle')}>{t('raw.introLead')}</Callout>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('raw.filled', { filled, total })}
              {errorCount > 0 && <span className="ml-2 font-medium text-danger">{t('scores.errorCount', { count: errorCount })}</span>}
            </p>
            {filled + errorCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => clearRefs('all')}>
                <RotateCcw /> {t('scores.clearAll')}
              </Button>
            )}
          </div>
        </div>
        {GROUPS.map((g) => (
          <section key={g.key} aria-labelledby={`raw-dim-${g.key}`}>
            <h3 id={`raw-dim-${g.key}`} className="border-b border-border pb-3 font-display text-xl font-semibold sm:text-[1.4rem]">
              {t(`common:dimensions.${g.key}`)}
            </h3>
            <div className="divide-y divide-border border-b border-border">
              {g.components.map((c) => (
                <ComponentBlock
                  key={c.name}
                  comp={c}
                  council={council}
                  score={compByName.get(c.name)?.score ?? null}
                  evals={evals}
                  setRow={setRow}
                  siblings={siblings.length}
                  pending={!!c.ref && pendingRefs.has(c.ref)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <PreviewAside id="raw-preview" label={t('preview.eyebrow')}>
        <ImpactPreview unitName={council.name} impact={impact} count={changes.length} siblings={siblingImpacts} submitTarget="raw-submit" />
      </PreviewAside>

      <EntrySubmitCard
        idPrefix="raw"
        council={council}
        changes={changes}
        impact={impact}
        meta={meta}
        setMeta={setMeta}
        blocking={errorCount}
        onSubmitted={(refs) => clearRefs(refs)}
        className="lg:col-start-1 lg:row-start-2"
      >
        {comps.length > 0 && (
          <section aria-labelledby="raw-mapping-title" className="mt-6">
            <h4 id="raw-mapping-title" className="text-sm font-medium text-muted-foreground">
              {t('raw.mappingTitle')}
            </h4>
            <ul className="mt-1.5 divide-y divide-border border-y border-border text-sm">
              {comps.map((c) => {
                const cur = currentValue(council, c.ref);
                const [dim, key] = c.ref.split(':');
                return (
                  <li key={c.ref} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t(`indicators:${key}`)}</span>
                      <span className="block text-xs text-muted-foreground">{t(`common:dimensions.${dim}Short`)}</span>
                    </span>
                    <span className="num flex shrink-0 items-center gap-1.5">
                      <ScoreValue value={cur} className="font-normal text-muted-foreground" />
                      <span className="text-muted-foreground" aria-hidden>
                        →
                      </span>
                      <ScoreValue value={c.score} />
                      <Delta value={scoreDelta(cur, c.score)} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </EntrySubmitCard>

      <MobileSubmitBar count={changes.length} before={impact.before.risk} after={impact.after.risk} target="raw-preview" />
    </div>
  );
}

/** "Storms & Cyclone" and "Storms & cyclones" are the same name for this purpose. */
const looseName = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.replace(/s$/, ''))
    .join(' ');

function ComponentBlock({
  comp,
  council,
  score,
  evals,
  setRow,
  siblings,
  pending,
}: {
  comp: RawComponent;
  council: Unit;
  score: number | null;
  evals: Map<string, SpecEval>;
  setRow: (id: string, text: string) => void;
  siblings: number;
  pending: boolean;
}) {
  const { t } = useTranslation(['data', 'common', 'indicators']);
  const leafKey = comp.leaf?.indicator.key;
  const current = comp.ref ? currentValue(council, comp.ref) : null;
  const shared = comp.ref ? targetKind(comp.ref) === 'source' : false;
  const title = leafKey ? t(`indicators:${leafKey}`) : comp.name;
  // The workbook component line only earns its place when its name differs from the heading.
  const showComponent = looseName(comp.name) !== looseName(title);
  const subText = [showComponent ? t('raw.component', { name: comp.name }) : null, shared ? (siblings ? t('raw.sharedTarget', { count: siblings }) : t('raw.sharedTargetAlone')) : null]
    .filter(Boolean)
    .join(' · ');
  const sub = subText.charAt(0).toUpperCase() + subText.slice(1);
  return (
    <section className="py-4" aria-labelledby={`comp-${specKey(comp.name)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="min-w-0">
          <h4 id={`comp-${specKey(comp.name)}`} className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
            {title}
            {pending && (
              <Badge variant="warning" className="px-2 text-[11px] font-semibold" title={t('scores.pendingTip')}>
                {t('scores.pending')}
              </Badge>
            )}
          </h4>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-xs text-muted-foreground">{t('scores.current')}</span>
          <ScoreValue value={current} />
          {score != null && (
            <>
              <span aria-hidden>→</span>
              <span className="num font-semibold">{formatScore(score)}</span>
              <Delta value={scoreDelta(current, score)} />
            </>
          )}
        </div>
      </div>
      <ul className="mt-1">
        {comp.specs.map((s) => (
          <SpecRow key={s.id} spec={s} ev={evals.get(s.id)} setRow={setRow} />
        ))}
      </ul>
    </section>
  );
}

interface SpecRowProps {
  spec: IndicatorSpec;
  ev: SpecEval | undefined;
  setRow: (id: string, text: string) => void;
}
const sameSpecRow = (a: SpecRowProps, b: SpecRowProps) =>
  a.spec === b.spec && a.setRow === b.setRow && a.ev?.text === b.ev?.text && a.ev?.score === b.ev?.score && a.ev?.error === b.ev?.error && a.ev?.readsAs === b.ev?.readsAs;

/** Memoised: typing in one measured value must not re-render the other 52 rows. */
const SpecRow = React.memo(function SpecRow({ spec, ev, setRow }: SpecRowProps) {
  const onChange = (v: string) => setRow(spec.id, v);
  const { t, i18n } = useTranslation(['data', 'common']);
  const id = `raw-${specKey(spec.id)}`;
  const errId = `${id}-error`;
  const computable = isComputable(spec);
  const range = naturalRange(spec);
  const unit = spec.unit?.trim() ? t(`units.${unitKey(spec.unit)}`, { defaultValue: spec.unit.trim() }) : t('raw.noUnit');
  const name = t(`specs.${specKey(spec.id)}`, { defaultValue: spec.name ?? spec.id });
  const fmt = (n: number) => formatNumber(n, i18n.language, { maximumSignificantDigits: 4 });
  const up = increasesRisk(spec);
  const keyedAt = spec.keyed_at ? t(`raw.keyedAt.${spec.keyed_at}`, { defaultValue: spec.keyed_at }) : null;

  return (
    <li className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-2.5', ev?.error ? ROW_TINT.error : ev?.score != null ? ROW_TINT.changed : undefined)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm">
          {name}
        </label>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{unit}</span>
          {range && <span className="num">{t('raw.reference', { min: fmt(range[0]), max: fmt(range[1]) })}</span>}
          <span className="inline-flex items-center gap-1">
            {up ? <TrendingUp className="size-3 text-danger" aria-hidden /> : <TrendingDown className="size-3 text-success" aria-hidden />}
            {up ? t('raw.higherMoreRisk') : t('raw.higherLessRisk')}
          </span>
          {keyedAt && <span>{keyedAt}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {computable ? (
          <>
            <Input
              id={id}
              inputMode="decimal"
              autoComplete="off"
              className="num h-9 w-28 text-right"
              value={ev?.text ?? ''}
              placeholder={t('raw.placeholder')}
              onChange={(e) => onChange(e.target.value)}
              aria-invalid={!!ev?.error}
              aria-describedby={ev?.error ? errId : undefined}
            />
            <span className="w-14 text-right" aria-live="polite">
              {ev?.score != null ? (
                <span className="num text-sm font-semibold" aria-label={t('raw.scoreAria', { score: formatScore(ev.score) })}>
                  {formatScore(ev.score)}
                </span>
              ) : null}
            </span>
          </>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <CircleSlash aria-hidden /> {t('raw.notComputable')}
          </Badge>
        )}
      </div>
      {ev?.error && (
        <p id={errId} role="alert" className="col-span-2 text-xs font-medium text-danger">
          {t('raw.errors.notNumber')}
        </p>
      )}
      {ev?.readsAs && !ev.error && <p className="col-span-2 text-xs text-muted-foreground">{t('raw.readsAs', { value: ev.readsAs })}</p>}
    </li>
  );
}, sameSpecRow);
