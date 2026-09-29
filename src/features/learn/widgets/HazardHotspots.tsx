import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Select, SelectGroup, SelectItem } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { DIMENSION_BY_KEY } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { rampColor } from '@/engine/risk/metrics';
import { indicatorValue } from '@/engine/risk/model';
import { sourceFor, sourceLabel } from '@/engine/risk/sources';
import { formatScore } from '@/lib/utils';
import { Chip, Finding, WidgetFrame } from '../components/WidgetKit';

const QUICK = ['flood', 'drought', 'earthquake', 'landslide', 'lightning'] as const;
const TOP_N = 5;

/** Lesson 1 - pick a hazard indicator and see the councils where it is highest (live model). */
export default function HazardHotspots() {
  const { t } = useTranslation(['learn', 'indicators', 'common']);
  const model = useModel();
  const [key, setKey] = React.useState<string>('flood');
  const hazard = DIMENSION_BY_KEY.hazard;

  const { top, withData, tiedAtTop, max } = React.useMemo(() => {
    const rows = model.councils
      .map((u) => ({ u, v: indicatorValue(u, 'hazard', key) }))
      .filter((r): r is { u: typeof r.u; v: number } => isNum(r.v))
      .sort((a, b) => b.v - a.v || a.u.name.localeCompare(b.u.name));
    const max = rows[0]?.v ?? null;
    return { top: rows.slice(0, TOP_N), withData: rows.length, tiedAtTop: max == null ? 0 : rows.filter((r) => r.v === max).length, max };
  }, [model, key]);

  return (
    <WidgetFrame
      title={t('widgets.hazardHotspots.title')}
      description={t('widgets.hazardHotspots.lead')}
      footer={
        <>
          <span className="font-medium text-foreground/80">{t('common:labels.source')}:</span> {sourceLabel(sourceFor('hazard', key))}. {t('widgets.hazardHotspots.relative')}
        </>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('widgets.hazardHotspots.quick')}>
          {QUICK.map((k) => (
            <Chip key={k} active={key === k} onClick={() => setKey(k)}>
              {t(`indicators:${k}`)}
            </Chip>
          ))}
        </div>
        <div className="sm:ml-auto sm:w-44 sm:shrink-0">
          <Select value={key} onValueChange={setKey} aria-label={t('widgets.hazardHotspots.pick')}>
            {hazard.categories.map((cat) => (
              <SelectGroup key={cat.key} label={t(`common:categories.${cat.key}`)}>
                {cat.indicators.map((ind) => (
                  <SelectItem key={ind.key} value={ind.key}>
                    {t(`indicators:${ind.key}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </Select>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t(`indicators:desc.${key}`, { defaultValue: '' })}</p>

      <ol className="mt-4 divide-y divide-border border-y border-border" aria-live="polite">
        {top.map(({ u, v }, i) => (
          <li key={`${key}-${u.id}`}>
            <Link to={`/area/${u.id}`} className="group grid grid-cols-[1.5rem_minmax(0,1fr)_auto_auto] items-center gap-3 py-3 sm:grid-cols-[1.5rem_minmax(0,1fr)_8rem_2.5rem_1rem]">
              <span className="num text-sm text-muted-foreground">{i + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium group-hover:text-primary group-hover:underline group-hover:underline-offset-4">{u.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{u.region}</span>
              </span>
              <span className="hidden h-1.5 bg-muted sm:block" aria-hidden>
                <span className="block h-full" style={{ width: `${(v / 10) * 100}%`, background: rampColor(v) }} />
              </span>
              <span className="num text-right font-semibold">{formatScore(v)}</span>
              <ArrowRight className="size-3.5 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>{t('widgets.hazardHotspots.coverage', { n: withData, total: model.councils.length })}</span>
        {tiedAtTop > 1 && max != null && <span className="font-medium text-warning">{t('widgets.hazardHotspots.ties', { n: tiedAtTop, value: formatScore(max) })}</span>}
      </div>
      {key === 'drought' && (
        <Finding tone="warning" className="mt-4 text-xs">
          {t('widgets.hazardHotspots.droughtNote')}
        </Finding>
      )}
    </WidgetFrame>
  );
}
