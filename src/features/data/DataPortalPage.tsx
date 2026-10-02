/**
 * Data Portal (/data): where institutions keep Tanzania's INFORM data current and PMO reviewers approve
 * it. Role-aware tabs: indicators (assignments, requests and the entry sheet), review, my submissions,
 * approved data (with revert), direct scores and bulk paste (reviewers), activity and people (admins).
 * Works in local demo mode (browser only) and against the shared Supabase backend (RLS + server-side
 * approval).
 *
 * Layout follows docs/DESIGN_LANGUAGE.md: a plain header whose key figures (separated by rules) close it,
 * the access note, then straight into the work - underline tabs (a labelled native select on phones, so
 * the active section is always visible), or just the approved changes when that is all a visitor can see.
 * Each tool loads on demand and is prefetched on tab hover/focus.
 */
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { KeyFigures, PageContainer, PageHeader } from '@/components/layout/Page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';
import { useData, useModel, useOverrides, useRawSubmissions, useRawValues } from '@/data-layer/DataProvider';
import { formatDate, formatNumber } from '@/lib/utils';
import { AccessPanel, ContributorAccess } from './components/AccessPanel';
import { ErrorState, ListSkeleton } from './components/common';
import { DataToolsMenu } from './components/DataTools';
import { useMySubmissions, usePendingQueue, usePermissions } from './hooks';
import { relativeTime } from './lib/format';
import { ActivityLog } from './tabs/ActivityLog';
import { Approved } from './tabs/Approved';
import { MySubmissions } from './tabs/MySubmissions';
import { ScoreEntry } from './tabs/ScoreEntry';

type TabKey = 'indicators' | 'queue' | 'scores' | 'paste' | 'mine' | 'approved' | 'activity' | 'people';
interface TabDef {
  key: TabKey;
  show: (p: { canSubmit: boolean; canReview: boolean; isAdmin: boolean }) => boolean;
}

// Institutions work through the indicators they are assigned (measured values). Direct 0–10 scores and
// bulk paste stay with reviewers, for the few indicator groups that have no workbook indicator.
const TABS: readonly TabDef[] = [
  { key: 'indicators', show: (p) => p.canSubmit },
  { key: 'queue', show: (p) => p.canReview },
  { key: 'scores', show: (p) => p.canReview },
  { key: 'paste', show: (p) => p.canReview },
  { key: 'mine', show: (p) => p.canSubmit },
  { key: 'approved', show: () => true },
  { key: 'activity', show: (p) => p.canReview },
  { key: 'people', show: (p) => p.isAdmin },
];
/** Reviewers land on their queue, so it leads their tab row. */
const REVIEWER_ORDER: readonly TabKey[] = ['queue', 'indicators', 'scores', 'paste', 'mine', 'approved', 'activity', 'people'];

/** Tools split out of the page chunk. Import promises are cached, so prefetching is free. */
const LOADERS = {
  indicators: () => import('./tabs/Indicators'),
  paste: () => import('./tabs/BulkPaste'),
  queue: () => import('./tabs/Review'),
  people: () => import('./tabs/People'),
};
const Indicators = React.lazy(() => LOADERS.indicators().then((m) => ({ default: m.Indicators })));
const BulkPaste = React.lazy(() => LOADERS.paste().then((m) => ({ default: m.BulkPaste })));
const Review = React.lazy(() => LOADERS.queue().then((m) => ({ default: m.Review })));
const People = React.lazy(() => LOADERS.people().then((m) => ({ default: m.People })));
const prefetch = (key: TabKey) => {
  if (key in LOADERS) void LOADERS[key as keyof typeof LOADERS]().catch(() => undefined);
};

export default function DataPortalPage() {
  const { t, i18n } = useTranslation(['data', 'common']);
  const { profile, authLoading } = useData();
  const perms = usePermissions();
  const overrides = useOverrides();
  const model = useModel();
  const { pending: pendingScores } = usePendingQueue();
  const { mine } = useMySubmissions();
  const rawSubmissions = useRawSubmissions();
  const rawValues = useRawValues();
  const isAdmin = profile?.role === 'admin';
  const rawPending = React.useMemo(() => (rawSubmissions.data ?? []).filter((s) => s.status === 'pending'), [rawSubmissions.data]);
  const pending = { length: pendingScores.length + (perms.canReview ? rawPending.length : 0) };
  const [params, setParams] = useSearchParams();

  const tabs = React.useMemo(() => {
    const shown = TABS.filter((tab) => tab.show({ canSubmit: perms.canSubmit, canReview: perms.canReview, isAdmin }));
    return perms.canReview ? [...shown].sort((a, b) => REVIEWER_ORDER.indexOf(a.key) - REVIEWER_ORDER.indexOf(b.key)) : shown;
  }, [perms.canSubmit, perms.canReview, isAdmin]);
  // Deterministic landing tab per role (no jump once data loads): reviewers start on their queue,
  // institutions on their indicators.
  const defaultTab: TabKey = perms.canReview ? 'queue' : perms.canSubmit ? 'indicators' : 'approved';
  const requested = params.get('tab') as TabKey | null;
  const active: TabKey = requested && tabs.some((x) => x.key === requested) ? requested : defaultTab;
  const councilParam = params.get('council');
  const councilId = councilParam && model.byId.get(councilParam)?.level === 'council' ? councilParam : null;
  const [visited, setVisited] = React.useState<ReadonlySet<TabKey>>(() => new Set([active]));
  const listRef = React.useRef<HTMLDivElement>(null);

  // Where the tab row scrolls sideways (tablet widths), keep the active tab in view - horizontally only,
  // so a deep link never makes the page jump.
  React.useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[data-state="active"]');
    if (!list || !el || list.scrollWidth <= list.clientWidth) return;
    const left = el.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
    list.scrollTo({ left: Math.max(0, left - (list.clientWidth - el.offsetWidth) / 2) });
  }, [active, authLoading, tabs.length]);

  const setParam = React.useCallback(
    (key: string, value: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const onTab = (v: string) => {
    setVisited((prev) => new Set(prev).add(v as TabKey));
    setParam('tab', v);
  };

  // Headline numbers.
  const stats = React.useMemo(() => {
    let values = 0;
    let latest = '';
    for (const refs of Object.values(overrides.data ?? {}))
      for (const stamp of Object.values(refs ?? {})) {
        if (!stamp) continue;
        values++;
        if (stamp.at > latest) latest = stamp.at;
      }
    const units = new Set(Object.keys(overrides.data ?? {}));
    for (const v of rawValues.data ?? []) {
      values++;
      units.add(v.unitId);
      if (v.at > latest) latest = v.at;
    }
    return { values, units: units.size, latest };
  }, [overrides.data, rawValues.data]);
  const myRawPending = rawPending.filter((s) => s.authorId === profile?.id && s.authorName === profile?.fullName).length;
  const awaiting = perms.canReview ? pending.length : mine.filter((s) => s.status === 'pending').length + myRawPending;
  const worker = perms.canSubmit || perms.canReview;
  // Only figures that say something for this person: no "awaiting" for visitors, no empty "0 /  - " pair
  // while the official baseline is still untouched.
  const figures = [
    stats.values > 0
      ? { label: t('stats.values'), value: formatNumber(stats.values, i18n.language), sub: t('stats.valuesSub', { count: stats.units }) }
      : { label: t('stats.inUse'), value: t('stats.baseline'), sub: t('stats.baselineSub') },
    ...(worker
      ? [{ label: t('stats.awaiting'), value: formatNumber(awaiting, i18n.language), sub: perms.canReview ? t('stats.awaitingReviewer') : t('stats.awaitingMine') }]
      : []),
    { label: t('stats.councils'), value: formatNumber(model.councils.length, i18n.language), sub: t('stats.councilsSub') },
    ...(stats.latest
      ? [
          {
            label: t('stats.latest'),
            value: formatDate(stats.latest, i18n.language, { day: 'numeric', month: 'short' }),
            sub: t('stats.latestSub', { when: relativeTime(stats.latest, i18n.language) }),
          },
        ]
      : []),
  ];

  const gate = (node: React.ReactNode) =>
    overrides.isLoading ? <ListSkeleton rows={2} /> : overrides.isError ? <ErrorState error={overrides.error} onRetry={() => void overrides.refetch()} /> : node;

  const body: Record<TabKey, () => React.ReactNode> = {
    indicators: () => <Indicators />,
    queue: () => <Review />,
    scores: () => gate(<ScoreEntry councilId={councilId} onCouncilChange={(id) => setParam('council', id)} />),
    paste: () => gate(<BulkPaste />),
    mine: () => <MySubmissions onStart={() => onTab('indicators')} />,
    approved: () => <Approved />,
    activity: () => <ActivityLog />,
    people: () => <People />,
  };

  const tabLabel = (key: TabKey) => t(`tabs.${key}`);

  return (
    <div>
      <PageHeader eyebrow={t('page.eyebrow')} title={t('page.title')} description={t('page.lead')} actions={<DataToolsMenu />}>
        <KeyFigures className="mt-10 border-t border-border pt-7" items={figures} />
      </PageHeader>

      <PageContainer className="pt-10 pb-20 sm:pt-12">
        <AccessPanel />

        {profile && !perms.canSubmit && <ContributorAccess className="mt-14" />}

        <div className="mt-12">
          {authLoading ? (
            <ListSkeleton rows={2} />
          ) : tabs.length === 1 ? (
            // One section only (visitors): a plain heading, not a one-item tab row.
            <section aria-labelledby="data-section-title" className="border-t border-border pt-10">
              <h2 id="data-section-title" className="text-[1.6rem] leading-tight">
                {tabLabel(tabs[0].key)}
              </h2>
              <div className="mt-6">{body[tabs[0].key]()}</div>
            </section>
          ) : (
            <Tabs value={active} onValueChange={onTab}>
              {/* Phones: a labelled native select, so the current section and every other one are visible. */}
              <div className="border-b border-border pb-5 md:hidden">
                <label htmlFor="data-section" className="text-sm text-muted-foreground">
                  {t('tabs.select')}
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="data-section"
                    value={active}
                    onChange={(e) => onTab(e.target.value)}
                    className="h-11 w-full appearance-none rounded-md border border-input bg-background pr-10 pl-3 text-base font-medium text-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/40"
                  >
                    {tabs.map((tab) => (
                      <option key={tab.key} value={tab.key}>
                        {tab.key === 'queue' && pending.length > 0 ? `${tabLabel(tab.key)} (${pending.length} ${t('tabs.pendingSr')})` : tabLabel(tab.key)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
              </div>
              <TabsList ref={listRef} className="relative hidden w-full gap-6 md:flex" aria-label={t('tabs.label')}>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key} onPointerEnter={() => prefetch(tab.key)} onFocus={() => prefetch(tab.key)}>
                    {tabLabel(tab.key)}
                    {tab.key === 'queue' && pending.length > 0 && (
                      <span className="num relative ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs leading-5 font-semibold text-foreground">
                        {pending.length}
                        <span className="sr-only"> {t('tabs.pendingSr')}</span>
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) =>
                visited.has(tab.key) || tab.key === active ? (
                  <TabsContent key={tab.key} value={tab.key} forceMount className="mt-8 data-[state=inactive]:hidden">
                    <React.Suspense fallback={<ListSkeleton rows={2} />}>{body[tab.key]()}</React.Suspense>
                  </TabsContent>
                ) : null,
              )}
            </Tabs>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
