import { describe, expect, it } from 'vitest';
import { correctCount, currentIsCorrect, initQuiz, isCorrectAt, quizOutcome, quizReducer, type QuizAction, type QuizState } from '../quiz';

const run = (state: QuizState, ...actions: QuizAction[]) => actions.reduce(quizReducer, state);
const answer = (option: number): QuizAction[] => [{ type: 'select', option }, { type: 'check' }, { type: 'next' }];

describe('quiz reducer', () => {
  const key = [1, 2, 0, 3] as const;

  it('opens on the intro and starts at question 1', () => {
    const s0 = initQuiz(key);
    expect(s0.phase).toBe('intro');
    const s1 = quizReducer(s0, { type: 'start' });
    expect(s1).toMatchObject({ phase: 'question', index: 0, selected: null, checked: false, chosen: [] });
  });

  it('ignores selection before the quiz starts', () => {
    const s = quizReducer(initQuiz(key), { type: 'select', option: 1 });
    expect(s.selected).toBeNull();
  });

  it('cannot check without a selection, nor move on before checking', () => {
    const s = run(initQuiz(key), { type: 'start' }, { type: 'check' }, { type: 'next' });
    expect(s).toMatchObject({ index: 0, checked: false, chosen: [] });
  });

  it('gives feedback for the current question only and locks the options once checked', () => {
    const s = run(initQuiz(key), { type: 'start' }, { type: 'select', option: 1 }, { type: 'check' });
    expect(s.checked).toBe(true);
    expect(currentIsCorrect(s)).toBe(true);
    // Changing the answer after checking is not allowed.
    const locked = quizReducer(s, { type: 'select', option: 3 });
    expect(locked.selected).toBe(1);
    // Checking twice does not double-count.
    expect(quizReducer(s, { type: 'check' }).chosen).toEqual([1]);
  });

  it('reports a wrong answer as incorrect', () => {
    const s = run(initQuiz(key), { type: 'start' }, { type: 'select', option: 0 }, { type: 'check' });
    expect(currentIsCorrect(s)).toBe(false);
    expect(isCorrectAt(s, 0)).toBe(false);
  });

  it('walks through every question to the result, scoring as it goes', () => {
    const s = run(initQuiz(key), { type: 'start' }, ...answer(1), ...answer(2), ...answer(1), ...answer(3));
    expect(s.phase).toBe('result');
    expect(s.chosen).toEqual([1, 2, 1, 3]);
    expect(correctCount(s)).toBe(3);
    expect(quizOutcome(s)).toEqual({ correct: 3, total: 4, pct: 75, passed: true });
  });

  it('fails below the pass mark and restarts cleanly', () => {
    const s = run(initQuiz(key), { type: 'start' }, ...answer(1), ...answer(0), ...answer(1), ...answer(0));
    expect(quizOutcome(s)).toEqual({ correct: 1, total: 4, pct: 25, passed: false });
    const r = quizReducer(s, { type: 'restart' });
    expect(r).toMatchObject({ phase: 'question', index: 0, selected: null, checked: false, chosen: [] });
    expect(r.answers).toEqual(key);
  });

  it('passes a three-question quiz with two correct', () => {
    const s = run(initQuiz([2, 0, 1]), { type: 'start' }, ...answer(2), ...answer(0), ...answer(3));
    expect(quizOutcome(s)).toMatchObject({ correct: 2, total: 3, passed: true, pct: 67 });
  });

  it('rejects invalid options', () => {
    const s = run(initQuiz(key), { type: 'start' }, { type: 'select', option: -1 });
    expect(s.selected).toBeNull();
  });
});
