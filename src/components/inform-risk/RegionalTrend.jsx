/**
 * RegionalTrend - the "Regional INFORM profile" multi-series line (Risk + 3
 * dimensions across regions, ordered by risk), highlighting the active lens.
 * Extracted so it can sit beside the map (default) or below it (split view).
 */
import React, { useMemo } from 'react';
import { DISTRICTS, round1 } from './riskModel';
import ChartCard from './charts/ChartCard';
import LineChart from './charts/LineChart';

const SCOPE_SERIES = { risk: 'INFORM Risk', hazard: 'Hazard and Exposure', vulnerability: 'Vulnerability', coping: 'Lack of Coping' };

export default function RegionalTrend({ metric, height = 360 }) {
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

  const series = [
    { name: 'INFORM Risk', color: '#0f172a', values: regional.map((r) => round1(r.risk)) },
    { name: 'Hazard and Exposure', color: '#FF9800', values: regional.map((r) => round1(r.hazard)) },
    { name: 'Vulnerability', color: '#1f6feb', values: regional.map((r) => round1(r.vuln)) },
    { name: 'Lack of Coping', color: '#7c3aed', values: regional.map((r) => round1(r.cope)) },
  ];
  const emphasize = SCOPE_SERIES[metric.scope];

  return (
    <ChartCard
      title="Regional INFORM profile"
      subtitle={`dimension means by region, ordered by overall risk${emphasize ? ` · highlighting ${emphasize}` : ''}`}
      filenameBase="inform-regional-profile"
      csv={{
        header: ['Region', 'INFORM Risk', 'Hazard and Exposure', 'Vulnerability', 'Lack of Coping'],
        rows: regional.map((r) => [r.name, round1(r.risk), round1(r.hazard), round1(r.vuln), round1(r.cope)]),
      }}
    >
      <LineChart series={series} xLabels={regional.map((r) => r.name)} emphasize={emphasize} height={height} />
    </ChartCard>
  );
}
