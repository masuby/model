import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DIMENSION_BY_KEY } from '@/engine/risk/hierarchy';
import { rampColor } from '@/engine/risk/metrics';
import { topDrivers } from '@/engine/risk/model';
import { sourceFor } from '@/engine/risk/sources';
import { formatScore } from '@/lib/utils';
import { formatDelta, weakestDimension, type AreaView, type IndicatorRow } from '../lib';
import { CompareTrack, DIM_SHORT, Reveal, ResolutionChip, type TrackRef } from './bits';

function DimTag({ dim }: { dim: keyof typeof DIMENSION_COLORS }) {
  const { t } = useTranslation('common');
  if (dim === 'risk') return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
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
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className={up ? 'size-4 text-danger' : 'size-4 text-success'} aria-hidden />
        {title}
      </div>
      {rows.length ? (
        <ul className="grid gap-1.5">
          {rows.map((r) => (
            <li key={`${r.dim}:${r.key}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: DIMENSION_COLORS[r.dim] }} aria-hidden />
                <span className="truncate">{t(`indicators:${r.key}`)}</span>
              </span>
              <span className="num shrink-0 text-xs text-muted-foreground">
                {formatScore(r.value)} <span className="opacity-60">{t('drivers.vs')}</span> {formatScore(r.national)}
                <span className={up ? 'ml-2 font-bold text-danger' : 'ml-2 font-bold text-success'}>{formatDelta(r.d)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t('drivers.none')}</p>
      )}
    </div>
  );
}

export function Drivers({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common', 'indicators']);
  const { unit, rows, region } = view;
  const drivers = topDrivers(unit, 5);
  const weakest = weakestDimension(unit);
  const isNational = unit.level === 'national';
  const byRef = new Map(rows.map((r) => [`${r.dim}:${r.key}`, r]));

  const diffs = isNational
    ? []
    : rows
        .filter((r): r is IndicatorRow & { value: number; national: number } => r.value != null && r.national != null)
        .map((r) => ({ ...r, d: Math.round((r.value - r.national) * 10) / 10 }));
  const above = diffs.filter((r) => r.d > 0).sort((a, b) => b.d - a.d).slice(0, 3);
  const below = diffs.filter((r) => r.d < 0).sort((a, b) => a.d - b.d).slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] print:grid-cols-1">
      <Reveal>
        <Card className="area-breakable">
          <CardHeader>
            <CardTitle className="text-lg">{t('drivers.topTitle')}</CardTitle>
            <CardDescription>{t('drivers.topLead')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="divide-y divide-border">
              {drivers.map((d, i) => {
                const row = byRef.get(`${d.dim}:${d.key}`);
                const refs: TrackRef[] = [];
                if (row?.region != null && region) refs.push({ kind: 'region', label: region.name, value: row.region });
                if (row?.national != null) refs.push({ kind: 'national', label: t('breadcrumb.country'), value: row.national });
                return (
                  <li key={`${d.dim}:${d.key}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-5 first:pt-0 last:pb-0 print:break-inside-avoid">
                    <span className="num inline-flex size-9 items-center justify-center rounded-xl bg-muted font-display text-sm font-extrabold text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold">{t(`indicators:${d.key}`)}</h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <DimTag dim={d.dim} />
                            <span className="text-[11px] text-muted-foreground">{t(`common:categories.${d.category}`)}</span>
                            <ResolutionChip resolution={sourceFor(d.dim, d.key).resolution} />
                          </div>
                        </div>
                        <div className="num shrink-0 font-display text-3xl leading-none font-extrabold tracking-tight">
                          {formatScore(d.value)}
                          <span className="ml-0.5 text-sm font-semibold text-muted-foreground">/10</span>
                        </div>
                      </div>
                      <CompareTrack className="mt-3" value={d.value} color={rampColor(d.value)} refs={refs} />
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(`indicators:desc.${d.key}`)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-5 rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">{t('drivers.note')}</p>
          </CardContent>
        </Card>
      </Reveal>

      <div className="grid content-start gap-6">
        {weakest && (
          <Reveal delay={0.06}>
            <Card className="relative overflow-hidden print:break-inside-avoid">
              <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-20 blur-3xl print:hidden" style={{ background: DIMENSION_COLORS[weakest.key] }} />
              <CardHeader className="relative">
                <span className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{t('drivers.weakestEyebrow')}</span>
                <CardTitle className="mt-1 text-2xl">{t(`common:dimensions.${weakest.key}`)}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: DIMENSION_COLORS[weakest.key] }}>
                    {DIM_SHORT[weakest.key]}
                  </span>
                  <span className="num font-display text-4xl font-extrabold">{formatScore(weakest.score)}</span>
                  <ClassBadge value={weakest.score} scale={DIMENSION_BY_KEY[weakest.key].scale} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {t('drivers.weakestBody', { dim: t(`common:dimensions.${weakest.key}`), cls: t(`common:classes.${weakest.cls.key}`) })}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`common:dimensions.${weakest.key}Desc`)}</p>
                <Link to="/learn" className="no-print mt-4 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline">
                  {t('drivers.learn')}
                </Link>
              </CardContent>
            </Card>
          </Reveal>
        )}
        {!isNational && (
          <Reveal delay={0.1}>
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-lg">{t('drivers.vsTitle')}</CardTitle>
                <CardDescription>{t('drivers.vsLead')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <DiffList title={t('drivers.above')} rows={above} up />
                <DiffList title={t('drivers.below')} rows={below} up={false} />
              </CardContent>
            </Card>
          </Reveal>
        )}
      </div>
    </div>
  );
}
