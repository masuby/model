import { ArrowLeft, Check, GraduationCap } from 'lucide-react';
import { motion, useScroll, useSpring } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { COMPLETE_SLUG, LESSONS, type LessonId } from '../course';
import { useProgress } from '../hooks';
import { completedCount, isCompleted, isCourseComplete } from '../progress';

/** Thin reading-progress bar fixed under the site header. */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div className="fixed inset-x-0 top-[67px] z-[999] h-[3px] origin-left bg-primary print:hidden" style={{ scaleX }} aria-hidden />;
}

/** Desktop: sticky side nav with every lesson, and the current lesson's sections (scroll-spy). */
export function LessonSideNav({ current, sections, active }: { current: LessonId; sections: Array<{ id: string; title: string }>; active: string | null }) {
  const { t } = useTranslation('learn');
  const progress = useProgress();
  const done = completedCount(progress);
  return (
    <nav aria-label={t('nav.label')} className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1 pb-6 lg:block">
      <Link to="/learn" className="group inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden /> {t('nav.overview')}
      </Link>
      <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between px-1 text-xs font-semibold">
          <span>{t('nav.course')}</span>
          <span className="num text-muted-foreground">{t('nav.done', { done, total: LESSONS.length })}</span>
        </div>
        <Progress value={(done / LESSONS.length) * 100} label={t('nav.course')} className="mt-2 h-1.5" indicatorClassName="bg-success" />
        <ol className="mt-3 grid min-w-0 grid-cols-1 gap-0.5">
          {LESSONS.map((l) => {
            const isCurrent = l.id === current;
            const complete = isCompleted(progress, l.id);
            return (
              <li key={l.id} className="min-w-0">
                <Link
                  to={`/learn/${l.id}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition-colors',
                    isCurrent ? 'bg-primary/10 font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <StepDot n={l.n} complete={complete} current={isCurrent} />
                  <span className="line-clamp-2 min-w-0 flex-1 leading-snug">{t(`lessons.${l.id}.title`)}</span>
                  {complete && <span className="sr-only">({t('status.completed')})</span>}
                </Link>
                {isCurrent && (
                  <ul className="my-1 ml-[1.35rem] grid gap-0.5 border-l border-border pl-3">
                    {[...sections, { id: 'quiz', title: t('quiz.title') }].map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          aria-current={active === s.id ? 'location' : undefined}
                          className={cn(
                            '-ml-[13px] block border-l-2 py-1 pl-3 text-xs leading-snug transition-colors',
                            active === s.id ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
          <li>
            <Link
              to={`/learn/${COMPLETE_SLUG}`}
              className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span className={cn('inline-flex size-6 shrink-0 items-center justify-center rounded-full', isCourseComplete(progress) ? 'bg-tz-gold text-slate-900' : 'bg-muted')}>
                <GraduationCap className="size-3.5" aria-hidden />
              </span>
              <span className="truncate">{t('nav.certificate')}</span>
            </Link>
          </li>
        </ol>
      </div>
    </nav>
  );
}

export function StepDot({ n, complete, current, size = 'md' }: { n: number; complete: boolean; current?: boolean; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'num inline-flex shrink-0 items-center justify-center rounded-full font-bold transition-colors',
        size === 'lg' ? 'size-9 text-sm' : 'size-6 text-[11px]',
        complete ? 'bg-success text-white' : current ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground',
      )}
      aria-hidden
    >
      {complete ? <Check className={size === 'lg' ? 'size-4' : 'size-3.5'} strokeWidth={3} /> : n}
    </span>
  );
}

/** Mobile & tablet: sticky top bar with the seven lessons as steps. */
export function LessonTopBar({ current }: { current: LessonId }) {
  const { t } = useTranslation('learn');
  const progress = useProgress();
  const ref = React.useRef<HTMLOListElement>(null);
  React.useEffect(() => {
    // Centre the current step horizontally without scrolling the page.
    const c = ref.current;
    const el = c?.querySelector('[aria-current="page"]');
    if (!c || !el) return;
    const a = el.getBoundingClientRect();
    const b = c.getBoundingClientRect();
    c.scrollLeft += a.left - b.left - (b.width - a.width) / 2;
  }, [current]);
  return (
    <nav aria-label={t('nav.label')} className="sticky top-[67px] z-[900] border-b border-border bg-background/85 backdrop-blur-xl lg:hidden print:hidden">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2 sm:px-6">
        <Link to="/learn" className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-primary" aria-label={t('nav.overview')}>
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <ol ref={ref} className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5 [scrollbar-width:none]">
          {LESSONS.map((l, i) => {
            const isCurrent = l.id === current;
            const complete = isCompleted(progress, l.id);
            return (
              <li key={l.id} className="flex shrink-0 items-center">
                {i > 0 && <span className={cn('mx-0.5 h-0.5 w-3 rounded-full', complete ? 'bg-success' : 'bg-border')} aria-hidden />}
                <Link
                  to={`/learn/${l.id}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`${t('lesson.of', { n: l.n, total: LESSONS.length })}: ${t(`lessons.${l.id}.title`)}${complete ? ` (${t('status.completed')})` : ''}`}
                  className={cn('flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-xs font-semibold', isCurrent ? 'bg-primary/10 text-foreground' : 'text-muted-foreground')}
                >
                  <StepDot n={l.n} complete={complete} current={isCurrent} />
                  {isCurrent && <span className="max-w-36 truncate">{t(`lessons.${l.id}.title`)}</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
