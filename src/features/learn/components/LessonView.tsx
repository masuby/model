import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/Page';
import { cn } from '@/lib/utils';
import { COMPLETE_SLUG, LESSON_BY_ID, LESSONS, type LessonId } from '../course';
import { useActiveSection, useLessonContent, useProgress } from '../hooks';
import { nextLessonAfter, previousLessonBefore } from '../progress';
import { preloadWidget } from '../widgets';
import { BlockView } from './Blocks';
import { LessonSideNav, LessonTopBar, ReadingProgress } from './LessonNav';
import { Quiz } from './Quiz';
import { RichText } from './RichText';

/** Left offset that lines the header up with the reading column (side nav width + gap). */
const COLUMN_OFFSET = 'lg:pl-[calc(16rem+4rem)]';

/**
 * A lesson section opens with a hairline. A ruled block (formula, terms, comparison) that ends the
 * section drops its own bottom rule, so it is never doubled by the next section's top rule.
 */
const SECTION = cn(
  'mt-14 scroll-mt-32 border-t border-border pt-10 lg:scroll-mt-24',
  '[&>[data-ruled]:last-child]:mb-0 [&>[data-ruled]:last-child]:border-b-0 [&>[data-ruled]:last-child]:pb-0',
);

export function LessonView({ id }: { id: LessonId }) {
  const { t } = useTranslation('learn');
  const content = useLessonContent(id);
  const meta = LESSON_BY_ID[id];
  const progress = useProgress();
  const record = progress[id];
  const sectionIds = [...content.sections.map((s) => s.id), 'quiz'];
  const active = useActiveSection(sectionIds);
  const prev = previousLessonBefore(id);
  const next = nextLessonAfter(id);

  // Fetch this lesson's widget chunk straight away, and the next lesson's once the browser is idle.
  React.useEffect(() => {
    preloadWidget(meta.widget);
    if (!next) return;
    const later = () => preloadWidget(LESSON_BY_ID[next].widget);
    // Safari has no requestIdleCallback; fall back to a plain delay there.
    if (typeof window.requestIdleCallback === 'function') {
      const h = window.requestIdleCallback(later, { timeout: 4000 });
      return () => window.cancelIdleCallback(h);
    }
    const h = setTimeout(later, 2500);
    return () => clearTimeout(h);
  }, [meta.widget, next]);

  return (
    <div>
      <ReadingProgress />
      <LessonTopBar current={id} />

      {/* ------------------------------------------------------------------ Title block */}
      <header className="border-b border-border">
        <PageContainer className="pt-8 pb-10 sm:pt-12 sm:pb-12">
          <div className={COLUMN_OFFSET}>
            <nav aria-label={t('nav.breadcrumb')} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/learn" className="hover:text-primary hover:underline hover:underline-offset-4">
                {t('overview.eyebrowShort')}
              </Link>
              <span aria-hidden>/</span>
              <span className="text-foreground">{t('lesson.of', { n: meta.n, total: LESSONS.length })}</span>
            </nav>
            <h1 className="mt-5 max-w-3xl text-[2.1rem] leading-[1.08] text-balance sm:text-[2.7rem] lg:text-[3.1rem]">{content.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{content.subtitle}</p>
            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>{t('overview.minutes', { count: meta.minutes })}</span>
              <span aria-hidden>·</span>
              <span>{t('lesson.sections', { count: content.sections.length })}</span>
              {record?.completed && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-success">
                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> {t('status.completedScore', { score: record.score })}
                  </span>
                </>
              )}
            </p>
          </div>
        </PageContainer>
      </header>

      {/* ------------------------------------------------------------------ Body */}
      <PageContainer className="grid gap-16 pt-10 pb-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:pt-12">
        <aside className="hidden lg:block">
          <LessonSideNav current={id} sections={content.sections} active={active} />
        </aside>

        <article className="min-w-0 max-w-[44rem]">
          {/* Objectives */}
          {content.objectives.length > 0 && (
            <section aria-labelledby={`${id}-objectives`}>
              <h2 id={`${id}-objectives`} className="font-sans text-sm font-semibold tracking-normal">
                {t('lesson.objectives')}
              </h2>
              <ol className="mt-4 grid gap-2.5">
                {content.objectives.map((o, i) => (
                  <li key={i} className="grid grid-cols-[1.75rem_1fr] text-[1.0625rem] leading-relaxed">
                    <span className="num text-muted-foreground" aria-hidden>
                      {i + 1}
                    </span>
                    <span>
                      <RichText text={o} />
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Sections */}
          {content.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className={SECTION}>
              <h2 id={`${s.id}-h`} className="flex items-baseline gap-3 text-[1.7rem] leading-tight text-balance sm:text-[2rem]">
                <span className="num shrink-0 font-sans text-base font-medium tracking-normal text-muted-foreground">{`${meta.n}.${i + 1}`}</span>
                <span>{s.title}</span>
              </h2>
              {s.blocks.map((b, j) => (
                <BlockView key={j} block={b} />
              ))}
            </section>
          ))}

          {/* Takeaways */}
          {content.takeaways.length > 0 && (
            <section aria-labelledby={`${id}-takeaways`} className="mt-14 border-l-2 border-foreground/70 py-1 pl-6">
              <h2 id={`${id}-takeaways`} className="text-xl sm:text-2xl">
                {t('lesson.takeaways')}
              </h2>
              <ul className="mt-4 grid gap-3">
                {content.takeaways.map((k, i) => (
                  <li key={i} className="grid grid-cols-[1.5rem_1fr] leading-relaxed">
                    <span className="text-muted-foreground" aria-hidden>
                      —
                    </span>
                    <span>
                      <RichText text={k} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quiz */}
          <section id="quiz" aria-label={t('quiz.title')} className="mt-14 scroll-mt-32 lg:scroll-mt-24">
            <Quiz key={id} lessonId={id} items={content.quiz} />
          </section>

          {/* Prev / next */}
          <nav aria-label={t('nav.pager')} className="mt-14 grid border-t border-border sm:grid-cols-2">
            {prev ? (
              <PagerLink to={`/learn/${prev}`} dir="prev" label={t('nav.previous')} title={t(`lessons.${prev}.title`)} />
            ) : (
              <PagerLink to="/learn" dir="prev" label={t('nav.overview')} title={t('overview.title')} />
            )}
            {/* Every lesson is open (side nav, step bar, overview); the quiz states its own pass mark. */}
            {next ? (
              <PagerLink to={`/learn/${next}`} dir="next" label={t('nav.next')} title={t(`lessons.${next}.title`)} />
            ) : (
              <PagerLink to={`/learn/${COMPLETE_SLUG}`} dir="next" label={t('nav.finish')} title={t('nav.certificate')} />
            )}
          </nav>
        </article>
      </PageContainer>
    </div>
  );
}

function PagerLink({ to, dir, label, title }: { to: string; dir: 'prev' | 'next'; label: string; title: string }) {
  const Arrow = dir === 'prev' ? ArrowLeft : ArrowRight;
  return (
    <Link to={to} className={cn('group block py-6', dir === 'prev' ? 'sm:pr-6' : 'border-t border-border sm:border-t-0 sm:border-l sm:pl-6 sm:text-right')}>
      <span className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', dir === 'next' && 'sm:justify-end')}>
        {dir === 'prev' && <Arrow className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden />}
        {label}
        {dir === 'next' && <Arrow className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />}
      </span>
      <span className="mt-1.5 block font-display text-xl leading-snug font-semibold text-balance group-hover:text-primary">{title}</span>
    </Link>
  );
}
