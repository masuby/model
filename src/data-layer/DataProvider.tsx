/**
 * Data & auth context. Picks the Supabase repository when VITE_SUPABASE_URL/KEY are set, otherwise the
 * browser-local demo repository. Exposes the INFORM model built from the approved edits, plus the
 * signed-in profile (Supabase) or a demo role (local mode).
 */
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import * as React from 'react';
import { buildModel } from '@/engine/risk/model';
import type { EditRef, Overrides, RiskModel } from '@/engine/risk/types';
import { createLocalRepository } from './local';
import { createSupabaseClient, createSupabaseRepository, supabaseConfigured, type SupabaseClient } from './supabase';
import type { NewSubmission, Profile, Repository, Role } from './types';

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
  signInWithEmail: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const DataContext = React.createContext<DataContextValue | null>(null);

/**
 * The Supabase client is created in the background — the app renders immediately with the shipped
 * dataset and picks up approved edits and the session as soon as the SDK has loaded (never blocking
 * first paint). In demo mode nothing is downloaded at all.
 */
const sbPromise: Promise<SupabaseClient | null> = supabaseConfigured ? createSupabaseClient() : Promise.resolve(null);
let SB: SupabaseClient | null = null;
void sbPromise.then((c) => {
  SB = c;
});
const getSupabase = () => SB;

/** A repository that forwards to the real Supabase one once the SDK is ready. */
function createDeferredSupabaseRepository(): Repository {
  const ready = sbPromise.then((c) => {
    if (!c) throw new Error('Supabase is not configured');
    return createSupabaseRepository(c);
  });
  return {
    mode: 'supabase',
    getOverrides: () => ready.then((r) => r.getOverrides()),
    listSubmissions: () => ready.then((r) => r.listSubmissions()),
    submit: (input, author) => ready.then((r) => r.submit(input, author)),
    review: (id, decision, reviewer, note) => ready.then((r) => r.review(id, decision, reviewer, note)),
    revert: (unitId, ref, actor) => ready.then((r) => r.revert(unitId, ref, actor)),
    listAudit: (limit) => ready.then((r) => r.listAudit(limit)),
  };
}

const DEMO_KEY = 'inform.demoRole';
const demoProfile = (role: Role): Profile => ({
  // One identity per demo role, so a demo reviewer never sees the demo officer's work as their own.
  id: `local-demo-${role}`,
  fullName: role === 'pmo' ? 'Demo PMO reviewer' : role === 'sector' ? 'Demo sector officer' : role === 'admin' ? 'Demo administrator' : 'Visitor',
  institution: 'Demo',
  role,
});

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
      const { data, error } = await sb!.from('profiles').select('id, full_name, institution, role').eq('id', session!.user.id).single();
      if (error) throw error;
      return { id: data.id, email: session!.user.email, fullName: data.full_name || session!.user.email || 'User', institution: data.institution, role: data.role as Role };
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

  const value = React.useMemo<DataContextValue>(() => {
    return {
      repo,
      mode: repo.mode,
      profile: repo.mode === 'supabase' ? sbAuth.profile : demoProfile(demoRole),
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
        for (const key of ['profile', 'submissions', 'audit']) queryClient.removeQueries({ queryKey: [key] });
      },
    };
  }, [repo, sbAuth.profile, sbAuth.loading, sbAuth.session, sbAuth.error, demoRole, setDemoRole]);

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

/** The INFORM model with all approved edits applied. Falls back to the shipped dataset while loading. */
export function useModel(): RiskModel {
  const { data } = useOverrides();
  return React.useMemo(() => (data && Object.keys(data).length ? buildModel(data as Overrides) : BASE_MODEL), [data]);
}

export function useSubmissions() {
  const { repo, profile } = useData();
  return useQuery({ queryKey: ['submissions', repo.mode, profile?.id], queryFn: () => repo.listSubmissions(), enabled: !!profile });
}

export function useAudit(limit = 100) {
  const { repo, profile } = useData();
  return useQuery({ queryKey: ['audit', repo.mode, profile?.id, limit], queryFn: () => repo.listAudit(limit), enabled: !!profile });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => Promise.all(['overrides', 'submissions', 'audit'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

/** Submit changes. Reviewers (PMO/admin) can apply immediately — recorded as a self-approved submission. */
export function useSubmit() {
  const { repo, profile } = useData();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ input, applyNow }: { input: NewSubmission; applyNow: boolean }) => {
      if (!profile) throw new Error('Not signed in');
      const s = await repo.submit(input, profile);
      if (applyNow) await repo.review(s.id, 'approved', profile, 'Applied directly by reviewer');
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
