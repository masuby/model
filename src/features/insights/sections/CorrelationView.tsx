import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ChartCard } from '@/components/charts/ChartCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isNum } from '@/engine/risk/math';
import type { RiskModel } from '@/engine/risk/types';
import { cn } from '@/lib/utils';
import { correlationColor, correlationMatrix, inkOn, strengthOf, type LensKey } from '../analytics';
import { useInsightTheme } from '../theme';
import { InsightSection, WhatThisShows } from '../ui';
import { LENS_SHORT } from './RegionalRanking';

const ABBR: Record<LensKey, string> = { hazard: 'H', vulnerability: 'V', coping: 'LCC', risk: 'R' };

const fmtR = (r: number | null) => (isNum(r) ? r.toFixed(2).replace('-', '−') : '—');

export function CorrelationView({ model }: { model: RiskModel }) {
  const { t } = useTranslation(['insights', 'common']);
  const th = useInsightTheme();
  const m = React.useMemo(() => correlationMatrix(model.councils), [model]);
  const label = React.useCallback((k: LensKey) => t(LENS_SHORT[k]), [t]);

  const pairs = React.useMemo(() => {
    const out: Array<{ a: LensKey; b: LensKey; r: number | null }> = [];
    for (let i = 0; i < m.keys.length; i++) for (let j = i + 1; j < m.keys.length; j++) out.push({ a: m.keys[i], b: m.keys[j], r: m.r[i][j] });
    // Relationships with overall risk first, then the dimensions among themselves.
    return out.sort((x, y) => Number(y.b === 'risk') - Number(x.b === 'risk') || Math.abs(y.r ?? 0) - Math.abs(x.r ?? 0));
  }, [m]);
  const withRisk = pairs.filter((p) => p.b === 'risk' && isNum(p.r));
  const strongest = withRisk[0];
  const hv = pairs.find((p) => p.a === 'hazard' && p.b === 'vulnerability');

  const csv = React.useMemo(() => [['', ...m.keys.map(label)], ...m.keys.map((k, i) => [label(k), ...m.r[i].map((r) => (isNum(r) ? Math.round(r * 1000) / 1000 : ''))])], [m, label]);

  // SVG geometry
  const labelW = 112;
  const cell = 66;
  const headH = 34;
  const n = m.keys.length;
  const W = labelW + n * cell + 6;
  const H = headH + n * cell + 6;

  return (
    <InsightSection id="correlation" index={8} eyebrow={t('correlation.eyebrow')} title={t('correlation.title')} lead={t('correlation.lead')}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <ChartCard title={t('correlation.chartTitle')} description={t('correlation.chartSub', { n: m.n })} csv={csv} filename="dimension-correlations">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            className="mx-auto block h-auto max-w-[440px]"
            role="img"
            aria-label={t('correlation.aria', { pairs: pairs.map((p) => `${label(p.a)}–${label(p.b)} ${fmtR(p.r)}`).join('; ') })}
          >
            {m.keys.map((k, j) => (
              <text key={`c${k}`} x={labelW + j * cell + cell / 2} y={headH - 12} textAnchor="middle" fill={th.text} fontSize={12} fontWeight={700}>
                {ABBR[k]}
              </text>
            ))}
            {m.keys.map((rk, i) => (
              <g key={rk}>
                <text x={labelW - 10} y={headH + i * cell + cell / 2 + 4} textAnchor="end" fill={th.ink} fontSize={12} fontWeight={600}>
                  {label(rk)}
                </text>
                {m.keys.map((ck, j) => {
                  const r = m.r[i][j];
                  const diag = i === j;
                  const fill = diag ? th.neutral : correlationColor(r, th.neutral);
                  return (
                    <g key={ck}>
                      <rect x={labelW + j * cell + 1} y={headH + i * cell + 1} width={cell - 2} height={cell - 2} rx={8} fill={fill}>
                        <title>{`${label(rk)} × ${label(ck)}: r = ${fmtR(r)}`}</title>
                      </rect>
                      <text
                        x={labelW + j * cell + cell / 2}
                        y={headH + i * cell + cell / 2 + 5}
                        textAnchor="middle"
                        fill={diag ? th.text : isNum(r) ? inkOn(fill) : th.text}
                        fontSize={diag ? 12 : 14}
                        fontWeight={diag ? 500 : 700}
                        pointerEvents="none"
                      >
                        {diag ? '1' : fmtR(r)}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
          <div className="mx-auto mt-4 max-w-[440px]">
            <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(90deg, ${correlationColor(-1, th.neutral)}, ${th.neutral}, ${correlationColor(1, th.neutral)})` }} aria-hidden />
            <div className="num mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>−1 · {t('correlation.negative')}</span>
              <span>0</span>
              <span>{t('correlation.positive')} · +1</span>
            </div>
          </div>
          <WhatThisShows>{t('correlation.caption')}</WhatThisShows>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>{t('correlation.readTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {pairs.map((p) => {
                const r = p.r;
                return (
                  <li key={`${p.a}-${p.b}`} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-sm font-semibold', p.b === 'risk' && 'text-foreground')}>
                        {label(p.a)} <span className="text-muted-foreground">×</span> {label(p.b)}
                      </div>
                      <div className="text-xs text-muted-foreground">{isNum(r) ? t(`correlation.strength.${strengthOf(r)}`, { direction: t(r >= 0 ? 'correlation.dirPositive' : 'correlation.dirNegative') }) : t('common:classes.noData')}</div>
                    </div>
                    {/* Diverging bar from a centre line, so sign reads without colour. */}
                    <div className="relative hidden h-2 w-24 rounded-full bg-muted sm:block" aria-hidden>
                      <span className="absolute top-[-3px] left-1/2 h-3.5 w-px bg-foreground/40" />
                      {isNum(r) && (
                        <span
                          className="absolute top-0 h-2 rounded-full"
                          style={{ left: r >= 0 ? '50%' : `${50 - Math.abs(r) * 50}%`, width: `${Math.abs(r) * 50}%`, background: correlationColor(r >= 0 ? 1 : -1, th.neutral) }}
                        />
                      )}
                    </div>
                    <span className="num w-12 text-right font-display text-base font-bold">{fmtR(r)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid gap-2 rounded-xl bg-muted/60 p-3.5 text-sm leading-relaxed">
              {strongest && isNum(strongest.r) && <p>{t('correlation.findingRisk', { dim: label(strongest.a), r: fmtR(strongest.r) })}</p>}
              {hv && isNum(hv.r) && <p className="text-muted-foreground">{t(Math.abs(hv.r) < 0.3 ? 'correlation.findingHvLow' : 'correlation.findingHvHigh', { r: fmtR(hv.r) })}</p>}
              <p className="text-xs text-muted-foreground">{t('correlation.note', { n: m.n, sources: model.sources.length })}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </InsightSection>
  );
}
