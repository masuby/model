/**
 * Data & auth context. Picks the Supabase repository when VITE_SUPABASE_URL/KEY are set, otherwise the
 * browser-local demo repository. Exposes the INFORM model built from the approved edits, plus the
 * signed-in profile (Supabase) or a demo role (local mode).
 */
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import * as React from 'react';
import { buildModel } from '@/engine/risk/model';
import type { BaselineRaw } from '@/engine/risk/rawValues';
import type { EditRef, Overrides, RiskModel } from '@/engine/risk/types';
import { createLocalRepository, demoProfile } from './local';
import { createSupabaseClient, createSupabaseRepository, supabaseConfigured, type SupabaseClient } from './supabase';
import { APPLIED_DIRECTLY_NOTE, type NewRawSubmission, type NewSubmission, type Profile, type Repository, type RequestKind, type Role } from './types';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
});

interface DataContextValue {
  repo: Repository;
  mode: Repository['mode'];
  profile: Profile | null;
  authLoading: boolean;
  /** Supabase mode: a session exists (the user is signed in), even if the profile failed to load. */
  signedIn: boolean;
  /** Supabase mode: the profile lookup failed for a signed-in user (e.g. missing profile row). */
  authError: string | null;
  /** Local demo mode only: switch the simulated role. */
  setDemoRole: (role: Role) => void;
  /** Local demo mode only: re-read the demo profile (after its institution changed). */
  refreshDemoProfile: () => void;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const DataContext = React.createContext<DataContextValue | null>(null);

/**
 * The Supabase client is created in the background - the app renders immediately with the shipped
 * dataset and picks up approved edits and the session as soon as the SDK has loaded (never blocking
 * first paint). The SDK download waits for the page's load event and an idle moment, so it never competes
 * with the route's own code. In demo mode nothing is downloaded at all.
 */
function afterLoad(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const idle = () => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(() => resolve(), { timeout: 1500 }) : window.setTimeout(resolve, 200));
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
  });
}
const sbPromise: Promise<SupabaseClient | null> = supabaseConfigured ? afterLoad().then(createSupabaseClient) : Promise.resolve(null);
let SB: SupabaseClient | null = null;
void sbPromise.then((c) => {
  SB = c;
});
const getSupabase = () => SB;

/** A repository that forwards every call to the real Supabase one once the SDK is ready. */
function createDeferredSupabaseRepository(): Repository {
  const ready = sbPromise.then((c) => {
    if (!c) throw new Error('Supabase is not configured');
    return createSupabaseRepository(c);
  });
  return new Proxy({ mode: 'supabase' } as Repository, {
    get(target, prop) {
      if (prop === 'mode') return target.mode;
      if (prop === 'resetAll' || typeof prop !== 'string') return undefined; // resetAll: local mode only
      return (...args: unknown[]) => ready.then((r) => (r[prop as keyof Repository] as (...a: unknown[]) => Promise<unknown>)(...args));
    },
  });
}

const DEMO_KEY = 'inform.demoRole';

function useSupabaseProfile(enabled: boolean) {
  const [sb, setSb] = React.useState<SupabaseClient | null>(getSupabase);
  React.useEffect(() => {
    if (enabled && !sb) void sbPromise.then(setSb);
  }, [enabled, sb]);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(enabled);

  React.useEffect(() => {
    if (!enabled || !sb) return;
    let active = true;
    void sb.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [enabled, sb]);

  const profileQuery = useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: enabled && !!sb && !!session,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await sb!.from('profiles').select('id, full_name, institution, institution_key, role').eq('id', session!.user.id).single();
      if (error) throw error;
      return {
        id: data.id,
        email: session!.user.email,
        fullName: data.full_name || session!.user.email || 'User',
        institution: data.institution,
        institutionKey: data.institution_key,
        role: data.role as Role,
      };
    },
  });

  return {
    session,
    profile: profileQuery.data ?? null,
    loading: loading || (!!session && profileQuery.isLoading),
    error: profileQuery.error ? (profileQuery.error as Error).message : null,
  };
}

function DataProviderInner({ children }: { children: React.ReactNode }) {
  const repo = React.useMemo<Repository>(() => (supabaseConfigured ? createDeferredSupabaseRepository() : createLocalRepository()), []);

  const sbAuth = useSupabaseProfile(repo.mode === 'supabase');
  const [demoTick, setDemoTick] = React.useState(0);
  const [demoRole, setDemoRoleState] = React.useState<Role>(() => {
    try {
      return (localStorage.getItem(DEMO_KEY) as Role) || 'viewer';
    } catch {
      return 'viewer';
    }
  });
  const setDemoRole = React.useCallback((role: Role) => {
    setDemoRoleState(role);
    try {
      localStorage.setItem(DEMO_KEY, role);
    } catch {
      /* ignore */
    }
  }, []);

  // demoTick re-reads the demo profile from storage after an administrator changes its institution.
  const demo = React.useMemo(() => (void demoTick, demoProfile(demoRole)), [demoRole, demoTick]);

  const value = React.useMemo<DataContextValue>(() => {
    return {
      repo,
      mode: repo.mode,
      profile: repo.mode === 'supabase' ? sbAuth.profile : demo,
      refreshDemoProfile: () => setDemoTick((n) => n + 1),
      authLoading: repo.mode === 'supabase' ? sbAuth.loading : false,
      signedIn: repo.mode === 'supabase' ? !!sbAuth.session : true,
      authError: repo.mode === 'supabase' ? sbAuth.error : null,
      setDemoRole,
      signInWithEmail: async (email) => {
        const sb = await sbPromise;
        if (!sb) return;
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/data` } });
        if (error) throw error;
      },
      signInWithPassword: async (email, password) => {
        const sb = await sbPromise;
        if (!sb) return;
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        const sb = await sbPromise;
        if (sb) await sb.auth.signOut();
        // Drop everything user-specific so the next person on this device sees nothing of the last.
        for (const key of ['profile', 'submissions', 'audit', 'requests', 'raw-submissions', 'profiles']) queryClient.removeQueries({ queryKey: [key] });
      },
    };
  }, [repo, sbAuth.profile, sbAuth.loading, sbAuth.session, sbAuth.error, demo, setDemoRole]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProviderInner>{children}</DataProviderInner>
    </QueryClientProvider>
  );
}

export function useData(): DataContextValue {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}

export const isSupabaseMode = () => supabaseConfigured;

/* ------------------------------------------------------------------------------------------------ */
/* Queries & mutations                                                                                */
/* ------------------------------------------------------------------------------------------------ */

const BASE_MODEL = buildModel();

export function useOverrides() {
  const { repo } = useData();
  return useQuery({ queryKey: ['overrides', repo.mode], queryFn: () => repo.getOverrides() });
}

/** One model per overrides object, however many components ask for it. */
const modelCache = new WeakMap<object, RiskModel>();
const EMPTY_OVERRIDES = {};
function toModel(data: unknown): RiskModel {
  if (!data || typeof data !== 'object' || !Object.keys(data).length) return BASE_MODEL;
  let model = modelCache.get(data);
  if (!model) modelCache.set(data, (model = buildModel(data as Overrides)));
  return model;
}

/** INFORM baseline measured values per district: loaded only once approved measured values exist. */
let baselinePromise: Promise<BaselineRaw> | null = null;
export const loadBaseline = (): Promise<BaselineRaw> =>
  (baselinePromise ??= import('@/data/inform-baseline-raw.json').then((m) => (m.default ?? m) as unknown as BaselineRaw));

/**
 * Direct 0–10 edits merged with the council values recomputed from approved measured values. The
 * measured-value engine (with the workbook's indicator specifications) loads only when such values exist.
 */
async function modelInputs(repo: Repository): Promise<Overrides> {
  const [overrides, raw] = await Promise.all([repo.getOverrides(), repo.getRawValues()]);
  if (!raw.length) return overrides;
  const [{ deriveRawOverrides, mergeOverrides }, baseline] = await Promise.all([import('@/engine/risk/rawValues'), loadBaseline()]);
  return mergeOverrides(overrides, deriveRawOverrides(raw, BASE_MODEL, baseline), BASE_MODEL);
}

/**
 * The INFORM model with all approved edits and measured values applied. Falls back to the shipped
 * dataset while loading. Subscribes through `select`, so a page only re-renders when the model itself
 * changes (not when the queries settle with no edits).
 */
export function useModel(): RiskModel {
  const { repo } = useData();
  const { data } = useQuery({ queryKey: ['model', repo.mode], queryFn: () => modelInputs(repo), select: toModel, placeholderData: EMPTY_OVERRIDES });
  return data ?? BASE_MODEL;
}

/** The model before any edit: the published INFORM baseline. */
export const baseModel = (): RiskModel => BASE_MODEL;

export function useSubmissions() {
  const { repo, profile } = useData();
  return useQuery({ queryKey: ['submissions', repo.mode, profile?.id], queryFn: () => repo.listSubmissions(), enabled: !!profile });
}

export function useAudit(limit = 100) {
  const { repo, profile } = useData();
  return useQuery({ queryKey: ['audit', repo.mode, profile?.id, limit], queryFn: () => repo.listAudit(limit), enabled: !!profile });
}

/** Every query that shows shared data; all are refreshed after any write. */
export const DATA_KEYS = ['model', 'overrides', 'submissions', 'audit', 'assignments', 'requests', 'raw-values', 'raw-submissions', 'validations', 'profiles'];
export const refreshData = (qc: QueryClient) => Promise.all(DATA_KEYS.map((k) => qc.invalidateQueries({ queryKey: [k] })));
function useInvalidate() {
  const qc = useQueryClient();
  return () => refreshData(qc);
}

/** Submit changes. Reviewers (PMO/admin) can apply immediately - recorded as a self-approved submission. */
export function useSubmit() {
  const { repo, profile } = useData();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ input, applyNow }: { input: NewSubmission; applyNow: boolean }) => {
      if (!profile) throw new Error('Not signed in');
      const s = await repo.submit(input, profile);
      if (applyNow) await repo.review(s.id, 'approved', profile, APPLIED_DIRECTLY_NOTE);
      return s;
    },
    onSuccess: invalidate,
  });
}

export function useReview() {
  const { repo, profile } = useData();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: 'approved' | 'rejected'; note?: string }) => {
      if (!profile) throw new Error('Not signed in');
      return repo.review(id, decision, profile, note);
    },
    onSuccess: invalidate,
  });
}

export function useRevert() {
  const { repo, profile } = useData();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ unitId, ref }: { unitId: string; ref: EditRef }) => {
      if (!profile) throw new Error('Not signed in');
      return repo.revert(unitId, ref, profile);
    },
    onSuccess: invalidate,
  });
}

export function useResetAll() {
  const { repo, profile } = useData();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async () => {
      if (!profile || !repo.resetAll) return;
      await repo.resetAll(profile);
    },
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* Institutional workflow                                                                             */
/* ------------------------------------------------------------------------------------------------ */

export function useInstitutions() {
  const { repo } = useData();
  return useQuery({ queryKey: ['institutions', repo.mode], queryFn: () => repo.listInstitutions(), staleTime: 60 * 60_000 });
}

export function useAssignments() {
  const { repo } = useData();
  return useQuery({ queryKey: ['assignments', repo.mode], queryFn: () => repo.listAssignments() });
}

export function useRequests() {
  const { repo, profile } = useData();
  return useQuery({ queryKey: ['requests', repo.mode, profile?.id], queryFn: () => repo.listRequests(), enabled: !!profile });
}

export function useRawValues() {
  const { repo } = useData();
  return useQuery({ queryKey: ['raw-values', repo.mode], queryFn: () => repo.getRawValues() });
}

export function useRawSubmissions() {
  const { repo, profile } = useData();
  return useQuery({ queryKey: ['raw-submissions', repo.mode, profile?.id], queryFn: () => repo.listRawSubmissions(), enabled: !!profile });
}

export function useValidations() {
  const { repo } = useData();
  return useQuery({ queryKey: ['validations', repo.mode], queryFn: () => repo.listValidations() });
}

export function useProfiles(enabled = true) {
  const { repo, profile } = useData();
  return useQuery({ queryKey: ['profiles', repo.mode, profile?.id], queryFn: () => repo.listProfiles(), enabled: enabled && !!profile });
}

function useWorkflowMutation<V, R>(run: (repo: Repository, profile: Profile, vars: V) => Promise<R>, after?: () => void) {
  const { repo, profile } = useData();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vars: V) => {
      if (!profile) throw new Error('Not signed in');
      return run(repo, profile, vars);
    },
    onSuccess: async () => {
      after?.();
      await invalidate();
    },
  });
}

export const useAssign = () =>
  useWorkflowMutation((repo, p, v: { specIds: string[]; institutionKey: string | null; note?: string }) => repo.assign(v.specIds, v.institutionKey, p, v.note));

export const useCreateRequests = () =>
  useWorkflowMutation((repo, p, v: { specIds: string[]; kind: RequestKind; dueDate: string | null; message?: string }) =>
    repo.createRequests(v.specIds, v.kind, v.dueDate, v.message, p),
  );

export const useCloseRequest = () =>
  useWorkflowMutation((repo, p, v: { id: string; status: 'done' | 'cancelled'; note?: string }) => repo.closeRequest(v.id, v.status, p, v.note));

/** Submit measured values. Reviewers may apply at once, recorded as a self-approved submission. */
export const useSubmitRaw = () =>
  useWorkflowMutation(async (repo, p, v: { input: NewRawSubmission; applyNow: boolean }) => {
    const s = await repo.submitRaw(v.input, p);
    if (v.applyNow) await repo.reviewRaw(s.id, 'approved', p, APPLIED_DIRECTLY_NOTE);
    return s;
  });

export const useReviewRaw = () =>
  useWorkflowMutation((repo, p, v: { id: string; decision: 'approved' | 'rejected'; note?: string }) => repo.reviewRaw(v.id, v.decision, p, v.note));

export const useRevertRaw = () => useWorkflowMutation((repo, p, v: { specId: string; unitId: string }) => repo.revertRaw(v.specId, v.unitId, p));

export const useConfirmValues = () =>
  useWorkflowMutation((repo, p, v: { specId: string; requestId: string | null; note?: string }) => repo.confirmValues(v.specId, v.requestId, p, v.note));

/** Set a user's role and institution (administrators). In demo mode the demo identity is re-read. */
export function useUpdateProfile() {
  const { refreshDemoProfile } = useData();
  return useWorkflowMutation((repo, _p, v: { id: string; role?: Role; institutionKey?: string | null }) => repo.updateProfile(v.id, v), refreshDemoProfile);
}
