import { Check, Info, Lightbulb, MapPin, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Block, CalloutTone } from '../content';
import { WIDGETS } from '../widgets';
import { Figure } from './Figures';
import { RichText } from './RichText';

const TONES: Record<CalloutTone, { icon: LucideIcon; box: string; icon_: string }> = {
  key: { icon: Lightbulb, box: 'border-primary/25 bg-primary/[0.06]', icon_: 'bg-primary text-primary-foreground' },
  tz: { icon: MapPin, box: 'border-emerald-500/30 bg-emerald-500/[0.07]', icon_: 'bg-emerald-600 text-white' },
  warn: { icon: TriangleAlert, box: 'border-warning/35 bg-warning/[0.08]', icon_: 'bg-warning text-white dark:text-slate-900' },
  tip: { icon: Sparkles, box: 'border-violet-500/25 bg-violet-500/[0.06]', icon_: 'bg-violet-600 text-white' },
  fact: { icon: Info, box: 'border-sky-500/25 bg-sky-500/[0.06]', icon_: 'bg-sky-600 text-white' },
};

const reveal = { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.4 } } as const;

export function BlockView({ block }: { block: Block }) {
  const { t } = useTranslation('learn');
  switch (block.type) {
    case 'p':
      return (
        <p className="my-4 text-[1.0625rem] leading-8 text-foreground/85">
          <RichText text={block.text} />
        </p>
      );
    case 'callout': {
      const tone = TONES[block.tone];
      return (
        <motion.aside {...reveal} className={cn('relative my-6 overflow-hidden rounded-2xl border p-4 pl-5 sm:p-5', tone.box)}>
          {block.tone === 'tz' && <div className="flag-rule absolute inset-x-0 top-0 h-1" aria-hidden />}
          <div className="flex gap-3.5">
            <span className={cn('mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl shadow-sm', tone.icon_)}>
              <tone.icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-wider text-foreground/70 uppercase">{block.title ?? t(`callout.${block.tone}`)}</div>
              <p className="mt-1 leading-relaxed text-foreground/90">
                <RichText text={block.text} />
              </p>
            </div>
          </div>
        </motion.aside>
      );
    }
    case 'list': {
      const Tag = block.style === 'number' ? 'ol' : 'ul';
      return (
        <Tag className="my-5 grid gap-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 leading-relaxed text-foreground/85">
              {block.style === 'number' ? (
                <span className="num mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              ) : block.style === 'check' ? (
                <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
              ) : (
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              )}
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
        <dl className="my-6 grid gap-3">
          {block.items.map((it, i) => (
            <motion.div key={i} {...reveal} transition={{ duration: 0.35, delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-4">
              <dt className="font-display font-bold">{it.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                <RichText text={it.def} />
              </dd>
            </motion.div>
          ))}
        </dl>
      );
    case 'compare':
      return (
        <div className={cn('my-6 grid gap-3', block.items.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {block.items.map((it, i) => (
            <motion.div key={i} {...reveal} transition={{ duration: 0.35, delay: i * 0.06 }} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <div className="font-display font-bold">{it.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                <RichText text={it.text} />
              </p>
            </motion.div>
          ))}
        </div>
      );
    case 'formula':
      return (
        <figure className="my-6">
          <div className="overflow-x-auto rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-4 text-center font-mono text-sm font-semibold text-balance text-foreground sm:px-5 sm:text-lg">
            <span className="sm:whitespace-nowrap">{block.text}</span>
          </div>
          {block.caption && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    case 'widget': {
      const W = WIDGETS[block.id];
      return <W />;
    }
    case 'figure':
      return <Figure id={block.id} caption={block.caption} />;
  }
}
