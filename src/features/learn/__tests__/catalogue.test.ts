/**
 * The Learn catalogues: English and Kiswahili must have the SAME structure (sections, block types,
 * widget/figure ids, list lengths, quiz option counts) and the same interpolation placeholders, so a
 * lesson can never break or show a different answer key in one language.
 */
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en/learn.json';
import sw from '@/i18n/locales/sw/learn.json';
import commonEn from '@/i18n/locales/en/common.json';
import { classify } from '@/engine/risk/classes';
import { riskScore } from '@/engine/risk/math';
import { CONTENT_VARS, parseLesson, widgetsIn, type ContentVars } from '../content';
import { LESSON_BY_ID, LESSON_IDS, LESSONS, QUIZ_VARS } from '../course';

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const STRUCTURAL_KEYS = new Set(['type', 'tone', 'id', 'style']);
const placeholders = (s: string) => [...s.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

/** Collect every structural difference between two catalogue trees. */
function diff(a: unknown, b: unknown, path: string, out: string[]) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      out.push(`${path}: array length ${Array.isArray(a) ? a.length : '?'} ≠ ${Array.isArray(b) ? b.length : typeof b}`);
      return;
    }
    a.forEach((x, i) => diff(x, b[i], `${path}[${i}]`, out));
    return;
  }
  if (isObj(a)) {
    if (!isObj(b)) {
      out.push(`${path}: object vs ${typeof b}`);
      return;
    }
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    for (const k of ka) if (!(k in b)) out.push(`${path}.${k}: missing in sw`);
    for (const k of kb) if (!(k in a)) out.push(`${path}.${k}: extra in sw`);
    for (const k of ka) {
      if (!(k in b)) continue;
      if (STRUCTURAL_KEYS.has(k)) {
        if (a[k] !== b[k]) out.push(`${path}.${k}: "${String(a[k])}" ≠ "${String(b[k])}"`);
      } else diff(a[k], b[k], `${path}.${k}`, out);
    }
    return;
  }
  if (typeof a === 'string') {
    if (typeof b !== 'string') {
      out.push(`${path}: string vs ${typeof b}`);
      return;
    }
    if (placeholders(a).join() !== placeholders(b).join()) out.push(`${path}: placeholders {${placeholders(a)}} ≠ {${placeholders(b)}}`);
    if (!b.trim()) out.push(`${path}: empty translation`);
  }
}

/** Every string in a tree, with its path. */
function strings(x: unknown, path = ''): Array<[string, string]> {
  if (typeof x === 'string') return [[path, x]];
  if (Array.isArray(x)) return x.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (isObj(x)) return Object.entries(x).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  return [];
}

describe('learn catalogues', () => {
  it('en and sw have identical structure and placeholders', () => {
    const out: string[] = [];
    diff(en, sw, 'learn', out);
    expect(out).toEqual([]);
  });

  it('every inline tag is balanced', () => {
    for (const cat of [en, sw])
      for (const [path, s] of strings(cat)) {
        for (const tag of ['b', 'i']) {
          const open = s.split(`<${tag}>`).length - 1;
          const close = s.split(`</${tag}>`).length - 1;
          expect(open, `${path}: <${tag}>`).toBe(close);
        }
      }
  });

  it('lesson text only interpolates known live values', () => {
    const known = new Set<string>(CONTENT_VARS);
    for (const [path, s] of strings(en.lessons, 'lessons')) for (const p of placeholders(s)) expect(known.has(p), `${path}: {{${p}}}`).toBe(true);
  });

  for (const [lang, cat] of [
    ['en', en],
    ['sw', sw],
  ] as const) {
    describe(`${lang} lessons`, () => {
      for (const id of LESSON_IDS) {
        it(`${id}: parses fully, embeds its widget and matches the answer key`, () => {
          const raw = (cat.lessons as Record<string, unknown>)[id];
          const lesson = parseLesson(raw);
          const meta = LESSON_BY_ID[id];
          expect(lesson.title).not.toBe('');
          expect(lesson.summary).not.toBe('');
          expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
          expect(lesson.takeaways.length).toBeGreaterThanOrEqual(3);
          expect(lesson.sections.length).toBeGreaterThanOrEqual(3);
          // No block may be silently dropped by the parser.
          const rawBlocks = ((raw as Obj).sections as Array<{ blocks: unknown[] }>).reduce((s, sec) => s + sec.blocks.length, 0);
          expect(lesson.sections.reduce((s, sec) => s + sec.blocks.length, 0)).toBe(rawBlocks);
          // Section ids are unique (they are page anchors) and never collide with the quiz anchor.
          const ids = lesson.sections.map((s) => s.id);
          expect(new Set(ids).size).toBe(ids.length);
          expect(ids).not.toContain('quiz');
          // Exactly the lesson's own live widget.
          expect(widgetsIn(lesson)).toEqual([meta.widget]);
          // Quiz: 3–4 questions, the answer key fits every question.
          expect(lesson.quiz.length).toBe(meta.answers.length);
          lesson.quiz.forEach((q, i) => {
            expect(q.q).not.toBe('');
            expect(q.explain).not.toBe('');
            expect(q.options.length).toBeGreaterThanOrEqual(3);
            expect(meta.answers[i]).toBeLessThan(q.options.length);
            expect(new Set(q.options).size).toBe(q.options.length);
          });
        });
      }
    });
  }

  it('interpolates live values into lesson content through i18next (returnObjects)', async () => {
    const i18n = i18next.createInstance();
    await i18n.init({ lng: 'en', resources: { en: { learn: en, common: commonEn } }, ns: ['learn', 'common'], defaultNS: 'learn', interpolation: { escapeValue: false } });
    const vars: ContentVars = {
      ...Object.fromEntries(CONTENT_VARS.map((k) => [k, `<${k}>`])),
      ...QUIZ_VARS,
      national: '4.1',
      nH: '2.2',
      nV: '5.5',
      nC: '5.9',
    } as ContentVars;
    const lesson = parseLesson(i18n.t('lessons.risk', { returnObjects: true, ...vars }));
    const text = JSON.stringify(lesson);
    expect(text).toContain('∛(2.2 × 5.5 × 5.9) = <b>4.1</b>');
    expect(text).not.toMatch(/\{\{\w+\}\}/);
    expect(lesson.quiz[1].options).toContain(QUIZ_VARS.geo);
  });
});

describe('quiz worked numbers come from the engine', () => {
  it('geometric vs arithmetic example', () => {
    expect(QUIZ_VARS.geo).toBe(riskScore(9, 1, 1)!.toFixed(1));
    expect(QUIZ_VARS.geo).toBe('2.1');
    expect(QUIZ_VARS.arith).toBe('3.7');
  });

  it('the class question lands in the High risk band and its answer index says so', () => {
    const score = Number(QUIZ_VARS.classScore);
    const cls = classify(score, 'risk')!;
    expect(cls.key).toBe('high');
    const riskLesson = LESSONS.find((l) => l.id === 'risk')!;
    expect(riskLesson.answers[2]).toBe(cls.index);
    // The options are the five classes in order.
    expect(parseLesson(en.lessons.risk).quiz[2].options).toEqual(['Very low', 'Low', 'Medium', 'High', 'Very high']);
  });

  it('flood rule example keeps the documented hazard', () => {
    expect(Number(QUIZ_VARS.sqrtVal)).toBeLessThan(9.8);
  });
});
