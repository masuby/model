/**
 * The top of the story: the key figures (shown in the page header) and the numbered key findings.
 * Neither needs a chart library, so both render with the first paint.
 */
import { ArrowDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { KeyFigures } from '@/components/layout/Page';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { THRESHOLDS } from '@/engine/risk/classes';
import { isNum } from '@/engine/risk/math';
import type { RiskModel } from '@/engine/risk/types';
import { formatCompact, formatNumber, formatScore, NO_VALUE } from '@/lib/utils';
import { HIGH_INDEX, resolutionBreakdown, topDriverCounts, type Headline } from '../analytics';
import { InsightSection } from '../ui';

/** A figure with a smaller "/ total" suffix. */
function OutOf({ value, total }: { value: React.ReactNode; total: React.ReactNode }) {
  return (
    <span>
      {value}
      <span className="text-lg font-medium text-muted-foreground"> / {total}</span>
    </span>
  );
}

/** Five numbers that frame the national picture, separated by vertical rules. */
export function HeadlineFigures({ h, className }: { h: Headline; className?: string }) {
  const { t, i18n } = useTranslation(['insights', 'common']);
  const lang = i18n.language;
  const pct = (x: number) => formatNumber(x, lang, { style: 'percent', maximumFractionDigits: 0 });

  return (
    <KeyFigures
      className={className}
      items={[
        {
          label: t('kpi.national'),
          value: (
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {formatScore(h.nationalRisk)}
              <ClassBadge value={h.nationalRisk} size="sm" className="-translate-y-[3px]" />
            </span>
          ),
          sub: t('kpi.nationalSub'),
        },
        { label: t('kpi.high'), value: <OutOf value={h.highCount} total={h.councils} />, sub: t('kpi.highSub', { pct: pct(h.highShare) }) },
        { label: t('kpi.exposed'), value: formatCompact(h.exposedPopulation, lang), sub: t('kpi.exposedSub', { pct: pct(h.exposedShare), total: formatCompact(h.totalPopulation, lang) }) },
        {
          label: t('kpi.topRegion'),
          value: h.topRegion ? (
            <Link to={`/area/${h.topRegion.id}`} className="block truncate underline-offset-4 hover:text-primary hover:underline">
              {h.topRegion.name}
            </Link>
          ) : (
            NO_VALUE
          ),
          sub: h.topRegion && (
            <span className="flex flex-wrap items-center gap-2">
              <ClassBadge value={h.topRegion.risk} showScore size="sm" />
              {t('kpi.topRegionSub')}
            </span>
          ),
        },
        { label: t('kpi.local'), value: <OutOf value={h.localIndicators} total={h.indicatorTotal} />, sub: t('kpi.localSub', { pct: pct(h.localShare) }) },
      ]}
    />
  );
}

/**
 * Key findings: a short numbered list separated by rules, each pointing to the chart that shows it.
 * Each one adds a fact the key figures above do not already state.
 */
export function KeyFindings({ model, h }: { model: RiskModel; h: Headline }) {
  const { t, i18n } = useTranslation(['insights', 'common', 'indicators']);
  const lang = i18n.language;

  const findings = React.useMemo(() => {
    const out: Array<{ id: string; href: string; text: string }> = [];

    // How uneven the regions are: how many sit above the national value, and the spread.
    const national = h.nationalRisk;
    const regional = model.regions.map((r) => r.risk).filter(isNum);
    if (isNum(national) && h.topRegion && h.bottomRegion && isNum(h.topRegion.risk) && isNum(h.bottomRegion.risk))
      out.push({
        id: 'regions',
        href: '#regions',
        text: t('findings.regions', {
          count: regional.filter((v) => v > national).length,
          total: regional.length,
          national: formatScore(national),
          bottom: h.bottomRegion.name,
          bottomScore: formatScore(h.bottomRegion.risk),
          spread: formatScore(h.topRegion.risk - h.bottomRegion.risk),
        }),
      });

    // The priority corner: high hazard and high vulnerability together.
    const hHigh = THRESHOLDS.hazard[HIGH_INDEX - 1];
    const vHigh = THRESHOLDS.vulnerability[HIGH_INDEX - 1];
    const hot = model.councils.filter((u) => isNum(u.dims.hazard.score) && isNum(u.dims.vulnerability.score) && u.dims.hazard.score >= hHigh && u.dims.vulnerability.score >= vHigh);
    const hotPop = hot.reduce((s, u) => s + (u.exposure?.population ?? 0), 0);
    out.push({ id: 'hot', href: '#dimensions', text: t('findings.hot', { count: hot.length, total: h.councils, pop: formatCompact(hotPop, lang) }) });

    const lead = topDriverCounts(model.councils)[0];
    if (lead) out.push({ id: 'driver', href: '#drivers', text: t('findings.driver', { indicator: t(`indicators:${lead.key}`), count: lead.count, total: h.councils }) });

    // What the evidence cannot yet do: indicators with one value for the whole country or per region.
    const res = resolutionBreakdown();
    const n = (r: string) => res.find((g) => g.resolution === r)?.count ?? 0;
    out.push({ id: 'data', href: '#coverage', text: t('findings.data', { national: n('national'), region: n('region'), total: h.indicatorTotal }) });
    return out;
  }, [model, h, t, lang]);

  return (
    <InsightSection id="kpis" title={t('findings.title')} lead={t('findings.lead')}>
      <ol className="grid border-t border-border md:grid-cols-2 md:gap-x-14">
        {findings.map((f, i) => (
          <li key={f.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 border-b border-border py-6">
            <span className="num pt-[3px] text-sm font-semibold text-muted-foreground">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-[1.0625rem] leading-relaxed text-pretty">{f.text}</p>
              <a href={f.href} className="no-print mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                {t('findings.see')}
                {/* Distinct link names for screen-reader link lists ("See the chart: Regions"). */}
                <span className="sr-only">: {t(`nav.${f.href.slice(1)}`)}</span>
                <ArrowDown className="size-3.5" aria-hidden />
              </a>
            </div>
          </li>
        ))}
      </ol>
    </InsightSection>
  );
}
