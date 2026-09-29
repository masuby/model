import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Shown wherever a value is missing (never an em dash). */
export const NO_VALUE = 'n/a';

/** Merge Tailwind class lists, resolving conflicts (`px-2` + `px-4` → `px-4`). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Building an Intl formatter is far slower than using one, and tables format thousands of values.
const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const intlLocale = (lang: string) => (lang === 'sw' ? 'sw-TZ' : 'en-GB');

/** Locale-aware number formatting (Swahili uses the same digits; grouping differs). */
export function formatNumber(value: number | null | undefined, lang = 'en', opts: Intl.NumberFormatOptions = {}): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return NO_VALUE;
  const key = intlLocale(lang) + JSON.stringify(opts);
  let f = numberFormats.get(key);
  if (!f) numberFormats.set(key, (f = new Intl.NumberFormat(intlLocale(lang), opts)));
  return f.format(value);
}

/** A 0–10 (or 0–5) score with one decimal, or an em dash. */
export function formatScore(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return NO_VALUE;
  return (Math.round(value * 10) / 10).toFixed(1);
}

export function formatCompact(value: number | null | undefined, lang = 'en'): string {
  return formatNumber(value, lang, { notation: 'compact', maximumFractionDigits: 1 });
}

export function formatDate(iso: string | number | Date | null | undefined, lang = 'en', opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  if (!iso) return NO_VALUE;
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return NO_VALUE;
  const key = intlLocale(lang) + JSON.stringify(opts);
  let f = dateFormats.get(key);
  if (!f) dateFormats.set(key, (f = new Intl.DateTimeFormat(intlLocale(lang), opts)));
  return f.format(d);
}

/** Stable slug for ids/URLs. */
export const slug = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Trigger a browser download of text content. */
export function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** RFC-4180 CSV from rows of plain values. */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>): string {
  const esc = (v: string | number | null | undefined) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n');
}
