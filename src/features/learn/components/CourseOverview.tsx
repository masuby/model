import { ArrowRight, Award, BookOpen, CircleCheck, Clock, Database, GraduationCap, Lock, MousePointerClick, RotateCcw, Target } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageContainer, SectionHeading } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { usePrefs } from '@/state/prefs';
import { COMPLETE_SLUG, LESSON_BY_ID, LESSONS, TOTAL_MINUTES, TOTAL_QUESTIONS } from '../course';
import { useProgress } from '../hooks';
import { averageScore, completedCount, courseProgressPct, isCompleted, isCourseComplete, nextIncomplete } from '../progress';
import { LESSON_THEME } from '../theme';
import { StepDot } from './LessonNav';
import { ProgressRing } from './ProgressRing';

const fade = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.45 } } as const;

export function CourseOverview() {
  const { t } = useTranslation('learn');
  const progress = useProgress();
  const done = completedCount(progress);
  const pct = courseProgressPct(progress);
  const avg = averageScore(progress);
  const upNext = nextIncomplete(progress);
  const complete = isCourseComplete(progress);

  const cta = complete
    ? { to: `/learn/${COMPLETE_SLUG}`, label: t('overview.viewCertificate'), icon: Award }
    : done === 0
      ? { to: `/learn/${upNext}`, label: t('overview.start'), icon: ArrowRight }
      : { to: `/learn/${upNext}`, label: t('overview.continue', { n: LESSON_BY_ID[upNext!].n }), icon: ArrowRight };

  return (
    <div>
      {/* ------------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 size-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
        <PageContainer className="relative grid items-center gap-10 py-12 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-xs backdrop-blur">
              <GraduationCap className="size-3.5 text-primary" aria-hidden />
              {t('overview.eyebrow', { lessons: LESSONS.length, minutes: TOTAL_MINUTES })}
            </div>
            <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold text-balance sm:text-5xl xl:text-6xl">{t('overview.title')}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('overview.lead')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to={cta.to}>
                  {cta.label} <cta.icon />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/methodology">
                  <BookOpen /> {t('overview.methodology')}
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-6">
              <div>
                <dt className="text-xs text-muted-foreground">{t('overview.kpi.lessons')}</dt>
                <dd className="num font-display text-2xl font-extrabold">{LESSONS.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('overview.kpi.minutes')}</dt>
                <dd className="num font-display text-2xl font-extrabold">~{TOTAL_MINUTES}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('overview.kpi.questions')}</dt>
                <dd className="num font-display text-2xl font-extrabold">{TOTAL_QUESTIONS}</dd>
              </div>
            </dl>
          </motion.div>

          {/* Progress card */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.1 }}>
            <div className="glass relative overflow-hidden rounded-[2rem] p-6 shadow-[var(--shadow-lift)] sm:p-8">
              <div className="flag-rule absolute inset-x-0 top-0 h-1" aria-hidden />
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <ProgressRing value={pct} size={150} stroke={12} barClassName={complete ? 'stroke-success' : 'stroke-primary'} label={t('overview.progressLabel', { pct })}>
                  <span className="num font-display text-4xl font-extrabold tracking-tight">{pct}%</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{t('overview.complete')}</span>
                </ProgressRing>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t('overview.yourProgress')}</div>
                  <div className="mt-1 text-2xl font-extrabold">{t('overview.lessonsDone', { done, total: LESSONS.length })}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{avg == null ? t('overview.noScoreYet') : t('overview.avgScore', { score: avg })}</div>
                  <div className="mt-4 flex justify-center gap-1.5 sm:justify-start" aria-hidden>
                    {LESSONS.map((l) => (
                      <StepDot key={l.id} n={l.n} complete={isCompleted(progress, l.id)} current={l.id === upNext} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
                <span>{t('overview.savedLocally')}</span>
                {done > 0 && <ResetProgress />}
              </div>
            </div>
          </motion.div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ How it works */}
      <PageContainer className="py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {([
            { key: 'read', icon: BookOpen },
            { key: 'try', icon: MousePointerClick },
            { key: 'quiz', icon: Target },
          ] as const).map((s, i) => (
            <motion.div key={s.key} {...fade} transition={{ duration: 0.45, delay: i * 0.06 }} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-bold">
                  <span className="num mr-1.5 text-primary">{i + 1}.</span>
                  {t(`overview.how.${s.key}.title`)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`overview.how.${s.key}.body`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </PageContainer>

      {/* ------------------------------------------------------------------ Lessons */}
      <PageContainer>
        <SectionHeading eyebrow={t('overview.pathEyebrow')} title={t('overview.pathTitle')} description={t('overview.pathLead')} />
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {LESSONS.map((l, i) => {
            const theme = LESSON_THEME[l.id];
            const rec = progress[l.id];
            const isNext = l.id === upNext;
            return (
              <motion.li key={l.id} {...fade} transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}>
                <Link
                  to={`/learn/${l.id}`}
                  className={cn(
                    'group relative flex h-full flex-col rounded-3xl border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]',
                    isNext ? 'border-primary/50 ring-4 ring-primary/10' : 'border-border',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn('inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br', theme.tint)}>
                      <theme.icon className="size-6" aria-hidden />
                    </div>
                    {rec?.completed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-bold text-success">
                        <CircleCheck className="size-3.5" aria-hidden /> {rec.score}%
                      </span>
                    ) : isNext ? (
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">{t('status.upNext')}</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{t('status.notStarted')}</span>
                    )}
                  </div>
                  <div className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t('lesson.of', { n: l.n, total: LESSONS.length })}</div>
                  <h3 className="mt-1 text-lg leading-snug font-bold group-hover:text-primary">{t(`lessons.${l.id}.title`)}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t(`lessons.${l.id}.summary`)}</p>
                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden /> {t('overview.minutes', { count: l.minutes })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Database className="size-3.5" aria-hidden /> {t('overview.liveWidget')}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      {rec?.completed ? t('status.review') : isNext && done > 0 ? t('status.continue') : t('status.start')}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                  {rec?.completed && <span className="sr-only">{t('status.completedScore', { score: rec.score })}</span>}
                </Link>
              </motion.li>
            );
          })}

          {/* Certificate tile */}
          <motion.li {...fade} transition={{ duration: 0.45, delay: 0.18 }}>
            <Link
              to={`/learn/${COMPLETE_SLUG}`}
              className={cn(
                'group relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1',
                complete ? 'border-tz-gold/60 bg-gradient-to-br from-tz-gold/25 via-card to-card shadow-[var(--shadow-lift)]' : 'border-dashed border-border bg-muted/30',
              )}
            >
              <div className={cn('inline-flex size-12 items-center justify-center rounded-2xl', complete ? 'bg-tz-gold text-slate-900' : 'bg-muted text-muted-foreground')}>
                {complete ? <Award className="size-6" aria-hidden /> : <Lock className="size-5" aria-hidden />}
              </div>
              <div className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t('overview.finalStep')}</div>
              <h3 className="mt-1 text-lg leading-snug font-bold">{t('nav.certificate')}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{complete ? t('overview.certReady') : t('overview.certLocked', { count: LESSONS.length - done })}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {complete ? t('overview.viewCertificate') : t('overview.seeWhatsLeft')} <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </Link>
          </motion.li>
        </ol>
      </PageContainer>

      {/* ------------------------------------------------------------------ Honest note */}
      <PageContainer className="pt-16">
        <div className="rounded-3xl border border-border bg-card/60 px-6 py-6 text-sm leading-relaxed text-muted-foreground sm:px-8">
          <span className="font-semibold text-foreground">{t('overview.aboutTitle')}</span> {t('overview.about')}
        </div>
      </PageContainer>
    </div>
  );
}

function ResetProgress() {
  const { t } = useTranslation('learn');
  const resetProgress = usePrefs((s) => s.resetProgress);
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <RotateCcw /> {t('overview.reset')}
        </Button>
      </DialogTrigger>
      <DialogContent title={t('overview.resetTitle')} description={t('overview.resetBody')}>
        <div className="flex justify-end gap-2 p-5">
          <DialogClose asChild>
            <Button variant="outline">{t('common:actions.cancel')}</Button>
          </DialogClose>
          <Button
            variant="danger"
            onClick={() => {
              resetProgress();
              setOpen(false);
            }}
          >
            <RotateCcw /> {t('overview.resetConfirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
