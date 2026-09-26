/**
 * Data Portal (/data) — where sector officers keep Tanzania's INFORM data current and PMO reviewers
 * approve it. Role-aware tabs: enter scores, measured values or bulk paste; review queue; my
 * submissions; approved changes (with revert); activity. Works in local demo mode (browser only) and
 * against the shared Supabase backend (RLS + server-side approval).
 *
 * Layout follows docs/DESIGN_LANGUAGE.md: a plain header whose key figures (separated by rules) close it,
 * the access note, then straight into the work — underline tabs (a labelled native select on phones, so
 * the active section is always visible), or just the approved changes when that is all a visitor can see.
 * Score entry (the contributors' landing tab) ships with the page; measured values, bulk paste and the
 * review queue load on demand and are prefetched on tab hover/focus.
 */
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { KeyFigures, PageContainer, PageHeader } from '@/components/layout/Page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';
import { useData, useModel, useOverrides } from '@/data-layer/DataProvider';
import { formatDate, formatNumber } from '@/lib/utils';
import { AccessPanel, ContributorAccess } from './components/AccessPanel';
import { ErrorState, ListSkeleton } from './components/common';
import { DataToolsMenu } from './components/DataTools';
import { useMySubmissions, usePendingQueue, usePermissions } from './hooks';
import { relativeTime } from './lib/format';
import { ActivityLog } from './tabs/ActivityLog';
import { ApprovedChanges } from './tabs/ApprovedChanges';
import { MySubmissions } from './tabs/MySubmissions';
import { ScoreEntry } from './tabs/ScoreEntry';

type TabKey = 'scores' | 'raw' | 'paste' | 'queue' | 'mine' | 'approved' | 'activity';
interface TabDef {
  key: TabKey;
  show: (p: { canSubmit: boolean; canReview: boolean }) => boolean;
}

const TABS: readonly TabDef[] = [
  { key: 'scores', show: (p) => p.canSubmit },
  { key: 'raw', show: (p) => p.canSubmit },
  { key: 'paste', show: (p) => p.canSubmit },
  { key: 'queue', show: (p) => p.canReview },
  { key: 'mine', show: (p) => p.canSubmit },
  { key: 'approved', show: () => true },
  { key: 'activity', show: (p) => p.canReview },
];
/** Reviewers land on their queue, so it leads their tab row. */
const REVIEWER_ORDER: readonly TabKey[] = ['queue', 'scores', 'raw', 'paste', 'mine', 'approved', 'activity'];

/** Tools split out of the page chunk. Import promises are cached, so prefetching is free. */
const LOADERS = {
  raw: () => import('./tabs/RawEntry'),
  paste: () => import('./tabs/BulkPaste'),
  queue: () => import('./tabs/ReviewQueue'),
};
const RawEntry = React.lazy(() => LOADERS.raw().then((m) => ({ default: m.RawEntry })));
const BulkPaste = React.lazy(() => LOADERS.paste().then((m) => ({ default: m.BulkPaste })));
const ReviewQueue = React.lazy(() => LOADERS.queue().then((m) => ({ default: m.ReviewQueue })));
const prefetch = (key: TabKey) => {
  if (key in LOADERS) void LOADERS[key as keyof typeof LOADERS]().catch(() => undefined);
};

export default function DataPortalPage() {
  const { t, i18n } = useTranslation(['data', 'common']);
  const { profile, authLoading } = useData();
  const perms = usePermissions();
  const overrides = useOverrides();
  const model = useModel();
  const { pending } = usePendingQueue();
  const { mine } = useMySubmissions();
  const [params, setParams] = useSearchParams();

  const tabs = React.useMemo(() => {
    const shown = TABS.filter((tab) => tab.show({ canSubmit: perms.canSubmit, canReview: perms.canReview }));
    return perms.canReview ? [...shown].sort((a, b) => REVIEWER_ORDER.indexOf(a.key) - REVIEWER_ORDER.indexOf(b.key)) : shown;
  }, [perms.canSubmit, perms.canReview]);
  // Deterministic landing tab per role (no jump once data loads): reviewers start on their queue.
  const defaultTab: TabKey = perms.canReview ? 'queue' : perms.canSubmit ? 'scores' : 'approved';
  const requested = params.get('tab') as TabKey | null;
  const active: TabKey = requested && tabs.some((x) => x.key === requested) ? requested : defaultTab;
  const councilParam = params.get('council');
  const councilId = councilParam && model.byId.get(councilParam)?.level === 'council' ? councilParam : null;
  const [visited, setVisited] = React.useState<ReadonlySet<TabKey>>(() => new Set([active]));
  const listRef = React.useRef<HTMLDivElement>(null);

  // Where the tab row scrolls sideways (tablet widths), keep the active tab in view — horizontally only,
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
    return { values, units: Object.keys(overrides.data ?? {}).length, latest };
  }, [overrides.data]);
  const awaiting = perms.canReview ? pending.length : mine.filter((s) => s.status === 'pending').length;
  const worker = perms.canSubmit || perms.canReview;
  // Only figures that say something for this person: no "awaiting" for visitors, no empty "0 / —" pair
  // while the official baseline is still untouched.
  const figures = [
    stats.values > 0
      ? { label: t('stats.values'), value: formatNumber(stats.values, i18n.language), sub: t('stats.valuesSub', { count: stats.units }) }
      : { label: t('stats.inUse'), value: t('stats.baseline'), sub: t('stats.baselineSub') },
    ...(worker
      ? [{ label: t('stats.awaiting'), value: formatNumber(awaiting, i18n.language), sub: perms.canReview ? t('stats.awaitingReviewer') : t('stats.awaitingMine') }]
      : []),
    { label: t('stats.councils'), value: formatNumber(model.councils.length, i18n.language), sub: t('stats.councilsSub', { sources: model.sources.length }) },
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
    scores: () => gate(<ScoreEntry councilId={councilId} onCouncilChange={(id) => setParam('council', id)} />),
    raw: () => gate(<RawEntry councilId={councilId} onCouncilChange={(id) => setParam('council', id)} />),
    paste: () => gate(<BulkPaste />),
    queue: () => <ReviewQueue />,
    mine: () => <MySubmissions onStart={() => onTab('scores')} />,
    approved: () => <ApprovedChanges />,
    activity: () => <ActivityLog />,
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
