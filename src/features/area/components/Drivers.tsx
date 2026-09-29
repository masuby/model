/**
 * What drives risk here: the five highest-scoring indicators as a ruled, numbered list; beside it (behind
 * a vertical rule) the weakest dimension and the indicators furthest from the national value.
 */
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { Note } from '@/components/layout/Page';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { DIMENSION_BY_KEY } from '@/engine/risk/hierarchy';
import { rampColor } from '@/engine/risk/metrics';
import { topDrivers } from '@/engine/risk/model';
import { sourceFor } from '@/engine/risk/sources';
import { formatScore } from '@/lib/utils';
import { formatDelta, weakestDimension, type AreaView, type IndicatorRow } from '../lib';
import { CompareTrack, OutOf10, ResolutionChip, SubHeading, type TrackRef } from './bits';

/** Dimension name with its colour dot - the dot encodes the dimension, the text names it. */
function DimTag({ dim }: { dim: keyof typeof DIMENSION_COLORS }) {
  const { t } = useTranslation('common');
  if (dim === 'risk') return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block size-2 rounded-full" style={{ background: DIMENSION_COLORS[dim] }} aria-hidden />
      {t(`dimensions.${dim}Short`)}
    </span>
  );
}

function DiffList({ title, rows, up }: { title: string; rows: Array<IndicatorRow & { d: number }>; up: boolean }) {
  const { t } = useTranslation(['area', 'indicators']);
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className={up ? 'size-4 text-danger' : 'size-4 text-success'} aria-hidden />
        {title}
      </div>
      {rows.length ? (
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <li key={`${r.dim}:${r.key}`} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: DIMENSION_COLORS[r.dim] }} aria-hidden />
                <span className="truncate">{t(`indicators:${r.key}`)}</span>
              </span>
              <span className="num shrink-0 text-xs text-muted-foreground">
                {formatScore(r.value)} {t('drivers.vs')} {formatScore(r.national)}
                <span className={up ? 'ml-2 text-sm font-semibold text-danger' : 'ml-2 text-sm font-semibold text-success'}>{formatDelta(r.d)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{t('drivers.none')}</p>
      )}
    </div>
  );
}

export function Drivers({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common', 'indicators']);
  const { unit, rows, region } = view;
  const isNational = unit.level === 'national';
  const drivers = React.useMemo(() => topDrivers(unit, 5), [unit]);
  const weakest = React.useMemo(() => weakestDimension(unit), [unit]);
  const byRef = React.useMemo(() => new Map(rows.map((r) => [`${r.dim}:${r.key}`, r])), [rows]);

  const { above, below } = React.useMemo(() => {
    if (isNational) return { above: [], below: [] };
    const diffs = rows
      .filter((r): r is IndicatorRow & { value: number; national: number } => r.value != null && r.national != null)
      .map((r) => ({ ...r, d: Math.round((r.value - r.national) * 10) / 10 }));
    return {
      above: diffs
        .filter((r) => r.d > 0)
        .sort((a, b) => b.d - a.d)
        .slice(0, 3),
      below: diffs
        .filter((r) => r.d < 0)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3),
    };
  }, [rows, isNational]);

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border print:grid-cols-1">
      <div className="lg:pr-12 xl:pr-16">
        <SubHeading title={t('drivers.topTitle')} lead={t('drivers.topLead')} />
        <ol className="area-breakable mt-5 divide-y divide-border border-y border-border">
          {drivers.map((d, i) => {
            const row = byRef.get(`${d.dim}:${d.key}`);
            const refs: TrackRef[] = [];
            if (row?.region != null && region) refs.push({ kind: 'region', label: region.name, value: row.region });
            if (row?.national != null) refs.push({ kind: 'national', label: t('breadcrumb.country'), value: row.national });
            return (
              <li key={`${d.dim}:${d.key}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)] print:break-inside-avoid">
                <span className="num font-display text-2xl leading-none text-muted-foreground">{i + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-x-6">
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold">{t(`indicators:${d.key}`)}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <DimTag dim={d.dim} />
                        <span aria-hidden>·</span>
                        <span>{t(`common:categories.${d.category}`)}</span>
                        <span aria-hidden>·</span>
                        <ResolutionChip resolution={sourceFor(d.dim, d.key).resolution} />
                      </div>
                    </div>
                    <div className="num shrink-0 text-3xl leading-none font-semibold tracking-tight">
                      {formatScore(d.value)}
                      <OutOf10 className="text-sm tracking-normal" />
                    </div>
                  </div>
                  <CompareTrack className="mt-4" value={d.value} color={rampColor(d.value)} refs={refs} />
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(`indicators:desc.${d.key}`)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <Note className="mt-6">{t(`drivers.note.${unit.level}`)}</Note>
      </div>

      <div className="grid content-start gap-12 lg:pl-12 xl:pl-16">
        {weakest && (
          <div className="print:break-inside-avoid">
            <div className="text-sm font-medium text-muted-foreground">{t('drivers.weakestEyebrow')}</div>
            <h3 className="mt-1 text-lg leading-snug font-semibold">{t(`common:dimensions.${weakest.key}`)}</h3>
            <div className="mt-4 flex items-center gap-3">
              <span className="num text-4xl leading-none font-semibold tracking-tight">
                {formatScore(weakest.score)}
                <OutOf10 className="text-sm tracking-normal" />
              </span>
              <ClassBadge value={weakest.score} scale={DIMENSION_BY_KEY[weakest.key].scale} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t('drivers.weakestBody', { dim: t(`common:dimensions.${weakest.key}`), cls: t(`common:classes.${weakest.cls.key}`) })}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`common:dimensions.${weakest.key}Desc`)}</p>
            <Link to="/learn" className="no-print group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
              {t('drivers.learn')} <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        )}
        {!isNational && (
          <div className="border-t border-border pt-8 print:break-inside-avoid">
            <SubHeading title={t('drivers.vsTitle')} lead={t('drivers.vsLead')} />
            <div className="mt-6 grid gap-8">
              <DiffList title={t('drivers.above')} rows={above} up />
              <DiffList title={t('drivers.below')} rows={below} up={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
