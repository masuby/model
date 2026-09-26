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
import { createSupabaseRepository, getSupabase, supabaseConfigured } from './supabase';
import type { NewSubmission, Profile, Repository, Role } from './types';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
});

interface DataContextValue {
  repo: Repository;
  mode: Repository['mode'];
  profile: Profile | null;
  authLoading: boolean;
  /** Local demo mode only: switch the simulated role. */
  setDemoRole: (role: Role) => void;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const DataContext = React.createContext<DataContextValue | null>(null);

const DEMO_KEY = 'inform.demoRole';
const demoProfile = (role: Role): Profile => ({
  id: 'local-demo',
  fullName: role === 'pmo' ? 'Demo PMO reviewer' : role === 'sector' ? 'Demo sector officer' : role === 'admin' ? 'Demo administrator' : 'Visitor',
  institution: 'Demo',
  role,
});

function useSupabaseProfile(enabled: boolean) {
  const sb = getSupabase();
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

  return { session, profile: profileQuery.data ?? null, loading: loading || (!!session && profileQuery.isLoading) };
}

function DataProviderInner({ children }: { children: React.ReactNode }) {
  const repo = React.useMemo<Repository>(() => {
    const sb = getSupabase();
    return sb ? createSupabaseRepository(sb) : createLocalRepository();
  }, []);

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
    const sb = getSupabase();
    return {
      repo,
      mode: repo.mode,
      profile: repo.mode === 'supabase' ? sbAuth.profile : demoProfile(demoRole),
      authLoading: repo.mode === 'supabase' ? sbAuth.loading : false,
      setDemoRole,
      signInWithEmail: async (email) => {
        if (!sb) return;
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/data` } });
        if (error) throw error;
      },
      signInWithPassword: async (email, password) => {
        if (!sb) return;
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        if (sb) await sb.auth.signOut();
        queryClient.removeQueries({ queryKey: ['profile'] });
      },
    };
  }, [repo, sbAuth.profile, sbAuth.loading, demoRole, setDemoRole]);

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
  return useQuery({ queryKey: ['audit', repo.mode, limit], queryFn: () => repo.listAudit(limit), enabled: !!profile });
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
