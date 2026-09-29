/**
 * The Learn course: lesson order, reading time, the live widget each lesson embeds and the quiz answer
 * key. Text (content, questions, options, explanations) lives in `locales/<lang>/learn.json`; only the
 * structure and the answers live here, so a translation can never change which option is correct.
 *
 * Worked numbers used inside quiz questions are computed with the real engine (never typed in).
 */
import { classify, THRESHOLDS } from '@/engine/risk/classes';
import { mean, riskScore, round1 } from '@/engine/risk/math';
import { NO_VALUE } from '@/lib/utils';

export const LESSON_IDS = ['hazard', 'exposure', 'vulnerability', 'coping', 'risk', 'severity', 'decisions'] as const;
export type LessonId = (typeof LESSON_IDS)[number];
export const isLessonId = (x: unknown): x is LessonId => typeof x === 'string' && (LESSON_IDS as readonly string[]).includes(x);

export const WIDGET_IDS = [
  'hazardHotspots',
  'exposureCompare',
  'vulnerabilityProfile',
  'copingWhatIf',
  'riskPlayground',
  'severityCalculator',
  'decisionChecklist',
] as const;
export type WidgetId = (typeof WIDGET_IDS)[number];

export const FIGURE_IDS = ['disasterEquation', 'aggregationLadder', 'classThresholds', 'severityWeights'] as const;
export type FigureId = (typeof FIGURE_IDS)[number];

const one = (x: number | null): string => (x == null ? NO_VALUE : x.toFixed(1));

/** A score in the middle of the "High" risk band, derived from the workbook thresholds. */
const CLASS_QUESTION_SCORE = round1((THRESHOLDS.risk[2] + THRESHOLDS.risk[3]) / 2);

/**
 * Values interpolated into quiz questions. The "extreme hazard only" case (H 9, V 1, LCC 1) shows why
 * INFORM uses a geometric mean; the flood case is the documented "exposure never lowers flood" rule.
 */
export const QUIZ_VARS = {
  geo: one(riskScore(9, 1, 1)),
  arith: one(round1(mean([9, 1, 1]) ?? 0)),
  classScore: one(CLASS_QUESTION_SCORE),
  sqrtVal: one(round1(Math.sqrt(9.8 * 2.9))),
} as const;

export interface LessonMeta {
  id: LessonId;
  /** 1-based position in the course. */
  n: number;
  /** Estimated reading + activity time. */
  minutes: number;
  /** The live-data widget this lesson must embed. */
  widget: WidgetId;
  /** Index of the correct option for each quiz question (same order as learn.json). */
  answers: readonly number[];
}

export const LESSONS: readonly LessonMeta[] = [
  { id: 'hazard', n: 1, minutes: 8, widget: 'hazardHotspots', answers: [1, 2, 0, 3] },
  { id: 'exposure', n: 2, minutes: 7, widget: 'exposureCompare', answers: [2, 0, 1] },
  { id: 'vulnerability', n: 3, minutes: 9, widget: 'vulnerabilityProfile', answers: [2, 3, 0, 1] },
  { id: 'coping', n: 4, minutes: 8, widget: 'copingWhatIf', answers: [2, 0, 3] },
  { id: 'risk', n: 5, minutes: 12, widget: 'riskPlayground', answers: [2, 1, classify(CLASS_QUESTION_SCORE, 'risk')!.index, 0] },
  { id: 'severity', n: 6, minutes: 10, widget: 'severityCalculator', answers: [1, 2, 0, 3] },
  { id: 'decisions', n: 7, minutes: 9, widget: 'decisionChecklist', answers: [2, 0, 3] },
];

export const LESSON_BY_ID: Record<LessonId, LessonMeta> = Object.fromEntries(LESSONS.map((l) => [l.id, l])) as Record<LessonId, LessonMeta>;

export const TOTAL_MINUTES = LESSONS.reduce((s, l) => s + l.minutes, 0);
export const TOTAL_QUESTIONS = LESSONS.reduce((s, l) => s + l.answers.length, 0);

/** Route of the course-completion / certificate screen (`/learn/complete`). */
export const COMPLETE_SLUG = 'complete';
