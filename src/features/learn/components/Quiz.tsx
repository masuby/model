import { ArrowRight, BookOpen, Check, RotateCcw, X } from 'lucide-react';
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
 * lesson as complete (best score kept); every lesson stays open whatever the result.
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
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border px-5 pt-5 pb-4 sm:px-7">
        <div>
          <h2 className="text-[1.6rem] leading-tight">{t('quiz.title')}</h2>
          {/* The intro sentence already gives the length and pass mark. */}
          {state.phase !== 'intro' && <p className="mt-1 text-sm text-muted-foreground">{t('quiz.meta', { n: total, mark })}</p>}
        </div>
        {state.phase === 'question' && <QuizSteps state={state} />}
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        {state.phase === 'intro' &&
          (record?.completed ? (
            <div>
              <p className="flex items-baseline gap-3">
                <span className="num font-display text-4xl font-semibold tracking-tight">{record.score}%</span>
                <span className="text-sm text-muted-foreground">{t('quiz.bestScore', { score: record.score })}</span>
              </p>
              <p className="mt-2 font-medium">{t('quiz.alreadyPassed')}</p>
              <div className="mt-5 flex flex-wrap gap-2">
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
          ) : (
            <div>
              <p className="max-w-2xl leading-relaxed text-foreground/90">{t('quiz.intro', { n: total, mark })}</p>
              <Button size="lg" className="mt-6" onClick={() => dispatch({ type: 'start' })}>
                {t('quiz.start')} <ArrowRight />
              </Button>
            </div>
          ))}

        {state.phase === 'question' && (
          <form
            key={`q-${state.index}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (state.selected != null) onPrimary();
            }}
          >
            <p className="text-sm text-muted-foreground">{t('quiz.progress', { i: state.index + 1, n: total })}</p>
            <h3 ref={focusOnMount} tabIndex={-1} id={`quiz-${lessonId}-q`} className="mt-2 text-xl leading-snug font-semibold outline-none">
              <RichText text={items[state.index].q} />
            </h3>

            <RadioGroup.Root
              aria-labelledby={`quiz-${lessonId}-q`}
              value={state.selected == null ? '' : String(state.selected)}
              onValueChange={(v) => dispatch({ type: 'select', option: Number(v) })}
              disabled={state.checked}
              className="mt-5 grid gap-2"
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
                      'group flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors duration-150 outline-none',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      !reveal && 'border-border hover:border-foreground/40 data-[state=checked]:border-foreground data-[state=checked]:bg-muted/60',
                      reveal && isAnswer && 'border-success',
                      reveal && isChosen && !isAnswer && 'border-danger',
                      reveal && !isAnswer && !isChosen && 'border-border text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-150',
                        !reveal && 'border-input text-muted-foreground group-data-[state=checked]:border-foreground group-data-[state=checked]:bg-foreground group-data-[state=checked]:text-background',
                        reveal && isAnswer && 'border-success bg-success text-background',
                        reveal && isChosen && !isAnswer && 'border-danger bg-danger text-background',
                        reveal && !isAnswer && !isChosen && 'border-border',
                      )}
                      aria-hidden
                    >
                      {reveal && isAnswer ? <Check className="size-3.5" strokeWidth={3} /> : reveal && isChosen ? <X className="size-3.5" strokeWidth={3} /> : LETTERS[i]}
                    </span>
                    <span className="leading-relaxed">
                      <RichText text={opt} />
                      {reveal && isAnswer && <span className="sr-only"> — {t('quiz.srCorrect')}</span>}
                      {reveal && isChosen && !isAnswer && <span className="sr-only"> — {t('quiz.srYourAnswer')}</span>}
                    </span>
                  </RadioGroup.Item>
                );
              })}
            </RadioGroup.Root>

            <div aria-live="polite" role="status">
              {state.checked && (
                <div className={cn('mt-6 border-l-2 pl-4', currentIsCorrect(state) ? 'border-success' : 'border-danger')}>
                  <p className={cn('font-semibold', currentIsCorrect(state) ? 'text-success' : 'text-danger')}>{currentIsCorrect(state) ? t('quiz.correct') : t('quiz.incorrect')}</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                    <RichText text={items[state.index].explain} />
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <span className="text-sm text-muted-foreground">{state.checked ? '' : state.selected == null ? t('quiz.chooseOne') : t('quiz.keyboardHint')}</span>
              <Button ref={actionRef} type="submit" size="lg" disabled={state.selected == null}>
                {!state.checked ? t('quiz.check') : state.index + 1 >= total ? t('quiz.seeResults') : t('quiz.next')}
                <ArrowRight />
              </Button>
            </div>
          </form>
        )}

        {state.phase === 'result' && <Result state={state} lessonId={lessonId} onRetry={() => dispatch({ type: 'restart' })} next={next} />}
      </div>
    </div>
  );
}

/** One short bar per question: answered right / wrong, current, still to come. */
function QuizSteps({ state }: { state: ReturnType<typeof initQuiz> }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {state.answers.map((_, i) => {
        const answered = i < state.chosen.length;
        return (
          <span
            key={i}
            className={cn('h-1 w-6', answered ? (isCorrectAt(state, i) ? 'bg-success' : 'bg-danger') : i === state.index ? 'bg-foreground' : 'bg-border')}
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
    <div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span className={cn('num font-display text-5xl font-semibold tracking-tight', o.passed ? 'text-success' : 'text-foreground')}>{o.pct}%</span>
        <div>
          <h3 ref={focusOnMount} tabIndex={-1} className="text-xl font-semibold outline-none">
            {o.passed ? t('quiz.passedTitle') : t('quiz.failedTitle')}
            <span className="sr-only"> — {t('quiz.score', { correct: o.correct, total: o.total })}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('quiz.score', { correct: o.correct, total: o.total })} · {t('quiz.passMark', { mark: passMark(o.total), total: o.total })}
          </p>
        </div>
      </div>
      <p className="mt-4 max-w-xl leading-relaxed text-foreground/90">{o.passed ? t('quiz.passedBody') : t('quiz.failedBody')}</p>
      {o.passed && record?.completed && record.score > o.pct && <p className="mt-2 text-sm text-muted-foreground">{t('quiz.bestKept', { score: record.score })}</p>}

      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm" aria-label={t('quiz.summary')}>
        {state.answers.map((_, i) => {
          const ok = isCorrectAt(state, i);
          return (
            <li key={i} className={cn('inline-flex items-center gap-1 font-medium', ok ? 'text-success' : 'text-danger')}>
              {ok ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : <X className="size-3.5" strokeWidth={2.5} aria-hidden />}
              {t('quiz.qShort', { i: i + 1 })}
              <span className="sr-only">: {ok ? t('quiz.srCorrect') : t('quiz.srWrong')}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
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
  );
}
