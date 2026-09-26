import type { Resolution } from './data';

/** Subtle entry motion for blocks as they scroll into view (reduced motion is honoured by MotionConfig). */
export const fadeIn = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] as const },
};

/** Colour coding for data resolution — always paired with a text label. */
export const RESOLUTION_STYLE: Record<Resolution, { chip: string; dot: string }> = {
  council: { chip: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  district: { chip: 'bg-sky-500/12 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  region: { chip: 'bg-violet-500/12 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  national: { chip: 'bg-slate-500/15 text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  overlay: { chip: 'bg-amber-500/15 text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
};

/** Accent per pipeline phase / severity dimension (text + tinted surface, both themes). */
export const PHASE_STYLE = {
  standardise: { ring: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300', line: 'bg-sky-500/30' },
  aggregate: { ring: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300', line: 'bg-violet-500/30' },
} as const;
