import { useTranslation } from 'react-i18next';
import { useModel } from '@/data-layer/DataProvider';
import { formatMonth, REFERENCES, type ReferenceGroup } from '../data';
import { DocSection, SubHeading } from '../ui';
import { NO_VALUE } from '@/lib/utils';

const GROUPS: readonly ReferenceGroup[] = ['inform', 'statistics', 'data'];

export function ReferencesSection() {
  const { t, i18n } = useTranslation('methodology');
  const model = useModel();
  let n = 0;
  return (
    <DocSection id="references" label={t('sections.references')} title={t('references.title')} lead={t('references.lead')}>
      <div className="space-y-12">
        {GROUPS.map((g) => (
          <div key={g}>
            <SubHeading>{t(`references.groups.${g}`)}</SubHeading>
            <ol className="mt-3 divide-y divide-border border-y border-border">
              {REFERENCES.filter((r) => r.group === g).map((r) => {
                n += 1;
                return (
                  <li key={r.id} id={`ref-${r.id}`} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-4">
                    <span className="num pt-px text-sm text-muted-foreground">[{n}]</span>
                    <div className="min-w-0">
                      <p className="max-w-[80ch] text-sm leading-relaxed">{r.citation}</p>
                      <p className="mt-1 max-w-[80ch] text-[13px] leading-relaxed text-muted-foreground">{t(`references.use.${r.id}`)}</p>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-block text-[13px] break-all text-primary underline-offset-4 hover:underline">
                          {r.linkLabel ?? r.url} <span aria-hidden>↗</span>
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
      <div className="mt-14 max-w-3xl border-l-2 border-border pl-5">
        <SubHeading>{t('references.citeTitle')}</SubHeading>
        <p className="mt-2 font-display text-[1.05rem] leading-relaxed">{t('references.cite', { date: model.asOf ? formatMonth(model.asOf, i18n.language) : NO_VALUE })}</p>
      </div>
    </DocSection>
  );
}
