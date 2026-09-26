/**
 * Who am I, and where does my data go? Local mode: a friendly demo banner with a role switcher.
 * Supabase mode: a sign-in card (magic link or password) when signed out, the profile chip when in.
 * Viewers get a clear explanation of how to request contributor access.
 */
import { Cloud, FlaskConical, KeyRound, Loader2, LogOut, Mail, MailCheck, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Label, Segmented, Skeleton } from '@/components/ui/primitives';
import { useData } from '@/data-layer/DataProvider';
import type { Profile, Role } from '@/data-layer/types';
import { errorMessage } from '../lib/batch';
import { initials } from '../lib/format';
import { RoleBadge } from './common';

const DEMO_ROLES: Role[] = ['viewer', 'sector', 'pmo'];

export function AccessPanel() {
  const { mode, profile, authLoading, signedIn, authError } = useData();
  if (mode === 'local') return <DemoBanner role={profile?.role ?? 'viewer'} />;
  if (authLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (signedIn && !profile) return <ProfileErrorCard message={authError} />;
  if (!profile) return <SignInCard />;
  return <ProfileBar profile={profile} />;
}

/** Signed in, but the account's profile could not be loaded — say so, never pretend to be signed out. */
function ProfileErrorCard({ message }: { message: string | null }) {
  const { t } = useTranslation('data');
  const { signOut } = useData();
  return (
    <section role="alert" className="flex flex-col gap-4 rounded-2xl border border-danger/30 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-bold">{t('mode.profileErrorTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('mode.profileErrorLead')}</p>
        {message && <p className="mt-2 font-mono text-xs text-muted-foreground">{message}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={() => void signOut()}>
        <LogOut aria-hidden /> {t('mode.signOut')}
      </Button>
    </section>
  );
}

function DemoBanner({ role }: { role: Role }) {
  const { t } = useTranslation('data');
  const { setDemoRole } = useData();
  const current = DEMO_ROLES.includes(role) ? role : 'pmo';
  return (
    <section aria-labelledby="demo-title" className="relative overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/10 via-card to-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-warning/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <FlaskConical className="size-5" aria-hidden />
          </div>
          <div>
            <h2 id="demo-title" className="text-base font-bold">
              {t('mode.demoTitle')}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t('mode.demoLead')}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 lg:items-end">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t('mode.demoRole')}</span>
          <Segmented
            size="sm"
            aria-label={t('mode.demoRole')}
            value={current}
            onValueChange={(r) => {
              setDemoRole(r);
              toast.message(t('mode.roleSwitched', { role: t(`roles.${r}`) }));
            }}
            options={DEMO_ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
          />
          <p className="max-w-sm text-xs text-muted-foreground lg:text-right" aria-live="polite">
            {t(`mode.roleDesc.${current}`)}
          </p>
        </div>
      </div>
    </section>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function SignInCard() {
  const { t } = useTranslation('data');
  const { signInWithEmail, signInWithPassword } = useData();
  const [method, setMethod] = React.useState<'link' | 'password'>('link');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const addr = email.trim();
    if (!EMAIL_RE.test(addr)) {
      setError(t('signIn.errors.email'));
      return;
    }
    if (method === 'password' && !password) {
      setError(t('signIn.errors.password'));
      return;
    }
    setBusy(true);
    try {
      if (method === 'link') {
        await signInWithEmail(addr);
        setSentTo(addr);
      } else {
        await signInWithPassword(addr, password);
        setPassword('');
        toast.success(t('signIn.welcome'));
      }
    } catch (err) {
      setError(t('signIn.errors.failed', { message: errorMessage(err) }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-[1fr_1.1fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-6 sm:p-8">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="size-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-xl font-bold">{t('signIn.title')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('signIn.lead')}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {(['point1', 'point2', 'point3'] as const).map((k) => (
                <li key={k} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{t(`signIn.${k}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          {sentTo ? (
            <div className="flex h-full flex-col items-start justify-center" role="status">
              <div className="flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <MailCheck className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-bold">{t('signIn.linkSent')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('signIn.linkSentLead', { email: sentTo })}</p>
              <Button variant="link" className="mt-3" onClick={() => setSentTo(null)}>
                {t('signIn.useAnother')}
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <Segmented
                aria-label={t('signIn.method')}
                value={method}
                onValueChange={(m) => {
                  setMethod(m);
                  setError(null);
                }}
                options={[
                  { value: 'link', label: t('signIn.tabLink'), icon: <Mail /> },
                  { value: 'password', label: t('signIn.tabPassword'), icon: <KeyRound /> },
                ]}
              />
              <div>
                <Label htmlFor="signin-email">{t('signIn.email')}</Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className="mt-1.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('signIn.emailPlaceholder')}
                  aria-invalid={!!error && !EMAIL_RE.test(email.trim())}
                  aria-describedby={error ? 'signin-error' : undefined}
                />
              </div>
              {method === 'password' && (
                <div>
                  <Label htmlFor="signin-password">{t('signIn.password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    className="mt-1.5"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby={error ? 'signin-error' : undefined}
                  />
                </div>
              )}
              {error && (
                <p id="signin-error" role="alert" className="text-sm font-medium text-danger">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : method === 'link' ? <Mail aria-hidden /> : <KeyRound aria-hidden />}
                {method === 'link' ? t('signIn.sendLink') : t('signIn.signIn')}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">{method === 'link' ? t('signIn.linkHint') : t('signIn.passwordHint')}</p>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
}

function ProfileBar({ profile }: { profile: Profile }) {
  const { t } = useTranslation('data');
  const { signOut } = useData();
  const [busy, setBusy] = React.useState(false);
  return (
    <section aria-label={t('mode.account')} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 font-display text-sm font-bold text-primary ring-1 ring-primary/20" aria-hidden>
          {initials(profile.fullName)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{profile.fullName}</span>
            <RoleBadge role={profile.role} />
          </div>
          <div className="truncate text-xs text-muted-foreground">{[profile.institution, profile.email].filter(Boolean).join(' · ') || '—'}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Cloud className="size-3.5 text-success" aria-hidden /> {t('mode.live')}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signOut();
            } catch (e) {
              toast.error(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />} {t('mode.signOut')}
        </Button>
      </div>
    </section>
  );
}

/** For viewers (and signed-out visitors): what contributing involves and how to get access. */
export function ContributorAccess() {
  const { t } = useTranslation('data');
  const { mode, profile } = useData();
  return (
    <Card>
      <CardContent className="grid gap-5 p-6 sm:p-7 md:grid-cols-[auto_1fr]">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold">{t('access.title')}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('access.lead')}</p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {([1, 2, 3] as const).map((i) => (
              <li key={i} className="rounded-xl border border-border bg-muted/30 p-4">
                <span className="num flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i}</span>
                <p className="mt-3 text-sm font-semibold">{t(`access.step${i}Title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`access.step${i}`)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">{mode === 'local' ? t('access.demoHint') : profile ? t('access.signedInHint') : t('access.signedOutHint')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
