import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChartCard } from '@/components/charts/ChartCard';
import { RampLegend } from '@/components/risk/ClassLegend';
import { isNum } from '@/engine/risk/math';
import { rampColor } from '@/engine/risk/metrics';
import type { RiskModel } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { columnMaxima, hazardMatrix, inkOn, MATRIX_HAZARDS, sortMatrix, type MatrixHazard, type MatrixRow, type MatrixSortKey, needsPlate } from '../analytics';
import { useInsightTheme, type InsightTheme } from '../theme';
import { InsightSection, WhatThisShows } from '../ui';

type Col = 'natural' | MatrixHazard;
const COLS: readonly Col[] = ['natural', ...MATRIX_HAZARDS];
const valueOf = (r: MatrixRow, c: Col) => (c === 'natural' ? r.natural : r.values[c]);

export function HazardMatrix({ model }: { model: RiskModel }) {
  const { t } = useTranslation(['insights', 'common', 'indicators']);
  const th = useInsightTheme();
  const [sort, setSort] = React.useState<{ key: MatrixSortKey; dir: 'asc' | 'desc' }>({ key: 'natural', dir: 'desc' });

  const base = React.useMemo(() => hazardMatrix(model.regions), [model]);
  const rows = React.useMemo(() => sortMatrix(base, sort.key, sort.dir), [base, sort]);
  const maxima = React.useMemo(() => columnMaxima(base), [base]);

  const colLabel = React.useCallback((c: Col) => (c === 'natural' ? t('matrix.naturalCol') : t(`indicators:${c}`)), [t]);

  const toggle = (key: MatrixSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }));

  // A narrative hook: the hazard with the single highest regional average.
  const hottest = React.useMemo(() => {
    let best: { col: MatrixHazard; row: MatrixRow; v: number } | null = null;
    for (const r of base)
      for (const c of MATRIX_HAZARDS) {
        const v = r.values[c];
        if (isNum(v) && (!best || v > best.v)) best = { col: c, row: r, v };
      }
    return best;
  }, [base]);

  const csv = React.useMemo(
    () => [
      [t('common:labels.region'), 'id', ...COLS.map(colLabel)],
      ...rows.map((r) => [r.name, r.id, ...COLS.map((c) => formatScore(valueOf(r, c)))]),
    ],
    [rows, colLabel, t],
  );

  const ariaSort = (key: MatrixSortKey): React.AriaAttributes['aria-sort'] => (sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
  const sortIcon = (k: MatrixSortKey) =>
    sort.key === k ? sort.dir === 'asc' ? <ArrowUp className="size-3 shrink-0" aria-hidden /> : <ArrowDown className="size-3 shrink-0" aria-hidden /> : <ArrowUpDown className="size-3 shrink-0 opacity-40" aria-hidden />;

  return (
    <InsightSection id="hazards" index={4} eyebrow={t('matrix.eyebrow')} title={t('matrix.title')} lead={t('matrix.lead')}>
      <ChartCard
        title={t('matrix.chartTitle')}
        description={t('matrix.chartSub')}
        csv={csv}
        filename="hazard-hotspot-matrix"
        actions={<RampLegend className="hidden w-44 md:flex" />}
      >
        {/* Off-screen SVG twin of the table: this is what "Download image" exports. */}
        <div aria-hidden className="h-0 overflow-hidden">
          <MatrixSvg rows={rows} colLabel={colLabel} maxima={maxima} th={th} title={t('matrix.chartTitle')} regionLabel={t('common:labels.region')} />
        </div>

        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6" tabIndex={0} role="region" aria-label={t('matrix.scrollLabel')}>
          <table className="w-full min-w-[980px] border-separate border-spacing-[2px] text-xs">
            <caption className="sr-only">{t('matrix.tableCaption')}</caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={ariaSort('name')} className="sticky left-0 z-10 bg-card pr-2 text-left align-bottom shadow-[4px_0_0_0_var(--card)]">
                  <button type="button" onClick={() => toggle('name')} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
                    {t('common:labels.region')}
                    {sortIcon('name')}
                  </button>
                </th>
                {COLS.map((c) => (
                  <th key={c} scope="col" aria-sort={ariaSort(c)} className={cn('w-[6.25%] align-bottom', c === 'natural' && 'pr-2')}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      title={t('matrix.sortBy', { name: colLabel(c) })}
                      className={cn(
                        'flex w-full items-end justify-center gap-1 rounded-md px-1 py-1 text-center text-[11px] leading-tight font-semibold hover:bg-muted hover:text-foreground',
                        sort.key === c ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <span className="line-clamp-3">{colLabel(c)}</span>
                      {sortIcon(c)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="group">
                  <th scope="row" className="sticky left-0 z-10 bg-card pr-2 text-left font-normal shadow-[4px_0_0_0_var(--card)]">
                    <Link to={`/area/${r.id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1.5 whitespace-nowrap group-hover:bg-muted hover:text-primary">
                      <span className="num w-4 text-right text-[11px] text-muted-foreground">{i + 1}</span>
                      <span className="font-semibold">{r.name}</span>
                    </Link>
                  </th>
                  {COLS.map((c) => {
                    const v = valueOf(r, c);
                    const fill = isNum(v) ? rampColor(v) : undefined;
                    const isMax = isNum(v) && maxima[c] !== null && Math.abs(v - (maxima[c] as number)) < 1e-9;
                    return (
                      <td
                        key={c}
                        className={cn(
                          'num h-9 rounded-md text-center font-semibold',
                          !isNum(v) && 'bg-muted text-muted-foreground',
                          isMax && 'shadow-[inset_0_0_0_2px_var(--foreground)]',
                          c === 'natural' && 'text-[13px]',
                        )}
                        style={fill ? { background: fill, color: inkOn(fill) } : undefined}
                        title={`${r.name} · ${colLabel(c)}: ${formatScore(v)}`}
                      >
                        {fill && needsPlate(fill) ? (
                          // Mid-orange fills: neither white nor dark text reaches AA, so sit the number on a light plate.
                          <span className="rounded-[5px] bg-white/90 px-1 text-[#0b1324]">{formatScore(v)}</span>
                        ) : (
                          formatScore(v)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <RampLegend className="w-56 md:hidden" />
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-3.5 rounded-[4px] shadow-[inset_0_0_0_2px_var(--foreground)]" aria-hidden />
            {t('matrix.maxLegend')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-3.5 rounded-[4px] bg-muted" aria-hidden />
            {t('common:classes.noData')}
          </span>
        </div>
        <WhatThisShows>
          {t('matrix.caption')}
          {hottest && ` ${t('matrix.captionHottest', { hazard: t(`indicators:${hottest.col}`), region: hottest.row.name, value: formatScore(hottest.v) })}`}
        </WhatThisShows>
      </ChartCard>
    </InsightSection>
  );
}

/** SVG rendering of the matrix (same order as the table) used for PNG export. */
function MatrixSvg({ rows, colLabel, maxima, th, title, regionLabel }: { rows: MatrixRow[]; colLabel: (c: Col) => string; maxima: Record<Col, number | null>; th: InsightTheme; title: string; regionLabel: string }) {
  const pad = 16;
  const titleH = 28;
  const labelW = 140;
  const cellW = 48;
  const cellH = 22;
  const gap = 2;
  const headH = 120;
  const width = pad * 2 + labelW + COLS.length * (cellW + gap) + 90;
  const height = pad * 2 + titleH + headH + rows.length * (cellH + gap);
  const top = pad + titleH + headH;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} focusable="false">
      <rect width={width} height={height} fill={th.surface} />
      <text x={pad} y={pad + 14} fill={th.ink} fontSize={15} fontWeight={700}>
        {title}
      </text>
      <text x={pad + labelW - 8} y={top - 10} fill={th.text} fontSize={11} fontWeight={600} textAnchor="end">
        {regionLabel}
      </text>
      {COLS.map((c, i) => (
        <text key={c} transform={`translate(${pad + labelW + i * (cellW + gap) + cellW / 2}, ${top - 8}) rotate(-45)`} fill={th.text} fontSize={10.5} fontWeight={c === 'natural' ? 700 : 500}>
          {colLabel(c)}
        </text>
      ))}
      {rows.map((r, ri) => {
        const y = top + ri * (cellH + gap);
        return (
          <g key={r.id}>
            <text x={pad + labelW - 8} y={y + cellH / 2 + 4} fill={th.ink} fontSize={11} fontWeight={600} textAnchor="end">
              {r.name}
            </text>
            {COLS.map((c, ci) => {
              const v = valueOf(r, c);
              const fill = isNum(v) ? rampColor(v) : th.neutral;
              const x = pad + labelW + ci * (cellW + gap);
              const isMax = isNum(v) && maxima[c] !== null && Math.abs(v - (maxima[c] as number)) < 1e-9;
              return (
                <g key={c}>
                  <rect x={x} y={y} width={cellW} height={cellH} rx={4} fill={fill} stroke={isMax ? th.ink : 'none'} strokeWidth={isMax ? 2 : 0} />
                  <text x={x + cellW / 2} y={y + cellH / 2 + 4} fill={isNum(v) ? inkOn(fill) : th.text} fontSize={10.5} fontWeight={600} textAnchor="middle">
                    {formatScore(v)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
