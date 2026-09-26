/**
 * Live "what the map would show after approval" panel: H / V / LCC / Risk before → after with deltas and
 * class changes, plus sibling councils affected through a shared source unit. The numbers come from the
 * engine's own `applyEdits` (see lib/targets.ts), so they are exactly what approval will produce.
 */
import { ArrowRight, Gauge, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ScoreBar } from '@/components/risk/DimensionBars';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { classify, type Scale } from '@/engine/risk/classes';
import { cn, formatScore } from '@/lib/utils';
import { scoreDelta } from '../lib/scores';
import type { AffectedImpact, Impact } from '../lib/targets';
import { Callout, Delta } from './common';

const KEYS = ['hazard', 'vulnerability', 'coping'] as const;

/** Before → after pair for one score, with class badges. */
export function BeforeAfter({ before, after, scale = 'risk', size = 'md' }: { before: number | null; after: number | null; scale?: Scale; size?: 'sm' | 'md' }) {
  const changed = scoreDelta(before, after) !== 0 || (before == null) !== (after == null);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <ClassBadge value={before} scale={scale} showScore size="sm" className={cn(changed && 'opacity-60')} />
      {changed && (
        <>
          <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
          <ClassBadge value={after} scale={scale} showScore size={size === 'md' ? 'md' : 'sm'} />
        </>
      )}
    </span>
  );
}

export function ImpactPreview({
  unitName,
  impact,
  count,
  siblings = [],
  className,
}: {
  unitName: string;
  impact: Impact;
  count: number;
  siblings?: AffectedImpact[];
  className?: string;
}) {
  const { t } = useTranslation(['data', 'common']);
  const { before, after } = impact;
  const riskDelta = scoreDelta(before.risk, after.risk);
  const fromCls = classify(before.risk);
  const toCls = classify(after.risk);
  const classChanged = !!fromCls && !!toCls && fromCls.key !== toCls.key;
  const summary = count
    ? t('preview.srSummary', { name: unitName, before: formatScore(before.risk), after: formatScore(after.risk) })
    : t('preview.idle');

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <Gauge className="size-3.5" aria-hidden /> {t('preview.eyebrow')}
        </div>
        <CardTitle className="text-lg">{unitName}</CardTitle>
        <CardDescription>{count ? t('preview.pending', { count }) : t('preview.idle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <div className="text-xs font-medium text-muted-foreground">{t('common:informRisk')}</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className={cn('num font-display text-3xl font-extrabold', count > 0 && riskDelta !== 0 && 'text-muted-foreground line-through decoration-2')}>{formatScore(before.risk)}</span>
              <AnimatePresence initial={false}>
                {count > 0 && riskDelta !== 0 && (
                  <motion.span
                    key="after"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="num inline-flex items-baseline gap-2 font-display text-3xl font-extrabold"
                  >
                    <ArrowRight className="size-5 self-center text-muted-foreground" aria-hidden />
                    {formatScore(after.risk)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <Delta value={count ? riskDelta : null} className="text-xs" />
          </div>
          <div className="mt-3">
            <BeforeAfter before={before.risk} after={after.risk} />
          </div>
        </div>

        {classChanged && (
          <Callout tone={toCls!.index > fromCls!.index ? 'danger' : 'success'} className="mt-3" title={t('preview.classChange', { from: t(`common:classes.${fromCls!.key}`), to: t(`common:classes.${toCls!.key}`) })}>
            {t(toCls!.index > fromCls!.index ? 'preview.classUp' : 'preview.classDown')}
          </Callout>
        )}

        <div className="mt-5 space-y-4">
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
          {count > 0 && <p className="text-[11px] leading-snug text-muted-foreground">{t('preview.barLegend')}</p>}
        </div>

        {siblings.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold">
              <Share2 className="size-4 text-primary" aria-hidden /> {t('preview.siblingsTitle', { count: siblings.length })}
            </h4>
            <ul className="mt-2 space-y-2">
              {siblings.map((s) => (
                <li key={s.unit.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium">{s.unit.name}</span>
                  <BeforeAfter before={s.before.risk} after={s.after.risk} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}

/** Compact impact list for review cards: each affected council's risk before → after. */
export function ImpactList({ impacts, max = 4 }: { impacts: AffectedImpact[]; max?: number }) {
  const { t } = useTranslation('data');
  if (!impacts.length) return null;
  const shown = impacts.slice(0, max);
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="text-xs font-semibold text-muted-foreground">{t('review.impactTitle', { count: impacts.length })}</div>
      <ul className="mt-2 space-y-1.5">
        {shown.map((i) => (
          <li key={i.unit.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{i.unit.name}</span>
            <span className="flex items-center gap-2">
              <BeforeAfter before={i.before.risk} after={i.after.risk} size="sm" />
              <Delta value={scoreDelta(i.before.risk, i.after.risk)} />
            </span>
          </li>
        ))}
      </ul>
      {impacts.length > max && <p className="mt-1.5 text-xs text-muted-foreground">{t('review.impactMore', { count: impacts.length - max })}</p>}
    </div>
  );
}
