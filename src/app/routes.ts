/**
 * Route registry: each page's code and its translation namespaces load in parallel (not one after the
 * other), and `prefetchRoute` warms both on link hover/focus so navigation feels instant.
 */
import type * as React from 'react';
import { preloadNamespaces } from '@/i18n';

type PageModule = { default: React.ComponentType };

interface RouteDef {
  load: () => Promise<PageModule>;
  ns: string[];
}

export const ROUTES = {
  home: { load: () => import('@/features/home/HomePage'), ns: ['home'] },
  explore: { load: () => import('@/features/explore/ExplorePage'), ns: ['explore', 'guide'] },
  area: { load: () => import('@/features/area/AreaPage'), ns: ['area', 'guide'] },
  card: { load: () => import('@/features/area/RiskCardPage'), ns: ['area', 'guide', 'data'] },
  cardDetailed: { load: () => import('@/features/area/DetailedRiskCardPage'), ns: ['area', 'guide', 'data', 'explore', 'indicators'] },
  insights: { load: () => import('@/features/insights/InsightsPage'), ns: ['insights'] },
  severity: { load: () => import('@/features/severity/SeverityPage'), ns: ['severity'] },
  learn: { load: () => import('@/features/learn/LearnPage'), ns: ['learn'] },
  methodology: { load: () => import('@/features/methodology/MethodologyPage'), ns: ['methodology'] },
  methodologySection: { load: () => import('@/features/methodology/SectionPage'), ns: ['methodology'] },
  data: { load: () => import('@/features/data/DataPortalPage'), ns: ['data'] },
  notFound: { load: () => import('./NotFound'), ns: [] },
} satisfies Record<string, RouteDef>;

export type RouteKey = keyof typeof ROUTES;

/** Load a page module together with its namespaces. */
export function loadRoute(key: RouteKey): Promise<PageModule> {
  const r = ROUTES[key];
  return Promise.all([r.load(), r.ns.length ? preloadNamespaces(r.ns) : Promise.resolve()]).then(([m]) => m);
}

const PATH_TO_ROUTE: Array<[RegExp, RouteKey]> = [
  [/^\/$/, 'home'],
  [/^\/explore/, 'explore'],
  [/^\/area\/[^/]+\/card\/detailed/, 'cardDetailed'],
  [/^\/area\/[^/]+\/card/, 'card'],
  [/^\/area\//, 'area'],
  [/^\/insights/, 'insights'],
  [/^\/severity/, 'severity'],
  [/^\/learn/, 'learn'],
  [/^\/methodology\/./, 'methodologySection'],
  [/^\/methodology/, 'methodology'],
  [/^\/data/, 'data'],
];

const warmed = new Set<RouteKey>();
/** Warm a route's code and translations (idempotent) - call on link hover/focus/touch. */
export function prefetchRoute(path: string): void {
  const key = PATH_TO_ROUTE.find(([re]) => re.test(path.split(/[?#]/)[0]))?.[1];
  if (!key || warmed.has(key)) return;
  warmed.add(key);
  void loadRoute(key).catch(() => warmed.delete(key));
}
