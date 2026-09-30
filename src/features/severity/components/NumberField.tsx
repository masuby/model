/**
 * Numeric input with live thousands grouping (caret-preserving), a unit addon, help text, and
 * validation: negatives and values above `max` are rejected in place (the last valid value is kept);
 * plausibility warnings come from the parent.
 */
import { TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { isNum } from '../lib';

const locale = (lang: string) => (lang === 'sw' ? 'sw-TZ' : 'en-GB');

function separators(lang: string) {
  const parts = new Intl.NumberFormat(locale(lang)).formatToParts(12345.6);
  return { group: parts.find((p) => p.type === 'group')?.value ?? ',', decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.' };
}

const groupDigits = (digits: string, group: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, group);

export interface NumberFieldProps {
  id: string;
  label: React.ReactNode;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  unit?: React.ReactNode;
  help?: React.ReactNode;
  /** Maximum fraction digits (0 = whole numbers). */
  decimals?: number;
  max?: number;
  placeholder?: string;
  warning?: React.ReactNode;
  /** Rendered under the help text (e.g. a data source line). */
  footer?: React.ReactNode;
  /** Rendered to the right of the label. */
  labelAddon?: React.ReactNode;
  /** Hide the visible label (it stays available to assistive tech). */
  srOnlyLabel?: boolean;
  className?: string;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  unit,
  help,
  decimals = 0,
  max,
  placeholder,
  warning,
  footer,
  labelAddon,
  srOnlyLabel,
  className,
}: NumberFieldProps) {
  const { t, i18n } = useTranslation('severity');
  const lang = i18n.language;
  const sep = React.useMemo(() => separators(lang), [lang]);
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale(lang), { maximumFractionDigits: decimals }), [lang, decimals]);
  const [draft, setDraft] = React.useState<string | null>(null);
  const [error, setError] = React.useState<'negative' | 'max' | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const caret = React.useRef<number | null>(null);

  const text = draft ?? (isNum(value) ? formatter.format(value) : '');

  React.useLayoutEffect(() => {
    const el = inputRef.current;
    if (caret.current == null || !el || document.activeElement !== el) return;
    el.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    const pos = e.currentTarget.selectionStart ?? raw.length;
    if (raw.includes('-')) {
      setDraft(raw);
      setError('negative');
      return;
    }
    // Keep digits and one decimal separator ('.' is also accepted as the decimal mark).
    let cleaned = '';
    let before = 0;
    let seenDecimal = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      let keep = '';
      if (ch >= '0' && ch <= '9') keep = ch;
      else if (decimals > 0 && !seenDecimal && (ch === sep.decimal || (ch === '.' && sep.group !== '.'))) {
        keep = '.';
        seenDecimal = true;
      }
      if (keep) {
        cleaned += keep;
        if (i < pos) before++;
      }
    }
    if (!cleaned || cleaned === '.') {
      setDraft(cleaned ? sep.decimal : '');
      setError(null);
      onChange(null);
      return;
    }
    const [intPart, fracPart] = cleaned.split('.');
    const display = groupDigits(intPart, sep.group) + (fracPart !== undefined ? sep.decimal + fracPart.slice(0, decimals) : '');
    // Place the caret after the same number of significant characters.
    let p = 0;
    let count = 0;
    while (p < display.length && count < before) {
      if (display[p] !== sep.group) count++;
      p++;
    }
    caret.current = p;
    setDraft(display);
    const next = Number(cleaned);
    if (isNum(max) && next > max) {
      setError('max');
      return;
    }
    setError(null);
    onChange(next);
  };

  const describedBy = [error || warning ? `${id}-msg` : null, help ? `${id}-help` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className={cn('flex items-baseline justify-between gap-2', srOnlyLabel && !labelAddon && 'sr-only')}>
        <label htmlFor={id} className={cn('text-sm font-medium text-foreground', srOnlyLabel && 'sr-only')}>
          {label}
        </label>
        {labelAddon}
      </div>
      <div
        className={cn(
          'flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-background transition-colors duration-150 focus-within:border-ring focus-within:outline-2 focus-within:outline-ring/40',
          error ? 'border-danger focus-within:border-danger' : warning ? 'border-warning' : '',
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode={decimals > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          spellCheck={false}
          value={text}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onFocus={() => setDraft(text)}
          onBlur={() => {
            setDraft(null);
            setError(null);
          }}
          onChange={handleChange}
          className="num min-w-0 flex-1 bg-transparent px-3 text-right text-[15px] font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-none"
        />
        {unit && <span className="flex shrink-0 items-center pr-3 pl-1 text-xs whitespace-nowrap text-muted-foreground">{unit}</span>}
      </div>
      {error ? (
        <p id={`${id}-msg`} role="alert" className="text-xs font-medium text-danger">
          {error === 'negative' ? t('validation.negative') : t('validation.max', { max: formatter.format(max ?? 0) })}
        </p>
      ) : warning ? (
        <p id={`${id}-msg`} className="flex items-start gap-1.5 text-xs font-medium text-warning">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>{warning}</span>
        </p>
      ) : null}
      {help && (
        <p id={`${id}-help`} className="text-xs leading-relaxed text-muted-foreground">
          {help}
        </p>
      )}
      {footer}
    </div>
  );
}
