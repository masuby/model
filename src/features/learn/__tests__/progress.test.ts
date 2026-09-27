import { describe, expect, it } from 'vitest';
import { LESSON_IDS, LESSONS, TOTAL_QUESTIONS } from '../course';
import {
  averageScore,
  bestScore,
  completedCount,
  completionDate,
  courseProgressPct,
  hasPassed,
  isCourseComplete,
  nextIncomplete,
  nextLessonAfter,
  passMark,
  previousLessonBefore,
  scorePct,
  type Progress,
} from '../progress';

const rec = (score: number, at = '2026-09-01T10:00:00.000Z') => ({ completed: true, score, at });

describe('pass rules', () => {
  it('requires two thirds, rounded up', () => {
    expect(passMark(3)).toBe(2);
    expect(passMark(4)).toBe(3);
    expect(passMark(5)).toBe(4);
  });

  it('passes 2/3 and 3/4 but not 1/3 or 2/4', () => {
    expect(hasPassed(2, 3)).toBe(true);
    expect(hasPassed(3, 3)).toBe(true);
    expect(hasPassed(1, 3)).toBe(false);
    expect(hasPassed(3, 4)).toBe(true);
    expect(hasPassed(2, 4)).toBe(false);
    expect(hasPassed(0, 0)).toBe(false);
  });

  it('computes whole-number percentages', () => {
    expect(scorePct(2, 3)).toBe(67);
    expect(scorePct(3, 4)).toBe(75);
    expect(scorePct(0, 0)).toBe(0);
  });

  it('keeps the best score on a retake', () => {
    expect(bestScore(undefined, 67)).toBe(67);
    expect(bestScore(100, 75)).toBe(100);
    expect(bestScore(67, 100)).toBe(100);
  });
});

describe('course progress', () => {
  it('starts at the first lesson with nothing completed', () => {
    const p: Progress = {};
    expect(completedCount(p)).toBe(0);
    expect(courseProgressPct(p)).toBe(0);
    expect(nextIncomplete(p)).toBe('hazard');
    expect(averageScore(p)).toBeNull();
    expect(completionDate(p)).toBeNull();
    expect(isCourseComplete(p)).toBe(false);
  });

  it('continues with the first incomplete lesson in course order, even out of order', () => {
    const p: Progress = { hazard: rec(100), vulnerability: rec(75) };
    expect(completedCount(p)).toBe(2);
    expect(nextIncomplete(p)).toBe('exposure');
    expect(averageScore(p)).toBe(88); // (100 + 75) / 2 = 87.5 → 88
  });

  it('ignores unknown ids and incomplete records', () => {
    const p: Progress = { hazard: rec(100), legacyLesson: rec(10), exposure: { completed: false, score: 33, at: '' } };
    expect(completedCount(p)).toBe(1);
    expect(averageScore(p)).toBe(100);
  });

  it('is complete when all seven lessons are passed, and dates the certificate by the latest pass', () => {
    const p: Progress = Object.fromEntries(LESSON_IDS.map((id, i) => [id, rec(100, `2026-09-0${i + 1}T08:00:00.000Z`)]));
    expect(isCourseComplete(p)).toBe(true);
    expect(courseProgressPct(p)).toBe(100);
    expect(nextIncomplete(p)).toBeNull();
    expect(completionDate(p)).toBe('2026-09-07T08:00:00.000Z');
  });

  it('navigates between neighbouring lessons', () => {
    expect(previousLessonBefore('hazard')).toBeNull();
    expect(nextLessonAfter('hazard')).toBe('exposure');
    expect(previousLessonBefore('decisions')).toBe('severity');
    expect(nextLessonAfter('decisions')).toBeNull();
  });
});

describe('course definition', () => {
  it('has seven lessons, numbered in order, each with a 3–4 question quiz', () => {
    expect(LESSONS.map((l) => l.id)).toEqual([...LESSON_IDS]);
    LESSONS.forEach((l, i) => {
      expect(l.n).toBe(i + 1);
      expect(l.answers.length).toBeGreaterThanOrEqual(3);
      expect(l.answers.length).toBeLessThanOrEqual(4);
      expect(l.minutes).toBeGreaterThan(0);
    });
    expect(TOTAL_QUESTIONS).toBe(LESSONS.reduce((s, l) => s + l.answers.length, 0));
  });

  it('uses a different widget in every lesson', () => {
    expect(new Set(LESSONS.map((l) => l.widget)).size).toBe(LESSONS.length);
  });
});
