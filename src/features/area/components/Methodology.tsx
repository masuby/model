/**
 * How this profile is calculated: the four steps as a numbered, ruled list with the level-specific note;
 * beside it (behind a vertical rule) the class thresholds table and the citation.
 */
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Note } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { CLASS_COLORS, CLASS_KEYS, classRanges, type Scale } from '@/engine/risk/classes';
import { OFFICIAL_NATIONAL_RISK } from '@/engine/risk/model';
import { formatScore } from '@/lib/utils';
import type { AreaView } from '../lib';
import { SubHeading } from './bits';

const SCALES: ReadonlyArray<{ scale: Scale; label: string }> = [
  { scale: 'risk', label: 'common:informRisk' },
  { scale: 'hazard', label: 'common:dimensions.hazardShort' },
  { scale: 'vulnerability', label: 'common:dimensions.vulnerabilityShort' },
  { scale: 'coping', label: 'common:dimensions.copingShort' },
];

const STEPS = ['indicators', 'categories', 'dimensions', 'risk'] as const;

export function Methodology({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit, model } = view;
  const year = model.asOf.slice(0, 4) || String(new Date().getFullYear());
  const url = typeof window !== 'undefined' ? `${window.location.origin}/area/${unit.id}` : `/area/${unit.id}`;

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border print:grid-cols-1">
      <div className="lg:pr-12 xl:pr-16">
        <ol className="divide-y divide-border border-y border-border">
          {STEPS.map((s, i) => (
            <li key={s} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 py-4 leading-relaxed">
              <span className="num font-display text-xl leading-snug text-muted-foreground">{i + 1}</span>
              <span>{t(`method.steps.${s}`)}</span>
            </li>
          ))}
        </ol>
        <Note className="mt-8">
          <p className="text-foreground">{t(`method.level.${unit.level}`, { value: formatScore(OFFICIAL_NATIONAL_RISK) })}</p>
          {unit.level !== 'national' && <p className="mt-2">{t('method.officialNote', { value: formatScore(OFFICIAL_NATIONAL_RISK) })}</p>}
        </Note>
        <Button variant="outline" className="no-print mt-8" asChild>
          <Link to="/methodology">
            {t('method.link')} <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="lg:pl-12 xl:pl-16">
        <SubHeading id="thresholds-title" title={t('method.thresholdsTitle')} lead={t('method.thresholdsLead')} />
        <table className="mt-5 w-full text-xs sm:text-sm" aria-labelledby="thresholds-title">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="py-2.5 pr-3 text-left font-medium">
                {t('common:labels.class')}
              </th>
              {SCALES.map((s) => (
                <th key={s.scale} scope="col" className="py-2.5 pl-2 text-right font-medium">
                  {t(s.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border border-b border-border">
            {[...CLASS_KEYS].reverse().map((k) => {
              const i = CLASS_KEYS.indexOf(k);
              return (
                <tr key={k}>
                  <th scope="row" className="py-2.5 pr-2 text-left font-normal sm:pr-3">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap sm:gap-2.5">
                      <span className="size-2.5 shrink-0" style={{ background: CLASS_COLORS[k] }} aria-hidden />
                      {t(`common:classes.${k}`)}
                    </span>
                  </th>
                  {SCALES.map((s) => (
                    <td key={s.scale} className="num py-2.5 pl-2 text-right whitespace-nowrap text-muted-foreground">
                      {classRanges(s.scale)[i]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-10 border-t border-border pt-6">
          <h3 className="text-sm font-semibold">{t('method.citeTitle')}</h3>
          <p className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">{t('method.cite', { year, name: unit.name, asOf: model.asOf, url })}</p>
        </div>
      </div>
    </div>
  );
}
