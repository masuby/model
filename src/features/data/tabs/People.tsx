/**
 * People (administrators): every account, with its role and the institution it enters data for.
 * Accounts appear after a person's first sign-in; the database only lets an administrator change a role
 * or an institution (nobody can change their own).
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Input, Select, SelectGroup, SelectItem } from '@/components/ui/primitives';
import { useData, useProfiles, useUpdateProfile } from '@/data-layer/DataProvider';
import type { Profile, Role } from '@/data-layer/types';
import { EmptyState, ErrorState, ListSkeleton } from '../components/common';
import { errorMessage } from '../lib/batch';
import { matchesQuery } from '../lib/format';
import { useInstitutionMap } from '../workflow/bits';

const ROLES: readonly Role[] = ['viewer', 'sector', 'pmo', 'admin'];
const NONE = '__none';

export function People() {
  const { t } = useTranslation(['data', 'common']);
  const { profile: me, mode } = useData();
  const q = useProfiles();
  const update = useUpdateProfile();
  const institutions = useInstitutionMap();
  const [find, setFind] = React.useState('');
  const list = React.useMemo(
    () => (q.data ?? []).filter((p) => matchesQuery(find, p.fullName, p.email, p.institutionKey && institutions.get(p.institutionKey)?.label)),
    [q.data, find, institutions],
  );
  const sorted = [...institutions.values()].sort((a, b) => a.label.localeCompare(b.label));

  const change = async (p: Profile, patch: { role?: Role; institutionKey?: string | null }) => {
    try {
      await update.mutateAsync({ id: p.id, ...patch });
      toast.success(t('workflow.people.saved', { name: p.fullName }));
    } catch (e) {
      toast.error(t('workflow.people.error'), { description: errorMessage(e) });
    }
  };

  if (q.isLoading) return <ListSkeleton rows={3} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;

  return (
    <div>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{t(mode === 'local' ? 'workflow.people.leadDemo' : 'workflow.people.lead')}</p>
      <div className="mt-5 max-w-sm">
        <Input value={find} onChange={(e) => setFind(e.target.value)} placeholder={t('workflow.people.search')} aria-label={t('workflow.people.search')} />
      </div>
      {!list.length ? (
        <EmptyState title={t('workflow.people.emptyTitle')} description={t('workflow.people.emptyLead')} />
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {list.map((p) => {
            const self = p.id === me?.id;
            return (
              <li key={p.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)] md:items-center md:gap-6">
                <div className="min-w-0">
                  <p className="font-medium">
                    {p.fullName}
                    {self && <span className="ml-2 text-xs font-normal text-muted-foreground">({t('workflow.people.you')})</span>}
                  </p>
                  {p.email && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
                </div>
                <div>
                  <Select
                    value={p.role}
                    onValueChange={(v) => change(p, { role: v as Role })}
                    aria-label={t('workflow.people.roleOf', { name: p.fullName })}
                    className="h-9"
                    disabled={self || mode === 'local' || update.isPending}
                  >
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`roles.${r}`)}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <Select
                    value={p.institutionKey ?? NONE}
                    onValueChange={(v) => change(p, { institutionKey: v === NONE ? null : v })}
                    aria-label={t('workflow.people.institutionOf', { name: p.fullName })}
                    className="h-9"
                    disabled={update.isPending}
                  >
                    <SelectItem value={NONE}>{t('workflow.people.noInstitution')}</SelectItem>
                    <SelectGroup label={t('workflow.kind.nationalPlural')}>
                      {sorted
                        .filter((i) => i.kind === 'national')
                        .map((i) => (
                          <SelectItem key={i.key} value={i.key} description={i.fullName}>
                            {i.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup label={t('workflow.kind.globalPlural')}>
                      {sorted
                        .filter((i) => i.kind === 'global')
                        .map((i) => (
                          <SelectItem key={i.key} value={i.key} description={i.fullName}>
                            {i.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </Select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
