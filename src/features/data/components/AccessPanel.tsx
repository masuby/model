/**
 * Who am I, and where does my data go? Local mode: a ruled demo note with a role switcher.
 * Supabase mode: one flat sign-in panel (magic link or password) when signed out, a ruled account line
 * when signed in. Viewers get a plain explanation of how to request contributor access.
 */
import { KeyRound, Loader2, LogOut, Mail, MailCheck } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label, Segmented, Skeleton } from '@/components/ui/primitives';
import { useData } from '@/data-layer/DataProvider';
import type { Profile, Role } from '@/data-layer/types';
import { cn, NO_VALUE } from '@/lib/utils';
import { errorMessage } from '../lib/batch';
import { RoleBadge } from './common';

const DEMO_ROLES: Role[] = ['viewer', 'sector', 'pmo', 'admin'];

export function AccessPanel() {
  const { mode, profile, authLoading, signedIn, authError } = useData();
  if (mode === 'local') return <DemoBanner role={profile?.role ?? 'viewer'} />;
  if (authLoading) return <Skeleton className="h-28 w-full rounded-lg" />;
  if (signedIn && !profile) return <ProfileErrorCard message={authError} />;
  if (!profile) return <SignInCard />;
  return <ProfileBar profile={profile} />;
}

/** Signed in, but the account's profile could not be loaded - say so, never pretend to be signed out. */
function ProfileErrorCard({ message }: { message: string | null }) {
  const { t } = useTranslation('data');
  const { signOut } = useData();
  return (
    <section role="alert" className="flex flex-col gap-4 border-l-2 border-danger py-1 pl-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl">
        <h2 className="font-sans text-base font-semibold tracking-normal">{t('mode.profileErrorTitle')}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('mode.profileErrorLead')}</p>
        {message && <p className="mt-2 font-mono text-xs text-muted-foreground">{message}</p>}
      </div>
      <Button variant="outline" size="sm" className="self-start sm:self-center" onClick={() => void signOut()}>
        <LogOut aria-hidden /> {t('mode.signOut')}
      </Button>
    </section>
  );
}

/** Local demo: a note with an amber left rule (not a coloured box) and the role switcher beside it. */
function DemoBanner({ role }: { role: Role }) {
  const { t } = useTranslation('data');
  const { setDemoRole } = useData();
  const current = DEMO_ROLES.includes(role) ? role : 'pmo';
  return (
    <section aria-labelledby="demo-title" className="grid gap-5 border-l-2 border-warning py-1 pl-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
      <div className="max-w-2xl">
        <h2 id="demo-title" className="font-sans text-base font-semibold tracking-normal">
          {t('mode.demoTitle')}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t('mode.demoLead')}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-2 lg:items-end">
        <span className="text-sm text-muted-foreground">{t('mode.demoRole')}</span>
        <div className="max-w-full overflow-x-auto">
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
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground lg:text-right" aria-live="polite">
          {t(`mode.roleDesc.${current}`)}
        </p>
      </div>
    </section>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Signed out: ONE flat bordered panel - the why on the left, the form on the right, a rule between. */
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
    <Card className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:divide-x md:divide-border">
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl leading-tight">{t('signIn.title')}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{t('signIn.lead')}</p>
        {/* Rules run to the column edge; no bottom rule on phones, where the form's top rule follows. */}
        <ul className="mt-6 divide-y divide-border border-t border-border text-sm md:border-b">
          {(['point1', 'point2', 'point3'] as const).map((k) => (
            <li key={k} className="py-3 leading-relaxed">
              {t(`signIn.${k}`)}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-border p-6 sm:p-8 md:flex md:flex-col md:justify-center md:border-t-0">
        {sentTo ? (
          <div className="flex h-full flex-col items-start justify-center" role="status">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <MailCheck className="size-5 text-success" aria-hidden /> {t('signIn.linkSent')}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t('signIn.linkSentLead', { email: sentTo })}</p>
            <Button variant="link" className="mt-3 px-0" onClick={() => setSentTo(null)}>
              {t('signIn.useAnother')}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-5">
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
    </Card>
  );
}

/** Signed in: one ruled line with who you are, the connection and sign-out. */
function ProfileBar({ profile }: { profile: Profile }) {
  const { t } = useTranslation('data');
  const { signOut } = useData();
  const [busy, setBusy] = React.useState(false);
  return (
    <section aria-label={t('mode.account')} className="flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-base font-semibold">{profile.fullName}</span>
          <RoleBadge role={profile.role} />
        </div>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">{[profile.institution, profile.email].filter(Boolean).join(' · ') || NO_VALUE}</div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="text-sm text-muted-foreground">{t('mode.live')}</span>
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
export function ContributorAccess({ className }: { className?: string }) {
  const { t } = useTranslation('data');
  const { mode, profile } = useData();
  return (
    <section aria-labelledby="contribute-title" className={cn('grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-16', className)}>
      <div>
        <h2 id="contribute-title" className="text-[1.6rem] leading-tight text-balance">
          {t('access.title')}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t('access.lead')}</p>
      </div>
      <div>
        <ol className="divide-y divide-border border-y border-border">
          {([1, 2, 3] as const).map((i) => (
            <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 py-4">
              <span className="num font-display text-xl leading-6 text-muted-foreground">{i}</span>
              <div>
                <p className="leading-6 font-semibold">{t(`access.step${i}Title`)}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`access.step${i}`)}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">{mode === 'local' ? t('access.demoHint') : profile ? t('access.signedInHint') : t('access.signedOutHint')}</p>
      </div>
    </section>
  );
}
