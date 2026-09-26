import { ArrowRight, BookOpen, Check, CircleCheck, CircleX, Flag, RotateCcw, Target, Trophy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { RadioGroup } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePrefs } from '@/state/prefs';
import type { QuizItem } from '../content';
import { COMPLETE_SLUG, LESSON_BY_ID, type LessonId } from '../course';
import { useProgress } from '../hooks';
import { bestScore, nextLessonAfter, passMark } from '../progress';
import { currentIsCorrect, initQuiz, isCorrectAt, quizOutcome, quizReducer } from '../quiz';
import { ProgressRing } from './ProgressRing';
import { RichText } from './RichText';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
/** Long "Next: lesson N · title" labels may wrap on phones instead of overflowing. */
const WRAP = 'h-auto min-h-10 max-w-full py-2 whitespace-normal text-left';

/**
 * Stable callback ref: focuses an element once, when it mounts. The quiz only mounts questions and
 * results after a user action (it opens on its intro), so this never steals focus on page load.
 */
const focusOnMount = (el: HTMLElement | null) => el?.focus();

/** Link target + label for "what comes after passing this lesson". */
function useNextTarget(id: LessonId) {
  const { t } = useTranslation('learn');
  const next = nextLessonAfter(id);
  return next
    ? { to: `/learn/${next}`, label: t('quiz.nextLesson', { n: LESSON_BY_ID[next].n, title: t(`lessons.${next}.title`) }) }
    : { to: `/learn/${COMPLETE_SLUG}`, label: t('quiz.finishCourse') };
}

/**
 * End-of-lesson quiz: one question at a time with a radio group (arrow keys move between options),
 * immediate feedback + explanation after "Check", a score at the end. Passing (≥ ⅔) records the
 * lesson as complete (best score kept) and unlocks the next lesson.
 */
export function Quiz({ lessonId, items }: { lessonId: LessonId; items: QuizItem[] }) {
  const { t } = useTranslation('learn');
  const answers = React.useMemo(() => LESSON_BY_ID[lessonId].answers.slice(0, items.length), [lessonId, items.length]);
  const [state, dispatch] = React.useReducer(quizReducer, answers, (a) => initQuiz(a));
  const record = useProgress()[lessonId];
  const completeLesson = usePrefs((s) => s.completeLesson);
  const next = useNextTarget(lessonId);
  const total = answers.length;
  const mark = passMark(total);

  const actionRef = React.useRef<HTMLButtonElement>(null);

  // Move focus sensibly for keyboard and screen-reader users: to the "Next" button after checking,
  // and to each new question / the result heading when it mounts (see focusOnMount).
  React.useEffect(() => {
    if (state.phase === 'question' && state.checked) actionRef.current?.focus();
  }, [state.phase, state.checked]);

  const onPrimary = () => {
    if (!state.checked) {
      dispatch({ type: 'check' });
      return;
    }
    if (state.index + 1 >= total) {
      const outcome = quizOutcome(state);
      if (outcome.passed) completeLesson(lessonId, bestScore(record?.completed ? record.score : undefined, outcome.pct));
    }
    dispatch({ type: 'next' });
  };

  if (!total) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Target className="size-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg leading-tight font-bold">{t('quiz.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('quiz.meta', { n: total, mark })}</p>
          </div>
        </div>
        {state.phase === 'question' && <QuizDots state={state} />}
      </div>

      <div className="p-5 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          {state.phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {record?.completed ? (
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <ProgressRing value={record.score} size={84} stroke={8} barClassName="stroke-success" label={t('quiz.bestScore', { score: record.score })}>
                    <span className="num font-display text-lg font-extrabold">{record.score}%</span>
                  </ProgressRing>
                  <div className="flex-1">
                    <p className="font-semibold">{t('quiz.alreadyPassed')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('quiz.bestScore', { score: record.score })}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild className={WRAP}>
                        <Link to={next.to}>
                          {next.label} <ArrowRight />
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={() => dispatch({ type: 'start' })}>
                        <RotateCcw /> {t('quiz.retake')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="leading-relaxed text-foreground/85">{t('quiz.intro', { n: total, mark })}</p>
                  <Button size="lg" className="mt-5" onClick={() => dispatch({ type: 'start' })}>
                    {t('quiz.start')} <ArrowRight />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {state.phase === 'question' && (
            <motion.form
              key={`q-${state.index}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (state.selected != null) onPrimary();
              }}
            >
              <div className="text-xs font-semibold tracking-wider text-primary uppercase">{t('quiz.progress', { i: state.index + 1, n: total })}</div>
              <h3 ref={focusOnMount} tabIndex={-1} id={`quiz-${lessonId}-q`} className="mt-2 text-xl leading-snug font-bold outline-none">
                <RichText text={items[state.index].q} />
              </h3>

              <RadioGroup.Root
                aria-labelledby={`quiz-${lessonId}-q`}
                value={state.selected == null ? '' : String(state.selected)}
                onValueChange={(v) => dispatch({ type: 'select', option: Number(v) })}
                disabled={state.checked}
                className="mt-5 grid gap-2.5"
                onKeyDown={(e) => {
                  // Radix radios ignore Enter; let Enter check the selected answer (as the hint says).
                  if (e.key === 'Enter' && state.selected != null && !state.checked) {
                    e.preventDefault();
                    onPrimary();
                  }
                }}
              >
                {items[state.index].options.map((opt, i) => {
                  const isAnswer = i === answers[state.index];
                  const isChosen = i === state.selected;
                  const reveal = state.checked;
                  return (
                    <RadioGroup.Item
                      key={i}
                      value={String(i)}
                      className={cn(
                        'group flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all outline-none',
                        'focus-visible:ring-4 focus-visible:ring-ring/30',
                        !reveal && 'border-border bg-background hover:border-primary/50 hover:bg-primary/[0.03] data-[state=checked]:border-primary data-[state=checked]:bg-primary/[0.06]',
                        reveal && isAnswer && 'border-success bg-success/10',
                        reveal && isChosen && !isAnswer && 'border-danger bg-danger/10',
                        reveal && !isAnswer && !isChosen && 'border-border opacity-55',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-px inline-flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors',
                          !reveal && 'border-border bg-muted text-muted-foreground group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary group-data-[state=checked]:text-primary-foreground',
                          reveal && isAnswer && 'border-success bg-success text-white',
                          reveal && isChosen && !isAnswer && 'border-danger bg-danger text-white',
                          reveal && !isAnswer && !isChosen && 'border-border bg-muted text-muted-foreground',
                        )}
                        aria-hidden
                      >
                        {reveal && isAnswer ? <Check className="size-4" strokeWidth={3} /> : reveal && isChosen ? <X className="size-4" strokeWidth={3} /> : LETTERS[i]}
                      </span>
                      <span className="pt-0.5 leading-relaxed">
                        <RichText text={opt} />
                        {reveal && isAnswer && <span className="sr-only"> — {t('quiz.srCorrect')}</span>}
                        {reveal && isChosen && !isAnswer && <span className="sr-only"> — {t('quiz.srYourAnswer')}</span>}
                      </span>
                    </RadioGroup.Item>
                  );
                })}
              </RadioGroup.Root>

              <div aria-live="polite" role="status">
                <AnimatePresence>
                  {state.checked && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                      className={cn('mt-5 flex gap-3 rounded-2xl border p-4', currentIsCorrect(state) ? 'border-success/40 bg-success/10' : 'border-danger/40 bg-danger/10')}
                    >
                      {currentIsCorrect(state) ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <CircleX className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />}
                      <div>
                        <p className={cn('font-bold', currentIsCorrect(state) ? 'text-success' : 'text-danger')}>{currentIsCorrect(state) ? t('quiz.correct') : t('quiz.incorrect')}</p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                          <RichText text={items[state.index].explain} />
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{state.checked ? '' : state.selected == null ? t('quiz.chooseOne') : t('quiz.keyboardHint')}</span>
                <Button ref={actionRef} type="submit" size="lg" disabled={state.selected == null}>
                  {!state.checked ? t('quiz.check') : state.index + 1 >= total ? t('quiz.seeResults') : t('quiz.next')}
                  <ArrowRight />
                </Button>
              </div>
            </motion.form>
          )}

          {state.phase === 'result' && <Result key="result" state={state} lessonId={lessonId} onRetry={() => dispatch({ type: 'restart' })} next={next} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function QuizDots({ state }: { state: ReturnType<typeof initQuiz> }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {state.answers.map((_, i) => {
        const answered = i < state.chosen.length;
        return (
          <span
            key={i}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === state.index ? 'w-6' : 'w-2',
              answered ? (isCorrectAt(state, i) ? 'bg-success' : 'bg-danger') : i === state.index ? 'bg-primary' : 'bg-muted-foreground/25',
            )}
          />
        );
      })}
    </div>
  );
}

function Result({
  state,
  lessonId,
  onRetry,
  next,
}: {
  state: ReturnType<typeof initQuiz>;
  lessonId: LessonId;
  onRetry: () => void;
  next: { to: string; label: string };
}) {
  const { t } = useTranslation('learn');
  const o = quizOutcome(state);
  const record = useProgress()[lessonId];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="relative">
      {o.passed && <Burst />}
      <div className="flex flex-col items-center text-center">
        <ProgressRing value={o.pct} size={128} stroke={11} barClassName={o.passed ? 'stroke-success' : 'stroke-warning'} label={t('quiz.score', { correct: o.correct, total: o.total })}>
          {o.passed ? <Trophy className="size-6 text-success" aria-hidden /> : <Flag className="size-6 text-warning" aria-hidden />}
          <span className="num mt-0.5 font-display text-2xl font-extrabold">{o.pct}%</span>
        </ProgressRing>
        <h3 ref={focusOnMount} tabIndex={-1} className="mt-4 text-2xl font-extrabold outline-none">
          {o.passed ? t('quiz.passedTitle') : t('quiz.failedTitle')}
          <span className="sr-only"> — {t('quiz.score', { correct: o.correct, total: o.total })}</span>
        </h3>
        <p className="mt-1 text-muted-foreground">
          {t('quiz.score', { correct: o.correct, total: o.total })} · {t('quiz.passMark', { mark: passMark(o.total), total: o.total })}
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed">{o.passed ? t('quiz.passedBody') : t('quiz.failedBody')}</p>
        {o.passed && record?.completed && record.score > o.pct && <p className="mt-2 text-xs text-muted-foreground">{t('quiz.bestKept', { score: record.score })}</p>}

        <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label={t('quiz.summary')}>
          {state.answers.map((_, i) => {
            const ok = isCorrectAt(state, i);
            return (
              <li key={i} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', ok ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger')}>
                {ok ? <Check className="size-3" strokeWidth={3} aria-hidden /> : <X className="size-3" strokeWidth={3} aria-hidden />}
                {t('quiz.qShort', { i: i + 1 })}
                <span className="sr-only">: {ok ? t('quiz.srCorrect') : t('quiz.srWrong')}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {o.passed ? (
            <>
              <Button size="lg" asChild className={WRAP}>
                <Link to={next.to}>
                  {next.label} <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={onRetry}>
                <RotateCcw /> {t('quiz.retake')}
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={onRetry}>
                <RotateCcw /> {t('quiz.retry')}
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <BookOpen /> {t('quiz.review')}
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** A small celebratory burst (motion respects reduced-motion via MotionConfig in LearnPage). */
function Burst() {
  const colors = ['#1eb53a', '#fcd116', '#00a3dd', '#338cf6', '#fc8d59', '#91cf60'];
  return (
    <div className="pointer-events-none absolute top-16 left-1/2" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const d = 70 + (i % 3) * 22;
        return (
          <motion.span
            key={i}
            className="absolute size-2 rounded-full"
            style={{ background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
          />
        );
      })}
    </div>
  );
}
