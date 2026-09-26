import { ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { isNum } from '@/engine/risk/math';
import { rampColor } from '@/engine/risk/metrics';
import { indicatorValue } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { CouncilPicker, Fact, useCouncil, WidgetFrame } from '../components/WidgetKit';

const LOG_MAX = 5; // 10^5 people per km² — above any Tanzanian council
const TICKS = [1, 10, 100, 1_000, 10_000, 100_000];

const areaOf = (u: Unit): number | null =>
  u.exposure?.areaKm2 ?? (isNum(u.exposure?.population) && isNum(u.exposure?.density) && u.exposure.density > 0 ? u.exposure.population / u.exposure.density : null);
const logPos = (d: number | null | undefined) => (isNum(d) && d > 0 ? Math.max(0, Math.min(1, Math.log10(d) / LOG_MAX)) : null);

const SIDE = [
  { key: 'a', dot: 'bg-sky-500', ring: 'ring-sky-500/30', text: 'text-sky-600 dark:text-sky-400' },
  { key: 'b', dot: 'bg-amber-500', ring: 'ring-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
] as const;

/** Lesson 2 — compare the population density (exposure) of two councils, on a log axis. */
export default function ExposureCompare() {
  const { t, i18n } = useTranslation(['learn', 'common', 'indicators']);
  const [a, setA] = useCouncil('Kinondoni Municipal');
  const [b, setB] = useCouncil('Rufiji District');
  const units = [a, b] as const;

  const da = a.exposure?.density ?? null;
  const db = b.exposure?.density ?? null;
  const ratio = isNum(da) && isNum(db) && Math.min(da, db) > 0 ? Math.max(da, db) / Math.min(da, db) : null;
  const denser = isNum(da) && isNum(db) ? (da >= db ? a : b) : null;
  const other = denser === a ? b : a;
  const idxGap = isNum(a.exposure?.index) && isNum(b.exposure?.index) ? Math.abs(a.exposure.index - b.exposure.index) : null;

  return (
    <WidgetFrame
      title={t('widgets.exposureCompare.title')}
      description={t('widgets.exposureCompare.lead')}
      footer={
        <>
          <span className="font-semibold">{t('common:labels.source')}:</span> {t('widgets.exposureCompare.source')}
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {units.map((u, i) => (
          <div key={SIDE[i].key} className={cn('rounded-2xl border border-border bg-background/50 p-4 ring-4', SIDE[i].ring)}>
            <div className="flex items-center gap-2">
              <span className={cn('size-2.5 rounded-full', SIDE[i].dot)} aria-hidden />
              <span className={cn('text-xs font-bold tracking-wider uppercase', SIDE[i].text)}>{t(`widgets.exposureCompare.${SIDE[i].key}`)}</span>
            </div>
            <CouncilPicker className="mt-2" value={u.id} onChange={i === 0 ? setA : setB} label={t('widgets.exposureCompare.pick')} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Fact label={t('common:labels.population')} value={formatNumber(u.exposure?.population, i18n.language)} />
              <Fact label={t('common:labels.area')} value={formatNumber(areaOf(u), i18n.language, { maximumFractionDigits: 0 })} sub={t('common:units.km2')} />
              <Fact label={t('common:labels.density')} value={formatNumber(u.exposure?.density, i18n.language, { maximumFractionDigits: 0 })} sub={t('common:units.perKm2')} />
              <Fact label={t('indicators:exposure')} value={formatScore(u.exposure?.index)} sub={t('widgets.exposureCompare.indexSub')} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-muted/60 px-3 py-2">
                <div className="text-muted-foreground">{t('widgets.exposureCompare.floodBefore')}</div>
                <div className="num font-display text-base font-bold">{formatScore(u.floodHazard)}</div>
              </div>
              <div className="rounded-xl bg-muted/60 px-3 py-2">
                <div className="text-muted-foreground">{t('widgets.exposureCompare.floodAfter')}</div>
                <div className="num font-display text-base font-bold">{formatScore(indicatorValue(u, 'hazard', 'flood'))}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Log-scale density axis */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{t('widgets.exposureCompare.axis')}</span>
          <span>{t('widgets.exposureCompare.logNote')}</span>
        </div>
        <div className="relative h-14" role="img" aria-label={units.map((u) => `${u.name}: ${formatNumber(u.exposure?.density, i18n.language, { maximumFractionDigits: 0 })} ${t('common:units.perKm2')}`).join('; ')}>
          <div className="absolute inset-x-0 top-6 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 2.5, 5, 7.5, 10].map((v) => rampColor(v)).join(',')})` }} />
          {TICKS.map((tk) => (
            <div key={tk} className="absolute top-9 -translate-x-1/2 text-[10px] text-muted-foreground" style={{ left: `${(Math.log10(tk) / LOG_MAX) * 100}%` }}>
              <div className="mx-auto mb-0.5 h-1.5 w-px bg-border" />
              <span className="num">{formatNumber(tk, i18n.language, { notation: 'compact' })}</span>
            </div>
          ))}
          {units.map((u, i) => {
            const p = logPos(u.exposure?.density);
            return p == null ? null : (
              <motion.div key={SIDE[i].key} className="absolute top-0 -translate-x-1/2" initial={false} animate={{ left: `${p * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 20 }}>
                <div className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white shadow', SIDE[i].dot)}>{t(`widgets.exposureCompare.${SIDE[i].key}`)}</div>
                <div className={cn('mx-auto mt-0.5 size-3 rounded-full border-2 border-card', SIDE[i].dot)} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {ratio != null && denser && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
          <ArrowLeftRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p>
            {a.id === b.id
              ? t('widgets.exposureCompare.same')
              : t('widgets.exposureCompare.insight', {
                  denser: denser.name,
                  other: other.name,
                  ratio: formatNumber(ratio, i18n.language, { maximumFractionDigits: ratio < 10 ? 1 : 0 }),
                  gap: idxGap == null ? '—' : formatScore(idxGap),
                })}
          </p>
        </div>
      )}
    </WidgetFrame>
  );
}
