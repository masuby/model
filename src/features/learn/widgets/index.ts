import * as React from 'react';
import type { WidgetId } from '../course';

type Loader = () => Promise<{ default: React.ComponentType }>;

const LOADERS: Record<WidgetId, Loader> = {
  hazardHotspots: () => import('./HazardHotspots'),
  exposureCompare: () => import('./ExposureCompare'),
  vulnerabilityProfile: () => import('./VulnerabilityProfile'),
  copingWhatIf: () => import('./CopingWhatIf'),
  riskPlayground: () => import('./RiskPlayground'),
  severityCalculator: () => import('./SeverityCalculator'),
  decisionChecklist: () => import('./DecisionChecklist'),
};

/**
 * Live widgets embeddable from lesson content (`{ "type": "widget", "id": … }`). Each lesson embeds
 * exactly one, so they are split into their own chunks and loaded on demand (render inside Suspense).
 */
export const WIDGETS = Object.fromEntries(Object.entries(LOADERS).map(([id, load]) => [id, React.lazy(load)])) as Record<
  WidgetId,
  React.LazyExoticComponent<React.ComponentType>
>;

/**
 * Start fetching a widget's chunk ahead of render (e.g. as soon as a lesson mounts, or when a link to
 * it is hovered). The module system caches the import, so the lazy component resolves from it.
 */
export function preloadWidget(id: WidgetId): void {
  void LOADERS[id]().catch(() => {
    /* a failed prefetch is retried by React.lazy on render */
  });
}

/**
 * Measured height of each widget (English, default council), used for the loading placeholder so
 * the text below — and a jump to a section or to #quiz — does not move when the chunk arrives.
 * `base` is a 390px phone, `sm` a 640px screen, `md` the full 44rem reading column.
 */
export const WIDGET_HEIGHT: Record<WidgetId, { base: string; sm: string; md: string }> = {
  hazardHotspots: { base: '54rem', sm: '46rem', md: '44rem' },
  exposureCompare: { base: '80rem', sm: '73rem', md: '49rem' },
  vulnerabilityProfile: { base: '78rem', sm: '64rem', md: '48rem' },
  copingWhatIf: { base: '120rem', sm: '94rem', md: '78rem' },
  riskPlayground: { base: '82rem', sm: '75rem', md: '61rem' },
  severityCalculator: { base: '69rem', sm: '64rem', md: '53rem' },
  decisionChecklist: { base: '112rem', sm: '93rem', md: '88rem' },
};
