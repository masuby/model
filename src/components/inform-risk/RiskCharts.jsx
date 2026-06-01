/**
 * RiskCharts — downloadable, academic (Excel-style) charts.
 *  • Regional INFORM profile: a multi-series line (Risk + 3 dimensions) across
 *    regions ordered by risk — fixed analytical overview.
 *  • Distribution (bar) + Highest districts (bar): react to the active lens.
 * Each chart exports to PNG or CSV.
 */
import React, { useMemo } from 'react';
import { DISTRICTS, classifyRisk, round1 } from './riskModel';
import ChartCard from './charts/ChartCard';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import DistrictCharts from './DistrictCharts';
import { CLASS_COLOR as CLASS_HEX, CLASS_LABELS as CLASS_ORDER } from './riskConstants';

const SCOPE_SERIES = { risk: 'INFORM Risk', hazard: 'Hazard & Exposure', vulnerability: 'Vulnerability', coping: 'Lack of Coping' };

export default function RiskCharts({ metric, selected }) {
  const rows = useMemo(
    () => DISTRICTS.map((d) => ({ d, v: metric.get(d) })).filter((x) => typeof x.v === 'number'),
    [metric]
  );
  const slug = metric.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Regional means of the 4 INFORM measures, ordered by risk (for the line chart)
  const regional = useMemo(() => {
    const byReg = {};
    DISTRICTS.forEach((d) => {
      const r = (byReg[d.admin.adm1Name] = byReg[d.admin.adm1Name] || { risk: [], hazard: [], vuln: [], cope: [] });
      if (typeof d.risk === 'number') r.risk.push(d.risk);
      if (typeof d.hazardExposure?.total === 'number') r.hazard.push(d.hazardExposure.total);
      if (typeof d.vulnerability?.total === 'number') r.vuln.push(d.vulnerability.total);
      if (typeof d.lackCopingCapacity?.total === 'number') r.cope.push(d.lackCopingCapacity.total);
    });
    const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
    return Object.entries(byReg)
      .map(([name, r]) => ({ name, risk: mean(r.risk), hazard: mean(r.hazard), vuln: mean(r.vuln), cope: mean(r.cope) }))
      .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0));
  }, []);

  const lineSeries = [
    { name: 'INFORM Risk', color: '#0f172a', values: regional.map((r) => round1(r.risk)) },
    { name: 'Hazard & Exposure', color: '#FF9800', values: regional.map((r) => round1(r.hazard)) },
    { name: 'Vulnerability', color: '#1f6feb', values: regional.map((r) => round1(r.vuln)) },
    { name: 'Lack of Coping', color: '#7c3aed', values: regional.map((r) => round1(r.cope)) },
  ];

  // Distribution across the 5 classes (reactive)
  const dist = useMemo(() => {
    const counts = Object.fromEntries(CLASS_ORDER.map((c) => [c, 0]));
    rows.forEach(({ v }) => { const lvl = classifyRisk(v).level; counts[lvl] = (counts[lvl] || 0) + 1; });
    return CLASS_ORDER.map((c) => ({ label: c, value: counts[c], color: CLASS_HEX[c] }));
  }, [rows]);
  const distMax = Math.max(1, ...dist.map((d) => d.value));

  // Highest districts (reactive)
  const top = useMemo(
    () => [...rows].sort((a, b) => b.v - a.v).slice(0, 12)
      .map(({ d, v }) => ({ label: d.admin.adm2Name, sub: d.admin.adm1Name, value: v, color: classifyRisk(v).color })),
    [rows]
  );

  const emphasize = SCOPE_SERIES[metric.scope];

  return (
    <>
    <div className="rx-charts">
      <div className="rc-wide">
        <ChartCard
          title="Regional INFORM profile"
          subtitle={`dimension means by region, ordered by overall risk${emphasize ? ` · highlighting ${emphasize}` : ''}`}
          filenameBase="inform-regional-profile"
          csv={{
            header: ['Region', 'INFORM Risk', 'Hazard & Exposure', 'Vulnerability', 'Lack of Coping'],
            rows: regional.map((r) => [r.name, round1(r.risk), round1(r.hazard), round1(r.vuln), round1(r.cope)]),
          }}
        >
          <LineChart series={lineSeries} xLabels={regional.map((r) => r.name)} emphasize={emphasize} />
        </ChartCard>
      </div>

      <ChartCard
        title="Distribution"
        subtitle={`${rows.length} districts by ${metric.label.toLowerCase()}`}
        filenameBase={`inform-${slug}-distribution`}
        csv={{ header: ['Class', 'Districts'], rows: dist.map((d) => [d.label, d.value]) }}
      >
        <BarChart data={dist} max={distMax} />
      </ChartCard>

      <ChartCard
        title="Highest districts"
        subtitle={`top 12 by ${metric.label.toLowerCase()}`}
        filenameBase={`inform-${slug}-top-districts`}
        csv={{ header: ['District', 'Region', metric.label], rows: top.map((t) => [t.label, t.sub, t.value]) }}
      >
        <BarChart data={top} horizontal />
      </ChartCard>
    </div>

    <DistrictCharts district={selected} />
    </>
  );
}
