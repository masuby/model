/**
 * For administrators and PMO reviewers: the shared database is behind this version of the portal (a
 * migration not yet applied), and what that leaves unavailable. The gaps are the ones the data layer met
 * while reading (see `schemaGaps` in the Supabase repository); nothing shows once every migration is in.
 */
import { useTranslation } from 'react-i18next';
import { useSchemaGaps } from '@/data-layer/DataProvider';
import { cn } from '@/lib/utils';

/** Each gap the data layer can meet, by the part of the portal it leaves unavailable. */
const PART: Record<string, string> = {
  committee_records: 'committee',
  notifications: 'notifications',
  'raw_values.value_type': 'deposits',
  submit_raw_values: 'deposits',
  indicator_values_public: 'publicViews',
  raw_values_public: 'publicViews',
  indicator_validations_public: 'publicViews',
  'profiles.scope_unit_id': 'scopes',
};

export function SchemaNotice({ className }: { className?: string }) {
  const { t } = useTranslation('data');
  const gaps = useSchemaGaps();
  if (!gaps.length) return null;
  const parts = [...new Set(gaps.map((g) => PART[g] ?? 'deposits'))];
  return (
    <section role="status" aria-labelledby="schema-title" className={cn('border-l-2 border-warning py-1 pl-5', className)}>
      <h2 id="schema-title" className="font-sans text-base font-semibold tracking-normal">
        {t('schema.title')}
      </h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('schema.lead')}</p>
      <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-muted-foreground">
        {parts.map((p) => (
          <li key={p}>{t(`schema.parts.${p}`)}</li>
        ))}
      </ul>
    </section>
  );
}
