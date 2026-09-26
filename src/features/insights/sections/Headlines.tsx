import { ArrowDownRight, Database, Gauge, MapPin, ShieldAlert, Users } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Stat } from '@/components/layout/Page';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { CLASS_COLORS, CLASS_KEYS, THRESHOLDS } from '@/engine/risk/classes';
import { isNum } from '@/engine/risk/math';
import type { RiskModel } from '@/engine/risk/types';
import { formatCompact, formatNumber, formatScore } from '@/lib/utils';
import { correlationMatrix, headline, HIGH_INDEX, resolutionBreakdown, topDriverCounts } from '../analytics';
import { useInsightTheme } from '../theme';
import { InsightSection, ScaleStrip } from '../ui';
import { LENS_SHORT } from './RegionalRanking';

const CLASS_RAMP = CLASS_KEYS.map((k) => CLASS_COLORS[k]);

export function Headlines({ model }: { model: RiskModel }) {
  const { t, i18n } = useTranslation(['insights', 'common', 'indicators']);
  const th = useInsightTheme();
  const lang = i18n.language;
  const h = React.useMemo(() => headline(model), [model]);
  const groups = React.useMemo(() => resolutionBreakdown(), []);
  const pct = (x: number) => formatNumber(x, lang, { style: 'percent', maximumFractionDigits: 0 });

  const findings = React.useMemo(() => {
    const pct = (x: number) => formatNumber(x, lang, { style: 'percent', maximumFractionDigits: 0 });
    const out: Array<{ id: string; href: string; text: string }> = [];
    out.push({
      id: 'high',
      href: '#classes',
      text: t('findings.high', { count: h.highCount, total: h.councils, pct: pct(h.highShare), pop: formatCompact(h.exposedPopulation, lang) }),
    });
    if (h.topRegion && h.bottomRegion)
      out.push({
        id: 'regions',
        href: '#regions',
        text: t('findings.regions', { top: h.topRegion.name, topScore: formatScore(h.topRegion.risk), bottom: h.bottomRegion.name, bottomScore: formatScore(h.bottomRegion.risk) }),
      });
    const hHigh = THRESHOLDS.hazard[HIGH_INDEX - 1];
    const vHigh = THRESHOLDS.vulnerability[HIGH_INDEX - 1];
    const hot = model.councils.filter((u) => isNum(u.dims.hazard.score) && isNum(u.dims.vulnerability.score) && u.dims.hazard.score >= hHigh && u.dims.vulnerability.score >= vHigh);
    out.push({ id: 'hot', href: '#dimensions', text: t('findings.hot', { count: hot.length, total: h.councils }) });
    const lead = topDriverCounts(model.councils)[0];
    if (lead) out.push({ id: 'driver', href: '#drivers', text: t('findings.driver', { indicator: t(`indicators:${lead.key}`), count: lead.count, total: h.councils }) });
    const m = correlationMatrix(model.councils);
    const ri = m.keys.indexOf('risk');
    const best = m.keys
      .map((k, i) => ({ k, r: m.r[i][ri] }))
      .filter((x) => x.k !== 'risk' && isNum(x.r))
      .sort((a, b) => Math.abs(b.r as number) - Math.abs(a.r as number))[0];
    if (best) out.push({ id: 'corr', href: '#correlation', text: t('findings.correlation', { dim: t(LENS_SHORT[best.k]), r: (best.r as number).toFixed(2) }) });
    out.push({ id: 'data', href: '#coverage', text: t('findings.data', { local: h.localIndicators, total: h.indicatorTotal }) });
    return out;
  }, [model, h, t, lang]);

  return (
    <InsightSection id="kpis" index={1} eyebrow={t('kpi.eyebrow')} title={t('kpi.title')} lead={t('kpi.lead')}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          className="sm:col-span-2 xl:col-span-1"
          label={t('kpi.national')}
          icon={<Gauge />}
          value={
            <span className="flex flex-wrap items-center gap-2.5">
              {formatScore(h.nationalRisk)}
              <ClassBadge value={h.nationalRisk} size="sm" />
            </span>
          }
          sub={
            <>
              {t('kpi.nationalSub')}
              <ScaleStrip value={h.nationalRisk} bounds={THRESHOLDS.risk} colors={CLASS_RAMP} label={t('kpi.scaleAria', { value: formatScore(h.nationalRisk) })} />
            </>
          }
        />
        <Stat
          label={t('kpi.high')}
          icon={<ShieldAlert />}
          value={
            <span>
              {h.highCount}
              <span className="text-base font-bold text-muted-foreground"> / {h.councils}</span>
            </span>
          }
          sub={t('kpi.highSub', { pct: pct(h.highShare) })}
        />
        <Stat label={t('kpi.exposed')} icon={<Users />} value={formatCompact(h.exposedPopulation, lang)} sub={t('kpi.exposedSub', { pct: pct(h.exposedShare), total: formatCompact(h.totalPopulation, lang) })} />
        <Stat
          label={t('kpi.topRegion')}
          icon={<MapPin />}
          value={
            h.topRegion ? (
              <Link to={`/area/${h.topRegion.id}`} className="block truncate text-2xl hover:text-primary sm:text-[1.7rem]">
                {h.topRegion.name}
              </Link>
            ) : (
              '—'
            )
          }
          sub={
            h.topRegion && (
              <span className="flex flex-wrap items-center gap-2">
                <ClassBadge value={h.topRegion.risk} showScore size="sm" />
                {t('kpi.topRegionSub')}
              </span>
            )
          }
        />
        <Stat
          label={t('kpi.local')}
          icon={<Database />}
          value={
            <span>
              {h.localIndicators}
              <span className="text-base font-bold text-muted-foreground"> / {h.indicatorTotal}</span>
            </span>
          }
          sub={
            <>
              {t('kpi.localSub', { pct: pct(h.localShare) })}
              <span className="mt-3 flex h-1.5 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={groups.map((g) => `${t(`coverage.res.${g.resolution}`)}: ${g.count}`).join(', ')}>
                {groups.map((g) => (g.count ? <span key={g.resolution} style={{ width: `${(g.count / h.indicatorTotal) * 100}%`, background: th.resolution[g.resolution] }} /> : null))}
              </span>
            </>
          }
        />
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-card p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_left,black,transparent_60%)]" />
        <div className="relative">
          <h3 className="font-display text-lg font-bold">{t('findings.title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('findings.lead')}</p>
          <ol className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
            {findings.map((f, i) => (
              <li key={f.id} className="flex gap-3">
                <span className="num inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed">{f.text}</p>
                  <a href={f.href} className="no-print mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    {t('findings.see')} <ArrowDownRight className="size-3.5" aria-hidden />
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </InsightSection>
  );
}
