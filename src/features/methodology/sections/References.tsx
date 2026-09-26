import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModel } from '@/data-layer/DataProvider';
import { REFERENCES, type ReferenceGroup } from '../data';
import { DocSection } from '../ui';

const GROUPS: readonly ReferenceGroup[] = ['inform', 'statistics', 'data'];

export function ReferencesSection() {
  const { t } = useTranslation('methodology');
  const model = useModel();
  let n = 0;
  return (
    <DocSection id="references" number="13" eyebrow={t('sections.references')} title={t('references.title')} lead={t('references.lead')}>
      <div className="space-y-8">
        {GROUPS.map((g) => (
          <div key={g}>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{t(`references.groups.${g}`)}</h3>
            <ol className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
              {REFERENCES.filter((r) => r.group === g).map((r) => {
                n += 1;
                return (
                  <li key={r.id} id={`ref-${r.id}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 px-4 py-4 sm:px-5">
                    <span className="num pt-0.5 font-mono text-xs font-semibold text-muted-foreground">[{n}]</span>
                    <div>
                      <p className="text-sm leading-relaxed">{r.citation}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`references.use.${r.id}`)}</p>
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium break-all text-primary hover:underline"
                        >
                          {r.linkLabel ?? r.url}
                          <ExternalLink className="size-3 shrink-0" aria-hidden />
                          <span className="sr-only">{t('references.newTab')}</span>
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-5">
        <h3 className="text-sm font-semibold">{t('references.citeTitle')}</h3>
        <p className="mt-1.5 font-serif text-[15px] leading-relaxed">{t('references.cite', { date: model.asOf || '—' })}</p>
      </div>
    </DocSection>
  );
}
