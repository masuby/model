import { ArrowRight, Printer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageContainer, PageHeader, Section } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Input, Progress as ProgressBar } from '@/components/ui/primitives';
import { cn, formatDate } from '@/lib/utils';
import { LESSONS, TOTAL_MINUTES } from '../course';
import { useProgress } from '../hooks';
import { averageScore, completedCount, completionDate, courseProgressPct, isCompleted, isCourseComplete, nextIncomplete, type Progress } from '../progress';
import { FigureRow } from './FigureRow';
import { StepMark } from './LessonNav';

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
  const done = completedCount(progress);
  // "Almost there" only once at least half the course is done; before that, a neutral title.
  const title = done * 2 >= LESSONS.length ? t('completion.notYetTitle') : t('completion.waitingTitle');
  return (
    <div>
      <PageHeader
        eyebrow={t('nav.certificate')}
        title={title}
        description={t('completion.notYetBody', { count: LESSONS.length - done })}
        actions={
          next ? (
            <Button size="lg" asChild>
              <Link to={`/learn/${next}`}>
                {done === 0 ? t('overview.start') : t('overview.continue', { n: LESSONS.find((l) => l.id === next)?.n ?? 1 })} <ArrowRight />
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PageContainer className="pt-10 pb-4">
        <div className="max-w-2xl">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{t('overview.yourProgress')}</span>
            <span className="num font-medium">{pct}%</span>
          </div>
          <ProgressBar value={pct} label={t('overview.progressLabel', { pct })} className="mt-2 h-1 rounded-none" indicatorClassName="rounded-none bg-foreground/70" />
          <ol className="mt-8 border-t border-border">
            {LESSONS.map((l) => {
              const rec = progress[l.id];
              const passed = isCompleted(progress, l.id);
              return (
                <li key={l.id} className="border-b border-border">
                  <Link to={`/learn/${l.id}`} className="group flex items-center gap-4 py-3.5">
                    <StepMark n={l.n} complete={passed} current={l.id === next} />
                    <span className="flex-1 font-medium group-hover:text-primary">{t(`lessons.${l.id}.title`)}</span>
                    {/* Only passed lessons and the next one carry a status; the rest need none. */}
                    {(passed || l.id === next) && (
                      <span className={cn('text-sm', passed ? 'font-medium text-success' : 'font-medium text-foreground')}>
                        {passed && rec ? t('status.completedScore', { score: rec.score }) : t('status.upNext')}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </PageContainer>
    </div>
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

      <div className="print:hidden">
        <PageHeader
          eyebrow={t('nav.certificate')}
          title={t('completion.title')}
          description={t('completion.lead')}
          actions={
            <>
              <Button size="lg" asChild>
                <Link to="/explore">
                  {t('completion.explore')} <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/methodology">{t('completion.methodology')}</Link>
              </Button>
            </>
          }
        />
      </div>

      <PageContainer className="print:max-w-none print:p-0">
        <Section ruled={false} className="grid gap-14 pt-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16 print:block print:p-0">
          {/* Scores */}
          <div className="print:hidden">
            <h2 className="text-[1.4rem] leading-tight">{t('completion.scores')}</h2>
            <FigureRow
              compact
              className="mt-6"
              items={[
                { label: t('completion.average'), value: `${avg}%` },
                { label: t('overview.kpi.lessons'), value: LESSONS.length },
                { label: t('overview.kpi.minutes'), value: `~${TOTAL_MINUTES}` },
              ]}
            />
            <ol className="mt-6 border-t border-border">
              {LESSONS.map((l) => {
                const score = progress[l.id]?.score ?? 0;
                return (
                  <li key={l.id} className="border-b border-border">
                    <Link to={`/learn/${l.id}`} className="group block py-3">
                      <span className="flex items-baseline gap-3 text-sm">
                        <span className="num w-4 text-muted-foreground">{l.n}</span>
                        <span className="min-w-0 flex-1 truncate font-medium group-hover:text-primary">{t(`lessons.${l.id}.title`)}</span>
                        <span className="num font-semibold">{score}%</span>
                      </span>
                      <span className="mt-2 ml-7 block h-1 bg-muted" aria-hidden>
                        <span className="block h-full bg-foreground/60" style={{ width: `${score}%` }} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Certificate */}
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
              <label className="min-w-0 flex-1">
                <span className="mb-1.5 block text-sm text-muted-foreground">{t('certificate.nameLabel')}</span>
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
            <p className="mt-3 text-sm text-muted-foreground print:hidden">{t('certificate.honest')}</p>
          </div>
        </Section>
      </PageContainer>
    </div>
  );
}

/** A restrained, printable certificate: a double hairline frame, serif type, no colour. */
function Certificate({ name, avg, date }: { name: string; avg: number; date: string }) {
  const { t } = useTranslation('learn');
  return (
    <div
      className="rounded-md border border-border bg-card p-2 [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:rounded-none print:border-0 print:bg-white print:p-0 print:text-slate-900"
      aria-label={t('certificate.aria', { name: name || t('certificate.namePlaceholder') })}
      role="group"
    >
      <div className="flex aspect-[1.414/1] flex-col items-center justify-between border border-foreground/25 px-6 py-7 text-center outline outline-offset-[-7px] outline-foreground/15 sm:px-14 sm:py-12 print:aspect-auto print:h-[180mm] print:border-slate-400 print:outline-slate-300">
        <div className="font-display text-[clamp(0.8rem,1.5vw,1.05rem)] font-semibold tracking-tight">{t('common:appName')}</div>
        <div className="w-full">
          <div className="font-display text-[clamp(1.35rem,3.6vw,2.6rem)] leading-tight font-semibold tracking-tight">{t('certificate.title')}</div>
          <div className="mt-[clamp(0.5rem,1.6vw,1.25rem)] text-[clamp(0.7rem,1.4vw,0.95rem)] text-muted-foreground print:text-slate-600">{t('certificate.certifies')}</div>
          <div
            className={cn(
              'mx-auto mt-2 max-w-[80%] border-b border-foreground/40 px-6 pb-1.5 font-display text-[clamp(1.15rem,3vw,2.2rem)] font-semibold print:border-slate-500',
              !name && 'text-muted-foreground/70 italic print:text-slate-400',
            )}
          >
            {name || t('certificate.namePlaceholder')}
          </div>
          <p className="mx-auto mt-[clamp(0.5rem,1.6vw,1.25rem)] max-w-xl text-[clamp(0.65rem,1.3vw,0.95rem)] leading-relaxed text-muted-foreground print:text-slate-700">
            {t('certificate.body', { lessons: LESSONS.length })}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-[clamp(1.5rem,8vw,6rem)] text-[clamp(0.6rem,1.1vw,0.8rem)]">
          <div>
            <div className="num font-display text-[clamp(0.9rem,2vw,1.4rem)] font-semibold">{avg}%</div>
            <div className="mt-1 border-t border-foreground/30 pt-1 text-muted-foreground print:border-slate-400 print:text-slate-600">{t('certificate.score')}</div>
          </div>
          <div>
            <div className="font-display text-[clamp(0.9rem,2vw,1.4rem)] font-semibold">{date || '—'}</div>
            <div className="mt-1 border-t border-foreground/30 pt-1 text-muted-foreground print:border-slate-400 print:text-slate-600">{t('certificate.date')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
