/**
 * Lesson content model. The words live in `locales/<lang>/learn.json` under `lessons.<id>` as a small
 * block tree (sections → blocks); this module types and validates it so a translation slip degrades
 * gracefully (an unknown block is dropped) instead of crashing the page. The en/sw catalogues are
 * checked for identical structure in `__tests__/catalogue.test.ts`.
 *
 * Inline markup in any text: <b>bold</b> and <i>italic</i> (see RichText).
 * Live values are interpolated with i18next (`{{national}}` …) - see CONTENT_VARS.
 */
import { FIGURE_IDS, WIDGET_IDS, type FigureId, type WidgetId } from './course';

export const CALLOUT_TONES = ['key', 'tz', 'warn', 'tip', 'fact'] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];
export const LIST_STYLES = ['bullet', 'check', 'number'] as const;
export type ListStyle = (typeof LIST_STYLES)[number];

export type Block =
  | { type: 'p'; text: string }
  | { type: 'callout'; tone: CalloutTone; title?: string; text: string }
  | { type: 'list'; style: ListStyle; items: string[] }
  | { type: 'terms'; items: Array<{ term: string; def: string }> }
  | { type: 'compare'; items: Array<{ title: string; text: string }> }
  | { type: 'formula'; text: string; caption?: string }
  | { type: 'widget'; id: WidgetId }
  | { type: 'figure'; id: FigureId; caption?: string };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface QuizItem {
  q: string;
  options: string[];
  explain: string;
}

export interface LessonContent {
  title: string;
  subtitle: string;
  summary: string;
  objectives: string[];
  sections: Section[];
  takeaways: string[];
  quiz: QuizItem[];
}

/**
 * Names of the live values lesson text may interpolate. They are filled from the real model
 * (`useContentVars`) and the engine (`QUIZ_VARS`) - lesson text never types an INFORM number in.
 */
export const CONTENT_VARS = [
  'national',
  'nationalClass',
  'nH',
  'nHClass',
  'nHRiskClass',
  'nV',
  'nVClass',
  'nC',
  'nCClass',
  'hazardCount',
  'indicatorCount',
  'councils',
  'regions',
  'geo',
  'arith',
  'classScore',
  'sqrtVal',
] as const;
export type ContentVars = Record<(typeof CONTENT_VARS)[number], string>;

/* ------------------------------------------------------------------------------------------------ */
/* Validation                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown): string => (typeof x === 'string' ? x : '');
const optStr = (x: unknown): string | undefined => (typeof x === 'string' && x ? x : undefined);
const strList = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : []);
const oneOf = <T extends string>(list: readonly T[], x: unknown): x is T => typeof x === 'string' && (list as readonly string[]).includes(x);

export function parseBlock(raw: unknown): Block | null {
  if (!isObj(raw)) return null;
  switch (raw.type) {
    case 'p':
      return str(raw.text) ? { type: 'p', text: str(raw.text) } : null;
    case 'callout':
      return oneOf(CALLOUT_TONES, raw.tone) && str(raw.text) ? { type: 'callout', tone: raw.tone, title: optStr(raw.title), text: str(raw.text) } : null;
    case 'list': {
      const items = strList(raw.items);
      return items.length ? { type: 'list', style: oneOf(LIST_STYLES, raw.style) ? raw.style : 'bullet', items } : null;
    }
    case 'terms': {
      const items = (Array.isArray(raw.items) ? raw.items : []).filter(isObj).map((i) => ({ term: str(i.term), def: str(i.def) }));
      return items.length ? { type: 'terms', items } : null;
    }
    case 'compare': {
      const items = (Array.isArray(raw.items) ? raw.items : []).filter(isObj).map((i) => ({ title: str(i.title), text: str(i.text) }));
      return items.length ? { type: 'compare', items } : null;
    }
    case 'formula':
      return str(raw.text) ? { type: 'formula', text: str(raw.text), caption: optStr(raw.caption) } : null;
    case 'widget':
      return oneOf(WIDGET_IDS, raw.id) ? { type: 'widget', id: raw.id } : null;
    case 'figure':
      return oneOf(FIGURE_IDS, raw.id) ? { type: 'figure', id: raw.id, caption: optStr(raw.caption) } : null;
    default:
      return null;
  }
}

export function parseLesson(raw: unknown): LessonContent {
  const o = isObj(raw) ? raw : {};
  const sections: Section[] = (Array.isArray(o.sections) ? o.sections : []).filter(isObj).map((s, i) => ({
    id: str(s.id) || `section-${i + 1}`,
    title: str(s.title),
    blocks: (Array.isArray(s.blocks) ? s.blocks : []).map(parseBlock).filter((b): b is Block => b !== null),
  }));
  const quiz: QuizItem[] = (Array.isArray(o.quiz) ? o.quiz : []).filter(isObj).map((q) => ({ q: str(q.q), options: strList(q.options), explain: str(q.explain) }));
  return {
    title: str(o.title),
    subtitle: str(o.subtitle),
    summary: str(o.summary),
    objectives: strList(o.objectives),
    sections,
    takeaways: strList(o.takeaways),
    quiz,
  };
}

/** Every widget id embedded in a lesson. */
export const widgetsIn = (lesson: LessonContent): WidgetId[] =>
  lesson.sections.flatMap((s) => s.blocks).flatMap((b) => (b.type === 'widget' ? [b.id] : []));
