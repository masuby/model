/**
 * Live "what the map would show after approval" panel: H / V / LCC / Risk before → after with deltas and
 * class changes, plus sibling councils affected through a shared source unit. The numbers come from the
 * engine's own `applyEdits` (see lib/targets.ts), so they are exactly what approval will produce.
 * Rendered as the one bordered tool panel beside the entry form.
 */
import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ScoreBar } from '@/components/risk/DimensionBars';
import { ClassBadge, ClassDot } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { classify, type Scale } from '@/engine/risk/classes';
import { cn, formatScore } from '@/lib/utils';
import { scoreDelta } from '../lib/scores';
import type { AffectedImpact, Impact } from '../lib/targets';
import { Callout, Delta } from './common';

const KEYS = ['hazard', 'vulnerability', 'coping'] as const;
const SIBLINGS_SHOWN = 3;

/**
 * Before → after for one score. The old value is quiet text (class dot + score, full contrast muted
 * text - never a faded badge); the new value is the full-colour class badge. Unchanged: just the badge.
 */
export function BeforeAfter({ before, after, scale = 'risk' }: { before: number | null; after: number | null; scale?: Scale }) {
  const changed = scoreDelta(before, after) !== 0 || (before == null) !== (after == null);
  if (!changed) return <ClassBadge value={after} scale={scale} showScore size="sm" />;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ClassDot value={before} scale={scale} className="size-2 ring-0" />
        <span className="num">{formatScore(before)}</span>
      </span>
      <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
      <ClassBadge value={after} scale={scale} showScore size="sm" />
    </span>
  );
}

export function ImpactPreview({
  unitName,
  impact,
  count,
  siblings = [],
  submitTarget,
  className,
}: {
  unitName: string;
  impact: Impact;
  count: number;
  siblings?: AffectedImpact[];
  /** Id of the submit section; on wide screens a button jumps there once something has changed. */
  submitTarget?: string;
  className?: string;
}) {
  const { t } = useTranslation(['data', 'common']);
  const titleId = React.useId();
  const [allSiblings, setAllSiblings] = React.useState(false);
  const { before, after } = impact;
  const riskDelta = scoreDelta(before.risk, after.risk);
  const moved = count > 0 && riskDelta !== 0;
  const fromCls = classify(before.risk);
  const toCls = classify(after.risk);
  const classChanged = !!fromCls && !!toCls && fromCls.key !== toCls.key;
  const summary = count
    ? t('preview.srSummary', { name: unitName, before: formatScore(before.risk), after: formatScore(after.risk) })
    : t('preview.idle');

  return (
    <section aria-labelledby={titleId} className={cn('p-5 sm:p-6', className)}>
      <p className="text-sm text-muted-foreground">{t('preview.eyebrow')}</p>
      <h3 id={titleId} className="mt-0.5 text-lg font-semibold">
        {unitName}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{count ? t('preview.pending', { count }) : t('preview.idle')}</p>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">{t('common:informRisk')}</span>
          {count > 0 && <Delta value={riskDelta} />}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className={cn('num text-3xl font-semibold tracking-tight', moved && 'text-muted-foreground line-through decoration-1')}>{formatScore(before.risk)}</span>
          {moved && (
            <>
              <ArrowRight className="size-5 text-muted-foreground" aria-hidden />
              <span className="num text-3xl font-semibold tracking-tight">{formatScore(after.risk)}</span>
            </>
          )}
          <ClassBadge value={after.risk} className="ml-1" />
        </div>
      </div>

      {classChanged && (
        <Callout
          tone={toCls!.index > fromCls!.index ? 'danger' : 'success'}
          className="mt-4"
          title={t('preview.classChange', { from: t(`common:classes.${fromCls!.key}`), to: t(`common:classes.${toCls!.key}`) })}
        >
          {t(toCls!.index > fromCls!.index ? 'preview.classUp' : 'preview.classDown')}
        </Callout>
      )}

      <div className="mt-5 space-y-4 border-t border-border pt-4">
        {KEYS.map((k) => (
          <ScoreBar
            key={k}
            label={t(`common:dimensions.${k}`)}
            dim={k}
            value={after[k]}
            reference={count ? before[k] : undefined}
            referenceLabel={t('preview.before')}
            hint={count ? <Delta value={scoreDelta(before[k], after[k])} /> : undefined}
          />
        ))}
        {count > 0 && <p className="text-xs leading-snug text-muted-foreground">{t('preview.barLegend')}</p>}
      </div>

      {siblings.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <h4 className="text-sm font-semibold">{t('preview.siblingsTitle', { count: siblings.length })}</h4>
          <ul className="mt-1 divide-y divide-border">
            {(allSiblings ? siblings : siblings.slice(0, SIBLINGS_SHOWN)).map((s) => (
              <li key={s.unit.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate font-medium">{s.unit.name}</span>
                <BeforeAfter before={s.before.risk} after={s.after.risk} />
              </li>
            ))}
          </ul>
          {siblings.length > SIBLINGS_SHOWN && (
            <Button variant="link" size="sm" className="h-auto px-0" aria-expanded={allSiblings} onClick={() => setAllSiblings((o) => !o)}>
              {allSiblings ? t('common:actions.showLess') : t('preview.siblingsMore', { count: siblings.length - SIBLINGS_SHOWN })}
            </Button>
          )}
        </div>
      )}
      {submitTarget && count > 0 && (
        <Button
          variant="outline"
          className="mt-5 hidden w-full lg:inline-flex"
          onClick={() => {
            const el = document.getElementById(submitTarget);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el?.querySelector<HTMLElement>('button, input, textarea')?.focus({ preventScroll: true });
          }}
        >
          {t('preview.toSubmit')}
        </Button>
      )}
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
    </section>
  );
}

/** Compact impact list for review items: each affected council's risk before → after. */
/** The dimension that moved most, for a council whose overall risk holds after rounding. */
function movedDimension(i: AffectedImpact): (typeof KEYS)[number] | null {
  let best: (typeof KEYS)[number] | null = null;
  for (const k of KEYS) {
    const d = Math.abs(scoreDelta(i.before[k], i.after[k]) ?? 0);
    if (d > 0 && (!best || d > Math.abs(scoreDelta(i.before[best], i.after[best]) ?? 0))) best = k;
  }
  return best;
}

export function ImpactList({ impacts, max = 4 }: { impacts: AffectedImpact[]; max?: number }) {
  const { t } = useTranslation(['data', 'common']);
  if (!impacts.length) return null;
  const shown = impacts.slice(0, max);
  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground">{t('review.impactTitle', { count: impacts.length })}</h4>
      <ul className="mt-1.5 divide-y divide-border border-y border-border">
        {shown.map((i) => {
          // Overall risk first; when it holds after rounding, the dimension that moved instead.
          const dim = scoreDelta(i.before.risk, i.after.risk) === 0 ? movedDimension(i) : null;
          return (
            <li key={i.unit.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 truncate">{i.unit.name}</span>
              {dim ? (
                <span className="flex items-center gap-2.5">
                  <span className="text-xs text-muted-foreground">{t(`common:dimensions.${dim}Short`)}</span>
                  <BeforeAfter before={i.before[dim]} after={i.after[dim]} scale={dim} />
                  <Delta value={scoreDelta(i.before[dim], i.after[dim])} />
                </span>
              ) : (
                <span className="flex items-center gap-2.5">
                  <BeforeAfter before={i.before.risk} after={i.after.risk} />
                  <Delta value={scoreDelta(i.before.risk, i.after.risk)} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {impacts.length > max && <p className="mt-1.5 text-xs text-muted-foreground">{t('review.impactMore', { count: impacts.length - max })}</p>}
    </div>
  );
}
