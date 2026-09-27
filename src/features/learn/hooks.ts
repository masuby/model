import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useModel } from '@/data-layer/DataProvider';
import { classify, type Scale } from '@/engine/risk/classes';
import { ALL_INDICATORS, DIMENSION_BY_KEY } from '@/engine/risk/hierarchy';
import { formatScore } from '@/lib/utils';
import { usePrefs } from '@/state/prefs';
import { QUIZ_VARS, type LessonId } from './course';
import { parseLesson, type ContentVars, type LessonContent } from './content';
import type { Progress } from './progress';

/** Live values for lesson text, read from the real model (national figures) and the engine. */
export function useContentVars(): ContentVars {
  const model = useModel();
  // `t` changes identity when the language changes, so class names re-translate.
  const { t } = useTranslation('common');
  return React.useMemo(() => {
    const n = model.national;
    const cls = (v: number | null | undefined, scale: Scale) => {
      const c = classify(v, scale);
      return c ? t(`classes.${c.key}`) : t('classes.noData');
    };
    const hazardCount = DIMENSION_BY_KEY.hazard.categories.reduce((s, c) => s + c.indicators.length, 0);
    return {
      national: formatScore(n.risk),
      nationalClass: cls(n.risk, 'risk'),
      nH: formatScore(n.dims.hazard.score),
      nHClass: cls(n.dims.hazard.score, 'hazard'),
      nHRiskClass: cls(n.dims.hazard.score, 'risk'),
      nV: formatScore(n.dims.vulnerability.score),
      nVClass: cls(n.dims.vulnerability.score, 'vulnerability'),
      nC: formatScore(n.dims.coping.score),
      nCClass: cls(n.dims.coping.score, 'coping'),
      hazardCount: String(hazardCount),
      indicatorCount: String(ALL_INDICATORS.length),
      councils: String(model.councils.length),
      regions: String(model.regions.length),
      ...QUIZ_VARS,
    };
  }, [model, t]);
}

/** A lesson's content in the current language, with live values interpolated. */
export function useLessonContent(id: LessonId): LessonContent {
  const { t } = useTranslation('learn');
  const vars = useContentVars();
  return React.useMemo(() => parseLesson(t(`lessons.${id}`, { returnObjects: true, ...vars })), [t, id, vars]);
}

/** Persisted course progress (per browser). */
export function useProgress(): Progress {
  return usePrefs((s) => s.learnProgress);
}

/** Id of the section currently in view (scroll-spy for the lesson side nav). */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = React.useState<string | null>(ids[0] ?? null);
  const key = ids.join('|');
  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        if (visible.size) {
          // The topmost visible section wins.
          const first = ids.find((id) => visible.has(id));
          if (first) setActive(first);
        }
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}
