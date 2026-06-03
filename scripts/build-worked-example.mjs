/**
 * build-worked-example.mjs — generate the WORKED-EXAMPLE tables from the REAL shipped data, so the
 * documentation's example can never drift from what the app computes. Uses Rufiji (Pwani) — a
 * documented flood district — for the full indicator→risk chain, Kibiti (its split council) for the
 * council-level refinement, and Pwani for the region harmonisation.
 *
 * out: docs/worked_example_indicators.csv  (every indicator: raw → standardisation → 0-10 → aggregation)
 *      docs/worked_example_levels.csv       (council → district → region → national harmonisation)
 */
import fs from 'fs';
const ROOT = new URL('..', import.meta.url).pathname;
const J = (p) => JSON.parse(fs.readFileSync(ROOT + p, 'utf8'));
const readCsv = (p) => { const l = fs.readFileSync(ROOT + p, 'utf8').trim().split('\n'); const h = l[0].split(','); return l.slice(1).map((x) => { const c = x.split(','); const o = {}; h.forEach((k, i) => (o[k] = c[i])); return o; }); };
const risk = J('src/data/tanzania-inform-risk.json'), cou = J('src/data/tanzania-councils.json'), cd = J('src/data/tanzania-councils-data.json');
const D = risk.subnational.adm2; const byName = (n) => D.find((d) => d.admin.adm2Name.toLowerCase().replace(/[^a-z]/g, '') === n.toLowerCase().replace(/[^a-z]/g, ''));
const isN = (x) => typeof x === 'number' && isFinite(x);
const r2 = (x) => (isN(x) ? Math.round(x * 100) / 100 : '');
const mean = (a) => { const v = a.filter(isN); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const sgm = (a) => { const v = a.filter(isN); if (!v.length) return null; const sc = v.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.pow(sc.reduce((p, x) => p * x, 1), 1 / sc.length)) / 9 * 10; };

const ru = byName('Rufiji');
const droughtRaw = readCsv('data-source/chirps_drought_spi_spei.csv').find((r) => /rufiji/i.test(r.dist_name)) || {};
const floods = readCsv('data-source/flood_events.csv').filter((r) => /rufiji/i.test(r.dist_name)).map((r) => r.year).join('; ');
const kibitiClim = readCsv('data-source/council_climate.csv').find((r) => /kibiti/i.test(r.council)) || {};
const kFeat = cou.features.find((f) => /kibiti/i.test(f.properties.name));
const kib = cd[kFeat.properties.code];

// ---- indicator table: dimension, category, indicator, raw value, source, standardisation, value 0-10
const SRC = {
  drought: [`mean annual rain ${droughtRaw.mean_annual_rain} mm; season-fail freq ${droughtRaw.season_fail_freq}; SPEI sev ${droughtRaw.spei_severity}`, 'CHIRPS v3 (1991-2024) + ERA5 t2m', 'blend(0.30 aridity + 0.20 variability + 0.15 SPEI-depth + 0.35 season-fail), min-max 0-10'],
  flood: [`documented floods ${floods}; heavy-rain days/yr ${kibitiClim.heavy_days_yr || 'n/a'}`, 'DesInventar/PMO-DMD + CHIRPS daily', 'max(documented floor, heavy-rain) then Hazard×Exposure = max(H, sqrt(H*E))'],
  heatwave: ['hottest-quarter & mean temperature', 'ERA5 t2m', 'min-max of (0.5 mean-temp + 0.5 hot-quarter) x 6.5'],
  coastalHazards: ['coastal exposure (delta/shoreline)', 'INFORM SADC + documented', 'standardised 0-10'],
  earthquake: ['Rift-valley seismicity', 'INFORM SADC (USGS basis)', 'standardised 0-10'],
  landslide: ['rainfall-triggered slope failure', 'INFORM SADC', 'standardised 0-10'],
  stormsCyclone: ['tropical cyclone exposure (coast)', 'documented (Hidaya etc.) + INFORM', 'standardised 0-10'],
  wildfire: ['fire-prone miombo', 'INFORM SADC', 'standardised 0-10'],
  lightning: ['lightning density', 'INFORM SADC', 'standardised 0-10'],
  environmentalDegradation: ['land degradation', 'INFORM SADC', 'standardised 0-10'],
  volcano: ['volcanic exposure', 'INFORM SADC', 'standardised 0-10'],
  zoonoses: ['pests/plant/animal disease', 'INFORM SADC', 'standardised 0-10 (null = no data)'],
  conflictIntensity: ['national conflict intensity', 'INFORM (ACLED/UCDP, national)', 'country value applied to all units'],
  conflictRisk: ['national conflict risk', 'INFORM (national)', 'country value applied to all units'],
  hazardousMaterial: ['industrial/mining sites', 'documented (null where none)', 'standardised 0-10'],
  internalViolence: ['internal violence', 'INFORM SADC', 'standardised 0-10'],
  vehicleAccidents: ['road-accident exposure (highways)', 'documented (null where none)', 'standardised 0-10'],
  developmentPoverty: ['basic-needs poverty rate', 'NBS Household Budget Survey', 'standardised 0-10'],
  economicDependency: ['economic dependency ratio', 'NBS census age structure', 'standardised 0-10'],
  habitat: ['housing quality / informal settlement', 'NBS 2022 census', 'standardised 0-10'],
  livelihoods: ['food insecurity (IPC phase)', 'IPC / MUCHALI', 'standardised 0-10 (0 = no IPC classification)'],
  displacedPeople: ['refugees / displaced', 'UNHCR / PMO', '(refugees / max)^0.4 x 10'],
  healthConditions: ['HIV + malaria burden', 'TACAIDS / NMCP (regional)', 'min-max(0.5 HIV + 0.5 malaria) x 10'],
  childrenHealthNutrition: ['under-5 stunting', 'TDHS 2022', 'standardised 0-10'],
  economic: ['economic vulnerability', 'no INFORM value', 'null = excluded from the mean'],
  accessHealth: ['health-facility access', 'NBS 2022 census (PHC)', 'inverted facility density, 0-10'],
  economicCapacity: ['economic capacity', 'INFORM SADC', 'standardised 0-10'],
  wash: ['water & sanitation access', 'NBS 2022 census water points', 'inverted access, 0-10'],
  communication: ['communication infrastructure', 'INFORM SADC / census ICT', 'standardised 0-10'],
  education: ['education access', 'NBS 2022 census schools', 'inverted access, 0-10'],
  drrImplementation: ['DRR plans/EOCC/EPRP in place', 'PMO-DMD / DRR Coordinator', 'inverted capacity, 0-10'],
  governance: ['institutional capacity', 'INFORM SADC', 'standardised 0-10'],
};
const TREE = [
  ['Hazard & Exposure', 'Natural hazards', ru.hazardExposure.natural, ['drought', 'flood', 'earthquake', 'landslide', 'wildfire', 'stormsCyclone', 'coastalHazards', 'heatwave', 'lightning', 'environmentalDegradation', 'volcano', 'zoonoses']],
  ['Hazard & Exposure', 'Human hazards', ru.hazardExposure.human, ['conflictIntensity', 'conflictRisk', 'hazardousMaterial', 'internalViolence', 'vehicleAccidents']],
  ['Vulnerability', 'Socio-economic', ru.vulnerability.socioEconomic, ['developmentPoverty', 'economicDependency', 'habitat', 'livelihoods']],
  ['Vulnerability', 'Vulnerable groups', ru.vulnerability.vulnerableGroups, ['displacedPeople', 'healthConditions', 'childrenHealthNutrition', 'economic']],
  ['Lack of Coping Capacity', 'Infrastructure', ru.lackCopingCapacity.infrastructure, ['accessHealth', 'economicCapacity', 'wash', 'communication', 'education']],
  ['Lack of Coping Capacity', 'Institutional', ru.lackCopingCapacity.institutional, ['drrImplementation', 'governance']],
];
const rows = [['stage', 'dimension', 'category', 'indicator', 'raw_value_or_basis', 'source', 'standardisation_to_0_10', 'value_0_10']];
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
for (const [dim, cat, obj, keys] of TREE) {
  for (const k of keys) {
    const [raw, src, std] = SRC[k] || ['', '', 'standardised 0-10'];
    rows.push(['1 indicator', dim, cat, k, raw, src, std, obj[k] == null ? 'null (no data)' : r2(obj[k])].map(q));
  }
  rows.push(['2 category = MEAN of indicators', dim, cat, 'CATEGORY AGGREGATE', '', '', 'arithmetic mean of the non-null indicators above', r2(obj.aggregate)].map(q));
}
// exposure row (the E in H x E)
rows.push(['1 exposure (E)', 'Hazard & Exposure', 'Exposure', 'population density', `pop ${ru.hazardExposure.exposure?.population?.toLocaleString?.() || ru.hazardExposure.exposure?.population} / area`, 'NBS 2022 PHC council population', 'log min-max of (population / area)', r2(ru.hazardExposure.exposure?.index)].map(q));
// dimension totals
rows.push(['3 dimension = scaled GEOMEAN of categories', 'Hazard & Exposure', '', 'HAZARD & EXPOSURE total', '', '', 'sgm(Natural, Human) = (10 - GEOMEAN((10-cat)/10*9+1))/9*10', r2(ru.hazardExposure.total)].map(q));
rows.push(['3 dimension = scaled GEOMEAN of categories', 'Vulnerability', '', 'VULNERABILITY total', '', '', 'sgm(Socio-economic, Vulnerable groups)', r2(ru.vulnerability.total)].map(q));
rows.push(['3 dimension = scaled GEOMEAN of categories', 'Lack of Coping Capacity', '', 'LACK OF COPING total', '', '', 'sgm(Infrastructure, Institutional)', r2(ru.lackCopingCapacity.total)].map(q));
rows.push(['4 risk = cube root of the three', 'Risk', '', 'INFORM RISK', '', '', 'risk = (H x V x LCC)^(1/3)', r2(ru.risk)].map(q));
fs.writeFileSync(ROOT + 'docs/worked_example_indicators.csv', rows.map((r) => r.join(',')).join('\n'));

// ---- levels harmonisation table
const pwReg = D.filter((d) => d.admin.adm1Name === 'Pwani');
const regAgg = (sel) => mean(pwReg.map(sel));
const regH = r2(sgm([regAgg((d) => d.hazardExposure.natural.aggregate), regAgg((d) => d.hazardExposure.human.aggregate)]));
const regV = r2(sgm([regAgg((d) => d.vulnerability.socioEconomic.aggregate), regAgg((d) => d.vulnerability.vulnerableGroups.aggregate)]));
const regC = r2(sgm([regAgg((d) => d.lackCopingCapacity.infrastructure.aggregate), regAgg((d) => d.lackCopingCapacity.institutional.aggregate)]));
const lvl = [['level', 'unit', 'how_it_is_built', 'Hazard&Exposure', 'Vulnerability', 'LackOfCoping', 'risk_cbrt']];
lvl.push(['council (195)', 'Kibiti', 'Hazard computed on Kibiti polygon (raise-only vs district); Vuln & Coping = Rufiji district', r2(kib.hazardExposure.total), r2(ru.vulnerability.total), r2(ru.lackCopingCapacity.total), r2(kib.risk)]);
lvl.push(['district (170)', 'Rufiji', 'indicator->category mean, category->dimension sgm, risk cbrt', r2(ru.hazardExposure.total), r2(ru.vulnerability.total), r2(ru.lackCopingCapacity.total), r2(ru.risk)]);
lvl.push(['region (31)', `Pwani (${pwReg.length} districts)`, 'mean of district indicators, then re-run sgm + cbrt', regH, regV, regC, r2(Math.pow(regH, 1 / 3) * Math.pow(regV, 1 / 3) * Math.pow(regC, 1 / 3))]);
lvl.push(['national', 'Tanzania', 'official INFORM country value (not a unit mean)', risk.national.hazardExposure, risk.national.vulnerability, risk.national.lackCopingCapacity, risk.national.risk]);
fs.writeFileSync(ROOT + 'docs/worked_example_levels.csv', lvl.map((r) => r.map((x) => `"${x}"`).join(',')).join('\n'));

console.log('wrote docs/worked_example_indicators.csv (' + (rows.length - 1) + ' rows) + docs/worked_example_levels.csv');
console.log('\nRufiji chain: H', ru.hazardExposure.total, 'V', ru.vulnerability.total, 'LCC', ru.lackCopingCapacity.total, '-> risk', ru.risk, '= cbrt(', ru.hazardExposure.total, '*', ru.vulnerability.total, '*', ru.lackCopingCapacity.total, ') =', r2(Math.cbrt(ru.hazardExposure.total * ru.vulnerability.total * ru.lackCopingCapacity.total)));
console.log('Pwani region: H', regH, 'V', regV, 'LCC', regC, '-> risk', r2(Math.pow(regH, 1 / 3) * Math.pow(regV, 1 / 3) * Math.pow(regC, 1 / 3)));
