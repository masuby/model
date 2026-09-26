/**
 * Data Portal (/data) — where sector officers keep Tanzania's INFORM data current and PMO reviewers
 * approve it. Role-aware tabs: enter scores, measured values or bulk paste; review queue; my
 * submissions; approved changes (with revert); activity. Works in local demo mode (browser only) and
 * against the shared Supabase backend (RLS + server-side approval).
 */
import {
  BadgeCheck,
  ClipboardPaste,
  Clock3,
  FileClock,
  History,
  Inbox,
  Map as MapIcon,
  PenLine,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageContainer, PageHeader, Stat } from '@/components/layout/Page';
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
import { BulkPaste } from './tabs/BulkPaste';
import { MySubmissions } from './tabs/MySubmissions';
import { RawEntry } from './tabs/RawEntry';
import { ReviewQueue } from './tabs/ReviewQueue';
import { ScoreEntry } from './tabs/ScoreEntry';

type TabKey = 'scores' | 'raw' | 'paste' | 'queue' | 'mine' | 'approved' | 'activity';
interface TabDef {
  key: TabKey;
  icon: LucideIcon;
  show: (p: { canSubmit: boolean; canReview: boolean }) => boolean;
}

const TABS: readonly TabDef[] = [
  { key: 'scores', icon: SlidersHorizontal, show: (p) => p.canSubmit },
  { key: 'raw', icon: Ruler, show: (p) => p.canSubmit },
  { key: 'paste', icon: ClipboardPaste, show: (p) => p.canSubmit },
  { key: 'queue', icon: Inbox, show: (p) => p.canReview },
  { key: 'mine', icon: FileClock, show: (p) => p.canSubmit },
  { key: 'approved', icon: BadgeCheck, show: () => true },
  { key: 'activity', icon: History, show: (p) => p.canReview },
];

export default function DataPortalPage() {
  const { t, i18n } = useTranslation(['data', 'common']);
  const { profile, authLoading } = useData();
  const perms = usePermissions();
  const overrides = useOverrides();
  const model = useModel();
  const { pending } = usePendingQueue();
  const { mine } = useMySubmissions();
  const [params, setParams] = useSearchParams();

  const tabs = React.useMemo(() => TABS.filter((tab) => tab.show({ canSubmit: perms.canSubmit, canReview: perms.canReview })), [perms.canSubmit, perms.canReview]);
  // Deterministic landing tab per role (no jump once data loads): reviewers start on their queue.
  const defaultTab: TabKey = perms.canReview ? 'queue' : perms.canSubmit ? 'scores' : 'approved';
  const requested = params.get('tab') as TabKey | null;
  const active: TabKey = requested && tabs.some((x) => x.key === requested) ? requested : defaultTab;
  const councilParam = params.get('council');
  const councilId = councilParam && model.byId.get(councilParam)?.level === 'council' ? councilParam : null;
  const [visited, setVisited] = React.useState<ReadonlySet<TabKey>>(() => new Set([active]));

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

  return (
    <div>
      <PageHeader eyebrow={t('page.eyebrow')} title={t('page.title')} description={t('page.lead')} actions={<DataToolsMenu />}>
        <WorkflowSteps />
      </PageHeader>

      <PageContainer className="space-y-6 py-8">
        <AccessPanel />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={t('stats.values')} value={formatNumber(stats.values, i18n.language)} sub={t('stats.valuesSub', { count: stats.units })} icon={<BadgeCheck />} />
          <Stat
            label={t('stats.awaiting')}
            value={profile ? formatNumber(awaiting, i18n.language) : '—'}
            sub={perms.canReview ? t('stats.awaitingReviewer') : perms.canSubmit ? t('stats.awaitingMine') : t('stats.awaitingNone')}
            icon={<Clock3 />}
          />
          <Stat label={t('stats.councils')} value={formatNumber(model.councils.length, i18n.language)} sub={t('stats.councilsSub', { sources: model.sources.length })} icon={<MapIcon />} />
          <Stat
            label={t('stats.latest')}
            value={stats.latest ? formatDate(stats.latest, i18n.language, { day: 'numeric', month: 'short' }) : '—'}
            sub={stats.latest ? t('stats.latestSub', { when: relativeTime(stats.latest, i18n.language) }) : t('stats.latestNone')}
            icon={<Sparkles />}
          />
        </div>

        {profile && !perms.canSubmit && <ContributorAccess />}

        {authLoading ? (
          <ListSkeleton rows={2} />
        ) : (
          <Tabs value={active} onValueChange={onTab}>
            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <TabsList className="w-max" aria-label={t('tabs.label')}>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key} className="px-3.5 py-2">
                    <tab.icon aria-hidden />
                    {t(`tabs.${tab.key}`)}
                    {tab.key === 'queue' && pending.length > 0 && (
                      <span className="num ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] leading-5 font-bold text-primary-foreground">
                        {pending.length}
                        <span className="sr-only"> {t('tabs.pendingSr')}</span>
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {tabs.map((tab) =>
              visited.has(tab.key) || tab.key === active ? (
                <TabsContent key={tab.key} value={tab.key} forceMount className="mt-6 animate-fade-up data-[state=inactive]:hidden">
                  {body[tab.key]()}
                </TabsContent>
              ) : null,
            )}
          </Tabs>
        )}
      </PageContainer>
    </div>
  );
}

function WorkflowSteps() {
  const { t } = useTranslation('data');
  const steps = [
    { icon: PenLine, key: 'enter' },
    { icon: ShieldCheck, key: 'review' },
    { icon: MapIcon, key: 'live' },
  ] as const;
  return (
    <ol className="mt-8 grid gap-3 sm:grid-cols-3" aria-label={t('steps.label')}>
      {steps.map((s, i) => (
        <li key={s.key} className="relative flex items-start gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-xs backdrop-blur">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <s.icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              <span className="num mr-1.5 text-muted-foreground">{i + 1}.</span>
              {t(`steps.${s.key}`)}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(`steps.${s.key}Desc`)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
