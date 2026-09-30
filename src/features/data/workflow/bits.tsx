/** Small shared pieces of the institutional workflow: where a value comes from, who owns it, what is asked. */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SourceKindTag } from '@/components/risk/Provenance';
import { Tooltip } from '@/components/ui/primitives';
import { useInstitutions } from '@/data-layer/DataProvider';
import { isOverdue, type DataRequest, type Institution } from '@/data-layer/types';
import { AUTHORITIES, authorityKind } from '@/engine/risk/sources';
import { cn, formatDate } from '@/lib/utils';

export { formatRaw, LevelTag, SourceKindTag } from '@/components/risk/Provenance';

/** Institutions by key (the live list in Supabase mode, the source register otherwise). */
export function useInstitutionMap(): Map<string, Institution> {
  const q = useInstitutions();
  return React.useMemo(() => {
    const m = new Map<string, Institution>();
    for (const [key, a] of Object.entries(AUTHORITIES)) m.set(key, { key, label: a.label, fullName: a.full, kind: authorityKind(key) });
    for (const i of q.data ?? []) m.set(i.key, i);
    return m;
  }, [q.data]);
}

/** Short institution label with its full name on hover. */
export function InstitutionLabel({ institutionKey, withKind = false, className }: { institutionKey: string | null | undefined; withKind?: boolean; className?: string }) {
  const { t } = useTranslation('data');
  const map = useInstitutionMap();
  if (!institutionKey) return <span className={cn('text-muted-foreground', className)}>{t('workflow.unassigned')}</span>;
  const inst = map.get(institutionKey);
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <Tooltip content={inst?.fullName}>
        <span className="font-medium underline decoration-dotted decoration-muted-foreground/60 underline-offset-4" tabIndex={0}>
          {inst?.label ?? institutionKey}
        </span>
      </Tooltip>
      {withKind && <SourceKindTag kind={inst?.kind ?? authorityKind(institutionKey)} />}
    </span>
  );
}

/** A calendar date ("2026-10-12") as a local date, so it never shows as the day before west of UTC. */
export const localDate = (isoDay: string): Date => new Date(`${isoDay}T00:00:00`);

/** "Update requested · due 12 Oct 2026 (overdue)". */
export function RequestSummary({ request, className }: { request: DataRequest; className?: string }) {
  const { t, i18n } = useTranslation('data');
  const overdue = isOverdue(request);
  return (
    <span className={cn('text-sm', overdue ? 'font-medium text-danger' : 'text-foreground', className)}>
      {t(`workflow.request.${request.status === 'submitted' ? 'submitted' : request.kind}`)}
      {request.dueDate && (
        <>
          {' · '}
          {t('workflow.request.due', { date: formatDate(localDate(request.dueDate), i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }) })}
          {overdue && ` (${t('workflow.request.overdue')})`}
        </>
      )}
    </span>
  );
}
