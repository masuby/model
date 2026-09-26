import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
import { cn, formatScore } from '@/lib/utils';
import { WidgetFrame } from '../components/WidgetKit';

const QUICK = ['flood', 'drought', 'earthquake', 'landslide', 'lightning'] as const;
const TOP_N = 5;

/** Lesson 1 — pick a hazard indicator and see the councils where it is highest (live model). */
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
          <span className="font-semibold">{t('common:labels.source')}:</span> {sourceLabel(sourceFor('hazard', key))}. {t('widgets.hazardHotspots.relative')}
        </>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('widgets.hazardHotspots.quick')}>
          {QUICK.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={key === k}
              onClick={() => setKey(k)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                key === k ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {t(`indicators:${k}`)}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto sm:w-56">
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

      <p className="mt-4 text-sm text-muted-foreground">{t(`indicators:desc.${key}`, { defaultValue: '' })}</p>

      <ol className="mt-4 grid gap-2" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {top.map(({ u, v }, i) => (
            <motion.li key={`${key}-${u.id}`} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
              <Link to={`/area/${u.id}`} className="group flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/60">
                <span className={cn('num flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold group-hover:text-primary">{u.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{u.region}</div>
                </div>
                <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(v / 10) * 100}%` }} transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }} style={{ background: rampColor(v) }} />
                </div>
                <span className="num w-9 text-right font-display text-base font-bold">{formatScore(v)}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>{t('widgets.hazardHotspots.coverage', { n: withData, total: model.councils.length })}</span>
        {tiedAtTop > 1 && max != null && <span className="font-medium text-warning">{t('widgets.hazardHotspots.ties', { n: tiedAtTop, value: formatScore(max) })}</span>}
      </div>
      {key === 'drought' && <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-foreground">{t('widgets.hazardHotspots.droughtNote')}</p>}
    </WidgetFrame>
  );
}
