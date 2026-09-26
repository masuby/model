import { ArrowRight, BookOpenText, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CLASS_COLORS, CLASS_KEYS, classRanges, type Scale } from '@/engine/risk/classes';
import { OFFICIAL_NATIONAL_RISK } from '@/engine/risk/model';
import { formatScore } from '@/lib/utils';
import type { AreaView } from '../lib';
import { Reveal } from './bits';

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
    <Reveal>
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] print:grid-cols-1">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpenText className="size-5" />
              </span>
              <h3 className="text-lg font-bold">{t('method.title')}</h3>
            </div>
            <ol className="mt-6 grid gap-4">
              {STEPS.map((s, i) => (
                <li key={s} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm leading-relaxed">
                  <span className="num inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className="text-muted-foreground">{t(`method.steps.${s}`)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-xl border-l-4 border-primary/50 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
              {t(`method.level.${unit.level}`, { value: formatScore(OFFICIAL_NATIONAL_RISK) })}
              {unit.level !== 'national' && <span className="mt-2 block text-muted-foreground">{t('method.officialNote', { value: formatScore(OFFICIAL_NATIONAL_RISK) })}</span>}
            </p>
            <Button variant="outline" className="no-print mt-6" asChild>
              <Link to="/methodology">
                {t('method.link')} <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="border-t border-border bg-muted/30 p-6 sm:p-8 lg:border-t-0 lg:border-l print:border-l-0">
            <h3 className="text-sm font-bold">{t('method.thresholdsTitle')}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('method.thresholdsLead')}</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-xs">
                <caption className="sr-only">{t('method.thresholdsTitle')}</caption>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th scope="col" className="px-3 py-2 text-left font-semibold">
                      {t('common:labels.class')}
                    </th>
                    {SCALES.map((s) => (
                      <th key={s.scale} scope="col" className="px-2 py-2 text-right font-semibold">
                        {t(s.label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...CLASS_KEYS].reverse().map((k) => {
                    const i = CLASS_KEYS.indexOf(k);
                    return (
                      <tr key={k} className="border-b border-border last:border-0">
                        <th scope="row" className="px-3 py-2 text-left font-medium">
                          <span className="inline-flex items-center gap-2">
                            <span className="size-2.5 rounded-[3px]" style={{ background: CLASS_COLORS[k] }} aria-hidden />
                            {t(`common:classes.${k}`)}
                          </span>
                        </th>
                        {SCALES.map((s) => (
                          <td key={s.scale} className="num px-2 py-2 text-right text-muted-foreground">
                            {classRanges(s.scale)[i]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-3 rounded-xl border border-dashed border-border bg-card/70 px-4 py-3">
              <Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 text-xs leading-relaxed">
                <div className="font-semibold">{t('method.citeTitle')}</div>
                <p className="mt-1 break-words text-muted-foreground">{t('method.cite', { year, name: unit.name, asOf: model.asOf, url })}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Reveal>
  );
}
