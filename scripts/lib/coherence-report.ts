/**
 * coherence-report.ts - the statistical coherence check the INFORM Subnational Guidance (II.7) asks for
 * (issue MET-13), computed with the engine (src/engine/risk/coherence.ts, the same code the Methodology
 * page's Quality section runs live) for the Core release and for the Advancement layer:
 *   1. the correlation matrix of the six categories and three dimensions with risk, over the 170 workbook
 *      units and over the 195 councils;
 *   2. the indicator groups that carry one value for every unit (they add no subnational information),
 *      and the groups empty for every unit;
 *   3. the share of units without data per group.
 * Bundled and run by scripts/coherence-report.mjs; writes docs/assessment/INFORM_TZ_Coherence_<release>.{md,json}.
 */
import { writeFileSync } from 'node:fs';
import inputsJson from '@/data/tanzania-advanced-inputs.json';
import { buildAdvancedModel, type AdvancedInputs } from '@/engine/risk/advanced';
import { coherenceMatrix, groupCoverage } from '@/engine/risk/coherence';
import { buildModel, DATA_RELEASE } from '@/engine/risk/model';
import type { RiskModel } from '@/engine/risk/types';

const DATE = '2026-10-10';
const core = buildModel();
const advanced = buildAdvancedModel(core, inputsJson as unknown as AdvancedInputs);

const section = (name: string, model: RiskModel) => ({
  name,
  units: { n: model.sources.length, matrix: coherenceMatrix(model.sources), groups: groupCoverage(model.sources) },
  councils: { n: model.councils.length, matrix: coherenceMatrix(model.councils), groups: groupCoverage(model.councils) },
});
const result = { date: DATE, release: DATA_RELEASE, core: section('Core', core), advancement: section('Advancement', advanced) };
writeFileSync(`docs/assessment/INFORM_TZ_Coherence_${DATA_RELEASE}.json`, JSON.stringify(result, null, 1));

const f = (x: number | null) => (x == null ? 'n/a' : x.toFixed(2));
const lines: string[] = [];
lines.push(`# INFORM Tanzania: coherence report, release ${DATA_RELEASE} (${DATE})`, '');
lines.push('The cross-correlation check the INFORM Subnational Guidance (II.7) asks for, computed with the engine (`node scripts/coherence-report.mjs`; the Quality section of the Methodology page runs the same code live over the councils) for the Core and for the Advancement layer, over the 170 workbook units and the 195 councils. A category that correlates negatively with its partner, or not at all with risk, adds little or contradicts the dimension it belongs to; a group with one value for every unit adds no subnational information; an empty group enters no score.', '');
for (const s of [result.core, result.advancement]) {
  for (const level of ['units', 'councils'] as const) {
    const m = s[level].matrix;
    lines.push(`## ${s.name}: correlation matrix over the ${s[level].n} ${level === 'units' ? 'workbook units' : 'councils'}`, '');
    lines.push('| | ' + m.labels.map((l) => l.replace(/ \(.*\)/, '')).join(' | ') + ' |', '|---|' + m.labels.map(() => '---').join('|') + '|');
    m.labels.forEach((l, i) => lines.push(`| ${l} | ` + m.r[i].map(f).join(' | ') + ' |'));
    lines.push('');
  }
  const g = s.units.groups;
  const constant = g.filter((x) => x.constant).map((x) => x.name);
  const empty = g.filter((x) => x.empty).map((x) => x.name);
  const missing = g.filter((x) => !x.empty && x.missing > 0).map((x) => `${x.name} (${x.missing})`);
  lines.push(`## ${s.name}: groups with one value for every unit`, '', constant.length ? constant.join('; ') : 'none', '');
  lines.push(`## ${s.name}: groups empty for every unit`, '', empty.length ? empty.join('; ') : 'none', '');
  lines.push(`## ${s.name}: groups with some units missing (workbook units)`, '', missing.length ? missing.join('; ') : 'none', '');
}
lines.push('## Reading', '');
lines.push('- Constant groups are the first targets for institutional data through the Data portal: a value per region or council turns them into information.');
lines.push('- Negative correlation between the two coping categories (infrastructure against institutional) means the institutional category pulls the dimension the other way; with one national value for DRR implementation, the category carries governance alone.');
lines.push('- The Advancement layer adds council variation to the hazard groups and to displaced people, facilities and DRM arrangements, which shows as higher correlations with risk and fewer constant groups.');
lines.push('', 'Machine-readable results: `INFORM_TZ_Coherence_' + DATA_RELEASE + '.json`. Regenerate with every release.');
writeFileSync(`docs/assessment/INFORM_TZ_Coherence_${DATA_RELEASE}.md`, lines.join('\n') + '\n');
const cm = result.core.units.matrix;
const idx = (label: string) => cm.labels.findIndex((l) => l.startsWith(label));
process.stdout.write(JSON.stringify({ release: DATA_RELEASE, coreUnits: { infraVsInst: cm.r[idx('Infrastructure')][idx('Institutional')], instVsRisk: cm.r[idx('Institutional')][cm.labels.length - 1], natVsHuman: cm.r[idx('Natural')][idx('Human')] }, constantCore: result.core.units.groups.filter((g) => g.constant).map((g) => g.name), emptyCore: result.core.units.groups.filter((g) => g.empty).map((g) => g.name), constantAdvancement: result.advancement.councils.groups.filter((g) => g.constant).map((g) => g.name) }, null, 1) + '\n');
