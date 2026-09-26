import { useTranslation } from 'react-i18next';
import { DocSection } from '../ui';

const ITEMS = ['thresholds', 'live', 'dar', 'severity', 'totals'] as const;

export function ChangelogSection() {
  const { t } = useTranslation('methodology');
  return (
    <DocSection id="changelog" label={t('sections.changelog')} title={t('changelog.title')} lead={t('changelog.lead')}>
      <ol className="border-t border-border">
        {ITEMS.map((k) => (
          <li key={k} className="border-t border-border py-6 first:border-t-0">
            <h3 className="text-base font-semibold">{t(`changelog.items.${k}.title`)}</h3>
            <dl className="mt-3 grid gap-5 text-sm leading-relaxed md:grid-cols-2 md:gap-0 md:divide-x md:divide-border">
              <div className="md:pr-8">
                <dt className="text-[13px] text-muted-foreground">{t('changelog.before')}</dt>
                <dd className="mt-1 text-muted-foreground">{t(`changelog.items.${k}.before`)}</dd>
              </div>
              <div className="md:pl-8">
                <dt className="text-[13px] font-medium text-foreground">{t('changelog.after')}</dt>
                <dd className="mt-1 text-foreground/90">{t(`changelog.items.${k}.after`)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </DocSection>
  );
}
