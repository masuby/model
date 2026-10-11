/**
 * worked-example.ts - the numbers behind docs/WORKED_EXAMPLE.md, read from the engine itself so the
 * documentation cannot drift from what the site computes. Bundled and run by
 * scripts/build-worked-example.mjs (esbuild), never imported by the app.
 *
 * Units: Rufiji (workbook unit TZ0605, Pwani), its two councils Rufiji District and Kibiti District
 * (Kibiti was carved out of Rufiji after the workbook's boundaries and inherits its values in the Core),
 * the Pwani region and the nation.
 *
 * Outputs (relative to the repository root):
 *   docs/worked_example_indicators.csv  every workbook indicator in use: raw value -> specification ->
 *                                       0-10 score -> indicator group -> category -> dimension -> risk
 *   docs/worked_example_levels.csv      council -> workbook unit -> region -> nation
 * and a JSON summary on stdout.
 */
import { writeFileSync } from 'node:fs';
import baselineJson from '@/data/inform-baseline-raw.json';
import { ALL_INDICATORS, DIMENSIONS, leafForWorkbookComponent } from '@/engine/risk/hierarchy';
import { mean, scaledGeomean } from '@/engine/risk/math';
import { buildModel } from '@/engine/risk/model';
import type { BaselineRaw } from '@/engine/risk/rawValues';
import { SPECS, standardise, usedSpecs } from '@/engine/risk/standardise';
import type { Unit } from '@/engine/risk/types';

const baseline = baselineJson as unknown as BaselineRaw;
const model = buildModel();
const SOURCE_ID = 'TZ0605';
const source = model.sources.find((u) => u.id === SOURCE_ID)!;
const councils = model.councils.filter((c) => c.sourceId === SOURCE_ID);
const region = model.regions.find((r) => r.name === source.region)!;
const national = model.national;

const q = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const r2 = (x: number | null | undefined) => (typeof x === 'number' && Number.isFinite(x) ? Math.round(x * 100) / 100 : '');
const unitIndex = baseline.units.indexOf(SOURCE_ID);

// ---- 1. Every workbook indicator in use, for Rufiji
const rows: string[] = [
  ['stage', 'dimension', 'category', 'indicator_group', 'indicator_id', 'indicator', 'raw_value_rufiji', 'unit', 'transform', 'reference_min', 'reference_max', 'direction', 'score_0_10'].map(q).join(','),
];
const groupScores = new Map<string, number | null>();
for (const spec of usedSpecs(SPECS)) {
  const leaf = leafForWorkbookComponent(String(spec.component));
  const raw = baseline.values[spec.id]?.[unitIndex] ?? null;
  const score = spec.denominator && spec.denominator !== 'None' ? null : standardise(raw, spec);
  const group = leaf ? `${leaf.dimension.key}:${leaf.indicator.key}` : '';
  if (leaf) groupScores.set(group, leaf ? unitValue(source, leaf.dimension.key, leaf.indicator.key) : null);
  rows.push(
    [
      '1 indicator',
      leaf?.dimension.en ?? spec.dimension,
      leaf?.category.en ?? spec.category,
      leaf?.indicator.en ?? spec.component,
      spec.id,
      spec.name,
      raw == null ? 'No data' : raw,
      spec.unit,
      spec.transform,
      spec.resolved_min,
      spec.resolved_max,
      spec.sign,
      score == null ? (spec.denominator && spec.denominator !== 'None' ? 'needs denominator' : 'No data') : score,
    ]
      .map(q)
      .join(','),
  );
}
function unitValue(u: Unit, dim: keyof Unit['dims'], key: string): number | null {
  for (const cat of Object.values(u.dims[dim].categories)) if (key in cat.indicators) return cat.indicators[key];
  return null;
}
// ---- 2. Indicator groups, categories, dimensions and risk, as the model holds them
for (const loc of ALL_INDICATORS) {
  const v = unitValue(source, loc.dimension.key, loc.indicator.key);
  rows.push(['2 indicator group', loc.dimension.en, loc.category.en, loc.indicator.en, '', 'mean of the group’s indicators with data', '', '', '', '', '', '', v == null ? 'No data' : v].map(q).join(','));
}
for (const d of DIMENSIONS) {
  for (const c of d.categories) {
    const cat = source.dims[d.key].categories[c.key];
    rows.push(['3 category', d.en, c.en, '', '', 'mean of the indicator groups with data', '', '', '', '', '', '', r2(cat.score)].map(q).join(','));
  }
  rows.push(['4 dimension', d.en, '', '', '', 'ROUND(scaled geometric mean of the categories, 1)', '', '', '', '', '', '', source.dims[d.key].score ?? 'No data'].map(q).join(','));
}
rows.push(['5 risk', '', '', '', '', 'ROUND(cube root of H x V x LCC, 1)', '', '', '', '', '', '', source.risk ?? 'No data'].map(q).join(','));
writeFileSync('docs/worked_example_indicators.csv', rows.join('\n') + '\n');

// ---- 3. The levels
const lvl = (level: string, u: Unit, how: string) =>
  [level, u.name, how, u.dims.hazard.score, u.dims.vulnerability.score, u.dims.coping.score, u.risk].map(q).join(',');
const levels = [
  ['level', 'unit', 'how_it_is_built', 'Hazard&Exposure', 'Vulnerability', 'LackOfCoping', 'risk'].map(q).join(','),
  ...councils.map((c) =>
    lvl(
      'council (195)',
      c,
      c.inheritedFrom
        ? `created after the workbook's boundaries: carries the values of ${c.inheritedFrom} until council values are approved`
        : `the values of workbook unit ${c.sourceName}; council values entered by institutions take precedence for this council alone`,
    ),
  ),
  lvl('workbook unit (170)', source, 'indicator -> group mean -> category mean -> dimension scaled geomean -> risk cube root'),
  lvl(`region (31)`, region, `${region.members} councils: mean of each indicator over the councils, then the same chain`),
  lvl('national', national, `${model.councils.length} councils: mean of each indicator over all councils, then the same chain (not an official INFORM figure)`),
];
writeFileSync('docs/worked_example_levels.csv', levels.join('\n') + '\n');

// ---- 4. Summary for the Markdown
const cats = (u: Unit) =>
  Object.fromEntries(
    DIMENSIONS.map((d) => [d.key, { score: u.dims[d.key].score, categories: Object.fromEntries(d.categories.map((c) => [c.key, r2(u.dims[d.key].categories[c.key].score)])) }]),
  );
const natural = source.dims.hazard.categories.natural.indicators;
const human = source.dims.hazard.categories.human.indicators;
const summary = {
  asOf: model.asOf,
  source: { id: source.id, name: source.name, region: source.region, risk: source.risk, ...cats(source), natural, human },
  councils: councils.map((c) => ({ id: c.id, name: c.name, inheritedFrom: c.inheritedFrom, risk: c.risk, population: c.exposure?.population, density: c.exposure?.density })),
  region: { id: region.id, name: region.name, members: region.members, risk: region.risk, ...cats(region) },
  national: { risk: national.risk, ...cats(national) },
  check: {
    naturalMean: r2(mean(Object.values(natural))),
    humanMean: r2(mean(Object.values(human))),
    hazardSgm: r2(scaledGeomean([source.dims.hazard.categories.natural.score, source.dims.hazard.categories.human.score])),
    riskCbrt: r2(Math.cbrt((source.dims.hazard.score ?? 0) * (source.dims.vulnerability.score ?? 0) * (source.dims.coping.score ?? 0))),
  },
  groupsWithData: [...groupScores.values()].filter((v) => v != null).length,
  inheritingCouncils: model.councils.filter((c) => c.inheritedFrom).length,
  sharedUnits: new Set(model.councils.filter((c) => model.councils.filter((o) => o.sourceId === c.sourceId).length > 1).map((c) => c.sourceId)).size,
};
process.stdout.write(JSON.stringify(summary, null, 1) + '\n');
