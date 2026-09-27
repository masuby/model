import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Block, CalloutTone } from '../content';
import type { WidgetId } from '../course';
import { WIDGET_HEIGHT, WIDGETS } from '../widgets';
import { Figure } from './Figures';
import { RichText } from './RichText';

/**
 * Callouts are notes set off by a left rule. One emphasis weight (`foreground/70`) is reserved for
 * "Key idea" (and the lesson's Key takeaways); only "watch out" carries a (state) colour.
 */
const RULE: Record<CalloutTone, string> = {
  key: 'border-foreground/70',
  tz: 'border-border',
  warn: 'border-warning',
  tip: 'border-border',
  fact: 'border-border',
};

/**
 * Blocks drawn between a top and a bottom hairline carry `data-ruled`. Two of them in a row share one
 * rule (the second drops its top rule and closes the gap); the lesson section drops the bottom rule of
 * a ruled block that ends it, and a Figure drops its top rule after one.
 */
const RULED = 'my-8 border-y border-border [[data-ruled]+&]:-mt-8 [[data-ruled]+&]:border-t-0';

/** Space reserved while a widget's code loads — about the widget's own height, so the text below does not jump. */
function WidgetFallback({ id }: { id: WidgetId }) {
  const h = WIDGET_HEIGHT[id];
  return (
    <div
      className="my-10 h-[var(--wh)] rounded-lg border border-border sm:h-[var(--wh-sm)] md:h-[var(--wh-md)]"
      style={{ '--wh': h.base, '--wh-sm': h.sm, '--wh-md': h.md } as React.CSSProperties}
      aria-hidden
    />
  );
}

/**
 * Split a formula into pieces that may only break between them, most preferably at "=", then at a
 * top-level "+"/"−", then at a top-level "×"/"÷" — never inside a bracket or an operand.
 * Returns the right-hand pieces with their operator in front ("= …", "+ …", "× …").
 */
function splitTopLevel(text: string, ops: string[]): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
    else if (depth === 0 && c === ' ' && ops.includes(text[i + 1]) && text[i + 2] === ' ') {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out.filter((s) => s.trim() !== '');
}

/**
 * A formula set like displayed maths: each side of "=" is an inline block, and so is each "+"/"−"
 * term inside it, so a line breaks at the weakest link first; inside a term, only at "×"/"÷".
 */
function FormulaText({ text }: { text: string }) {
  const join = (parts: React.ReactNode[]) => parts.map((p, i) => <React.Fragment key={i}>{i > 0 && ' '}{p}</React.Fragment>);
  return (
    <>
      {join(
        splitTopLevel(text, ['=']).map((side, i) => (
          <span key={i} className="inline-block max-w-full">
            {join(
              splitTopLevel(side, ['+', '−']).map((term, j) => (
                <span key={j} className="inline-block max-w-full">
                  {join(
                    splitTopLevel(term, ['×', '÷']).map((factor, k) => (
                      <span key={k} className="whitespace-nowrap">
                        {factor}
                      </span>
                    )),
                  )}
                </span>
              )),
            )}
          </span>
        )),
      )}
    </>
  );
}

export function BlockView({ block }: { block: Block }) {
  const { t } = useTranslation('learn');
  switch (block.type) {
    case 'p':
      return (
        <p className="my-5 text-[1.0625rem] leading-8 text-foreground/90">
          <RichText text={block.text} />
        </p>
      );
    case 'callout':
      return (
        <aside className={cn('my-8 border-l-2 py-0.5 pl-5', RULE[block.tone])}>
          <p className="text-sm font-semibold text-foreground">{block.title ?? t(`callout.${block.tone}`)}</p>
          <p className="mt-1 leading-relaxed text-foreground/85">
            <RichText text={block.text} />
          </p>
        </aside>
      );
    case 'list': {
      const Tag = block.style === 'number' ? 'ol' : 'ul';
      return (
        <Tag className="my-6 grid gap-3">
          {block.items.map((item, i) => (
            <li key={i} className="grid grid-cols-[1.5rem_1fr] leading-relaxed text-foreground/90">
              <span className="num pt-px text-sm text-muted-foreground" aria-hidden>
                {block.style === 'number' ? `${i + 1}.` : '—'}
              </span>
              <span>
                <RichText text={item} />
              </span>
            </li>
          ))}
        </Tag>
      );
    }
    case 'terms':
      return (
        <dl data-ruled="" className={cn(RULED, 'divide-y divide-border')}>
          {block.items.map((it, i) => (
            <div key={i} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="font-semibold">{it.term}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                <RichText text={it.def} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case 'compare':
      return (
        <div data-ruled="" className={cn(RULED, 'grid gap-y-6 py-6 sm:divide-x sm:divide-border', block.items.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {block.items.map((it, i) => (
            <div key={i} className={cn(i > 0 && 'border-t border-border pt-6 sm:border-t-0 sm:pt-0', 'sm:px-6 sm:first:pl-0 sm:last:pr-0')}>
              <h3 className="text-base font-semibold">{it.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                <RichText text={it.text} />
              </p>
            </div>
          ))}
        </div>
      );
    case 'formula':
      return (
        <figure data-ruled="" className={cn(RULED, 'py-6 text-center')}>
          <div className="overflow-x-auto font-display text-xl leading-relaxed sm:text-2xl">
            <FormulaText text={block.text} />
          </div>
          {block.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    case 'widget': {
      const W = WIDGETS[block.id];
      return (
        <React.Suspense fallback={<WidgetFallback id={block.id} />}>
          <W />
        </React.Suspense>
      );
    }
    case 'figure':
      return <Figure id={block.id} caption={block.caption} />;
  }
}
