import * as React from 'react';

const TAG = /<(b|i)>([\s\S]*?)<\/\1>/g;
/** A numeric range such as "0–10" or "1.5–3.4": kept on one line (never "0–" / "10"). */
const RANGE = /\d+(?:\.\d+)?–\d+(?:\.\d+)?/g;

/** Plain text with every numeric range wrapped so it cannot break at the en dash. */
function keepRanges(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(RANGE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <span key={`${key}-${k++}`} className="whitespace-nowrap">
        {m[0]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Renders translated text with a tiny, safe inline markup: <b>bold</b> and <i>italic</i>.
 * Everything else is plain text (no HTML is ever injected). Numeric ranges never wrap mid-range.
 */
export function RichText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TAG)) {
    const at = m.index ?? 0;
    if (at > last) nodes.push(...keepRanges(text.slice(last, at), `t${k++}`));
    const inner = keepRanges(m[2], `i${k}`);
    nodes.push(
      m[1] === 'b' ? (
        <strong key={k++} className="font-semibold text-foreground">
          {inner}
        </strong>
      ) : (
        <em key={k++}>{inner}</em>
      ),
    );
    last = at + m[0].length;
  }
  if (last < text.length) nodes.push(...keepRanges(text.slice(last), `t${k}`));
  return <>{nodes}</>;
}

/** Strip the inline markup (for aria-labels and plain contexts). */
export const plainText = (text: string): string => text.replace(TAG, '$2');
