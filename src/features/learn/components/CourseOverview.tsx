/**
 * Course overview - an editorial title block with a "start here" line (or the learner's progress once
 * a lesson is passed) beside it, the lessons as a ruled table of contents, and a short "how it works"
 * column. No cards, no decoration.
 */
import { ArrowRight, Check, Lock, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Kicker, Note, PageContainer, Section, SectionHeading } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger, Progress } from '@/components/ui/primitives';
import { cn, NO_VALUE } from '@/lib/utils';
import { usePrefs } from '@/state/prefs';
import { COMPLETE_SLUG, LESSON_BY_ID, LESSONS, TOTAL_MINUTES, TOTAL_QUESTIONS, type LessonId } from '../course';
import { useProgress } from '../hooks';
import { averageScore, completedCount, courseProgressPct, isCourseComplete, nextIncomplete } from '../progress';
import { preloadWidget } from '../widgets';
import { FigureRow } from './FigureRow';
import { RichText } from './RichText';

const STEPS = ['read', 'try', 'quiz'] as const;

export function CourseOverview() {
  const { t } = useTranslation('learn');
  const progress = useProgress();
  const done = completedCount(progress);
  const pct = courseProgressPct(progress);
  const avg = averageScore(progress);
  const upNext = nextIncomplete(progress);
  const complete = isCourseComplete(progress);

  /** Fetch a lesson's widget chunk as soon as a link to it is pointed at or focused. */
  const warm = (id: LessonId | null) => (id ? { onPointerEnter: () => preloadWidget(LESSON_BY_ID[id].widget), onFocus: () => preloadWidget(LESSON_BY_ID[id].widget) } : {});
  const first = LESSONS[0];

  const cta = complete
    ? { to: `/learn/${COMPLETE_SLUG}`, label: t('overview.viewCertificate') }
    : done === 0
      ? { to: `/learn/${upNext}`, label: t('overview.start') }
      : { to: `/learn/${upNext}`, label: t('overview.continue', { n: LESSON_BY_ID[upNext!].n }) };

  return (
    <div>
      {/* ------------------------------------------------------------------ Title block */}
      <PageContainer className="grid gap-12 pt-12 pb-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20 lg:pt-20 lg:pb-16">
        <div>
          <Kicker className="mb-4">{t('overview.kicker')}</Kicker>
          <h1 className="max-w-3xl text-[2.5rem] leading-[1.05] text-balance sm:text-[3.2rem] lg:text-[3.6rem]">{t('overview.title')}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t('overview.lead')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to={cta.to} {...warm(complete ? null : upNext)}>
                {cta.label} <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/methodology">{t('overview.methodology')}</Link>
            </Button>
          </div>
          <FigureRow
            className="mt-14 max-w-2xl border-t border-border pt-8"
            items={[
              { label: t('overview.kpi.lessons'), value: LESSONS.length },
              { label: t('overview.kpi.minutes'), value: `~${TOTAL_MINUTES}` },
              { label: t('overview.kpi.questions'), value: TOTAL_QUESTIONS },
            ]}
          />
        </div>

        {/* Start here, then progress - set off by a rule, not a box. Its top lines up with the title. */}
        <aside aria-labelledby="learn-progress" className="self-start border-t border-border pt-6 lg:mt-[2.6rem] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          {done === 0 ? (
            <>
              <h2 id="learn-progress" className="font-sans text-sm font-medium tracking-normal text-muted-foreground">
                {t('overview.startHere')}
              </h2>
              <Link to={`/learn/${first.id}`} className="group mt-3 block border-b border-border pb-4 lg:border-t lg:pt-4" {...warm(first.id)}>
                <span className="block text-sm text-muted-foreground">
                  {t('lesson.of', { n: first.n, total: LESSONS.length })} <span aria-hidden>·</span> {t('overview.minutes', { count: first.minutes })}
                </span>
                <span className="mt-1 flex items-center justify-between gap-3 font-display text-2xl leading-tight font-semibold group-hover:text-primary">
                  {t(`lessons.${first.id}.title`)}
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                </span>
              </Link>
            </>
          ) : (
            <>
              <h2 id="learn-progress" className="font-sans text-sm font-medium tracking-normal text-muted-foreground">
                {t('overview.yourProgress')}
              </h2>
              <p className="num mt-1.5 text-3xl font-semibold tracking-tight sm:text-[2.1rem]">{pct}%</p>
              <p className="mt-1 text-sm">{t('overview.lessonsDone', { done, total: LESSONS.length })}</p>
              <Progress value={pct} label={t('overview.progressLabel', { pct })} className="mt-4 h-1 rounded-none" indicatorClassName={cn('rounded-none', complete ? 'bg-success' : 'bg-foreground/70')} />
              <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
                {avg != null && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">{t('overview.avgLabel')}</dt>
                    <dd className="num font-medium">{avg}%</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{t('overview.nextLabel')}</dt>
                  <dd className="text-right font-medium">{complete ? t('nav.certificate') : upNext ? t(`lessons.${upNext}.title`) : NO_VALUE}</dd>
                </div>
              </dl>
            </>
          )}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t('overview.savedLocally')}</p>
          {done > 0 && <ResetProgress />}
        </aside>
      </PageContainer>

      <PageContainer>
        {/* ---------------------------------------------------------------- Lessons */}
        <Section className="pt-12 sm:pt-14">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
            <div>
              <SectionHeading title={t('overview.pathTitle')} description={t('overview.pathLead')} />
              <ol className="border-t border-border">
                {LESSONS.map((l) => {
                  const rec = progress[l.id];
                  const isNext = l.id === upNext;
                  return (
                    <Row
                      key={l.id}
                      to={`/learn/${l.id}`}
                      linkProps={warm(l.id)}
                      mark={l.n}
                      strong={isNext}
                      srPrefix={`${t('lesson.of', { n: l.n, total: LESSONS.length })}: `}
                      title={t(`lessons.${l.id}.title`)}
                      summary={t(`lessons.${l.id}.summary`)}
                      status={
                        rec?.completed ? (
                          <span className="inline-flex items-center gap-1 font-medium text-success">
                            <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> {t('status.completedScore', { score: rec.score })}
                          </span>
                        ) : isNext ? (
                          <span className="font-medium text-foreground">{t('status.upNext')}</span>
                        ) : null
                      }
                      meta={t('overview.minutes', { count: l.minutes })}
                    />
                  );
                })}
                <Row
                  to={`/learn/${COMPLETE_SLUG}`}
                  mark={complete ? <Check className="size-5 text-success" strokeWidth={2.5} /> : <Lock className="size-5 text-muted-foreground" />}
                  title={t('nav.certificate')}
                  summary={complete ? t('overview.certReady') : t('overview.certLocked', { count: LESSONS.length - done })}
                  status={complete ? <span className="font-medium text-success">{t('status.ready')}</span> : null}
                />
              </ol>
            </div>

            {/* ---------------------------------------------------------------- How it works */}
            <aside aria-labelledby="learn-how" className="lg:pt-2">
              <h2 id="learn-how" className="text-[1.4rem] leading-tight">
                {t('overview.howTitle')}
              </h2>
              <ol className="mt-5 divide-y divide-border border-y border-border">
                {STEPS.map((s, i) => (
                  <li key={s} className="grid grid-cols-[1.75rem_1fr] py-4">
                    <span className="num font-display text-lg leading-6 text-muted-foreground" aria-hidden>
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{t(`overview.how.${s}.title`)}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`overview.how.${s}.body`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Note title={t('overview.aboutTitle')} className="mt-8">
                {t('overview.about')}
              </Note>
            </aside>
          </div>
        </Section>
      </PageContainer>
    </div>
  );
}

/** One ruled table-of-contents row: number, title and summary, status and length. */
function Row({
  to,
  linkProps,
  mark,
  strong = false,
  srPrefix,
  title,
  summary,
  status,
  meta,
}: {
  to: string;
  linkProps?: Pick<React.ComponentProps<typeof Link>, 'onPointerEnter' | 'onFocus'>;
  mark: React.ReactNode;
  strong?: boolean;
  srPrefix?: string;
  title: string;
  summary: string;
  status?: React.ReactNode;
  meta?: string;
}) {
  return (
    <li className="border-b border-border">
      <Link to={to} {...linkProps} className="group grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_10rem] sm:gap-x-6">
        <span className={cn('num pt-0.5 font-display text-2xl leading-none', strong ? 'text-foreground' : 'text-muted-foreground')} aria-hidden>
          {mark}
        </span>
        <span className="min-w-0">
          {srPrefix && <span className="sr-only">{srPrefix}</span>}
          <span className="block text-lg leading-snug font-semibold group-hover:text-primary group-hover:underline group-hover:underline-offset-4">{title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
            <RichText text={summary} />
          </span>
        </span>
        <span className="col-start-2 mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:col-start-3 sm:mt-0 sm:flex-col sm:items-end sm:pt-1 sm:text-right">
          {status}
          {meta && <span className="num text-muted-foreground">{meta}</span>}
        </span>
      </Link>
    </li>
  );
}

function ResetProgress() {
  const { t } = useTranslation('learn');
  const resetProgress = usePrefs((s) => s.resetProgress);
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-2 -ml-3 text-muted-foreground">
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
