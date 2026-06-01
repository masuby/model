/**
 * RiskCharts — the two reactive, downloadable bar charts (distribution + highest
 * units) for the active lens/indicator. The regional line lives in RegionalTrend
 * and the per-unit charts in DistrictCharts; the explorer lays them out.
 */
import React, { useMemo } from 'react';
import { DISTRICTS, classifyRisk } from './riskModel';
import ChartCard from './charts/ChartCard';
import BarChart from './charts/BarChart';
import { CLASS_COLOR as CLASS_HEX, CLASS_LABELS as CLASS_ORDER } from './riskConstants';

export default function RiskCharts({ metric }) {
  const rows = useMemo(
    () => DISTRICTS.map((d) => ({ d, v: metric.get(d) })).filter((x) => typeof x.v === 'number'),
    [metric]
  );
  const slug = metric.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const dist = useMemo(() => {
    const counts = Object.fromEntries(CLASS_ORDER.map((c) => [c, 0]));
    rows.forEach(({ v }) => { const lvl = classifyRisk(v).level; counts[lvl] = (counts[lvl] || 0) + 1; });
    return CLASS_ORDER.map((c) => ({ label: c, value: counts[c], color: CLASS_HEX[c] }));
  }, [rows]);
  const distMax = Math.max(1, ...dist.map((d) => d.value));

  const top = useMemo(
    () => [...rows].sort((a, b) => b.v - a.v).slice(0, 12)
      .map(({ d, v }) => ({ label: d.admin.adm2Name, sub: d.admin.adm1Name, value: v, color: classifyRisk(v).color })),
    [rows]
  );

  return (
    <div className="rx-charts">
      <ChartCard
        title="Distribution"
        subtitle={`${rows.length} units by ${metric.label.toLowerCase()}`}
        filenameBase={`inform-${slug}-distribution`}
        csv={{ header: ['Class', 'Units'], rows: dist.map((d) => [d.label, d.value]) }}
      >
        <BarChart data={dist} max={distMax} />
      </ChartCard>

      <ChartCard
        title="Highest units"
        subtitle={`top 12 by ${metric.label.toLowerCase()}`}
        filenameBase={`inform-${slug}-top`}
        csv={{ header: ['Unit', 'Region', metric.label], rows: top.map((t) => [t.label, t.sub, t.value]) }}
      >
        <BarChart data={top} horizontal />
      </ChartCard>
    </div>
  );
}
