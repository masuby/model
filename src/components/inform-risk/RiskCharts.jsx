/**
 * RiskCharts — downloadable visualization panel. Reacts to the active lens/
 * indicator: distribution (bar), the ranked profile (line), highest districts
 * (bar) and regional averages (bar). Each chart exports to PNG or CSV.
 */
import React, { useMemo } from 'react';
import { DISTRICTS, classifyRisk, round1 } from './riskModel';
import ChartCard from './charts/ChartCard';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';

const CLASS_HEX = { 'Very Low': '#2E7D32', Low: '#8BC34A', Medium: '#FFC107', High: '#FF9800', 'Very High': '#D32F2F' };
const CLASS_ORDER = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

export default function RiskCharts({ metric }) {
  const rows = useMemo(
    () => DISTRICTS.map((d) => ({ d, v: metric.get(d) })).filter((x) => typeof x.v === 'number'),
    [metric]
  );
  const slug = metric.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Distribution across the 5 classes
  const dist = useMemo(() => {
    const counts = Object.fromEntries(CLASS_ORDER.map((c) => [c, 0]));
    rows.forEach(({ v }) => { const lvl = classifyRisk(v).level; counts[lvl] = (counts[lvl] || 0) + 1; });
    return CLASS_ORDER.map((c) => ({ label: c, value: counts[c], color: CLASS_HEX[c] }));
  }, [rows]);
  const distMax = Math.max(1, ...dist.map((d) => d.value));

  // Ranked profile (line) — all districts high → low
  const profile = useMemo(() => [...rows].map((r) => r.v).sort((a, b) => b - a), [rows]);

  // Top districts (bar)
  const top = useMemo(
    () => [...rows].sort((a, b) => b.v - a.v).slice(0, 12)
      .map(({ d, v }) => ({ label: d.admin.adm2Name, sub: d.admin.adm1Name, value: v, color: classifyRisk(v).color })),
    [rows]
  );

  // Regional averages (bar)
  const regions = useMemo(() => {
    const byReg = {};
    rows.forEach(({ d, v }) => { (byReg[d.admin.adm1Name] = byReg[d.admin.adm1Name] || []).push(v); });
    return Object.entries(byReg)
      .map(([name, vs]) => ({ name, avg: vs.reduce((s, x) => s + x, 0) / vs.length, n: vs.length }))
      .sort((a, b) => b.avg - a.avg).slice(0, 12)
      .map((r) => ({ label: r.name, sub: `${r.n} districts`, value: round1(r.avg), color: classifyRisk(r.avg).color }));
  }, [rows]);

  const sortedRows = useMemo(() => [...rows].sort((a, b) => b.v - a.v), [rows]);

  return (
    <div className="rx-charts">
      <ChartCard
        title="Distribution"
        subtitle={`${rows.length} districts by ${metric.label.toLowerCase()}`}
        filenameBase={`inform-${slug}-distribution`}
        csv={{ header: ['Class', 'Districts'], rows: dist.map((d) => [d.label, d.value]) }}
      >
        <BarChart data={dist} max={distMax} />
      </ChartCard>

      <ChartCard
        title="Ranked profile"
        subtitle={`all ${rows.length} districts, high → low`}
        filenameBase={`inform-${slug}-profile`}
        csv={{ header: ['Rank', 'District', 'Region', metric.label], rows: sortedRows.map((r, i) => [i + 1, r.d.admin.adm2Name, r.d.admin.adm1Name, round1(r.v)]) }}
      >
        <LineChart values={profile} />
      </ChartCard>

      <ChartCard
        title="Highest districts"
        subtitle="top 12"
        filenameBase={`inform-${slug}-top-districts`}
        csv={{ header: ['District', 'Region', metric.label], rows: top.map((t) => [t.label, t.sub, t.value]) }}
      >
        <BarChart data={top} horizontal />
      </ChartCard>

      <ChartCard
        title="By region"
        subtitle="average · top 12"
        filenameBase={`inform-${slug}-by-region`}
        csv={{ header: ['Region', 'Districts', `Average ${metric.label}`], rows: regions.map((r) => [r.label, r.sub.replace(' districts', ''), r.value]) }}
      >
        <BarChart data={regions} horizontal />
      </ChartCard>
    </div>
  );
}
