import { ArrowLeft, ArrowRight, BookOpen, CircleCheck, Clock, Lock, Sparkles, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/Page';
import { cn } from '@/lib/utils';
import { COMPLETE_SLUG, LESSON_BY_ID, LESSONS, type LessonId } from '../course';
import { useActiveSection, useLessonContent, useProgress } from '../hooks';
import { isCompleted, nextLessonAfter, passMark, previousLessonBefore } from '../progress';
import { LESSON_THEME } from '../theme';
import { BlockView } from './Blocks';
import { LessonSideNav, LessonTopBar, ReadingProgress } from './LessonNav';
import { Quiz } from './Quiz';
import { RichText } from './RichText';

export function LessonView({ id }: { id: LessonId }) {
  const { t } = useTranslation('learn');
  const content = useLessonContent(id);
  const meta = LESSON_BY_ID[id];
  const theme = LESSON_THEME[id];
  const progress = useProgress();
  const record = progress[id];
  const sectionIds = [...content.sections.map((s) => s.id), 'quiz'];
  const active = useActiveSection(sectionIds);
  const prev = previousLessonBefore(id);
  const next = nextLessonAfter(id);
  const unlocked = isCompleted(progress, id);
  const total = meta.answers.length;

  return (
    <div>
      <ReadingProgress />
      <LessonTopBar current={id} />

      {/* ------------------------------------------------------------------ Lesson hero */}
      <header className="relative overflow-hidden border-b border-border bg-card/40">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className={cn('pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-gradient-to-br opacity-70 blur-3xl', theme.tint)} />
        <PageContainer className="relative py-10 sm:py-14">
          <div className="lg:pl-[calc(17rem+2.5rem)]">
            <nav aria-label={t('nav.breadcrumb')} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Link to="/learn" className="hover:text-primary">
                {t('overview.eyebrowShort')}
              </Link>
              <span aria-hidden>/</span>
              <span className="text-foreground">{t('lesson.of', { n: meta.n, total: LESSONS.length })}</span>
            </nav>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mt-5 flex items-start gap-4 sm:gap-5">
              <div className={cn('hidden size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-[var(--shadow-soft)] ring-1 ring-border sm:inline-flex', theme.tint)}>
                <theme.icon className="size-8" aria-hidden />
              </div>
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="tracking-[0.16em] text-primary uppercase">{t('lesson.of', { n: meta.n, total: LESSONS.length })}</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden /> {t('overview.minutes', { count: meta.minutes })}
                  </span>
                  {record?.completed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-success">
                      <CircleCheck className="size-3.5" aria-hidden /> {t('status.completedScore', { score: record.score })}
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-3xl leading-tight font-extrabold text-balance sm:text-4xl lg:text-5xl">{content.title}</h1>
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{content.subtitle}</p>
              </div>
            </motion.div>
          </div>
        </PageContainer>
      </header>

      {/* ------------------------------------------------------------------ Body */}
      <PageContainer className="grid gap-10 py-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <LessonSideNav current={id} sections={content.sections} active={active} />
        </aside>

        <article className="min-w-0 max-w-3xl">
          {/* Objectives */}
          {content.objectives.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Target className="size-4 text-primary" aria-hidden /> {t('lesson.objectives')}
              </div>
              <ul className="mt-3 grid gap-2">
                {content.objectives.map((o, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="num mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
                    <span>
                      <RichText text={o} />
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <BookOpen className="size-3.5" aria-hidden /> {t('lesson.sections', { count: content.sections.length })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Target className="size-3.5" aria-hidden /> {t('quiz.meta', { n: total, mark: passMark(total) })}
                </span>
              </div>
            </div>
          )}

          {/* Sections */}
          {content.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-32 pt-10 lg:scroll-mt-24">
              <motion.h2
                id={`${s.id}-h`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4 }}
                className="flex items-baseline gap-3 text-2xl font-bold text-balance sm:text-[1.75rem]"
              >
                <span className="num font-display text-base font-bold text-primary/70">{`${meta.n}.${i + 1}`}</span>
                <span>{s.title}</span>
              </motion.h2>
              {s.blocks.map((b, j) => (
                <BlockView key={j} block={b} />
              ))}
            </section>
          ))}

          {/* Takeaways */}
          {content.takeaways.length > 0 && (
            <div className="mt-12 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="size-4 text-primary" aria-hidden /> {t('lesson.takeaways')}
              </div>
              <ul className="mt-3 grid gap-2.5">
                {content.takeaways.map((k, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                    <span>
                      <RichText text={k} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quiz */}
          <section id="quiz" aria-label={t('quiz.title')} className="scroll-mt-32 pt-10 lg:scroll-mt-24">
            <Quiz key={id} lessonId={id} items={content.quiz} />
          </section>

          {/* Prev / next */}
          <nav aria-label={t('nav.pager')} className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <PagerLink to={`/learn/${prev}`} dir="prev" eyebrow={t('nav.previous')} title={t(`lessons.${prev}.title`)} />
            ) : (
              <PagerLink to="/learn" dir="prev" eyebrow={t('nav.overview')} title={t('overview.title')} />
            )}
            {unlocked ? (
              next ? (
                <PagerLink to={`/learn/${next}`} dir="next" eyebrow={t('nav.next')} title={t(`lessons.${next}.title`)} />
              ) : (
                <PagerLink to={`/learn/${COMPLETE_SLUG}`} dir="next" eyebrow={t('nav.finish')} title={t('nav.certificate')} />
              )
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground sm:justify-end sm:text-right">
                <Lock className="size-4 shrink-0" aria-hidden />
                <span>{t('nav.locked', { mark: passMark(total), total })}</span>
              </div>
            )}
          </nav>
        </article>
      </PageContainer>
    </div>
  );
}

function PagerLink({ to, dir, eyebrow, title }: { to: string; dir: 'prev' | 'next'; eyebrow: string; title: string }) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]',
        dir === 'next' && 'sm:flex-row-reverse sm:text-right',
      )}
    >
      {dir === 'prev' ? (
        <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" aria-hidden />
      ) : (
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
      )}
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-muted-foreground">{eyebrow}</span>
        <span className="block truncate font-semibold group-hover:text-primary">{title}</span>
      </span>
    </Link>
  );
}
