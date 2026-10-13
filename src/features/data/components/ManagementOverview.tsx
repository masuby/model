/**
 * Data management as everyone sees it: the distribution of the indicator groups to the institutions
 * responsible for them (with their lead sectors) and where each group's live values come from today.
 * Administrators and PMO reviewers get the same picture with its controls on the Data management tab;
 * this read-only view stands on the portal for everyone else, so the area is visible before and without
 * signing in. Everything here is read from the model shipped with the site, so it needs no database.
 */
import { KeyRound } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useData, useModel } from '@/data-layer/DataProvider';
import { AUTHORITIES, custodianFor } from '@/engine/risk/sources';
import { sectorsFor } from '@/features/guide/sectors';
import { cn, formatNumber } from '@/lib/utils';
import { valuesControl } from '../lib/control';

const COUNT_COLUMNS = ['workbook', 'benchmark', 'institutional', 'withheld'] as const;

export function ManagementOverview({ className }: { className?: string }) {
  const { t, i18n } = useTranslation(['data', 'common', 'indicators']);
  const model = useModel();
  const { mode, profile } = useData();
  const rows = React.useMemo(() => valuesControl(model).map((g) => ({ ...g, custodian: custodianFor(g.dim, g.key), sectors: sectorsFor(g.dim, g.key) })), [model]);
  const n = (x: number) => formatNumber(x, i18n.language);
  const figures = [
    { key: 'groups', value: n(rows.length) },
    { key: 'institutions', value: n(new Set(rows.map((r) => r.custodian.by)).size) },
    { key: 'institutional', value: n(rows.filter((r) => r.institutional > 0).length) },
    { key: 'withheld', value: n(rows.filter((r) => r.withheld > 0).length) },
  ] as const;

  // The sign-in form stands above this section; take the reader there.
  const focusSignIn = () => {
    const el = document.getElementById('signin-email');
    el?.scrollIntoView({ block: 'center' });
    el?.focus();
  };

  return (
    <section aria-labelledby="management-title" className={className}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground">{t('management.eyebrow')}</p>
          <h2 id="management-title" className="mt-1 text-[1.6rem] leading-tight">
            {t('management.title')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{t('management.lead')}</p>
        </div>
        {mode === 'supabase' && !profile ? (
          <Button variant="outline" className="shrink-0 self-start" onClick={focusSignIn}>
            <KeyRound /> {t('management.signIn')}
          </Button>
        ) : profile ? (
          <p className="shrink-0 text-sm text-muted-foreground">{t('management.role', { role: t(`roles.${profile.role}`) })}</p>
        ) : null}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 sm:grid-cols-4">
        {figures.map((f) => (
          <div key={f.key} className="min-w-0">
            <dt className="text-xs text-muted-foreground sm:text-sm">{t(`management.summary.${f.key}`)}</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2.5 pr-3 font-medium">
                {t('management.col.group')}
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                {t('management.col.institution')}
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                {t('management.col.sectors')}
              </th>
              {COUNT_COLUMNS.map((c) => (
                <th key={c} scope="col" className={cn('py-2.5 text-right font-medium', c === 'withheld' ? 'pl-3' : 'px-3')}>
                  {t(`management.col.${c}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={`${r.dim}:${r.key}`} className="align-top">
                <th scope="row" className="min-w-[11rem] py-2.5 pr-3 text-left font-normal">
                  <span className="font-medium">{t(`indicators:${r.key}`)}</span>
                  <span className="block text-xs text-muted-foreground">{t(`common:dimensions.${r.dim}Short`)}</span>
                </th>
                <td className="min-w-[9rem] px-3 py-2.5">
                  <span title={AUTHORITIES[r.custodian.by].full}>{AUTHORITIES[r.custodian.by].label}</span>
                  {r.custodian.also.length > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {t('management.with')} {r.custodian.also.map((a) => AUTHORITIES[a].label).join(', ')}
                    </span>
                  )}
                </td>
                <td className="min-w-[16rem] px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">{r.sectors.map((s) => t(`common:sectors.${s}`)).join(' · ')}</td>
                <td className="num px-3 py-2.5 text-right">{n(r.workbook)}</td>
                <td className="num px-3 py-2.5 text-right">{n(r.benchmark)}</td>
                <td className={cn('num px-3 py-2.5 text-right', r.institutional > 0 && 'font-semibold text-primary')}>{n(r.institutional)}</td>
                <td className={cn('num py-2.5 pl-3 text-right', r.withheld > 0 && 'font-semibold text-warning')}>{n(r.withheld)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">{t('management.note')}</p>
    </section>
  );
}
