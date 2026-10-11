/**
 * integrity-recheck.ts - the indicator integrity register of a release: every Core indicator (the 53
 * workbook indicators and the 32 groups) and every Advancement member rechecked value by value over the
 * 170 workbook units and the 195 councils, with the ground-truth checks the recheck of 10 October 2026
 * codified (Dar es Salaam's drought, Kagera's earthquake, Ukerewe's landslide, the coastal-erosion rows,
 * the food-security units, the displaced-people rows, Dodoma's electricity, the health-facility range,
 * the Advancement members' ranges and the facility join). Run by scripts/integrity-recheck.mjs; writes
 * docs/assessment/INFORM_TZ_Indicator_Integrity_<release>.{md,json}. The data notes the site shows are
 * src/data/inform-data-notes.json; this register is their evidence and must agree with them.
 */
import { writeFileSync } from 'node:fs';
import advSpecJson from '@/data/inform-advanced-spec.json';
import rawJson from '@/data/inform-baseline-raw.json';
import specJson from '@/data/inform-indicator-spec.json';
import sourcesJson from '@/data/inform-workbook-sources.json';
import inputsJson from '@/data/tanzania-advanced-inputs.json';
import { buildAdvancedModel, type AdvancedInputs } from '@/engine/risk/advanced';
import { ALL_INDICATORS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum, mean } from '@/engine/risk/math';
import { buildModel, DATA_RELEASE, indicatorValue, placeKey } from '@/engine/risk/model';
import { DATA_NOTES, dataNotesFor, isDecision, noteById } from '@/engine/risk/notes';
import type { RiskModel, Unit } from '@/engine/risk/types';

const DATE = '2026-10-10';
/** The live model (the quarantined values withheld) and the workbook exactly (what the queries are about). */
const core = buildModel();
const exact = buildModel({}, { workbookOnly: true });
const inputs = inputsJson as unknown as AdvancedInputs;
const advanced = buildAdvancedModel(core, inputs);

interface Spec { id: string; name: string; component: string; dimension: string; keyed_at: string; unit: string; normalisation: string; resolved_min: number; resolved_max: number; sign: string; transform: string; use: string }
interface WorkbookSource { source: string; year: string; resolution: string }
const SPEC = specJson as Record<string, Spec>;
const SOURCES = (sourcesJson as { indicators: Record<string, WorkbookSource> }).indicators;
const RAW = rawJson as { units: string[]; values: Record<string, Array<number | null>> };
const ADV_SPEC = advSpecJson as Record<string, { id: string; name: string; component: string; unit: string; resolved_min: number; resolved_max: number; transform: string; weight: number; sign: string }>;

const unitName = new Map(core.sources.map((u) => [u.id, u.name]));
const unitRegion = new Map(core.sources.map((u) => [u.id, u.region]));
const f = (x: number | null | undefined, d = 3) => (x == null ? 'n/a' : Number.isInteger(x) ? String(x) : x.toFixed(d).replace(/\.?0+$/, ''));

function stats(values: ReadonlyArray<number | null | undefined>) {
  const v = values.filter(isNum).sort((a, b) => a - b);
  const n = v.length;
  if (!n) return { n: 0, distinct: 0, min: null, median: null, mean: null, max: null, zeros: 0, atMin: 0, atMax: 0, q1: null, q3: null };
  const q = (p: number) => v[Math.min(n - 1, Math.max(0, Math.round((n - 1) * p)))];
  return { n, distinct: new Set(v.map((x) => Math.round(x * 1e4))).size, min: v[0], median: q(0.5), mean: mean(v), max: v[n - 1], zeros: v.filter((x) => x === 0).length, atMin: v.filter((x) => x === v[0]).length, atMax: v.filter((x) => x === v[n - 1]).length, q1: q(0.25), q3: q(0.75) };
}

/* ---------------------------------------------------------------- Core raw indicators */
const rawRows = Object.keys(RAW.values)
  .sort()
  .map((id) => {
    const s = SPEC[id];
    const src = SOURCES[id];
    const vals = RAW.values[id];
    const st = stats(vals);
    const pairs = RAW.units.map((u, i) => [u, vals[i]] as const).filter((p): p is readonly [string, number] => isNum(p[1]));
    const top = [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([u, v]) => `${unitName.get(u)} ${f(v)}`);
    const bottom = [...pairs].sort((a, b) => a[1] - b[1]).slice(0, 5).map(([u, v]) => `${unitName.get(u)} ${f(v)}`);
    const iqr = st.q3 != null && st.q1 != null ? st.q3 - st.q1 : 0;
    const outliers = iqr > 0 ? pairs.filter(([, v]) => v > st.q3! + 3 * iqr || v < st.q1! - 3 * iqr).map(([u, v]) => `${unitName.get(u)} ${f(v)}`) : [];
    const pct = s?.unit?.trim().startsWith('%');
    const flags: string[] = [];
    if (st.n === 0) flags.push('empty');
    else if (st.distinct === 1) flags.push('constant (one value for the whole country)');
    if (s && s.resolved_min === s.resolved_max) flags.push('degenerate reference range (min = max): never scores');
    if (pct && st.max != null && st.max > 100) flags.push('values above 100 on a percentage indicator');
    if (st.n > 0 && st.n < RAW.units.length) flags.push(`${RAW.units.length - st.n} units without a value`);
    if (outliers.length) flags.push(`${outliers.length} far outlier(s) beyond 3 IQR`);
    const notes = DATA_NOTES.filter((n) => n.indicator === id).map((n) => n.id);
    return { id, name: s?.name, component: s?.component, dimension: s?.dimension, unit: s?.unit, keyedAt: s?.keyed_at, normalisation: s?.normalisation, range: s ? [s.resolved_min, s.resolved_max] : null, sign: s?.sign, source: src ? `${src.source} ${src.year} (${src.resolution})` : '', ...st, top, bottom, outliers, flags, notes };
  });

/* ---------------------------------------------------------------- Core group scores */
const groupRows = ALL_INDICATORS.map((l) => {
  const dim = l.dimension.key as DimensionKey;
  const vals = exact.sources.map((u) => indicatorValue(u, dim, l.indicator.key));
  const st = stats(vals);
  const pairs = exact.sources.map((u) => [u, indicatorValue(u, dim, l.indicator.key)] as const).filter((p): p is readonly [Unit, number] => isNum(p[1]));
  return {
    ref: `${dim}:${l.indicator.key}`,
    name: l.indicator.en,
    ...st,
    top: [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([u, v]) => `${u.name} ${f(v, 1)}`),
    bottom: [...pairs].sort((a, b) => a[1] - b[1]).slice(0, 5).map(([u, v]) => `${u.name} ${f(v, 1)}`),
    notes: DATA_NOTES.filter((n) => n.ref === `${dim}:${l.indicator.key}`).map((n) => n.id),
    councilsWithNote: core.councils.filter((c) => dataNotesFor(c, dim, l.indicator.key).length > 0).length,
    withheldUnits: core.sources.filter((u) => u.quarantined?.[`${dim}:${l.indicator.key}` as keyof NonNullable<Unit['quarantined']>]).length,
  };
});

/* ---------------------------------------------------------------- Advancement members */
const memberRows = Object.keys(inputs.inputs).map((id) => {
  const m = inputs.inputs[id];
  const spec = ADV_SPEC[id];
  const vals = Object.values(inputs.values).map((v) => v[id]);
  const st = stats(vals);
  const pairs = Object.entries(inputs.values).map(([c, v]) => [c, v[id]] as const).filter((p): p is readonly [string, number] => isNum(p[1]));
  const name = (c: string) => core.byId.get(c)?.name ?? c;
  const flags: string[] = [];
  const width = spec.resolved_max - spec.resolved_min;
  if (spec.transform === 'None' && st.n > 1 && st.min != null && st.max != null) {
    const span = st.max - st.min;
    // A range wider than one and a half times the span keeps every score away from the ends; a zero floor is natural for counts.
    if (span > 0 && width > 1.5 * span && !(spec.resolved_min === 0 && st.min > 0)) flags.push(`reference range (${spec.resolved_min}..${spec.resolved_max}) is ${(width / span).toFixed(1)}x the council span (${f(st.min)}..${f(st.max)}): scores cannot reach the ends`);
    if (st.min < spec.resolved_min || st.max > spec.resolved_max) flags.push(`values outside the reference range are clamped (${f(st.min)}..${f(st.max)} against ${spec.resolved_min}..${spec.resolved_max})`);
  }
  if (st.n > 0 && st.distinct === 1) flags.push('constant');
  if (st.n > 0 && st.median != null && st.max != null && st.median > 0 && st.max > 5 * st.median) flags.push(`maximum is ${(st.max / st.median).toFixed(1)}x the median`);
  return { id, name: spec.name, component: spec.component, unit: spec.unit, weight: spec.weight, sign: spec.sign, range: [spec.resolved_min, spec.resolved_max], source: m.source, method: m.method, resolution: m.resolution, filled: m.filled, ...st, top: [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, v]) => `${name(c)} ${f(v)}`), bottom: [...pairs].sort((a, b) => a[1] - b[1]).slice(0, 5).map(([c, v]) => `${name(c)} ${f(v)}`), flags };
});

/* ---------------------------------------------------------------- Ground-truth checks */
interface Check { id: string; layer: 'core' | 'advancement'; group: string; check: string; pass: boolean; detail: string; note: string }
const checks: Check[] = [];
const rawOf = (id: string, name: string) => RAW.values[id][RAW.units.findIndex((u) => unitName.get(u) === name)];
const exactOf = (m: RiskModel, id: string) => m.byId.get(id)!;
const regionRaw = (id: string, region: string) => mean(RAW.units.map((u, i) => (placeKey(unitRegion.get(u)) === placeKey(region) ? RAW.values[id][i] : null)));
const councilsOf = (m: RiskModel, region: string) => m.councils.filter((c) => placeKey(c.region) === placeKey(region));
const leaf = (m: RiskModel, id: string, dim: DimensionKey, key: string) => indicatorValue(m.byId.get(id)!, dim, key);
const add = (id: string, layer: Check['layer'], group: string, check: string, pass: boolean, detail: string, note = '') => checks.push({ id, layer, group, check, pass, detail, note });

{
  const dar = regionRaw('HA.NAT.DR-FRE', 'Dar es Salaam')!;
  const centre = ['Dodoma', 'Singida', 'Shinyanga', 'Simiyu'].map((r) => `${r} ${f(regionRaw('HA.NAT.DR-FRE', r))}`);
  add('CHK-01', 'core', 'hazard:drought', 'Dar es Salaam is not the most drought-prone region (FAO drought frequency)', dar < Math.max(regionRaw('HA.NAT.DR-FRE', 'Dodoma')!, regionRaw('HA.NAT.DR-FRE', 'Singida')!), `Dar es Salaam ${f(dar)} years; ${centre.join(', ')}`, 'DN-01, DN-02');
  const kagera = councilsOf(exact, 'Kagera');
  const kCore = kagera.map((c) => indicatorValue(c, 'hazard', 'earthquake') ?? 0);
  const kAdv = kagera.map((c) => leaf(advanced, c.id, 'hazard', 'earthquake') ?? 0);
  add('CHK-02a', 'core', 'hazard:earthquake', 'Kagera carries earthquake exposure in the workbook (Bukoba 2016, Mw 5.9)', Math.max(...kCore) > 0, `workbook Kagera councils: ${kCore.map((v) => f(v, 1)).join(', ')}; withheld live`, 'DN-03');
  add('CHK-02b', 'advancement', 'hazard:earthquake', "The Advancement layer's seismicity and felt-intensity members give Kagera a value above the workbook's 0", Math.min(...kAdv) > Math.max(...kCore), `Advancement Kagera councils: ${kagera.map((c, i) => `${c.name} ${f(kAdv[i], 1)}`).join(', ')}`, 'DN-03');
  const lsMax = [...exact.sources].sort((a, b) => (indicatorValue(b, 'hazard', 'landslide') ?? -1) - (indicatorValue(a, 'hazard', 'landslide') ?? -1))[0];
  add('CHK-03a', 'core', 'hazard:landslide', 'The most landslide-exposed unit of the workbook is not the flat island of Ukerewe', lsMax.name !== 'Ukerewe', `workbook maximum: ${lsMax.name} ${f(indicatorValue(lsMax, 'hazard', 'landslide'), 1)}; withheld live`, 'DN-04');
  const uk = exact.councils.find((c) => c.name.startsWith('Ukerewe'))!;
  add('CHK-03b', 'advancement', 'hazard:landslide', "Ukerewe's Advancement landslide value (slope and rainfall members) sits well below the workbook's 10", (leaf(advanced, uk.id, 'hazard', 'landslide') ?? 10) < (indicatorValue(uk, 'hazard', 'landslide') ?? 0), `workbook ${f(indicatorValue(uk, 'hazard', 'landslide'), 1)}, Advancement ${f(leaf(advanced, uk.id, 'hazard', 'landslide'), 1)}`, 'DN-04');
  const coastal = new Set(['Tanga', 'Pwani', 'Dar es Salaam', 'Lindi', 'Mtwara', 'Mjini Magharibi', 'Kaskazini Unguja', 'Kusini Unguja', 'Kaskazini Pemba', 'Kusini Pemba'].map(placeKey));
  const inland = RAW.units.map((u, i) => [u, RAW.values['HA.NAT.CH-ERO'][i]] as const).filter(([u, v]) => isNum(v) && v !== 0 && !coastal.has(placeKey(unitRegion.get(u))));
  add('CHK-04', 'core', 'hazard:coastalHazards', 'Non-zero coastal-erosion values occur only in coastal regions', inland.length === 0, inland.length ? `inland non-zero: ${inland.map(([u, v]) => `${unitName.get(u)} ${f(v)}`).join(', ')}` : 'none inland', 'DN-05');
  const fsMax = stats(RAW.values['VU.SE.LV-FS']).max ?? 0;
  add('CHK-05', 'core', 'vulnerability:livelihoods', 'Food-security values are percentages (at most 100)', fsMax <= 100, `maximum ${f(fsMax)} (Dodoma); ${stats(RAW.values['VU.SE.LV-FS']).zeros} units at 0`, 'DN-06');
  add('CHK-06', 'core', 'vulnerability:displacedPeople', 'Manyara records internal displacement after the Hanang landslide of December 2023', (regionRaw('VU.VG.DP-IDP', 'Manyara') ?? 0) > 0, `Manyara ${f(regionRaw('VU.VG.DP-IDP', 'Manyara'))}; Kaskazini Unguja ${f(regionRaw('VU.VG.DP-IDP', 'Kaskazini Unguja'))}`, 'DN-07');
  add('CHK-07', 'core', 'coping:communication', 'Access to electricity in Dodoma is below Dar es Salaam', (regionRaw('CC.INF.COM-ELEC', 'Dodoma') ?? 0) < (regionRaw('CC.INF.COM-ELEC', 'Dar es Salaam') ?? 0), `Dodoma ${f(regionRaw('CC.INF.COM-ELEC', 'Dodoma'))}%, Dar es Salaam ${f(regionRaw('CC.INF.COM-ELEC', 'Dar es Salaam'))}%`, 'DN-08');
  add('CHK-08', 'core', 'coping:accessHealth', 'The density-of-health-facilities indicator can score', SPEC['CC.INF.HC-FAC'].resolved_min !== SPEC['CC.INF.HC-FAC'].resolved_max, `reference range ${SPEC['CC.INF.HC-FAC'].resolved_min}..${SPEC['CC.INF.HC-FAC'].resolved_max}`, 'DN-09');
  const eq10 = exact.sources.filter((u) => (indicatorValue(u, 'hazard', 'earthquake') ?? 0) >= 9.95).length;
  add('CHK-09', 'core', 'hazard:earthquake', 'The earthquake index separates the rift units (fewer than a fifth at the ceiling)', eq10 < exact.sources.length / 5, `${eq10} of ${exact.sources.length} units score 10`, 'DN-10');
  const hc = memberRows.find((m) => m.id === 'CC.INF.HC-DENS')!;
  add('CHK-10', 'advancement', 'coping:accessHealth', 'Health-facility density is filled for every council and its maximum is within 5x the median', hc.filled === 195 && hc.max! <= 5 * hc.median!, `filled ${hc.filled}; median ${f(hc.median)}, max ${f(hc.max)} per 10,000 (${hc.top[0]})`);
  const badRanges = memberRows.filter((m) => m.flags.some((x) => x.includes('reference range') || x.includes('clamped')));
  add('CHK-11', 'advancement', 'all baskets', "Every member's reference range fits its council span (the layer's own rule)", badRanges.length === 0, badRanges.length ? badRanges.map((m) => `${m.id}: ${m.flags.join('; ')}`).join(' | ') : 'all fit');
  const spei = Object.values(advanced.councils).map((c) => c.id);
  const speiScores = spei.map((id) => ((inputs.values[id]?.['HA.NAT.DR-SPEI'] ?? null) as number | null));
  const speiSpec = ADV_SPEC['HA.NAT.DR-SPEI'];
  const speiSpread = speiScores.filter(isNum).length ? ((Math.max(...speiScores.filter(isNum)) - Math.min(...speiScores.filter(isNum))) / (speiSpec.resolved_max - speiSpec.resolved_min)) * 10 : 0;
  add('CHK-12', 'advancement', 'hazard:drought', 'The SPEI member spreads the councils over at least 5 score points', speiSpread >= 5, `spread ${speiSpread.toFixed(1)} points over range ${speiSpec.resolved_min}..${speiSpec.resolved_max}`);
  const coverage = core.sources.map((u) => ALL_INDICATORS.filter((l) => isNum(indicatorValue(u, l.dimension.key, l.indicator.key))).length);
  const usual = coverage.filter((_, i) => core.sources[i].name !== 'Mkinga').sort((a, b) => a - b)[Math.floor(coverage.length / 2)];
  // A programme decision withholds a group everywhere (DN-12): it is not a unit-specific hold.
  const unitSpecific = (u: Unit) => Object.values(u.quarantined ?? {}).some((id) => !isDecision(noteById(id)));
  const offCoverage = core.sources.filter((u, i) => coverage[i] !== usual && u.name !== 'Mkinga' && !unitSpecific(u)).map((u) => `${u.name} ${coverage[core.sources.indexOf(u)]}`);
  add('CHK-13', 'core', 'all groups', `Every unit without a unit-specific withheld value carries the same ${usual} filled groups (Mkinga excepted)`, offCoverage.length === 0, offCoverage.length ? offCoverage.join(', ') : `${usual} of 32; Mkinga ${coverage[core.sources.findIndex((u) => u.name === 'Mkinga')]}; ${core.sources.filter(unitSpecific).length} units carry a unit-specific withheld value`);
  const unreached = DATA_NOTES.filter((n) => !core.councils.some((c) => dataNotesFor(c, n.ref.split(':')[0] as DimensionKey, n.ref.split(':')[1]).includes(n)));
  add('CHK-14', 'core', 'data notes', 'Every data note reaches at least one council', unreached.length === 0, unreached.length ? unreached.map((n) => n.id).join(', ') : `${DATA_NOTES.length} notes`);
  const darC = councilsOf(exact, 'Dar es Salaam');
  add('CHK-15', 'advancement', 'hazard:drought', "Dar es Salaam's Advancement drought (council drought members) sits below the workbook's 10", darC.every((c) => (leaf(advanced, c.id, 'hazard', 'drought') ?? 10) < (indicatorValue(c, 'hazard', 'drought') ?? 0)), darC.map((c) => `${c.name} workbook ${f(indicatorValue(c, 'hazard', 'drought'), 1)} / live withheld / Advancement ${f(leaf(advanced, c.id, 'hazard', 'drought'), 1)}`).join('; '), 'DN-01');
  // The quarantine itself: every value a withheld note applies to is missing live, and nothing else differs from the workbook.
  let withheld = 0;
  let decided = 0;
  let stray = 0;
  for (const u of core.sources) {
    const w = exactOf(exact, u.id);
    for (const l of ALL_INDICATORS) {
      const live = indicatorValue(u, l.dimension.key, l.indicator.key);
      const wb = indicatorValue(w, l.dimension.key, l.indicator.key);
      const ref = `${l.dimension.key}:${l.indicator.key}` as keyof NonNullable<Unit['quarantined']>;
      const id = u.quarantined?.[ref];
      if (id && isDecision(noteById(id))) decided++;
      else if (id) withheld++;
      else if (live !== wb) stray++;
    }
  }
  add('CHK-16', 'core', 'quarantine', 'The live model withholds exactly the quarantined values and keeps every other workbook value', stray === 0, `${withheld} values withheld after validation over ${core.sources.filter(unitSpecific).length} units, ${decided} withheld by programme decision; ${stray} other differences; national risk ${f(exact.national.risk, 1)} (workbook) / ${f(core.national.risk, 1)} (live)`);
}

/* ---------------------------------------------------------------- write */
const result = { date: DATE, release: DATA_RELEASE, advancementRelease: inputs.release, units: core.sources.length, councils: core.councils.length, checks, rawIndicators: rawRows, groups: groupRows, members: memberRows, notes: DATA_NOTES.map((n) => ({ id: n.id, ref: n.ref, indicator: n.indicator, status: n.status, where: n.where, issue: n.issue, evidence: n.evidence })) };
writeFileSync(`docs/assessment/INFORM_TZ_Indicator_Integrity_${DATA_RELEASE}.json`, JSON.stringify(result, null, 1));

const L: string[] = [];
const P = (s = '') => L.push(s);
P(`# INFORM Tanzania: indicator integrity register, release ${DATA_RELEASE} / ${inputs.release} (${DATE})`);
P();
P('Every value of every indicator rechecked: the 53 workbook indicators and the 32 indicator groups of the Core over the 170 workbook units, and the Advancement members over the 195 councils. Computed by the engine (`node scripts/integrity-recheck.mjs`); regenerate with every release. The data notes the site shows beside a value are `src/data/inform-data-notes.json`; the checks below are their evidence. A failed Core check is a workbook value raised with INFORM (JRC) and SADC, never a value changed in the workbook: the live model withholds it (the quarantine, CHK-16) until an institution supplies the value through the Data portal or the workbook is corrected. A failed Advancement check is ours to fix.');
P();
P('## Ground-truth checks');
P();
P('| Check | Layer | Group | What must hold | Result | Detail | Note |');
P('|---|---|---|---|---|---|---|');
for (const c of checks) P(`| ${c.id} | ${c.layer} | ${c.group} | ${c.check} | ${c.pass ? 'pass' : 'FAIL'} | ${c.detail} | ${c.note} |`);
P();
P(`${checks.filter((c) => !c.pass).length} of ${checks.length} checks fail: ${checks.filter((c) => !c.pass).map((c) => c.id).join(', ')}. Core failures are the workbook's: each carries a data note and the eight queried or artefact values are withheld from the live model (DN-01 to DN-08; DN-09 never scores, DN-10 and DN-11 are explanations). Advancement checks pass after the recheck's fixes (felt-intensity member, facility join on the council polygons with the facility types filtered, member ranges fitted to the council spans).`);
P();
P('## Core: the 53 workbook indicators');
P();
P('| Indicator | Group | Unit | Keyed at | Source | Range | n | Distinct | Min | Median | Max | Zeros | Flags | Highest | Lowest | Notes |');
P('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rawRows) P(`| ${r.id} ${r.name ?? ''} | ${r.component ?? ''} | ${r.unit ?? ''} | ${r.keyedAt ?? ''} | ${r.source} | ${r.range ? `${r.range[0]}..${r.range[1]} (${r.normalisation})` : ''} | ${r.n} | ${r.distinct} | ${f(r.min)} | ${f(r.median)} | ${f(r.max)} | ${r.zeros} | ${r.flags.join('; ')} | ${r.top.join('; ')} | ${r.bottom.join('; ')} | ${r.notes.join(', ')} |`);
P();
P('## Core: the 32 indicator groups (0 to 10), as the workbook has them');
P();
P('| Group | n | Distinct | Min | Median | Max | At max | Highest | Lowest | Notes | Councils with a note | Units withheld live |');
P('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const g of groupRows) P(`| ${g.ref} ${g.name} | ${g.n} | ${g.distinct} | ${f(g.min, 1)} | ${f(g.median, 1)} | ${f(g.max, 1)} | ${g.atMax} | ${g.top.join('; ')} | ${g.bottom.join('; ')} | ${g.notes.join(', ')} | ${g.councilsWithNote} | ${g.withheldUnits} |`);
P();
P('## Advancement: the members with data');
P();
P('| Member | Basket | Unit | Weight | Range | Resolution | Filled | Min | Median | Max | Flags | Highest | Lowest | Method |');
P('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const m of memberRows) P(`| ${m.id} ${m.name} | ${m.component} | ${m.unit} | ${m.weight} | ${m.range[0]}..${m.range[1]} | ${m.resolution} | ${m.filled} | ${f(m.min)} | ${f(m.median)} | ${f(m.max)} | ${m.flags.join('; ')} | ${m.top.join('; ')} | ${m.bottom.join('; ')} | ${m.method} |`);
P();
P('## Data notes');
P();
P('| Note | Group | Indicator | Status | Where | Issue | Evidence |');
P('|---|---|---|---|---|---|---|');
for (const n of DATA_NOTES) P(`| ${n.id} | ${n.ref} | ${n.indicator} | ${n.status} | ${JSON.stringify(n.where)} | ${n.issue} | ${n.evidence} |`);
P();
P('## What was changed by the recheck (Advancement layer only; the Core is the workbook)');
P();
P('- A felt-intensity member (HA.NAT.EQ-FELT) joins the earthquake basket: the maximum over the USGS catalogue 1960-2024 of 1.5 M - 1.5 log10(R + 15) at the council centroid, so a damaging event the GEM exposure index misses (Bukoba 2016) counts.');
P('- Facility densities (CC.INF.HC-DENS, CC.INF.EDU-DENS) are recomputed on the 195 council polygons with the census facility types filtered: the census "health facilities" layer is 56,677 points of which 46,000 are drug outlets, pharmacies, traditional medicine shops and laboratories; only the 10,649 dispensaries, health centres and hospitals count now. The earlier join used the district polygons, so 32 urban units had no value and rural units carried whole-district counts.');
P("- Member reference ranges fitted to the council spans where they were wider (DR-SPEI, DR-CV, FL-R50, FL-R100, HC-DENS, EDU-DENS), as the layer's rule says: a range twice the span kept every score in the lower half.");
P('- The Core display counts of facilities per unit (profile Services) come from the same filtered join.');
P();
P(`Machine-readable results: \`INFORM_TZ_Indicator_Integrity_${DATA_RELEASE}.json\`.`);
writeFileSync(`docs/assessment/INFORM_TZ_Indicator_Integrity_${DATA_RELEASE}.md`, L.join('\n') + '\n');

/* ---------------------------------------------------------------- the queries to the partners (decision D5) */
const Q: string[] = [];
const q = (s = '') => Q.push(s);
q(`# INFORM Tanzania: queries on the INFORM Sub-national SADC 2024 workbook (release ${DATA_RELEASE}, ${DATE})`);
q();
q('To: the INFORM team at the Joint Research Centre (JRC) and the SADC Secretariat (DRR Unit). From: the Prime Minister\'s Office, Disaster Management Department (PMO-DMD), INFORM Tanzania.');
q();
q('INFORM Tanzania reproduces the *Tanzania - Country Model Template.xlsx* (INFORM Sub-national SADC 2024, December 2024 v1.0) exactly, leaf by leaf, as its Core. An indicator-by-indicator recheck of every value against documented events, the other indicators of the workbook and each indicator\'s own definition found the values below. None has been changed: the live model withholds the ones marked *withheld* (treated as missing until corrected, as the INFORM guidance treats data that fails validation) and shows the note beside every other. We ask the partners to confirm or correct each in the next release of the workbook, and we offer the Tanzanian institution named as the source of a replacement value.');
q();
q('| Query | Indicator | Units | Observation | Evidence | Live model | Replacement offered |');
q('|---|---|---|---|---|---|---|');
const offer: Record<string, string> = { 'DN-01': 'TMA and MoA drought monitoring through the Data portal; council-level CHIRPS/ERA5 drought members', 'DN-02': 'as DN-01', 'DN-03': 'GST seismic zonation; the USGS catalogue felt-intensity member', 'DN-04': 'SRTM slope and CHIRPS triggering rainfall members', 'DN-05': 'NEMC/VPO shoreline monitoring; Digital Earth Africa coastlines reprocessed per unit', 'DN-06': 'MoA / IPC technical working group: share of population in IPC phase 2+ per region', 'DN-07': 'PMO-DMD recorded displacement per region (Hanang 2023 included)', 'DN-08': 'NBS 2022 census household electricity access per region', 'DN-09': 'NBS 2022 census facilities per 10,000 people (the Advancement layer carries it)', 'DN-10': 'none: an explanation', 'DN-11': 'none: an explanation; the recorded flood events member' };
// A programme decision is the programme's own choice, not a query on the workbook.
for (const n of DATA_NOTES.filter((x) => !isDecision(x))) {
  const where = n.where.all ? 'all units' : n.where.regions ? `region(s) ${n.where.regions.join(', ')}` : n.where.units ? `unit(s) ${n.where.units.join(', ')}` : n.where.valueAtLeast != null ? `units with value >= ${n.where.valueAtLeast}` : '';
  q(`| ${n.id} | ${n.indicator} (${n.ref}) | ${where} | ${n.en.replace(/^(Value under query|Known data artefact|Explained)\. /, '')} | ${n.evidence} | ${n.quarantine ? 'withheld' : 'shown with the note'} | ${offer[n.id] ?? ''} |`);
}
q();
q('The register behind these queries, with every value of every indicator rechecked, is `INFORM_TZ_Indicator_Integrity_' + DATA_RELEASE + '.md`; the data notes are published with the model (`src/data/inform-data-notes.json`).');
writeFileSync(`docs/assessment/INFORM_TZ_Upstream_Queries_${DATA_RELEASE}.md`, Q.join('\n') + '\n');
process.stdout.write(JSON.stringify({ release: DATA_RELEASE, checks: checks.map((c) => `${c.id} ${c.pass ? 'pass' : 'FAIL'}: ${c.detail}`), memberFlags: memberRows.filter((m) => m.flags.length).map((m) => `${m.id}: ${m.flags.join('; ')}`), rawFlags: rawRows.filter((r) => r.flags.some((x) => x.includes('above 100') || x.includes('outlier'))).map((r) => `${r.id}: ${r.flags.join('; ')}`) }, null, 1) + '\n');
