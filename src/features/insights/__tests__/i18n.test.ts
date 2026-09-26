/**
 * Guards the `insights` catalogues: English and Kiswahili define the same keys (plural variants
 * aside), and every key the Insights code asks for exists in both languages.
 */
import commonEn from '@/i18n/locales/en/common.json';
import indicatorsEn from '@/i18n/locales/en/indicators.json';
import en from '@/i18n/locales/en/insights.json';
import sw from '@/i18n/locales/sw/insights.json';
import { RESOLUTIONS } from '../analytics';

type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

const base = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');
const EN = flatten(en as Tree);
const SW = flatten(sw as Tree);
const CATALOGUES: Record<string, Record<string, string>> = { insights: EN, common: flatten(commonEn as Tree), indicators: flatten(indicatorsEn as Tree) };
const has = (cat: Record<string, string>, key: string) => key in cat || `${key}_one` in cat || `${key}_other` in cat;

const sources = import.meta.glob<string>('../**/*.tsx', { query: '?raw', import: 'default', eager: true });

describe('insights i18n', () => {
  it('en and sw define the same keys', () => {
    const a = new Set(Object.keys(EN).map(base));
    const b = new Set(Object.keys(SW).map(base));
    expect([...a].filter((k) => !b.has(k))).toEqual([]);
    expect([...b].filter((k) => !a.has(k))).toEqual([]);
  });

  it('no empty strings, interpolations match between languages', () => {
    const vars = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();
    for (const [k, v] of Object.entries(EN)) {
      expect(v.trim(), k).not.toBe('');
      const swKey = k in SW ? k : base(k) in SW ? base(k) : `${base(k)}_other`;
      const swVal = SW[swKey];
      expect(swVal, k).toBeDefined();
      // Kiswahili may drop {{count}} from a plural form, but must not invent variables.
      for (const name of vars(swVal)) expect(vars(v), `${k} → ${name}`).toContain(name);
    }
  });

  it('every static key used in the Insights code exists', () => {
    const missing: string[] = [];
    let checked = 0;
    for (const [file, code] of Object.entries(sources)) {
      for (const m of code.matchAll(/\bt\(\s*'([^']+)'/g)) {
        checked++;
        const raw = m[1];
        const [ns, key] = raw.includes(':') ? (raw.split(':') as [string, string]) : ['insights', raw];
        const cat = CATALOGUES[ns];
        if (!cat || !has(cat, key)) missing.push(`${file}: ${raw}`);
        if (ns === 'insights' && !has(SW, key)) missing.push(`${file}: sw ${raw}`);
      }
      for (const m of code.matchAll(/'insights:([\w.]+)'/g)) if (!has(EN, m[1]) || !has(SW, m[1])) missing.push(`${file}: ${m[1]}`);
    }
    expect(Object.keys(sources).length).toBeGreaterThan(5);
    expect(checked).toBeGreaterThan(100);
    expect(missing).toEqual([]);
  });

  it('dynamic key families are complete', () => {
    for (const id of ['kpis', 'regions', 'dimensions', 'hazards', 'classes', 'drivers', 'coverage', 'correlation']) {
      expect(has(EN, `nav.${id}`)).toBe(true);
      expect(has(SW, `nav.${id}`)).toBe(true);
    }
    for (const r of RESOLUTIONS) for (const fam of ['coverage.res', 'coverage.resDesc']) expect(has(SW, `${fam}.${r}`) && has(EN, `${fam}.${r}`)).toBe(true);
    for (const s of ['none', 'weak', 'moderate', 'strong', 'veryStrong']) expect(has(SW, `correlation.strength.${s}`) && has(EN, `correlation.strength.${s}`)).toBe(true);
    for (const k of ['hazard', 'vulnerability', 'coping', 'risk']) expect(has(SW, `abbr.${k}`) && has(EN, `abbr.${k}`)).toBe(true);
  });
});
