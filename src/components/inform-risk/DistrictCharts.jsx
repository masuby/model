/**
 * DistrictCharts — selection-responsive charts that update when a district is
 * picked on the map/table: its component breakdown (bar) and a District vs
 * National vs Region comparison across the INFORM dimensions (line). Downloadable.
 */
import React, { useMemo } from 'react';
import { DISTRICTS, NATIONAL, classifyRisk, round1 } from './riskModel';
import ChartCard from './charts/ChartCard';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';

export default function DistrictCharts({ district }) {
  const region = useMemo(() => {
    if (!district) return null;
    const peers = DISTRICTS.filter((d) => d.admin.adm1Name === district.admin.adm1Name);
    if (!peers.length) {
      // region/national unit: no ADM2 peers — fall back to the unit's own totals
      return { hazard: district.hazardExposure?.total, vuln: district.vulnerability?.total, cope: district.lackCopingCapacity?.total, risk: district.risk };
    }
    const mean = (sel) => {
      const xs = peers.map(sel).filter((x) => typeof x === 'number');
      return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
    };
    return {
      hazard: mean((d) => d.hazardExposure?.total),
      vuln: mean((d) => d.vulnerability?.total),
      cope: mean((d) => d.lackCopingCapacity?.total),
      risk: mean((d) => d.risk),
    };
  }, [district]);

  if (!district) {
    return (
      <div className="rx-dc-empty ui-card ui-card-pad ui-muted">
        Select a district (on the map or in the table) to see its component breakdown and how it compares to the national and regional averages.
      </div>
    );
  }

  const he = district.hazardExposure || {};
  const vu = district.vulnerability || {};
  const cc = district.lackCopingCapacity || {};

  const comps = [
    { label: 'Natural hazards', value: he.natural?.aggregate },
    { label: 'Human hazards', value: he.human?.aggregate },
    { label: 'Socio-economic', value: vu.socioEconomic?.aggregate },
    { label: 'Vulnerable groups', value: vu.vulnerableGroups?.aggregate },
    { label: 'Infrastructure', value: cc.infrastructure?.aggregate },
    { label: 'Institutional', value: cc.institutional?.aggregate },
  ].map((c) => ({ ...c, value: round1(c.value), color: classifyRisk(c.value).color }));

  const xLabels = ['Hazard & Exposure', 'Vulnerability', 'Lack of Coping', 'INFORM Risk'];
  const series = [
    { name: district.admin.adm2Name, color: '#1f6feb', values: [round1(he.total), round1(vu.total), round1(cc.total), round1(district.risk)] },
    { name: `${district.admin.adm1Name} region`, color: '#7c3aed', values: [round1(region.hazard), round1(region.vuln), round1(region.cope), round1(region.risk)] },
    { name: 'National', color: '#94a3b8', values: [round1(NATIONAL.hazardExposure), round1(NATIONAL.vulnerability), round1(NATIONAL.lackCopingCapacity), round1(NATIONAL.risk)] },
  ];

  const base = `inform-district-${district.admin.adm2Name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="rx-dc">
      <div className="rx-dc-title ui-eyebrow">Selected district — {district.admin.adm2Name} ({district.admin.adm1Name})</div>
      <div className="rx-dc-grid">
        <ChartCard
          title="Component breakdown"
          subtitle={`${district.admin.adm2Name} — by INFORM component`}
          filenameBase={`${base}-components`}
          csv={{ header: ['Component', 'Score'], rows: comps.map((c) => [c.label, c.value]) }}
        >
          <BarChart data={comps} horizontal />
        </ChartCard>

        <ChartCard
          title="District vs region vs national"
          subtitle="across the INFORM dimensions"
          filenameBase={`${base}-comparison`}
          csv={{ header: ['Series', ...xLabels], rows: series.map((s) => [s.name, ...s.values]) }}
        >
          <LineChart series={series} xLabels={xLabels} height={300} xTitle="INFORM dimension" />
        </ChartCard>
      </div>
    </div>
  );
}
