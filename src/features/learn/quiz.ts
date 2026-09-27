/**
 * Quiz state machine (pure reducer): one question at a time, the learner selects an option, checks it
 * (immediate feedback for THAT question only), then moves on. Results are revealed at the end.
 *
 *   intro ──start──▶ question ──select──▶ question(selected) ──check──▶ question(checked) ──next──▶ … ──▶ result
 *   result ──restart──▶ question
 */
import { hasPassed, scorePct } from './progress';

export type QuizPhase = 'intro' | 'question' | 'result';

export interface QuizState {
  phase: QuizPhase;
  /** Answer key (index of the correct option per question). */
  answers: readonly number[];
  /** Current question index. */
  index: number;
  /** Option chosen for the current question. */
  selected: number | null;
  /** Whether the current question has been checked (feedback shown, options locked). */
  checked: boolean;
  /** The option chosen for every checked question, in order. */
  chosen: number[];
}

export type QuizAction = { type: 'start' } | { type: 'restart' } | { type: 'select'; option: number } | { type: 'check' } | { type: 'next' };

export function initQuiz(answers: readonly number[], phase: QuizPhase = 'intro'): QuizState {
  return { phase, answers, index: 0, selected: null, checked: false, chosen: [] };
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'start':
    case 'restart':
      return initQuiz(state.answers, 'question');
    case 'select':
      if (state.phase !== 'question' || state.checked) return state;
      if (action.option < 0 || !Number.isInteger(action.option)) return state;
      return { ...state, selected: action.option };
    case 'check':
      if (state.phase !== 'question' || state.checked || state.selected == null) return state;
      return { ...state, checked: true, chosen: [...state.chosen, state.selected] };
    case 'next':
      if (state.phase !== 'question' || !state.checked) return state;
      if (state.index + 1 >= state.answers.length) return { ...state, phase: 'result' };
      return { ...state, index: state.index + 1, selected: null, checked: false };
    default:
      return state;
  }
}

/** Whether the i-th checked answer was right. */
export const isCorrectAt = (state: QuizState, i: number): boolean => state.chosen[i] === state.answers[i];

/** Is the current (checked) question answered correctly? */
export const currentIsCorrect = (state: QuizState): boolean => state.checked && state.selected === state.answers[state.index];

export const correctCount = (state: QuizState): number => state.chosen.filter((c, i) => c === state.answers[i]).length;

export interface QuizOutcome {
  correct: number;
  total: number;
  pct: number;
  passed: boolean;
}

export function quizOutcome(state: QuizState): QuizOutcome {
  const correct = correctCount(state);
  const total = state.answers.length;
  return { correct, total, pct: scorePct(correct, total), passed: hasPassed(correct, total) };
}
