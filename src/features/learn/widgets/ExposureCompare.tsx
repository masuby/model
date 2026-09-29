import { useTranslation } from 'react-i18next';
import { SERIES } from '@/components/charts/theme';
import { isNum } from '@/engine/risk/math';
import { indicatorValue } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore, NO_VALUE } from '@/lib/utils';
import { CouncilPicker, Finding, useCouncil, WidgetFrame } from '../components/WidgetKit';

const LOG_MAX = 5; // 10^5 people per km² - above any Tanzanian council
const TICKS = [1, 10, 100, 1_000, 10_000, 100_000];

const areaOf = (u: Unit): number | null =>
  u.exposure?.areaKm2 ?? (isNum(u.exposure?.population) && isNum(u.exposure?.density) && u.exposure.density > 0 ? u.exposure.population / u.exposure.density : null);
const logPos = (d: number | null | undefined) => (isNum(d) && d > 0 ? Math.max(0, Math.min(1, Math.log10(d) / LOG_MAX)) : null);

/** Series colours for the two councils (marker fills only - labels stay in the text colour). */
const SIDE = [
  { key: 'a', color: SERIES[0] },
  { key: 'b', color: SERIES[1] },
] as const;

/** Lesson 2 - compare the population density (exposure) of two councils, on a log axis. */
export default function ExposureCompare() {
  const { t, i18n } = useTranslation(['learn', 'common', 'indicators']);
  const [a, setA] = useCouncil('Kinondoni Municipal');
  const [b, setB] = useCouncil('Rufiji District');
  const units = [a, b] as const;
  const lang = i18n.language;

  const da = a.exposure?.density ?? null;
  const db = b.exposure?.density ?? null;
  const ratio = isNum(da) && isNum(db) && Math.min(da, db) > 0 ? Math.max(da, db) / Math.min(da, db) : null;
  const denser = isNum(da) && isNum(db) ? (da >= db ? a : b) : null;
  const other = denser === a ? b : a;
  const positions = units.map((u) => logPos(u.exposure?.density));
  const idxGap = isNum(a.exposure?.index) && isNum(b.exposure?.index) ? Math.abs(a.exposure.index - b.exposure.index) : null;

  return (
    <WidgetFrame
      title={t('widgets.exposureCompare.title')}
      description={t('widgets.exposureCompare.lead')}
      footer={
        <>
          <span className="font-medium text-foreground/80">{t('common:labels.source')}:</span> {t('widgets.exposureCompare.source')}
        </>
      }
    >
      <div className="grid gap-y-8 md:grid-cols-2 md:divide-x md:divide-border">
        {units.map((u, i) => {
          const rows: Array<[string, string, string?]> = [
            [t('common:labels.population'), formatNumber(u.exposure?.population, lang)],
            [t('common:labels.area'), formatNumber(areaOf(u), lang, { maximumFractionDigits: 0 }), t('common:units.km2')],
            [t('common:labels.density'), formatNumber(u.exposure?.density, lang, { maximumFractionDigits: 0 }), t('common:units.perKm2')],
            [t('indicators:exposure'), formatScore(u.exposure?.index), t('widgets.exposureCompare.indexSub')],
            [t('widgets.exposureCompare.floodBefore'), formatScore(u.floodHazard)],
            [t('widgets.exposureCompare.floodAfter'), formatScore(indicatorValue(u, 'hazard', 'flood'))],
          ];
          return (
            <div key={SIDE[i].key} className={cn(i === 0 ? 'md:pr-7' : 'md:pl-7')}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: SIDE[i].color }} aria-hidden />
                {t(`widgets.exposureCompare.${SIDE[i].key}`)}
              </div>
              <CouncilPicker className="mt-2" value={u.id} onChange={i === 0 ? setA : setB} label={t('widgets.exposureCompare.pick')} />
              <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
                {rows.map(([label, value, unit]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right">
                      <span className="num font-semibold">{value}</span>
                      {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      {/* Log-scale density axis */}
      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{t('widgets.exposureCompare.axis')}</span>
          <span>{t('widgets.exposureCompare.logNote')}</span>
        </div>
        <div
          className="relative mx-3 h-[4.5rem]"
          role="img"
          aria-label={units.map((u) => `${u.name}: ${formatNumber(u.exposure?.density, lang, { maximumFractionDigits: 0 })} ${t('common:units.perKm2')}`).join('; ')}
        >
          <div className="absolute inset-x-0 top-11 h-px bg-foreground/40" />
          {TICKS.map((tk) => (
            <div key={tk} className="absolute top-11 -translate-x-1/2 text-[11px] text-muted-foreground" style={{ left: `${(Math.log10(tk) / LOG_MAX) * 100}%` }}>
              <div className="mx-auto h-1.5 w-px bg-foreground/40" />
              <span className="num mt-1 block">{formatNumber(tk, lang, { notation: 'compact' })}</span>
            </div>
          ))}
          {units.map((u, i) => {
            const p = logPos(u.exposure?.density);
            // Lift the second label when both markers sit close together, so the labels never overlap.
            const lift = i === 1 && p != null && positions[0] != null && Math.abs(p - positions[0]) < 0.14;
            return p == null ? null : (
              <div key={SIDE[i].key} className="absolute top-11 size-0 transition-[left] duration-150" style={{ left: `${p * 100}%` }}>
                <span className={cn('absolute left-0 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap', lift ? 'bottom-[1.6rem]' : 'bottom-2')}>{t(`widgets.exposureCompare.${SIDE[i].key}`)}</span>
                <span className="absolute top-0 left-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card" style={{ background: SIDE[i].color }} />
              </div>
            );
          })}
        </div>
      </div>

      {ratio != null && denser && (
        <Finding className="mt-6">
          {a.id === b.id
            ? t('widgets.exposureCompare.same')
            : t('widgets.exposureCompare.insight', {
                denser: denser.name,
                other: other.name,
                ratio: formatNumber(ratio, lang, { maximumFractionDigits: ratio < 10 ? 1 : 0 }),
                gap: idxGap == null ? NO_VALUE : formatScore(idxGap),
              })}
        </Finding>
      )}
    </WidgetFrame>
  );
}
