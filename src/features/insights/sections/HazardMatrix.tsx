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
import { columnMaxima, hazardMatrix, inkOn, MATRIX_HAZARDS, needsPlate, sortMatrix, type MatrixHazard, type MatrixRow, type MatrixSortKey } from '../analytics';
import { useInsightTheme, type InsightTheme } from '../theme';
import { FigureNote, InsightSection } from '../ui';

type Col = 'natural' | MatrixHazard;
const COLS: readonly Col[] = ['natural', ...MATRIX_HAZARDS];
const valueOf = (r: MatrixRow, c: Col) => (c === 'natural' ? r.natural : r.values[c]);
/** A score that rounds to 0.0: shown as a quiet "0" on the page colour, so real hot-spots stand out. */
const isZero = (v: number | null | undefined): v is number => isNum(v) && Math.round(v * 10) === 0;

/**
 * The ramp fill for a score, stepped where needed so plain ink is readable: on a narrow band of
 * mid-orange fills (about 7.3–7.7) neither white nor dark text reaches WCAG AA, so those cells take the
 * nearest ramp colour where one does (never more than a few tenths away; the printed value is exact).
 */
function readableFill(v: number): string {
  const fill = rampColor(v);
  if (!needsPlate(fill)) return fill;
  for (let d = 0.05; d <= 1.5; d += 0.05)
    for (const w of [v - d, v + d]) {
      if (w < 0 || w > 10) continue;
      const alt = rampColor(w);
      if (!needsPlate(alt)) return alt;
    }
  return fill;
}

/** How a matrix cell is painted: ramp fill + readable ink, or no fill for zero / missing values. */
function cellPaint(v: number | null | undefined) {
  if (!isNum(v) || isZero(v)) return null;
  const fill = readableFill(v);
  return { fill, ink: inkOn(fill) };
}

export function HazardMatrix({ model }: { model: RiskModel }) {
  const { t } = useTranslation(['insights', 'common', 'indicators']);
  const th = useInsightTheme();
  const [sort, setSort] = React.useState<{ key: MatrixSortKey; dir: 'asc' | 'desc' }>({ key: 'natural', dir: 'desc' });

  const base = React.useMemo(() => hazardMatrix(model.regions), [model]);
  const rows = React.useMemo(() => sortMatrix(base, sort.key, sort.dir), [base, sort]);
  const maxima = React.useMemo(() => columnMaxima(base), [base]);
  const isMax = (c: Col, v: number | null | undefined) => isNum(v) && isNum(maxima[c]) && (maxima[c] as number) > 0 && Math.abs(v - (maxima[c] as number)) < 1e-9;

  const colLabel = React.useCallback((c: Col) => (c === 'natural' ? t('matrix.naturalCol') : t(`indicators:${c}`)), [t]);

  const toggle = (key: MatrixSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }));

  // While the table is wider than its column, fade its right edge as a cue that it scrolls sideways.
  const scroller = React.useRef<HTMLDivElement>(null);
  const [moreRight, setMoreRight] = React.useState(false);
  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, []);
  const fade = 'linear-gradient(to right, #000 calc(100% - 48px), transparent)';

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
  const sortIcon = (k: MatrixSortKey, className?: string) => {
    const cls = cn('size-3 shrink-0', className, sort.key !== k && 'opacity-40');
    return sort.key === k ? sort.dir === 'asc' ? <ArrowUp className={cls} aria-hidden /> : <ArrowDown className={cls} aria-hidden /> : <ArrowUpDown className={cls} aria-hidden />;
  };

  // The "all natural hazards" column is set apart from the single hazards by a wider gap.
  const natGap = 'border-r-[6px] border-r-background';

  return (
    <InsightSection id="hazards" title={t('matrix.title')} lead={t('matrix.lead')}>
      <ChartCard
        title={t('matrix.chartTitle')}
        description={t('matrix.chartSub')}
        csv={csv}
        filename="hazard-hotspot-matrix"
        actions={<RampLegend className="hidden w-44 md:flex" />}
      >
        {/* Off-screen SVG twin of the table: this is what "Download image" exports. */}
        <div aria-hidden className="h-0 overflow-hidden">
          <MatrixSvg rows={rows} colLabel={colLabel} isMax={isMax} th={th} title={t('matrix.chartTitle')} regionLabel={t('common:labels.region')} />
        </div>

        <div
          ref={scroller}
          className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          style={moreRight ? { maskImage: fade, WebkitMaskImage: fade } : undefined}
          tabIndex={0}
          role="region"
          aria-label={t('matrix.scrollLabel')}
        >
          <table className="w-full min-w-[900px] border-separate border-spacing-px text-xs">
            <caption className="sr-only">{t('matrix.tableCaption')}</caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={ariaSort('name')} className="sticky left-0 z-10 w-[12.25%] bg-background pr-2 text-left align-bottom shadow-[1px_0_0_0_var(--background)]">
                  <button type="button" onClick={() => toggle('name')} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    {t('common:labels.region')}
                    {sortIcon('name')}
                  </button>
                </th>
                {COLS.map((c) => (
                  <th key={c} scope="col" aria-sort={ariaSort(c)} className={cn('w-[6.75%] pb-1 align-bottom', c === 'natural' && natGap)}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      title={t('matrix.sortBy', { name: colLabel(c) })}
                      className={cn(
                        'block w-full rounded-md px-0.5 py-1 text-center text-[11px] leading-tight font-medium break-words hover:bg-muted hover:text-foreground',
                        sort.key === c ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {/* The sort arrow runs inline after the last word, so the name gets the column's full width. */}
                      <span className="line-clamp-3">
                        {colLabel(c)}
                        {sortIcon(c, 'ml-0.5 inline align-[-2px]')}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="group">
                  <th scope="row" className="sticky left-0 z-10 bg-background pr-2 text-left font-normal shadow-[1px_0_0_0_var(--background)]">
                    <Link to={`/area/${r.id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 whitespace-nowrap group-hover:bg-muted hover:text-primary">
                      <span className="num w-4 text-right text-[11px] text-muted-foreground">{i + 1}</span>
                      <span className="font-medium">{r.name}</span>
                    </Link>
                  </th>
                  {COLS.map((c) => {
                    const v = valueOf(r, c);
                    const paint = cellPaint(v);
                    return (
                      <td
                        key={c}
                        className={cn(
                          'num h-8 text-center',
                          paint ? 'font-semibold' : 'text-muted-foreground',
                          !isNum(v) && 'bg-muted',
                          isMax(c, v) && 'shadow-[inset_0_0_0_2px_var(--foreground)]',
                          c === 'natural' && cn(natGap, 'text-[13px]'),
                        )}
                        style={paint ? { background: paint.fill, color: paint.ink } : undefined}
                        title={`${r.name} · ${colLabel(c)}: ${formatScore(v)}`}
                      >
                        {isZero(v) ? '0' : formatScore(v)}
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
            <span className="inline-block size-3.5 shadow-[inset_0_0_0_2px_var(--foreground)]" aria-hidden />
            {t('matrix.maxLegend')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="num inline-grid size-3.5 place-items-center text-[10px]" aria-hidden>
              0
            </span>
            {t('matrix.zeroLegend')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-3.5 bg-muted" aria-hidden />
            {t('common:classes.noData')}
          </span>
        </div>
        <FigureNote>
          {t('matrix.caption')}
          {hottest && ` ${t('matrix.captionHottest', { hazard: t(`indicators:${hottest.col}`), region: hottest.row.name, value: formatScore(hottest.v) })}`}
        </FigureNote>
      </ChartCard>
    </InsightSection>
  );
}

/** SVG rendering of the matrix (same order and encoding as the table) used for PNG export. */
function MatrixSvg({
  rows,
  colLabel,
  isMax,
  th,
  title,
  regionLabel,
}: {
  rows: MatrixRow[];
  colLabel: (c: Col) => string;
  isMax: (c: Col, v: number | null | undefined) => boolean;
  th: InsightTheme;
  title: string;
  regionLabel: string;
}) {
  const pad = 16;
  const titleH = 28;
  const labelW = 140;
  const cellW = 48;
  const cellH = 22;
  const gap = 1;
  const natGap = 6;
  const headH = 120;
  const colX = (i: number) => pad + labelW + i * (cellW + gap) + (i > 0 ? natGap : 0);
  const width = colX(COLS.length) + 90;
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
        <text key={c} transform={`translate(${colX(i) + cellW / 2}, ${top - 8}) rotate(-45)`} fill={th.text} fontSize={10.5} fontWeight={c === 'natural' ? 700 : 500}>
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
              const paint = cellPaint(v);
              const x = colX(ci);
              const max = isMax(c, v);
              return (
                <g key={c}>
                  {(paint || !isNum(v) || max) && (
                    <rect
                      x={x}
                      y={y}
                      width={cellW}
                      height={cellH}
                      fill={paint ? paint.fill : isNum(v) ? 'none' : th.neutral}
                      stroke={max ? th.ink : 'none'}
                      strokeWidth={max ? 2 : 0}
                    />
                  )}
                  <text
                    x={x + cellW / 2}
                    y={y + cellH / 2 + 4}
                    fill={paint ? paint.ink : th.text}
                    fontSize={10.5}
                    fontWeight={paint ? 600 : 400}
                    textAnchor="middle"
                  >
                    {isZero(v) ? '0' : formatScore(v)}
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
