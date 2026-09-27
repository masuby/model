/** Small, locale-aware display helpers for the Data Portal. */
import { formatDate } from '@/lib/utils';

const locale = (lang: string) => (lang === 'sw' ? 'sw-TZ' : 'en-GB');

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 hours ago" / "saa 3 zilizopita"; "just now" under a minute. */
export function relativeTime(iso: string | null | undefined, lang = 'en', now = Date.now()): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const secs = Math.round((t - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  for (const [unit, size] of UNITS) if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  return rtf.format(0, 'second');
}

export const dateTime = (iso: string | null | undefined, lang = 'en') => formatDate(iso, lang, { dateStyle: 'medium', timeStyle: 'short' });

/** Calendar-day key (local time) for grouping. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function initials(name: string | null | undefined): string {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Join names as "A, B and 3 more" with a translated "and N more" tail. */
export function listNames(names: readonly string[], max: number, more: (n: number) => string): string {
  if (names.length <= max) return names.join(', ');
  return `${names.slice(0, max).join(', ')} ${more(names.length - max)}`;
}

/** Diacritic- and case-insensitive "all words present" search. */
export function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  const norm = (s: string) =>
    s
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = norm(fields.filter(Boolean).join(' '));
  return words.every((w) => hay.includes(w));
}
