/**
 * Course progress rules (pure — the persisted state lives in `usePrefs().learnProgress`).
 * A lesson is complete once its quiz is passed: at least two thirds of the questions right
 * (2 of 3, 3 of 4). The best score is kept when a learner retakes a quiz.
 */
import { LESSON_IDS, type LessonId } from './course';

export interface LessonRecord {
  completed: boolean;
  score: number;
  at: string;
}
export type Progress = Record<string, LessonRecord | undefined>;

/** Minimum number of correct answers to pass a quiz of `total` questions (⅔, rounded up). */
export const passMark = (total: number): number => Math.ceil((total * 2) / 3);

export const hasPassed = (correct: number, total: number): boolean => total > 0 && correct >= passMark(total);

/** Whole-number percentage. */
export const scorePct = (correct: number, total: number): number => (total > 0 ? Math.round((correct / total) * 100) : 0);

/** The score to persist after a pass: never lower an earlier, better result. */
export const bestScore = (previous: number | undefined, pct: number): number => Math.max(previous ?? 0, pct);

export const isCompleted = (progress: Progress, id: LessonId): boolean => !!progress[id]?.completed;

export const completedCount = (progress: Progress): number => LESSON_IDS.filter((id) => isCompleted(progress, id)).length;

/** 0–100, share of lessons completed. */
export const courseProgressPct = (progress: Progress): number => Math.round((completedCount(progress) / LESSON_IDS.length) * 100);

export const isCourseComplete = (progress: Progress): boolean => completedCount(progress) === LESSON_IDS.length;

/** First lesson (in course order) that is not yet completed; null when the whole course is done. */
export function nextIncomplete(progress: Progress): LessonId | null {
  return LESSON_IDS.find((id) => !isCompleted(progress, id)) ?? null;
}

export function nextLessonAfter(id: LessonId): LessonId | null {
  const i = LESSON_IDS.indexOf(id);
  return i >= 0 && i < LESSON_IDS.length - 1 ? LESSON_IDS[i + 1] : null;
}

export function previousLessonBefore(id: LessonId): LessonId | null {
  const i = LESSON_IDS.indexOf(id);
  return i > 0 ? LESSON_IDS[i - 1] : null;
}

/** Mean quiz score over completed lessons (rounded), or null when nothing is completed yet. */
export function averageScore(progress: Progress): number | null {
  const scores = LESSON_IDS.map((id) => progress[id]).filter((r): r is LessonRecord => !!r?.completed).map((r) => r.score);
  return scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null;
}

/** ISO date of the most recent completion — the certificate date. */
export function completionDate(progress: Progress): string | null {
  const dates = LESSON_IDS.map((id) => progress[id]).filter((r): r is LessonRecord => !!r?.completed && !!r.at).map((r) => r.at);
  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
}
