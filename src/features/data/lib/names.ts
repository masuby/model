/**
 * Forgiving place-name matching for pasted data: case-, accent- and punctuation-insensitive, and aware
 * of how councils are written in practice ("Kondoa DC", "Kondoa District Council",
 * "Halmashauri ya Wilaya ya Kondoa", "Moshi MC", "Manispaa ya Moshi", "Dodoma CC", "Jiji la Dodoma").
 */
import type { Unit } from '@/engine/risk/types';

/** Lowercase, strip diacritics, `&` → and, drop everything but letters and digits. */
export function normaliseName(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

const tokens = (s: string) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

export type CouncilType = 'district' | 'town' | 'municipal' | 'city';

const EN_SUFFIX: Record<string, CouncilType> = {
  district: 'district',
  dc: 'district',
  town: 'town',
  tc: 'town',
  municipal: 'municipal',
  municipality: 'municipal',
  mc: 'municipal',
  city: 'city',
  cc: 'city',
};
const SW_TYPE: Record<string, CouncilType> = { wilaya: 'district', mji: 'town', manispaa: 'municipal', jiji: 'city' };
const SW_COUNCIL = new Set(['halmashauri', 'halmashuari']);
const SW_FILLER = new Set(['ya', 'wa', 'la']);

/** Split a council name into its base ("kondoa") and council type ("district"), in any common spelling. */
export function parseCouncilName(name: string): { base: string; type: CouncilType | null } {
  let ws = tokens(name);
  let type: CouncilType | null = null;
  const swahili = ws.some((w) => SW_COUNCIL.has(w) || w in SW_TYPE);
  if (swahili) {
    for (const w of ws) if (w in SW_TYPE) type ??= SW_TYPE[w];
    ws = ws.filter((w) => !SW_COUNCIL.has(w) && !(w in SW_TYPE) && !SW_FILLER.has(w));
  }
  while (ws.length > 1 && ws[ws.length - 1] === 'council') ws = ws.slice(0, -1);
  if (ws.length > 1 && ws[ws.length - 1] in EN_SUFFIX) {
    type ??= EN_SUFFIX[ws[ws.length - 1]];
    ws = ws.slice(0, -1);
  }
  return { base: ws.join(''), type };
}

/** Canonical council key: base + type ("kondoadistrict"). */
export function councilKey(name: string): string {
  const { base, type } = parseCouncilName(name);
  return base + (type ?? '');
}

/** Canonical region key ("Mkoa wa Dar es Salaam" / "Dar-es-Salaam Region" → "daressalaam"). */
export function regionKey(name: string): string {
  const ws = tokens(name).filter((w) => w !== 'region' && w !== 'mkoa');
  const hadMkoa = tokens(name).includes('mkoa');
  return (hadMkoa ? ws.filter((w) => !SW_FILLER.has(w)) : ws).join('');
}

/** Classic Levenshtein distance (small inputs only). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

export type MatchResult =
  | { kind: 'match'; unit: Unit; how: 'id' | 'exact' | 'base' }
  | { kind: 'ambiguous'; candidates: Unit[] }
  | { kind: 'none'; suggestion: Unit | null };

export interface NameIndex {
  match: (name: string) => MatchResult;
}

function suggest(key: string, entries: ReadonlyArray<{ key: string; unit: Unit }>): Unit | null {
  if (!key) return null;
  let best: { d: number; unit: Unit } | null = null;
  for (const e of entries) {
    const d = levenshtein(key, e.key);
    if (!best || d < best.d) best = { d, unit: e.unit };
  }
  return best && best.d <= Math.max(2, Math.floor(key.length / 4)) ? best.unit : null;
}

/** Index councils for matching by id, canonical name, or (when unambiguous) the bare base name. */
export function buildCouncilIndex(councils: readonly Unit[]): NameIndex {
  const byId = new Map(councils.map((c) => [c.id.toLowerCase(), c]));
  const byKey = new Map<string, Unit>();
  const byBase = new Map<string, Unit[]>();
  const entries: Array<{ key: string; unit: Unit }> = [];
  for (const c of councils) {
    const { base, type } = parseCouncilName(c.name);
    const key = base + (type ?? '');
    byKey.set(key, c);
    byKey.set(normaliseName(c.name), c);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base)!.push(c);
    entries.push({ key, unit: c });
  }
  return {
    match(name) {
      const id = byId.get(name.trim().toLowerCase());
      if (id) return { kind: 'match', unit: id, how: 'id' };
      const { base, type } = parseCouncilName(name);
      const exact = byKey.get(base + (type ?? '')) ?? byKey.get(normaliseName(name));
      if (exact) return { kind: 'match', unit: exact, how: 'exact' };
      // Loose: the base name alone identifies one council ("Mpwapwa", or a mistyped council type).
      const list = byBase.get(base) ?? [];
      if (list.length === 1) return { kind: 'match', unit: list[0], how: 'base' };
      if (list.length > 1) return { kind: 'ambiguous', candidates: list };
      return { kind: 'none', suggestion: suggest(base + (type ?? ''), entries) };
    },
  };
}

/** Index regions for matching by id or name. */
export function buildRegionIndex(regions: readonly Unit[]): NameIndex {
  const byKey = new Map<string, Unit>();
  const entries: Array<{ key: string; unit: Unit }> = [];
  for (const r of regions) {
    byKey.set(regionKey(r.name), r);
    byKey.set(r.id.toLowerCase(), r);
    entries.push({ key: regionKey(r.name), unit: r });
  }
  return {
    match(name) {
      const hit = byKey.get(name.trim().toLowerCase()) ?? byKey.get(regionKey(name));
      if (hit) return { kind: 'match', unit: hit, how: 'exact' };
      return { kind: 'none', suggestion: suggest(regionKey(name), entries) };
    },
  };
}
