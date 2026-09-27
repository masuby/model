/**
 * Derived, read-only data for the Methodology page. Everything here is computed from the engine
 * (hierarchy, workbook spec, sources, severity model) so the documentation cannot drift from the code.
 * The only literals are the sizes of the verification fixtures, which `__tests__/methodology.test.ts`
 * checks against the fixtures themselves.
 */
import { ALL_INDICATORS, DIMENSIONS, leafForWorkbookComponent, type DimensionKey, type IndicatorLocation } from '@/engine/risk/hierarchy';
import { ADVANCED_SPECS, SPECS, usedSpecs, type IndicatorSpec } from '@/engine/risk/standardise';
import { AUTHORITIES, AUTHORITY_KEYS, INDICATOR_SOURCES, sourceFor, type Authority, type SourceInfo } from '@/engine/risk/sources';
import { toCsv } from '@/lib/utils';

/* ------------------------------------------------------------------------------------------------ */
/* Sections (table of contents)                                                                       */
/* ------------------------------------------------------------------------------------------------ */

export interface SectionDef {
  id: string;
  /** Display number ("01"); sub-sections share their parent's number. */
  number: string;
  /** 0 = section, 1 = sub-section (indented in the table of contents). */
  depth: 0 | 1;
}

export const SECTIONS: readonly SectionDef[] = [
  { id: 'overview', number: '01', depth: 0 },
  { id: 'structure', number: '02', depth: 0 },
  { id: 'pipeline', number: '03', depth: 0 },
  { id: 'worked-example', number: '03', depth: 1 },
  { id: 'geometric', number: '04', depth: 0 },
  { id: 'classification', number: '05', depth: 0 },
  { id: 'levels', number: '06', depth: 0 },
  { id: 'advanced', number: '07', depth: 0 },
  { id: 'severity', number: '08', depth: 0 },
  { id: 'sources', number: '09', depth: 0 },
  { id: 'quality', number: '10', depth: 0 },
  { id: 'limitations', number: '11', depth: 0 },
  { id: 'changelog', number: '12', depth: 0 },
  { id: 'references', number: '13', depth: 0 },
];
export const SECTION_IDS: readonly string[] = SECTIONS.map((s) => s.id);

/** Document numbering as printed: "3" for a section, "3.1" for its first sub-section. */
export const DISPLAY_NUMBERS: ReadonlyMap<string, string> = (() => {
  const m = new Map<string, string>();
  let subs = 0;
  for (const s of SECTIONS) {
    const n = String(Number(s.number));
    subs = s.depth ? subs + 1 : 0;
    m.set(s.id, s.depth ? `${n}.${subs}` : n);
  }
  return m;
})();
export const displayNumber = (id: string): string => DISPLAY_NUMBERS.get(id) ?? '';

/** i18n key of a section title (`sections.<camel>`). */
export const sectionKey = (id: string) => `sections.${id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())}`;

/* ------------------------------------------------------------------------------------------------ */
/* Workbook specification                                                                            */
/* ------------------------------------------------------------------------------------------------ */

export const specDimension = (s: Pick<IndicatorSpec, 'dimension'>): DimensionKey | null => {
  const l = String(s.dimension).toLowerCase();
  return l.includes('hazard') ? 'hazard' : l.includes('vulner') ? 'vulnerability' : l.includes('coping') ? 'coping' : null;
};

export type KeyedLevel = 'adm2' | 'adm1' | 'national';
export const KEYED_LEVELS: readonly KeyedLevel[] = ['adm2', 'adm1', 'national'];
export function keyedLevel(s: Pick<IndicatorSpec, 'keyed_at' | 'resolution'>): KeyedLevel | null {
  const k = String(s.keyed_at ?? s.resolution ?? '').toLowerCase();
  if (k.includes('adm2')) return 'adm2';
  if (k.includes('adm1')) return 'adm1';
  if (k.includes('national')) return 'national';
  return null;
}

export const isUsed = (s: IndicatorSpec) => s.use === 'Yes';
export const isDecrease = (s: IndicatorSpec) => String(s.sign).startsWith('Decrease');
export const hasDenominator = (s: IndicatorSpec) => !!s.denominator && s.denominator !== 'None';

export const ALL_SPECS: readonly IndicatorSpec[] = Object.values(SPECS);
const USED = usedSpecs();

export const SPEC_STATS = {
  total: ALL_SPECS.length,
  used: USED.length,
  denominator: USED.filter(hasDenominator).length,
  outlier: USED.filter((s) => s.outlier === 'Yes').length,
  log: USED.filter((s) => s.transform === 'Logarithm').length,
  custom: USED.filter((s) => s.normalisation === 'Custom').length,
  range: USED.filter((s) => s.normalisation === 'Data range').length,
  decrease: USED.filter(isDecrease).length,
  byLevel: Object.fromEntries(KEYED_LEVELS.map((l) => [l, USED.filter((s) => keyedLevel(s) === l).length])) as Record<KeyedLevel, number>,
} as const;

export const leafRef = (l: IndicatorLocation) => `${l.dimension.key}:${l.indicator.key}`;

/** Workbook indicators (used and unused) grouped onto the model leaf they feed, keyed `dim:key`. */
export const WORKBOOK_BY_LEAF: ReadonlyMap<string, IndicatorSpec[]> = (() => {
  const m = new Map<string, IndicatorSpec[]>();
  for (const s of ALL_SPECS) {
    const leaf = s.component ? leafForWorkbookComponent(s.component) : null;
    if (!leaf) continue;
    const k = leafRef(leaf);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(s);
  }
  return m;
})();

/* ------------------------------------------------------------------------------------------------ */
/* Authorities                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** Resolve an authority by registry key ("PMO") or by its label ("PMO-DMD", "MoA"). */
export function findAuthority(keyOrLabel: string | null | undefined): Authority | null {
  if (!keyOrLabel) return null;
  const reg = AUTHORITIES as Record<string, Authority>;
  if (reg[keyOrLabel]) return reg[keyOrLabel];
  const norm = keyOrLabel.toLowerCase();
  const k = AUTHORITY_KEYS.find((a) => AUTHORITIES[a].label.toLowerCase() === norm);
  return k ? AUTHORITIES[k] : null;
}

/* ------------------------------------------------------------------------------------------------ */
/* Sources register                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

export type Resolution = SourceInfo['resolution'];
export const RESOLUTIONS: readonly Resolution[] = ['council', 'district', 'region', 'national', 'overlay'];

export interface RegisterRow {
  ref: string;
  dim: DimensionKey;
  /** Category key, or null for population exposure (part of the hazard term). */
  category: string | null;
  key: string;
  /** Canonical English name (used in exports). */
  en: string;
  source: SourceInfo;
}

const EXPOSURE_SOURCE = INDICATOR_SOURCES['hazard:exposure'];

export const REGISTER_ROWS: readonly RegisterRow[] = [
  ...ALL_INDICATORS.map((l) => ({
    ref: leafRef(l),
    dim: l.dimension.key,
    category: l.category.key,
    key: l.indicator.key,
    en: l.indicator.en,
    source: sourceFor(l.dimension.key, l.indicator.key),
  })),
  ...(EXPOSURE_SOURCE ? [{ ref: 'hazard:exposure', dim: 'hazard' as const, category: null, key: 'exposure', en: 'Population exposure', source: EXPOSURE_SOURCE }] : []),
];

export function registerCsv(rows: readonly RegisterRow[]): string {
  const header = ['dimension', 'category', 'indicator_key', 'indicator', 'lead_authority', 'lead_authority_name', 'partners', 'dataset', 'method', 'resolution'];
  const dimEn = (d: DimensionKey) => DIMENSIONS.find((x) => x.key === d)!.en;
  const catEn = (d: DimensionKey, c: string | null) => (c ? (DIMENSIONS.find((x) => x.key === d)!.categories.find((x) => x.key === c)?.en ?? c) : 'Exposure');
  return toCsv([
    header,
    ...rows.map((r) => [
      dimEn(r.dim),
      catEn(r.dim, r.category),
      r.key,
      r.en,
      AUTHORITIES[r.source.by].label,
      AUTHORITIES[r.source.by].full,
      (r.source.also ?? []).map((a) => AUTHORITIES[a].label).join('; '),
      r.source.dataset,
      r.source.method,
      r.source.resolution,
    ]),
  ]);
}

export function workbookCsv(specs: readonly IndicatorSpec[]): string {
  const header = ['id', 'name', 'dimension', 'category', 'component', 'unit', 'denominator', 'outlier_cap', 'transform', 'normalisation', 'reference_min', 'reference_max', 'direction', 'keyed_at', 'in_use'];
  return toCsv([
    header,
    ...specs.map((s) => [
      s.id,
      s.name,
      s.dimension,
      s.category,
      s.component,
      s.unit,
      s.denominator,
      s.outlier,
      s.transform,
      s.normalisation,
      s.resolved_min,
      s.resolved_max,
      s.sign,
      s.keyed_at ?? s.resolution,
      isUsed(s) ? 'Yes' : 'No',
    ]),
  ]);
}

/* ------------------------------------------------------------------------------------------------ */
/* Advanced multi-source baskets                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export interface Basket {
  component: string;
  leaf: IndicatorLocation | null;
  /** Exploded sub-indicators, heaviest first. */
  members: IndicatorSpec[];
  /** Workbook indicators (Use = Yes) that aggregate alongside the basket at weight 1. */
  workbook: IndicatorSpec[];
  totalWeight: number;
}

export const weightOf = (s: IndicatorSpec): number => {
  const w = Number(s.weight);
  return Number.isFinite(w) ? w : 1;
};

export const BASKETS: readonly Basket[] = (() => {
  const groups = new Map<string, IndicatorSpec[]>();
  for (const s of Object.values(ADVANCED_SPECS)) {
    const c = String(s.component);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(s);
  }
  const order = (b: Basket) => (b.leaf ? ALL_INDICATORS.indexOf(b.leaf) : 999);
  return [...groups.entries()]
    .map(([component, members]) => ({
      component,
      leaf: leafForWorkbookComponent(component),
      members: [...members].sort((a, b) => weightOf(b) - weightOf(a)),
      workbook: USED.filter((s) => s.component === component),
      totalWeight: members.reduce((sum, s) => sum + weightOf(s), 0),
    }))
    .sort((a, b) => order(a) - order(b));
})();

export const ADVANCED_COUNT = Object.keys(ADVANCED_SPECS).length;

/* ------------------------------------------------------------------------------------------------ */
/* Verification (sizes of the golden fixtures — asserted by the methodology test)                     */
/* ------------------------------------------------------------------------------------------------ */

export const VERIFIED = {
  /** standardise.fixture.json — every used indicator × every district. */
  standardiseValues: 8664,
  /** pipeline.fixture.json — raw → risk for every INFORM source unit. */
  pipelineUnits: 170,
  /** workbook_rows.fixture.json — cached workbook rows (category → dimension → risk). */
  workbookRows: 8,
} as const;

/* ------------------------------------------------------------------------------------------------ */
/* References                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export type ReferenceGroup = 'inform' | 'statistics' | 'data';
export interface Reference {
  id: string;
  group: ReferenceGroup;
  /** Bibliographic entry, as published (not translated). */
  citation: string;
  url?: string;
  /** Link text, e.g. a DOI. */
  linkLabel?: string;
}

export const REFERENCES: readonly Reference[] = [
  {
    id: 'informMethodology',
    group: 'inform',
    citation: 'Marin-Ferrer, M., Vernaccini, L. & Poljanšek, K. (2017). INFORM Index for Risk Management: Concept and Methodology, Version 2017. EUR 28655 EN. Publications Office of the European Union, Luxembourg.',
    url: 'https://doi.org/10.2760/094023',
    linkLabel: 'doi:10.2760/094023',
  },
  {
    id: 'informSubnational',
    group: 'inform',
    citation: 'European Commission, Joint Research Centre — Disaster Risk Management Knowledge Centre. INFORM Sub-national risk models: guidance and methodology.',
    url: 'https://drmkc.jrc.ec.europa.eu/inform-index/INFORM-Subnational-Risk',
    linkLabel: 'drmkc.jrc.ec.europa.eu',
  },
  {
    id: 'informSeverity',
    group: 'inform',
    citation: 'Poljanšek, K., Vernaccini, L. & Marin Ferrer, M. (2020). INFORM Severity Index: Concept and Methodology, Version 2020. European Commission Joint Research Centre and ACAPS.',
    url: 'https://drmkc.jrc.ec.europa.eu/inform-index/INFORM-Severity',
    linkLabel: 'drmkc.jrc.ec.europa.eu',
  },
  {
    id: 'informIndex',
    group: 'inform',
    citation: 'INFORM — Index for Risk Management. Inter-Agency Standing Committee and European Commission.',
    url: 'https://drmkc.jrc.ec.europa.eu/inform-index',
    linkLabel: 'drmkc.jrc.ec.europa.eu/inform-index',
  },
  {
    id: 'oecd',
    group: 'statistics',
    citation: 'OECD & European Commission Joint Research Centre (2008). Handbook on Constructing Composite Indicators: Methodology and User Guide. OECD Publishing, Paris.',
    url: 'https://doi.org/10.1787/9789264043466-en',
    linkLabel: 'doi:10.1787/9789264043466-en',
  },
  {
    id: 'tukey',
    group: 'statistics',
    citation: 'Tukey, J. W. (1977). Exploratory Data Analysis. Addison-Wesley, Reading, MA.',
  },
  {
    id: 'chirps',
    group: 'data',
    citation: 'Funk, C. et al. (2015). The climate hazards infrared precipitation with stations — a new environmental record for monitoring extremes. Scientific Data 2, 150066.',
    url: 'https://doi.org/10.1038/sdata.2015.66',
    linkLabel: 'doi:10.1038/sdata.2015.66',
  },
  {
    id: 'era5',
    group: 'data',
    citation: 'Hersbach, H. et al. (2020). The ERA5 global reanalysis. Quarterly Journal of the Royal Meteorological Society 146(730), 1999–2049.',
    url: 'https://doi.org/10.1002/qj.3803',
    linkLabel: 'doi:10.1002/qj.3803',
  },
  {
    id: 'spei',
    group: 'data',
    citation: 'Vicente-Serrano, S. M., Beguería, S. & López-Moreno, J. I. (2010). A multiscalar drought index sensitive to global warming: the Standardized Precipitation Evapotranspiration Index. Journal of Climate 23(7), 1696–1718.',
    url: 'https://doi.org/10.1175/2009JCLI2909.1',
    linkLabel: 'doi:10.1175/2009JCLI2909.1',
  },
  {
    id: 'census',
    group: 'data',
    citation: 'National Bureau of Statistics & Office of the Chief Government Statistician, Zanzibar (2022). The 2022 Population and Housing Census: Administrative Units Population Distribution Report. Dodoma, Tanzania.',
    url: 'https://www.nbs.go.tz',
    linkLabel: 'nbs.go.tz',
  },
];

/* ------------------------------------------------------------------------------------------------ */
/* Small numeric helpers                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/**
 * A weight in one plain notation, matching the formulas: a simple fraction when it is one ("1/3", "2/3"),
 * otherwise a decimal ("0.7", "0.3").
 */
export function fractionLabel(w: number): string {
  for (const den of [2, 3, 4]) {
    const num = Math.round(w * den);
    if (num > 0 && num < den && Math.abs(num / den - w) < 1e-9) return `${num}/${den}`;
  }
  return String(Number(w.toFixed(2)));
}

/** A "YYYY-MM" data date as a month and year in the reader's language ("June 2026", "Juni 2026"). */
export function formatMonth(asOf: string | null | undefined, lang: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(asOf ?? '');
  if (!m) return asOf ?? '';
  const date = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  try {
    return new Intl.DateTimeFormat(lang.startsWith('sw') ? 'sw-TZ' : 'en-GB', { month: 'long', year: 'numeric' }).format(date);
  } catch {
    return asOf ?? '';
  }
}

/** Fixed-decimal formatting for intermediate values in formulas. */
export const fx = (x: number | null | undefined, d = 2): string => (typeof x === 'number' && Number.isFinite(x) ? x.toFixed(d) : '—');
