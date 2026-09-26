import { ArrowRight, Award, BookOpen, Compass, Printer, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/primitives';
import { cn, formatDate } from '@/lib/utils';
import { LESSONS, TOTAL_MINUTES } from '../course';
import { useProgress } from '../hooks';
import { averageScore, completedCount, completionDate, courseProgressPct, isCompleted, isCourseComplete, nextIncomplete, type Progress } from '../progress';
import { LESSON_THEME } from '../theme';
import { StepDot } from './LessonNav';
import { ProgressRing } from './ProgressRing';

const NAME_KEY = 'inform.learn.certificateName';
const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};
const saveName = (v: string) => {
  try {
    localStorage.setItem(NAME_KEY, v);
  } catch {
    /* storage unavailable — the name simply is not remembered */
  }
};

export function CompletionView() {
  const progress = useProgress();
  return isCourseComplete(progress) ? <Completed progress={progress} /> : <NotYet progress={progress} />;
}

function NotYet({ progress }: { progress: Progress }) {
  const { t } = useTranslation('learn');
  const pct = courseProgressPct(progress);
  const next = nextIncomplete(progress);
  return (
    <PageContainer className="py-14">
      <div className="mx-auto max-w-2xl text-center">
        <ProgressRing value={pct} size={140} stroke={12} label={t('overview.progressLabel', { pct })} className="mx-auto">
          <span className="num font-display text-3xl font-extrabold">{pct}%</span>
        </ProgressRing>
        <h1 className="mt-6 text-3xl font-extrabold text-balance sm:text-4xl">{t('completion.notYetTitle')}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t('completion.notYetBody', { count: LESSONS.length - completedCount(progress) })}</p>
        <ul className="mt-8 grid gap-2 text-left">
          {LESSONS.map((l) => {
            const rec = progress[l.id];
            const done = isCompleted(progress, l.id);
            return (
              <li key={l.id}>
                <Link to={`/learn/${l.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40">
                  <StepDot n={l.n} complete={done} current={l.id === next} />
                  <span className="flex-1 font-medium">{t(`lessons.${l.id}.title`)}</span>
                  <span className={cn('text-xs font-semibold', done ? 'text-success' : 'text-muted-foreground')}>
                    {done && rec ? t('status.completedScore', { score: rec.score }) : t('status.notStarted')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {next && (
          <Button size="lg" className="mt-8" asChild>
            <Link to={`/learn/${next}`}>
              {t('overview.continue', { n: LESSONS.find((l) => l.id === next)?.n ?? 1 })} <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
    </PageContainer>
  );
}

function Completed({ progress }: { progress: Progress }) {
  const { t, i18n } = useTranslation('learn');
  const [name, setName] = React.useState(readName);
  const avg = averageScore(progress) ?? 0;
  const date = completionDate(progress);

  return (
    <div>
      {/* Print setup: landscape page, only the certificate. */}
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } }'}</style>

      <section className="relative overflow-hidden border-b border-border print:hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-tz-gold/20 blur-3xl" />
        <PageContainer className="relative py-14 text-center sm:py-20">
          <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }} className="relative mx-auto inline-flex">
            <span className="inline-flex size-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-tz-gold to-amber-500 text-slate-900 shadow-[var(--shadow-lift)]">
              <Trophy className="size-12" aria-hidden />
            </span>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute top-1/2 left-1/2 text-tz-gold"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x: Math.cos((i / 6) * Math.PI * 2) * 78, y: Math.sin((i / 6) * Math.PI * 2) * 78, opacity: [0, 1, 0], scale: 1 }}
                transition={{ duration: 1.4, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
              >
                <Sparkles className="size-4" />
              </motion.span>
            ))}
          </motion.div>
          <h1 className="mt-8 text-4xl font-extrabold text-balance sm:text-5xl">{t('completion.title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t('completion.lead')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/explore">
                <Compass /> {t('completion.explore')}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/methodology">
                <BookOpen /> {t('completion.methodology')}
              </Link>
            </Button>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="grid gap-8 py-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] print:block print:p-0">
        {/* Scores */}
        <div className="print:hidden">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <h2 className="text-lg font-bold">{t('completion.scores')}</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-muted/60 p-3">
                <div className="num font-display text-2xl font-extrabold">{avg}%</div>
                <div className="text-[11px] text-muted-foreground">{t('completion.average')}</div>
              </div>
              <div className="rounded-2xl bg-muted/60 p-3">
                <div className="num font-display text-2xl font-extrabold">{LESSONS.length}</div>
                <div className="text-[11px] text-muted-foreground">{t('overview.kpi.lessons')}</div>
              </div>
              <div className="rounded-2xl bg-muted/60 p-3">
                <div className="num font-display text-2xl font-extrabold">~{TOTAL_MINUTES}</div>
                <div className="text-[11px] text-muted-foreground">{t('overview.kpi.minutes')}</div>
              </div>
            </div>
            <ul className="mt-5 grid gap-3">
              {LESSONS.map((l) => {
                const rec = progress[l.id];
                const Icon = LESSON_THEME[l.id].icon;
                return (
                  <li key={l.id}>
                    <Link to={`/learn/${l.id}`} className="group block">
                      <div className="mb-1 flex items-center gap-2 text-sm">
                        <Icon className="size-4 text-muted-foreground" aria-hidden />
                        <span className="flex-1 truncate font-medium group-hover:text-primary">{t(`lessons.${l.id}.title`)}</span>
                        <span className="num font-display font-bold">{rec?.score ?? 0}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div className="h-full rounded-full bg-success" initial={{ width: 0 }} animate={{ width: `${rec?.score ?? 0}%` }} transition={{ duration: 0.8, delay: 0.1 * l.n }} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Certificate */}
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t('certificate.nameLabel')}</span>
              <Input
                value={name}
                maxLength={80}
                placeholder={t('certificate.namePlaceholder')}
                onChange={(e) => {
                  setName(e.target.value);
                  saveName(e.target.value);
                }}
              />
            </label>
            <Button size="lg" onClick={() => window.print()}>
              <Printer /> {t('certificate.print')}
            </Button>
          </div>
          <Certificate name={name.trim()} avg={avg} date={date ? formatDate(date, i18n.language, { dateStyle: 'long' }) : ''} />
          <p className="mt-3 text-center text-xs text-muted-foreground print:hidden">{t('certificate.honest')}</p>
        </div>
      </PageContainer>
    </div>
  );
}

function Certificate({ name, avg, date }: { name: string; avg: number; date: string }) {
  const { t } = useTranslation('learn');
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-2 shadow-[var(--shadow-lift)] [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:rounded-none print:border-0 print:bg-white print:p-0 print:text-slate-900 print:shadow-none"
      aria-label={t('certificate.aria', { name: name || t('certificate.namePlaceholder') })}
      role="group"
    >
      <div className="relative flex aspect-[1.414/1] flex-col print:aspect-auto print:h-[180mm] items-center justify-between overflow-hidden rounded-[1.4rem] border-2 border-double border-tz-gold/70 bg-gradient-to-br from-tz-gold/10 via-transparent to-primary/10 px-6 py-6 text-center sm:px-12 sm:py-10 print:rounded-none print:border-[3px] print:border-amber-400">
        <div className="flag-rule absolute inset-x-0 top-0 h-1.5" aria-hidden />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase print:text-blue-800">
          <Award className="size-4" aria-hidden /> {t('common:appName')}
        </div>
        <div className="relative">
          <div className="font-display text-[clamp(1.25rem,3.4vw,2.5rem)] leading-tight font-extrabold tracking-tight">{t('certificate.title')}</div>
          <div className="mt-2 text-[clamp(0.7rem,1.4vw,0.95rem)] text-muted-foreground print:text-slate-600">{t('certificate.certifies')}</div>
          <div className={cn('mt-2 border-b-2 border-tz-gold/60 px-6 pb-1 font-display text-[clamp(1.1rem,3vw,2.25rem)] font-bold', !name && 'text-muted-foreground/60 italic print:text-slate-400')}>
            {name || t('certificate.namePlaceholder')}
          </div>
          <p className="mx-auto mt-3 max-w-xl text-[clamp(0.65rem,1.3vw,0.95rem)] leading-relaxed text-muted-foreground print:text-slate-700">{t('certificate.body', { lessons: LESSONS.length })}</p>
        </div>
        <div className="relative grid w-full grid-cols-3 items-end gap-2 text-[clamp(0.6rem,1.1vw,0.8rem)]">
          <div>
            <div className="num font-display text-[clamp(0.9rem,2vw,1.4rem)] font-extrabold">{avg}%</div>
            <div className="border-t border-border pt-1 text-muted-foreground print:border-slate-300 print:text-slate-600">{t('certificate.score')}</div>
          </div>
          <div className="flex justify-center" aria-hidden>
            <span className="inline-flex size-[clamp(2.5rem,7vw,4.5rem)] items-center justify-center rounded-full bg-gradient-to-br from-tz-gold to-amber-500 text-slate-900 shadow-lg ring-4 ring-tz-gold/30">
              <Award className="size-1/2" />
            </span>
          </div>
          <div>
            <div className="font-display text-[clamp(0.8rem,1.6vw,1.1rem)] font-bold">{date || '—'}</div>
            <div className="border-t border-border pt-1 text-muted-foreground print:border-slate-300 print:text-slate-600">{t('certificate.date')}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
