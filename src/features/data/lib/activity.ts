/** Audit trail details: the server writes short English details for workflow actions; show them translated. */
import { APPLIED_DIRECTLY_NOTE, type AuditEntry } from '@/data-layer/types';
import { isSpecId, specLabel } from './workflow';

type T = (key: string, opts?: Record<string, unknown>) => string;

/** The server writes short English details for workflow actions; show them in the reader's language. */
export function localiseDetail(e: Pick<AuditEntry, 'action' | 'detail'>, t: T): string | undefined {
  const d = e.detail;
  if (!d) return undefined;
  if (d === APPLIED_DIRECTLY_NOTE) return t('mine.appliedDirectly');
  let m: RegExpMatchArray | null;
  if (e.action === 'assigned' && (m = d.match(/^(\d+) indicator\(s\): (\S+)$/)))
    return m[2] === 'unassigned' ? t('activity.detail.unassigned', { count: Number(m[1]) }) : t('activity.detail.assigned', { count: Number(m[1]), institution: m[2] });
  if (e.action === 'requested' && (m = d.match(/^(\d+) (update|validate) request\(s\)$/))) return t(`activity.detail.requested.${m[2]}`, { count: Number(m[1]) });
  if (e.action === 'submitted' && (m = d.match(/^(\d+) value\(s\) · (.+)$/))) return t('activity.detail.values', { count: Number(m[1]), dataset: m[2] });
  if (e.action === 'submitted' && (m = d.match(/^(\d+) change\(s\) · (.+)$/))) return t('activity.detail.changes', { count: Number(m[1]), authority: m[2] });
  if (e.action === 'closed' && (d === 'done' || d === 'cancelled')) return t(`activity.detail.closed.${d}`);
  if (isSpecId(d)) return specLabel(t, d);
  return d;
}
