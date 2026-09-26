/**
 * Every translation key the Data Portal uses must exist in BOTH English and Kiswahili, and the two
 * `data` catalogues must have exactly the same shape. Static keys are read from the source files;
 * dynamic (template) keys are enumerated from the same constants the UI uses.
 */
import commonEn from '@/i18n/locales/en/common.json';
import dataEn from '@/i18n/locales/en/data.json';
import indicatorsEn from '@/i18n/locales/en/indicators.json';
import commonSw from '@/i18n/locales/sw/common.json';
import dataSw from '@/i18n/locales/sw/data.json';
import indicatorsSw from '@/i18n/locales/sw/indicators.json';
import { AUTHORITY_KEYS } from '@/engine/risk/sources';
import { usedSpecs } from '@/engine/risk/standardise';
import { specKey, unitKey } from '../lib/raw';
import { EDITABLE_FIELDS } from '../lib/targets';

type Tree = { [k: string]: string | Tree };
const catalogues: Record<'en' | 'sw', Record<string, Tree>> = {
  en: { data: dataEn as Tree, common: commonEn as Tree, indicators: indicatorsEn as Tree },
  sw: { data: dataSw as Tree, common: commonSw as Tree, indicators: indicatorsSw as Tree },
};

function has(lang: 'en' | 'sw', fullKey: string): boolean {
  const [ns, key] = fullKey.includes(':') ? (fullKey.split(':') as [string, string]) : ['data', fullKey];
  const parts = key.split('.');
  let node: string | Tree | undefined = catalogues[lang][ns];
  for (const p of parts.slice(0, -1)) node = typeof node === 'object' ? node[p] : undefined;
  if (typeof node !== 'object') return false;
  const last = parts[parts.length - 1];
  return typeof node[last] === 'string' || (typeof node[`${last}_one`] === 'string' && typeof node[`${last}_other`] === 'string');
}

function flatten(t: Tree, prefix = ''): string[] {
  return Object.entries(t).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`)));
}

const sources = import.meta.glob<string>(['../**/*.ts', '../**/*.tsx', '!../__tests__/**'], { query: '?raw', import: 'default', eager: true });

function staticKeys(): string[] {
  const keys = new Set<string>();
  for (const src of Object.values(sources)) {
    for (const m of src.matchAll(/\bt\(\s*'([^'$`]+)'/g)) keys.add(m[1]);
    for (const m of src.matchAll(/\bt\(\s*`([^`$]+)`/g)) keys.add(m[1]);
    for (const m of src.matchAll(/\? '([a-zA-Z]+\.[a-zA-Z.]+)' : '([a-zA-Z]+\.[a-zA-Z.]+)'/g)) keys.add(m[1]).add(m[2]);
  }
  return [...keys];
}

const specs = usedSpecs();
const DYNAMIC = [
  ...['council', 'source', 'region', 'national'].map((k) => `levels.${k}`),
  ...['viewer', 'sector', 'pmo', 'admin'].flatMap((k) => [`roles.${k}`, `mode.roleDesc.${k}`]),
  ...['pending', 'approved', 'rejected'].map((k) => `status.${k}`),
  ...[1, 2, 3].flatMap((i) => [`signIn.point${i}`, `access.step${i}`, `access.step${i}Title`]),
  ...['notNumber', 'range', 'decimals'].map((k) => `scores.errors.${k}`),
  'meta.errors.note_required',
  'meta.errors.note_tooLong',
  ...AUTHORITY_KEYS.map((k) => `authorities.${k}`),
  ...specs.map((s) => `specs.${specKey(s.id)}`),
  ...specs.filter((s) => s.unit?.trim()).map((s) => `units.${unitKey(s.unit)}`),
  ...specs.map((s) => `raw.keyedAt.${s.keyed_at}`),
  ...['council', 'region', 'nation'].flatMap((l) => [`paste.levels.${l}`, `paste.levelHelp.${l}`, `paste.placeholder.${l}`]),
  ...['empty', 'notNumber', 'range', 'unmatched', 'ambiguous', 'missingName', 'duplicate', 'extraValue', 'tooManyValues', 'noDataNotAllowed'].map((k) => `paste.issues.${k}`),
  ...['ready', 'unchanged', 'conflict'].map((k) => `paste.status.${k}`),
  ...['tooLarge', 'json', 'format', 'version', 'read'].map((k) => `tools.errors.${k}`),
  ...['unknownUnit', 'unknownIndicator', 'badValue', 'unsupportedUnit', 'badSubmission'].map((k) => `tools.issueKinds.${k}`),
  ...['submitted', 'approved', 'rejected', 'reverted', 'imported', 'reset'].map((k) => `activity.actions.${k}`),
  ...['scores', 'raw', 'paste', 'queue', 'mine', 'approved', 'activity'].map((k) => `tabs.${k}`),
  ...EDITABLE_FIELDS.map((f) => `indicators:${f.key}`),
  ...['hazard', 'vulnerability', 'coping'].flatMap((d) => [`common:dimensions.${d}`, `common:dimensions.${d}Short`]),
  ...['natural', 'human', 'socioEconomic', 'vulnerableGroups', 'infrastructure', 'institutional'].map((c) => `common:categories.${c}`),
  ...['veryLow', 'low', 'medium', 'high', 'veryHigh', 'noData'].map((c) => `common:classes.${c}`),
];

describe('data portal translations', () => {
  it('finds the static keys in the source', () => {
    expect(staticKeys().length).toBeGreaterThan(200);
  });

  it.each(['en', 'sw'] as const)('%s has every static and dynamic key', (lang) => {
    const missing = [...staticKeys(), ...DYNAMIC].filter((k) => !has(lang, k));
    expect(missing).toEqual([]);
  });

  it('en and sw data catalogues have the same shape', () => {
    expect(flatten(dataSw as Tree).sort()).toEqual(flatten(dataEn as Tree).sort());
  });
});
