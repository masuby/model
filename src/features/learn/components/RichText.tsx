import * as React from 'react';

const TAG = /<(b|i)>([\s\S]*?)<\/\1>/g;

/**
 * Renders translated text with a tiny, safe inline markup: <b>bold</b> and <i>italic</i>.
 * Everything else is plain text (no HTML is ever injected).
 */
export function RichText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TAG)) {
    const at = m.index ?? 0;
    if (at > last) nodes.push(text.slice(last, at));
    nodes.push(
      m[1] === 'b' ? (
        <strong key={k++} className="font-semibold text-foreground">
          {m[2]}
        </strong>
      ) : (
        <em key={k++}>{m[2]}</em>
      ),
    );
    last = at + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

/** Strip the inline markup (for aria-labels and plain contexts). */
export const plainText = (text: string): string => text.replace(TAG, '$2');
