/**
 * "What to do" in the area panel: the area's alert category (from its risk level), the local advice and
 * the main hazards from the Risk Action Guide Book, with a link to the full guidance (every warning
 * level, the incident guide) on the area profile.
 */
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Unit } from '@/engine/risk/types';
import { alertFor } from '@/features/guide/alert';
import { AlertDot } from '@/features/guide/AlertBadge';
import { pick, useAreaGuide } from '@/features/guide/data';
import { SectionTitle } from './bits';

const HAZARDS_SHOWN = 4;

export function AreaGuide({ unit }: { unit: Unit }) {
  const { t, i18n } = useTranslation(['guide', 'common']);
  const lang = i18n.language;
  const guide = useAreaGuide(unit);
  if (unit.level === 'national') return null;
  const single = unit.level === 'council';
  const first = guide.entries[0]?.guide.know[0];
  const alert = alertFor(unit.risk);

  return (
    <section className="py-6">
      <SectionTitle as="h3" className="mb-2">
        {t('summary.title')}
      </SectionTitle>
      {alert && (
        <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          <AlertDot level={alert.level} />
          <span className="font-semibold">
            {t(`levels.${alert.level}.name`)}: {t(`levels.${alert.level}.call`)}
          </span>
          <span className="text-xs text-muted-foreground">{t('alert.from', { cls: t(`common:classes.${alert.cls}`) })}</span>
        </p>
      )}
      {guide.loading ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-3 w-3/4 animate-pulse bg-muted" />
          <div className="h-3 w-2/3 animate-pulse bg-muted" />
        </div>
      ) : (
        <>
          {single && first && (
            <>
              <p className="text-xs text-muted-foreground">{pick(first.area, lang)}</p>
              <p className="mt-1 text-sm leading-relaxed">{pick(first.advice, lang) || pick(first.risk, lang)}</p>
            </>
          )}
          {guide.hazards.length > 0 && (
            <p className={single && first ? 'mt-3' : undefined}>
              <span className="block text-xs text-muted-foreground">{single ? t('summary.hazards') : t('summary.hazardsMany')}</span>
              <span className="mt-0.5 block text-sm font-medium">
                {guide.hazards
                  .slice(0, HAZARDS_SHOWN)
                  .map((h) => t(`hazards.${h}`))
                  .join(' · ')}
              </span>
            </p>
          )}
          <Link to={`/area/${unit.id}#actions`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            {t('summary.more')} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </>
      )}
    </section>
  );
}
