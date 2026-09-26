import { ClipboardCheck, CloudLightning, HeartPulse, ShieldCheck, Sigma, Siren, Users, type LucideIcon } from 'lucide-react';
import type { LessonId } from './course';

export interface LessonTheme {
  icon: LucideIcon;
  /** Soft gradient tile + icon colour (day and night). */
  tint: string;
  /** Solid accent used for the course path dots. */
  dot: string;
}

/** Per-lesson accent. Static class strings so Tailwind can see them. */
export const LESSON_THEME: Record<LessonId, LessonTheme> = {
  hazard: { icon: CloudLightning, tint: 'from-amber-500/20 to-orange-500/5 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  exposure: { icon: Users, tint: 'from-sky-500/20 to-blue-500/5 text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
  vulnerability: { icon: HeartPulse, tint: 'from-rose-500/20 to-pink-500/5 text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
  coping: { icon: ShieldCheck, tint: 'from-emerald-500/20 to-green-500/5 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  risk: { icon: Sigma, tint: 'from-violet-500/20 to-indigo-500/5 text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  severity: { icon: Siren, tint: 'from-red-500/20 to-orange-500/5 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  decisions: { icon: ClipboardCheck, tint: 'from-blue-500/20 to-cyan-500/5 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
};
