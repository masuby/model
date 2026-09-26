import { ArrowLeft, Check, Lock } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { COMPLETE_SLUG, LESSONS, type LessonId } from '../course';
import { useProgress } from '../hooks';
import { completedCount, isCompleted, isCourseComplete } from '../progress';

/**
 * Thin reading-progress bar fixed under the site header. A plain bar driven by one passive scroll
 * listener (coalesced to one write per frame) — no animation library.
 */
export function ReadingProgress() {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return <div ref={ref} className="fixed inset-x-0 top-[var(--header-h)] z-[999] h-0.5 origin-left bg-foreground/50 print:hidden" style={{ transform: 'scaleX(0)' }} aria-hidden />;
}

/** Lesson marker: the number, or a check once the lesson is passed. */
export function StepMark({ n, complete, current }: { n: number; complete: boolean; current?: boolean }) {
  return (
    <span className={cn('num inline-flex w-5 shrink-0 justify-center text-sm', complete ? 'text-success' : current ? 'font-semibold text-foreground' : 'text-muted-foreground')} aria-hidden>
      {complete ? <Check className="mt-0.5 size-4" strokeWidth={2.5} /> : n}
    </span>
  );
}

/** Desktop: sticky side nav with every lesson, and the current lesson's sections (scroll-spy). */
export function LessonSideNav({ current, sections, active }: { current: LessonId; sections: Array<{ id: string; title: string }>; active: string | null }) {
  const { t } = useTranslation('learn');
  const progress = useProgress();
  const done = completedCount(progress);
  const complete = isCourseComplete(progress);
  return (
    <nav aria-label={t('nav.label')} className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-6 lg:block">
      <Link to="/learn" className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden /> {t('nav.overview')}
      </Link>

      <div className="mt-6 border-t border-border pt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">{t('nav.course')}</span>
          <span className="num font-medium">{t('nav.done', { done, total: LESSONS.length })}</span>
        </div>
        <Progress value={(done / LESSONS.length) * 100} label={t('nav.course')} className="mt-2 h-1 rounded-none" indicatorClassName={cn('rounded-none', complete ? 'bg-success' : 'bg-foreground/70')} />
      </div>

      <ol className="mt-5 grid min-w-0 grid-cols-1">
        {LESSONS.map((l) => {
          const isCurrent = l.id === current;
          const passed = isCompleted(progress, l.id);
          return (
            <li key={l.id} className="min-w-0">
              <Link
                to={`/learn/${l.id}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn('flex items-start gap-2.5 py-1.5 text-sm transition-colors', isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <StepMark n={l.n} complete={passed} current={isCurrent} />
                <span className="min-w-0 flex-1 leading-snug">{t(`lessons.${l.id}.title`)}</span>
                {passed && <span className="sr-only">({t('status.completed')})</span>}
              </Link>
              {isCurrent && (
                <ul className="mt-1 mb-2 ml-[0.6rem] grid border-l border-border">
                  {[...sections, { id: 'quiz', title: t('quiz.title') }].map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={active === s.id ? 'location' : undefined}
                        className={cn(
                          '-ml-px block border-l-2 py-1 pl-4 text-[13px] leading-snug transition-colors',
                          active === s.id ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
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
        <li className="mt-2 border-t border-border pt-2">
          <Link to={`/learn/${COMPLETE_SLUG}`} className="flex items-start gap-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <span className={cn('inline-flex w-5 shrink-0 justify-center', complete && 'text-success')} aria-hidden>
              {complete ? <Check className="mt-0.5 size-4" strokeWidth={2.5} /> : <Lock className="mt-0.5 size-3.5" />}
            </span>
            <span className="truncate">{t('nav.certificate')}</span>
          </Link>
        </li>
      </ol>
    </nav>
  );
}

/** Mobile & tablet: sticky top bar with the seven lessons as numbered steps. */
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
    <nav aria-label={t('nav.label')} className="sticky top-[var(--header-h)] z-[900] border-b border-border bg-background lg:hidden print:hidden">
      <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 sm:px-6">
        <Link to="/learn" className="inline-flex size-9 shrink-0 items-center justify-center text-muted-foreground hover:text-primary" aria-label={t('nav.overview')}>
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <ol ref={ref} className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto [scrollbar-width:none]">
          {LESSONS.map((l) => {
            const isCurrent = l.id === current;
            const passed = isCompleted(progress, l.id);
            return (
              <li key={l.id} className="flex shrink-0">
                <Link
                  to={`/learn/${l.id}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`${t('lesson.of', { n: l.n, total: LESSONS.length })}: ${t(`lessons.${l.id}.title`)}${passed ? ` (${t('status.completed')})` : ''}`}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 px-1.5 py-2.5 text-sm',
                    isCurrent ? 'border-foreground font-semibold text-foreground' : 'border-transparent text-muted-foreground',
                  )}
                >
                  <StepMark n={l.n} complete={passed} current={isCurrent} />
                  {isCurrent && <span className="max-w-40 truncate">{t(`lessons.${l.id}.title`)}</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
