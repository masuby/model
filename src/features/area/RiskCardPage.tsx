/**
 * The one-page risk card of an area (RC-08): what a ward office, notice board or radio desk needs on a
 * single A4 sheet, Kiswahili first (decision D9). The risk level on its colour band with what it means
 * for residents and for those who plan or invest here, the emergency number, the warnings in force, the
 * reconciled hazard list with its bands, the statements generated from the area's own data (its rank,
 * what weighs most, its hazards, vulnerability, coping gaps and people) beside a locator map, the
 * statements about the nature of the area, and the DRR arrangements. Everything is read from the same
 * model, guide and committee records as the profile; nothing is typed in here. No warning level is
 * derived from the risk level.
 */
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import i18n from '@/i18n';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import type { WarningPayload } from '@/data-layer/types';
import { ALERT_COLOR, planMessage, riskBandFor } from '@/features/guide/alert';
import { AreaStatements } from '@/features/guide/AreaStatements';
import { RiskBandBadge } from '@/features/guide/AlertBadge';
import { reconciledHazards, type HazardItem } from '@/features/guide/crosswalk';
import { applyGuidance, pick, useAreaGuide, useAreaRecords } from '@/features/guide/data';
import type { DimensionKey } from '@/engine/risk/hierarchy';
import { parseMetric } from '@/engine/risk/metrics';
import { placeKey } from '@/engine/risk/model';
import { dataNotesFor, worstStatus } from '@/engine/risk/notes';
import { usePrefs } from '@/state/prefs';
import { formatDate, formatScore } from '@/lib/utils';
import { resolveUnit, servicesFor } from './lib';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));

const CARD_CSS = `
@media print {
  @page { size: A4; margin: 9mm 10mm; }
  html, body { background: #fff !important; }
  .risk-card { font-size: 9.5pt; color: #0b1324; }
  .risk-card * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .risk-card section { break-inside: avoid; }
}`;

/** One number for every emergency, stated on its own (no institution named with it). */
const EMERGENCY_NUMBER = '190';

/** The card's language comes from ?lang (Kiswahili by default) and is restored to the reader's choice on leaving. */
export function useCardLanguage() {
  const [params] = useSearchParams();
  const wanted = params.get('lang') === 'en' ? 'en' : 'sw';
  React.useEffect(() => {
    const before = usePrefs.getState().language;
    if (i18n.language !== wanted) void i18n.changeLanguage(wanted);
    return () => {
      if (i18n.language !== before) void i18n.changeLanguage(before);
    };
  }, [wanted]);
  return wanted;
}

export default function RiskCardPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const lang = useCardLanguage();
  const { t } = useTranslation(['area', 'guide', 'common', 'indicators', 'data']);
  const model = useModel();
  const unit = React.useMemo(() => resolveUnit(model, id), [model, id]);
  const guide = useAreaGuide(unit);
  const area = useAreaRecords(unit);
  const items = React.useMemo(() => (unit ? reconciledHazards(unit, guide.hazards) : []), [unit, guide.hazards]);
  const services = React.useMemo(() => (unit ? servicesFor(model, unit) : null), [model, unit]);
  const riskMetric = React.useMemo(() => parseMetric('risk'), []);

  React.useEffect(() => {
    if (unit) document.title = t('card.title', { name: unit.name });
  }, [unit, t, lang]);
  // ?print=1 opens the print dialogue once the guide has loaded.
  React.useEffect(() => {
    if (params.get('print') === '1' && unit && !guide.loading) {
      const h = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(h);
    }
  }, [params, unit, guide.loading]);

  if (!unit) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p>{t('notFound.lead')}</p>
      </div>
    );
  }
  const risk = riskBandFor(unit.risk);
  const clsLabel = risk ? t(`common:classes.${risk.cls}`) : '';
  const rows = guide.entries.flatMap((e) => applyGuidance(e.guide.know, area.records, e.council.id).map((row) => ({ council: e.council, row }))).slice(0, unit.level === 'council' ? 3 : 4);
  const drr = services?.drr;
  const drrKeys = ['eprp', 'aa', 'ert', 'rvca', 'eocc'] as const;
  const today = formatDate(new Date().toISOString(), lang);

  return (
    <div className="risk-card mx-auto max-w-[200mm] px-4 py-6 text-[13px] leading-snug print:max-w-none print:px-0 print:py-0">
      <style>{CARD_CSS}</style>

      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/area/${unit.id}`}>
            <ArrowLeft /> {t('card.back')}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            value={lang}
            onValueChange={(v) =>
              setParams(
                (p) => {
                  const next = new URLSearchParams(p);
                  next.set('lang', v);
                  return next;
                },
                { replace: true },
              )
            }
            options={[
              { value: 'sw', label: 'Kiswahili' },
              { value: 'en', label: 'English' },
            ]}
            aria-label={t('card.language')}
          />
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/area/${unit.id}/card/detailed?lang=${lang}`}>
              <FileText /> {t('detailed.eyebrow')}
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer /> {t('card.print')}
          </Button>
        </div>
      </div>

      {/* Header: name, priority, date */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-foreground pb-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{t('card.eyebrow')}</p>
          <h1 className="font-display text-[26px] leading-tight font-semibold">{unit.name}</h1>
          <p className="text-muted-foreground">{unit.level === 'council' ? t('levelOf.regionName', { region: unit.region }) : unit.level === 'region' ? t('levelOf.region') : unit.level === 'national' ? t('levelOf.national') : unit.region}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{t('guide:risk.label')}</p>
          <p className="mt-1 flex items-center justify-end gap-2">
            <RiskBandBadge risk={unit.risk} />
            <span className="num text-base text-muted-foreground">({formatScore(unit.risk)} / 10)</span>
          </p>
        </div>
      </header>

      {/* The emergency number and the warnings in force */}
      <section className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border pb-2">
        <span className="font-semibold">{t('guide:emergency.label')}</span>
        <span>
          <span className="num text-base font-semibold">{EMERGENCY_NUMBER}</span>
        </span>
      </section>
      {area.warnings.length > 0 && (
        <section className="mt-3 space-y-1.5">
          {area.warnings.map((r) => {
            const w = r.payload as WarningPayload;
            return (
              <p key={r.id} className="border-l-4 pl-3" style={{ borderColor: ALERT_COLOR[w.alertLevel] }}>
                <span className="inline-block size-2.5 rounded-full align-middle" style={{ background: ALERT_COLOR[w.alertLevel] }} aria-hidden />{' '}
                <span className="font-semibold">{t('guide:banner.title', { hazard: r.hazard ? t(`guide:hazards.${r.hazard}`) : '' })}</span>{' '}
                <span className="text-muted-foreground">
                  {r.validFrom ? formatDate(r.validFrom, lang) : ''}
                  {r.validTo ? ` – ${formatDate(r.validTo, lang)}` : ` (${t('data:committee.warning.untilLifted')})`} · {w.issuer}
                </span>
              </p>
            );
          })}
        </section>
      )}

      {/* What the area's own data say, beside where it lies */}
      <section className="mt-4 grid items-start gap-x-6 gap-y-3 md:grid-cols-[1fr_9.5rem] print:grid-cols-[1fr_9.5rem]">
        <div>
          <h2 className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
            {unit.level === 'national' ? t('guide:statements.titleNational') : t('guide:statements.title', { name: unit.name })}
          </h2>
          <AreaStatements model={model} unit={unit} className="mt-1.5 text-[12px] [&_ul]:text-[12px]" />
        </div>
        {unit.level !== 'national' && (
          <div className="aspect-square w-full max-w-[9.5rem] border border-border">
            <React.Suspense fallback={<div className="size-full bg-muted/50" />}>
              <StaticMap
                model={model}
                level={unit.level === 'region' ? 'region' : 'council'}
                metric={riskMetric}
                selectedIds={[unit.id]}
                emphasiseIds={unit.level === 'region' ? undefined : (model.councilsByRegion.get(placeKey(unit.region)) ?? []).map((c) => c.id)}
                focusId={unit.id}
                hoverCard={false}
                className="size-full"
                aria-label={t('card.locator', { name: unit.name })}
              />
            </React.Suspense>
          </div>
        )}
      </section>

      <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2 print:grid-cols-2">
        {/* Hazards */}
        <section>
          <h2 className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{t('guide:hazardList.title', { name: unit.name })}</h2>
          <ul className="mt-1.5 divide-y divide-border border-y border-border">
            {items.slice(0, 7).map((i: HazardItem) => {
              // A workbook value under query says so on the card too (the integrity recheck).
              const status = worstStatus(i.groups.flatMap((g) => dataNotesFor(unit, g.split(':')[0] as DimensionKey, g.split(':')[1])).filter((n) => n.status !== 'explained'));
              return (
                <li key={i.key} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="font-medium">
                    {i.guide ? t(`guide:hazards.${i.guide}`) : i.groups.map((g) => t(`indicators:${g.split(':')[1]}`)).join(', ')}
                    {status && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">({t(`common:dataNote.status.${status}`)})</span>}
                  </span>
                  <span className="num shrink-0 text-right text-muted-foreground">
                    {i.band ? t(`common:classes.${i.band}`) : t('guide:hazardList.noScore')}
                    {i.score != null && <span> · {formatScore(i.score)}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* What the risk level means: for residents, and for those who plan, build or invest here */}
        {risk && (
          <section className="border-l-4 pl-2.5" style={{ borderColor: risk.color }}>
            <h2 className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{t('guide:risk.for', { name: unit.name })}</h2>
            <p className="mt-1 font-semibold">{t('guide:risk.live')}</p>
            <p className="text-[12px] leading-snug">{t(`guide:risk.band.${risk.band}.live`, { cls: clsLabel.toLowerCase() })}</p>
            <p className="mt-1.5 font-semibold">{t('guide:risk.plan')}</p>
            <p className="text-[12px] leading-snug">
              {(() => {
                const plan = planMessage(unit, risk);
                return t(`guide:${plan.key}`, { cls: clsLabel.toLowerCase(), ...(plan.hazard ? { hazard: t(`indicators:${plan.hazard.key}`).toLowerCase(), score: formatScore(plan.hazard.score) } : {}) });
              })()}
            </p>
          </section>
        )}
      </div>

      {/* The area and its hazards, as the guide records them */}
      <section className="mt-5">
        <h2 className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{t('guide:know.title')}</h2>
        {rows.length ? (
          <ul className="mt-1.5 divide-y divide-border border-y border-border">
            {rows.map(({ council, row }, i) => (
              <li key={`${council.id}-${i}`} className="py-2">
                <p className="font-medium">
                  {unit.level !== 'council' && `${council.name}: `}
                  {pick(row.area, lang)}
                </p>
                <p className="text-[12px]">{pick(row.risk, lang)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[12px] text-muted-foreground">{t('guide:know.empty')}</p>
        )}
      </section>

      {/* DRR arrangements */}
      {drr && drr.recorded > 0 && (
        <section className="mt-4">
          <h2 className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{t('services.drrTitle')}</h2>
          <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
            {drrKeys.map((k) => {
              const flag = drr.flags?.[k];
              const state = drr.flags ? (flag === true ? t('services.drr.inPlace') : flag === false ? t('services.drr.notInPlace') : t('services.drr.notRecorded')) : t('services.drr.countOf', { n: drr[k], total: drr.recorded });
              return (
                <span key={k}>
                  <span className="font-medium">{t(`services.drr.${k}.abbr`)}</span>: {state}
                </span>
              );
            })}
          </p>
        </section>
      )}

      <footer className="mt-5 border-t border-border pt-2 text-[10px] leading-snug text-muted-foreground">
        <p>{t('card.footer', { date: today, url: typeof window !== 'undefined' ? `${window.location.origin}/area/${unit.id}` : `/area/${unit.id}` })}</p>
      </footer>
    </div>
  );
}
