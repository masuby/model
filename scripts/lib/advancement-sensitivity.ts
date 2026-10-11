/**
 * advancement-sensitivity.ts - the sensitivity and validation report of the Advancement layer (issue
 * ADV-04), computed with the engine itself. Bundled and run by scripts/advancement-sensitivity.mjs.
 *
 *  1. Core versus Advancement: rank agreement, class changes and the biggest movers.
 *  2. Weight sensitivity: equal weights; every member's weight halved and doubled; every member left
 *     out. For each variant: Spearman rank correlation of council risk with the baseline Advancement,
 *     the largest change of a council's risk, and how many councils change risk class or hazard class.
 *  3. Agreement with documented hazards: for each hazard basket, how well the Core group score and the
 *     Advancement group score separate the councils where the Risk Action Guide Book documents that
 *     hazard from the others (area under the ROC curve: 0.5 = no separation, 1 = perfect).
 *
 * Outputs docs/assessment/INFORM_TZ_Advancement_Sensitivity_2026-10.md and .json.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import inputsJson from '@/data/tanzania-advanced-inputs.json';
import { ADVANCEMENT_BASKETS, buildAdvancedModel, type AdvancedInputs, type BasketWeights } from '@/engine/risk/advanced';
import { classify } from '@/engine/risk/classes';
import { buildModel, indicatorValue } from '@/engine/risk/model';
import { ADVANCED_SPECS } from '@/engine/risk/standardise';
import type { RiskModel, Unit } from '@/engine/risk/types';

const inputs = inputsJson as unknown as AdvancedInputs;
const DATE = '2026-10-10';
const core = buildModel();
const base = buildAdvancedModel(core, inputs);

/** The guide book's hazards behind each INFORM hazard group (the crosswalk of src/features/guide/crosswalk.ts). */
const GUIDE_OF: Record<string, string[]> = {
  flood: ['floods', 'heavyRainfall'],
  landslide: ['landslide', 'heavyRainfall'],
  stormsCyclone: ['strongWinds'],
  coastalHazards: ['largeWaves'],
  wildfire: ['wildfire'],
  drought: ['drought'],
  earthquake: ['earthquake'],
};

const r2 = (x: number) => Math.round(x * 100) / 100;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const risks = (m: RiskModel) => m.councils.map((c) => c.risk ?? 0);

function ranks(xs: readonly number[]): number[] {
  const order = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(xs.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[order[k][1]] = r;
    i = j + 1;
  }
  return out;
}
function spearman(a: readonly number[], b: readonly number[]): number {
  const ra = ranks(a);
  const rb = ranks(b);
  const n = a.length;
  const ma = ra.reduce((s, x) => s + x, 0) / n;
  const mb = rb.reduce((s, x) => s + x, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (ra[i] - ma) * (rb[i] - mb);
    da += (ra[i] - ma) ** 2;
    db += (rb[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
/** Area under the ROC curve of `score` for the positive set (Mann-Whitney form, ties counted half). */
function auc(score: ReadonlyArray<number | null>, positive: readonly boolean[]): number | null {
  const pos: number[] = [];
  const neg: number[] = [];
  score.forEach((s, i) => {
    if (s == null) return;
    (positive[i] ? pos : neg).push(s);
  });
  if (!pos.length || !neg.length) return null;
  let wins = 0;
  for (const p of pos) for (const q of neg) wins += p > q ? 1 : p === q ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}

function compare(ref: RiskModel, m: RiskModel) {
  const a = risks(ref);
  const b = risks(m);
  let maxDelta = 0;
  let riskClass = 0;
  let hazardClass = 0;
  const movers: Array<{ id: string; name: string; from: number | null; to: number | null; delta: number }> = [];
  ref.councils.forEach((c, i) => {
    const d = m.councils[i];
    const delta = (d.risk ?? 0) - (c.risk ?? 0);
    maxDelta = Math.max(maxDelta, Math.abs(delta));
    if (classify(c.risk, 'risk')?.key !== classify(d.risk, 'risk')?.key) riskClass++;
    if (classify(c.dims.hazard.score, 'hazard')?.key !== classify(d.dims.hazard.score, 'hazard')?.key) hazardClass++;
    movers.push({ id: c.id, name: c.name, from: c.risk, to: d.risk, delta: r2(delta) });
  });
  movers.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  return { rho: r3(spearman(a, b)), maxDelta: r2(maxDelta), riskClass, hazardClass, movers: movers.slice(0, 10) };
}

// ---- 1. Core versus Advancement
const coreVsAdv = compare(core, base);
const national = { core: core.national.risk, advancement: base.national.risk };

// ---- 2. Weight sensitivity
const members = Object.values(ADVANCED_SPECS);
const specWeights: BasketWeights = Object.fromEntries(members.map((s) => [s.id, Number(s.weight) || 1]));
const variants: Array<{ name: string; weights: BasketWeights }> = [{ name: 'Equal weights (every member 1)', weights: Object.fromEntries(members.map((s) => [s.id, 1])) }];
for (const s of members) {
  variants.push({ name: `${s.id} × 0.5`, weights: { ...specWeights, [s.id]: specWeights[s.id] * 0.5 } });
  variants.push({ name: `${s.id} × 2`, weights: { ...specWeights, [s.id]: specWeights[s.id] * 2 } });
  variants.push({ name: `${s.id} left out`, weights: { ...specWeights, [s.id]: 0 } });
}
const sensitivity = variants.map((v) => {
  const m = buildAdvancedModel(core, inputs, v.weights);
  const c = compare(base, m);
  return { variant: v.name, rho: c.rho, maxDelta: c.maxDelta, riskClass: c.riskClass, hazardClass: c.hazardClass };
});

// ---- 3. Agreement with the documented hazards of the Risk Action Guide Book
const regionsDir = 'src/data/action-guide/regions';
const documented = new Map<string, string[]>();
for (const f of readdirSync(regionsDir)) {
  const g = JSON.parse(readFileSync(`${regionsDir}/${f}`, 'utf8')) as { councils: Record<string, { hazards: string[] }> };
  for (const [id, cg] of Object.entries(g.councils)) documented.set(id, cg.hazards);
}
const agreement = ADVANCEMENT_BASKETS.filter((b) => b.dim === 'hazard' && GUIDE_OF[b.key]).map((b) => {
  const positive = core.councils.map((c) => (documented.get(c.id) ?? []).some((h) => GUIDE_OF[b.key].includes(h)));
  const scoreOf = (m: RiskModel) => m.councils.map((c) => indicatorValue(c, b.dim, b.key));
  const filled = base.councils.filter((c) => c.edits[b.ref]?.authority === 'CHC').length;
  return { group: b.key, documentedIn: positive.filter(Boolean).length, filled, aucCore: auc(scoreOf(core), positive), aucAdvancement: auc(scoreOf(base), positive) };
});

// ---- Member coverage, for the record
const coverage = members.map((s) => ({ id: s.id, name: s.name, weight: specWeights[s.id], filled: inputs.inputs[s.id]?.filled ?? 0, resolution: inputs.inputs[s.id]?.resolution ?? (inputs.withheld[s.id] ? 'withheld' : 'unavailable') }));

const result = { date: DATE, release: inputs.release, councils: core.councils.length, national, coreVsAdv, sensitivity, agreement, coverage };
writeFileSync('docs/assessment/INFORM_TZ_Advancement_Sensitivity_2026-10.json', JSON.stringify(result, null, 1));

const f = (x: number | null) => (x == null ? 'n/a' : x.toFixed(2));
const lines: string[] = [];
lines.push(`# INFORM Tanzania: Advancement layer, sensitivity and validation (${DATE})`, '');
lines.push(`Computed by \`scripts/advancement-sensitivity.mjs\` with the engine (\`src/engine/risk/advanced.ts\`) on release \`${inputs.release}\` of the inputs, over the ${core.councils.length} councils. The Advancement layer is the Core (the INFORM SADC 2024 workbook) plus the Tanzanian sub-indicators, computed beside it; it is shown on request and the Core stays the headline. Issue ADV-04 asked for this report before Advancement scores inform decisions.`, '');
lines.push('## 1. Core versus Advancement', '');
lines.push(`| Measure | Value |`, `|---|---|`);
lines.push(`| National INFORM risk, Core | ${f(national.core)} |`, `| National INFORM risk, Advancement | ${f(national.advancement)} |`);
lines.push(`| Spearman rank correlation of council risk (Core vs Advancement) | ${coreVsAdv.rho} |`, `| Largest change of a council's risk | ${coreVsAdv.maxDelta} |`);
lines.push(`| Councils changing risk class (SADC thresholds) | ${coreVsAdv.riskClass} of ${core.councils.length} |`, `| Councils changing hazard class | ${coreVsAdv.hazardClass} of ${core.councils.length} |`, '');
lines.push('Biggest movers (council risk, Core → Advancement):', '', '| Council | Core | Advancement | Change |', '|---|---|---|---|');
for (const m of coreVsAdv.movers) lines.push(`| ${m.name} | ${f(m.from)} | ${f(m.to)} | ${m.delta > 0 ? '+' : ''}${m.delta.toFixed(1)} |`);
lines.push('', '## 2. Weight sensitivity', '');
lines.push('Each variant is compared with the baseline Advancement (the specification weights). ρ is the Spearman rank correlation of council risk; "max Δ" the largest change of any council\'s risk; the class columns count councils whose risk class or hazard class changes.', '');
lines.push('| Variant | ρ | max Δ risk | Risk class changes | Hazard class changes |', '|---|---|---|---|---|');
for (const s of sensitivity) lines.push(`| ${s.variant} | ${s.rho.toFixed(3)} | ${s.maxDelta.toFixed(2)} | ${s.riskClass} | ${s.hazardClass} |`);
const worst = [...sensitivity].sort((a, b) => a.rho - b.rho)[0];
const mostClass = [...sensitivity].sort((a, b) => b.riskClass - a.riskClass)[0];
lines.push('', `Reading: the lowest rank agreement with the baseline is ${worst.rho.toFixed(3)} (${worst.variant}); the most risk-class changes come from "${mostClass.variant}" (${mostClass.riskClass} councils). Variants that leave a ρ above 0.99 and change no class show that the ranking does not depend on that weight.`, '');
lines.push('## 3. Agreement with the documented hazards of the Risk Action Guide Book', '');
lines.push('For each hazard group with a basket: how well the group score separates the councils where the guide book documents that hazard (through the hazard crosswalk) from the others. AUC 0.5 means no separation, 1 perfect separation. The guide documents hazards by local experience, so this is agreement with institutional knowledge, not a measure of truth; both columns use the same councils.', '');
lines.push('| Group | Documented in (councils) | Councils with Advancement data | AUC, Core | AUC, Advancement |', '|---|---|---|---|---|');
for (const a of agreement) lines.push(`| ${a.group} | ${a.documentedIn} | ${a.filled} | ${f(a.aucCore)} | ${f(a.aucAdvancement)} |`);
lines.push('', '## 4. Members and coverage', '', '| Member | Name | Weight | Councils filled | Level |', '|---|---|---|---|---|');
for (const c of coverage) lines.push(`| ${c.id} | ${c.name} | ${c.weight} | ${c.filled} | ${c.resolution} |`);
lines.push('', '## 5. What this does and does not show', '');
lines.push('- The weights remain proposed; this report shows how much the ranking depends on each, which is the information a calibration against recorded losses would need. A calibration needs an event and loss register by council (the committees\' validated event reports through the Data portal, DesInventar, EM-DAT), which does not exist at council level yet.');
lines.push('- The agreement test uses the guide book\'s documented hazards as the reference. It is institutional knowledge, not an observed loss record, and the guide documents floods for almost every council, so the flood row says little.');
lines.push('- Hazard members measure intensity on the territory, not people exposed (MET-16); refugees, facility densities and DRM arrangements are counts at the district or council level.');
lines.push('', `Regenerate: \`node scripts/advancement-sensitivity.mjs\`. Machine-readable results: \`INFORM_TZ_Advancement_Sensitivity_2026-10.json\`.`);
writeFileSync('docs/assessment/INFORM_TZ_Advancement_Sensitivity_2026-10.md', lines.join('\n') + '\n');
process.stdout.write(JSON.stringify({ national, coreVsAdv: { rho: coreVsAdv.rho, maxDelta: coreVsAdv.maxDelta, riskClass: coreVsAdv.riskClass, hazardClass: coreVsAdv.hazardClass }, variants: sensitivity.length, worst, agreement }, null, 1) + '\n');
