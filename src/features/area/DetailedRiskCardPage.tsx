/**
 * The detailed risk card of an area: what sectors and decision-makers need on two or three A4 pages,
 * Kiswahili first like the one-page card. The risk level and its parts against the region and the
 * country; every indicator group scoring 5.0 or more in each dimension with the measured values behind
 * it, the lead sectors and the national action library's entry when there is one; every group in one
 * table with its sources; the guide's statements about the area and what helps; the DRR arrangements and
 * the committee; the climate year by year; the warnings in force and the events reported. Everything is
 * read from the same model, guide and committee records as the profile; nothing is typed in here, and no
 * warning level is derived from the risk level.
 */
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import type { EventPayload, WarningPayload } from '@/data-layer/types';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { ALL_INDICATORS, DIMENSION_BY_KEY, DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { parseMetric, rampColor } from '@/engine/risk/metrics';
import { indicatorValue, placeKey } from '@/engine/risk/model';
import { dataNotesFor, worstStatus } from '@/engine/risk/notes';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { ClimateTrends } from '@/features/explore/components/ClimateTrends';
import { EvidenceItem } from '@/features/explore/components/Evidence';
import { coarseOf, dimensionGroups, evidenceFor, groupRanks, memberSpread, type TopGroup } from '@/features/explore/lib/riskPanel';
import { ALERT_COLOR, planMessage, riskBandFor } from '@/features/guide/alert';
import { guideHazardName, isCoastal } from '@/features/guide/crosswalk';
import { RiskBandBadge } from '@/features/guide/AlertBadge';
import { AreaStatements } from '@/features/guide/AreaStatements';
import { applyGuidance, pick, useAreaGuide, useAreaRecords, vcActions, type VcAction } from '@/features/guide/data';
import { formatDate, formatScore, NO_VALUE } from '@/lib/utils';
import { EMERGENCY_NUMBER } from './components/WhatToDo';
import { resolveUnit, servicesFor } from './lib';
import { useCardLanguage } from './RiskCardPage';
import { sectorsFor } from '@/features/guide/sectors';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));

/** A group counts as high-scoring from this score (the upper half of the 0-10 scale). */
export const HIGH_SCORE = 5;
/** Measured values shown per high-scoring group. */
const EVIDENCE_LINES = 2;

const CARD_CSS = `
@media print {
  @page { size: A4; margin: 10mm 11mm; }
  html, body { background: #fff !important; }
  .risk-card { font-size: 9.5pt; color: #0b1324; }
  .risk-card * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .risk-card .keep { break-inside: avoid; }
  .risk-card .page { break-before: page; }
}`;

const PARTS: ReadonlyArray<{ key: 'risk' | DimensionKey; scale: 'risk' | DimensionKey }> = [{ key: 'risk', scale: 'risk' }, ...DIMENSIONS.map((d) => ({ key: d.key, scale: d.scale }))];
const partValue = (u: Unit | null, key: 'risk' | DimensionKey) => (!u ? null : key === 'risk' ? u.risk : u.dims[key].score);
const DRR_KEYS = ['eprp', 'rvca', 'ert', 'eocc', 'training', 'aa', 'committee', 'stakeholders', 'involvement'] as const;

const H2 = 'text-[12px] font-semibold tracking-wide text-muted-foreground uppercase';

export default function DetailedRiskCardPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const lang = useCardLanguage();
  const { t } = useTranslation(['area', 'guide', 'common', 'indicators', 'data', 'explore']);
  const model = useModel();
  const unit = React.useMemo(() => resolveUnit(model, id), [model, id]);
  const guide = useAreaGuide(unit);
  const area = useAreaRecords(unit);
  const library = React.useMemo(() => vcActions(area.records), [area.records]);
  const services = React.useMemo(() => (unit ? servicesFor(model, unit) : null), [model, unit]);
  const riskMetric = React.useMemo(() => parseMetric('risk'), []);

  React.useEffect(() => {
    if (unit) document.title = t('detailed.title', { name: unit.name });
  }, [unit, t, lang]);
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
  const region = unit.level === 'council' || unit.level === 'source' ? (model.byId.get(`R-${placeKey(unit.region)}`) ?? null) : null;
  const national = unit.level === 'national' ? null : model.national;
  const risk = riskBandFor(unit.risk);
  const clsLabel = risk ? t(`common:classes.${risk.cls}`) : '';
  const rows = guide.entries.flatMap((e) => applyGuidance(e.guide.know, area.records, e.council.id).map((row) => ({ council: e.council, row }))).slice(0, unit.level === 'council' ? 6 : 8);
  const drr = services?.drr;
  const today = formatDate(new Date().toISOString(), lang);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/area/${unit.id}` : `/area/${unit.id}`;
  const name = unit.level === 'national' ? t('explore:riskPanel.country') : unit.name;

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
            <Link to={`/area/${unit.id}/card?lang=${lang}`}>
              <FileText /> {t('detailed.simple')}
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer /> {t('card.print')}
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-foreground pb-3">
        <div className="min-w-0">
          <p className={H2}>
            {t('detailed.eyebrow')} · {t('detailed.audience')}
          </p>
          <h1 className="font-display text-[26px] leading-tight font-semibold">{name}</h1>
          <p className="text-muted-foreground">
            {unit.level === 'council' ? t('levelOf.regionName', { region: unit.region }) : unit.level === 'region' ? t('levelOf.region') : unit.level === 'national' ? t('levelOf.national') : unit.region} · {today}
          </p>
        </div>
        <div className="text-right">
          <p className={H2}>{t('guide:risk.label')}</p>
          <p className="mt-1 flex items-center justify-end gap-2">
            <RiskBandBadge risk={unit.risk} />
            <span className="num text-base text-muted-foreground">({formatScore(unit.risk)} / 10)</span>
          </p>
        </div>
      </header>

      <section className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border pb-2">
        <span className="font-semibold">{t('guide:emergency.label')}</span>
        <span className="num text-base font-semibold">{EMERGENCY_NUMBER}</span>
      </section>

      {area.warnings.length > 0 && (
        <section className="mt-3 space-y-1.5">
          {area.warnings.map((r) => {
            const w = r.payload as WarningPayload;
            return (
              <p key={r.id} className="border-l-4 pl-3" style={{ borderColor: ALERT_COLOR[w.alertLevel] }}>
                <span className="font-semibold">{t('guide:banner.title', { hazard: r.hazard ? guideHazardName(t, r.hazard, isCoastal(unit)) : '' })}</span>{' '}
                <span className="text-muted-foreground">
                  {r.validFrom ? formatDate(r.validFrom, lang) : ''}
                  {r.validTo ? ` – ${formatDate(r.validTo, lang)}` : ` (${t('data:committee.warning.untilLifted')})`} · {w.issuer}
                </span>
              </p>
            );
          })}
        </section>
      )}

      {/* What the data say, beside where it lies */}
      <section className="keep mt-4 grid items-start gap-x-6 gap-y-3 md:grid-cols-[1fr_9.5rem] print:grid-cols-[1fr_9.5rem]">
        <div>
          <h2 className={H2}>{unit.level === 'national' ? t('guide:statements.titleNational') : t('guide:statements.title', { name: unit.name })}</h2>
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
                keyboard={false}
                className="size-full"
                aria-label={t('card.locator', { name: unit.name })}
              />
            </React.Suspense>
          </div>
        )}
      </section>

      {/* The risk level's two messages */}
      {risk && (
        <section className="keep mt-4 border-l-4 pl-2.5" style={{ borderColor: risk.color }}>
          <h2 className={H2}>{t('guide:risk.for', { name: unit.name })}</h2>
          <div className="mt-1 grid gap-x-6 gap-y-1.5 md:grid-cols-2 print:grid-cols-2">
            <div>
              <p className="font-semibold">{t('guide:risk.live')}</p>
              <p className="text-[12px] leading-snug">{t(`guide:risk.band.${risk.band}.live`, { cls: clsLabel.toLowerCase() })}</p>
            </div>
            <div>
              <p className="font-semibold">{t('guide:risk.plan')}</p>
              <p className="text-[12px] leading-snug">
                {(() => {
                  const plan = planMessage(unit, risk);
                  return t(`guide:${plan.key}`, { cls: clsLabel.toLowerCase(), ...(plan.hazard ? { hazard: t(`indicators:${plan.hazard.key}`).toLowerCase(), score: formatScore(plan.hazard.score) } : {}) });
                })()}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Risk and its parts */}
      <section className="keep mt-5">
        <h2 className={H2}>{t('detailed.parts')}</h2>
        <div className="mt-1.5 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-foreground/40 text-left text-[11px] text-muted-foreground">
              <th scope="col" className="py-1 pr-2 font-medium">
                {t('detailed.part')}
              </th>
              <th scope="col" className="num py-1 pr-2 text-right font-medium">
                {t('detailed.here')}
              </th>
              <th scope="col" className="py-1 pr-2 font-medium">
                {t('detailed.cls')}
              </th>
              {region && (
                <th scope="col" className="num py-1 pr-2 text-right font-medium">
                  {t('detailed.region', { name: region.name })}
                </th>
              )}
              {national && (
                <th scope="col" className="num py-1 pr-2 text-right font-medium">
                  {t('detailed.national')}
                </th>
              )}
              <th scope="col" className="num py-1 text-right font-medium">
                {t('detailed.rank')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PARTS.map(({ key, scale }) => {
              const v = partValue(unit, key);
              const c = classify(v, scale);
              const rank = key === 'risk' ? rankOfRisk(model, unit) : null;
              return (
                <tr key={key} className={key === 'risk' ? 'font-semibold' : ''}>
                  <td className="py-1 pr-2">{key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}`)}</td>
                  <td className="num py-1 pr-2 text-right">{formatScore(v)}</td>
                  <td className="py-1 pr-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: c?.color ?? NO_DATA_COLOR }} aria-hidden />
                      {c ? t(`common:classes.${c.key}`) : t('common:classes.noData')}
                    </span>
                  </td>
                  {region && <td className="num py-1 pr-2 text-right font-normal">{formatScore(partValue(region, key))}</td>}
                  {national && <td className="num py-1 pr-2 text-right font-normal">{formatScore(partValue(national, key))}</td>}
                  <td className="num py-1 text-right font-normal">{rank ? t('detailed.rankOf', { rank: rank.rank, of: rank.of }) : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </section>

      {/* High-scoring groups of each dimension */}
      <section className="mt-5">
        <h2 className={H2}>{t('detailed.high', { score: formatScore(HIGH_SCORE) })}</h2>
        {DIMENSIONS.map((d) => {
          const groups = dimensionGroups(unit, d.key);
          const high = groups.filter((g) => g.score >= HIGH_SCORE);
          return (
            <div key={d.key} className="mt-3">
              <h3 className="flex items-baseline justify-between gap-2 border-b border-foreground/40 pb-1 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: classify(unit.dims[d.key].score, d.scale)?.color ?? NO_DATA_COLOR }} aria-hidden />
                  {t(`common:dimensions.${d.key}`)}
                </span>
                <span className="num">{formatScore(unit.dims[d.key].score)}</span>
              </h3>
              {high.length ? (
                <ul className="divide-y divide-border">
                  {high.map((g) => (
                    <GroupBlock key={g.key} model={model} unit={unit} region={region} national={national} group={g} lang={lang} library={library.get(`${g.dim}:${g.key}`) ?? null} />
                  ))}
                </ul>
              ) : (
                <p className="py-1.5 text-[12px] text-muted-foreground">
                  {groups.length
                    ? t('detailed.highNone', { dim: t(`common:dimensions.${d.key}`), name: t(`indicators:${groups[0].key}`), score: formatScore(groups[0].score) })
                    : t('explore:riskPanel.top.empty')}
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* Every group */}
      <section className="page mt-5">
        <h2 className={H2}>{t('detailed.all')}</h2>
        <div className="mt-1.5 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-foreground/40 text-left text-[10px] text-muted-foreground">
              <th scope="col" className="py-1 pr-2 font-medium">
                {t('detailed.group')}
              </th>
              <th scope="col" className="py-1 pr-2 font-medium">
                {t('detailed.category')}
              </th>
              <th scope="col" className="num py-1 pr-2 text-right font-medium">
                {t('detailed.here')}
              </th>
              {region && (
                <th scope="col" className="num py-1 pr-2 text-right font-medium">
                  {t('detailed.regionShort')}
                </th>
              )}
              {national && (
                <th scope="col" className="num py-1 pr-2 text-right font-medium">
                  {t('detailed.national')}
                </th>
              )}
              <th scope="col" className="py-1 font-medium">
                {t('detailed.source')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ALL_INDICATORS.map((l) => (
              <GroupLine key={`${l.dimension.key}:${l.indicator.key}`} unit={unit} region={region} national={national} dim={l.dimension.key} groupKey={l.indicator.key} category={l.category.key} />
            ))}
          </tbody>
        </table>
        </div>
      </section>

      {/* The area and its hazards, with what helps */}
      <section className="mt-5">
        <h2 className={H2}>{t('guide:know.title')}</h2>
        {rows.length ? (
          <ul className="mt-1.5 divide-y divide-border border-y border-border">
            {rows.map(({ council, row }, i) => (
              <li key={`${council.id}-${i}`} className="keep py-2">
                <p className="font-medium">
                  {unit.level !== 'council' && `${council.name}: `}
                  {pick(row.area, lang)}
                </p>
                <p className="text-[12px]">{pick(row.risk, lang)}</p>
                {pick(row.advice, lang) && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    <span className="font-medium text-foreground">{t('detailed.helps')}: </span>
                    {pick(row.advice, lang)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[12px] text-muted-foreground">{t('guide:know.empty')}</p>
        )}
      </section>

      {/* DRR arrangements and the committee */}
      {drr && (
        <section className="keep mt-5">
          <h2 className={H2}>{t('detailed.drr')}</h2>
          <ul className="mt-1.5 grid gap-x-6 gap-y-1 text-[12px] md:grid-cols-3 print:grid-cols-3">
            {DRR_KEYS.map((k) => {
              const flag = drr.flags?.[k];
              const state = drr.flags
                ? flag === true
                  ? t('services.drr.inPlace')
                  : flag === false
                    ? t('services.drr.notInPlace')
                    : t('services.drr.notRecorded')
                : t('services.drr.countOf', { n: drr[k], total: drr.recorded });
              return (
                <li key={k} className="flex items-baseline justify-between gap-2 border-b border-border py-0.5">
                  <span>{t(`services.drr.${k}.name`)}</span>
                  <span className={flag === true ? 'font-semibold' : 'text-muted-foreground'}>{state}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Climate year by year */}
      <section className="keep mt-5">
        <h2 className={H2}>{t('detailed.climate')}</h2>
        <div className="mt-1.5">
          <ClimateTrends unit={unit} />
        </div>
      </section>

      {/* Events reported by the committees */}
      {area.events.length > 0 && (
        <section className="keep mt-5">
          <h2 className={H2}>{t('detailed.events')}</h2>
          <ul className="mt-1.5 divide-y divide-border border-y border-border text-[12px]">
            {area.events.slice(0, 6).map((r) => (
              <li key={r.id} className="py-1">
                <span className="num text-muted-foreground">{formatDate((r.payload as EventPayload).date ?? r.createdAt, lang)}</span>{' '}
                <span className="font-medium">{r.hazard ? guideHazardName(t, r.hazard, isCoastal(model.byId.get(r.unitId) ?? unit)) : ''}</span>{' '}
                <span className="text-muted-foreground">{model.byId.get(r.unitId)?.name ?? r.unitId}</span>
                {(r.payload as EventPayload).description && <span className="block text-muted-foreground">{(r.payload as EventPayload).description}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-5 border-t border-border pt-2 text-[10px] leading-snug text-muted-foreground">
        <p>{t('detailed.footer', { date: today, url })}</p>
      </footer>
    </div>
  );
}

/** Where the area's risk ranks among its level (councils, regions or workbook units); ties share the better rank, as in the statements. */
function rankOfRisk(model: RiskModel, unit: Unit): { rank: number; of: number } | null {
  const pool = unit.level === 'council' ? model.councils : unit.level === 'region' ? model.regions : unit.level === 'source' ? model.sources : null;
  if (!pool || !isNum(unit.risk)) return null;
  const scored = pool.map((u) => u.risk).filter(isNum);
  const v = unit.risk;
  return { rank: 1 + scored.filter((x) => x > v).length, of: scored.length };
}

/** One high-scoring group: score and comparison, the measured values, the lead sectors and the library's entry. */
function GroupBlock({ model, unit, region, national, group, lang, library }: { model: RiskModel; unit: Unit; region: Unit | null; national: Unit | null; group: TopGroup; lang: string; library: VcAction | null }) {
  const { t } = useTranslation(['area', 'common', 'indicators', 'explore']);
  const scale = DIMENSION_BY_KEY[group.dim].scale;
  const evidence = React.useMemo(() => evidenceFor(unit, group.dim, group.key).slice(0, EVIDENCE_LINES), [unit, group.dim, group.key]);
  // A region's or the country's value is an aggregate: show how it spreads over the members instead.
  const spread = React.useMemo(() => (unit.level === 'region' || unit.level === 'national' ? memberSpread(model, unit, group.dim, group.key) : null), [model, unit, group.dim, group.key]);
  const ranks = groupRanks(model, unit, group.dim, group.key);
  const status = worstStatus(dataNotesFor(unit, group.dim, group.key).filter((n) => n.status !== 'explained'));
  // The library's sectors when PMO-DMD has set them, else the proposal of sectors.ts.
  const sectors = library?.leadSectors?.length ? library.leadSectors : sectorsFor(group.dim, group.key);
  return (
    <li className="keep py-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">
          {t(`indicators:${group.key}`)}
          {status && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">({t(`common:dataNote.status.${status}`)})</span>}
        </p>
        <p className="num shrink-0 font-semibold">{formatScore(group.score)}</p>
      </div>
      <div className="mt-1 h-1 bg-muted">
        <div className="h-full" style={{ width: `${group.score * 10}%`, background: rampColor(group.score, scale) }} />
      </div>
      <p className="num mt-1 text-[11px] text-muted-foreground">
        {[
          region && `${t('detailed.regionShort')} ${formatScore(indicatorValue(region, group.dim, group.key))}`,
          national && `${t('detailed.national')} ${formatScore(indicatorValue(national, group.dim, group.key))}`,
          ranks.level && t('explore:riskPanel.group.rankLevel', { rank: ranks.level.rank, of: ranks.level.of, level: t(`explore:riskPanel.group.levels.${unit.level}`) }),
          group.coarse && t(`explore:riskPanel.coarse.${group.coarse}`),
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {spread && spread.withData > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t('explore:riskPanel.group.spread', { withData: spread.withData, total: spread.total })} {spread.top.map((m) => `${m.unit.name} ${formatScore(m.value)}`).join(', ')}
        </p>
      )}
      {evidence.length > 0 && (
        <ul className="mt-1 divide-y divide-border/60 border-t border-border/60 text-[11px] [&_li]:py-1 [&_p]:text-[11px]">
          {evidence.map((line) => (
            <EvidenceItem key={line.specId} line={line} lang={lang} />
          ))}
        </ul>
      )}
      <p className="mt-1 text-[12px]">
        <span className="font-medium">{t('detailed.sectors')}: </span>
        {sectors.map((s) => t(`common:sectors.${s}`, { defaultValue: s })).join(' · ')}
      </p>
      {library && (
        <div className="mt-1 border-l-2 border-border pl-2 text-[12px]">
          <p className="font-medium">
            {t('detailed.library')}
          </p>
          {pick(library.why, lang) && <p className="text-muted-foreground">{pick(library.why, lang)}</p>}
          <p>{pick(library.actions, lang)}</p>
        </div>
      )}
    </li>
  );
}

/** One line of the table of every group: score here, region and country, the first source behind it. */
function GroupLine({ unit, region, national, dim, groupKey, category }: { unit: Unit; region: Unit | null; national: Unit | null; dim: DimensionKey; groupKey: string; category: string }) {
  const { t } = useTranslation(['area', 'common', 'indicators', 'explore']);
  const v = indicatorValue(unit, dim, groupKey);
  const first = React.useMemo(() => evidenceFor(unit, dim, groupKey)[0] ?? null, [unit, dim, groupKey]);
  const status = worstStatus(dataNotesFor(unit, dim, groupKey).filter((n) => n.status !== 'explained'));
  const coarse = coarseOf(unit, `${dim}:${groupKey}`);
  const source = first
    ? [t(`explore:riskPanel.group.origin.${first.origin}`), first.period, first.institution && first.institution !== 'INFORM' ? first.institution : null, coarse ? t(`explore:riskPanel.coarse.${coarse}`) : null].filter(Boolean).join(' · ')
    : '';
  return (
    <tr className={isNum(v) && v >= HIGH_SCORE ? 'font-semibold' : ''}>
      <td className="py-0.5 pr-2">
        {t(`indicators:${groupKey}`)}
        {status && <span className="ml-1 text-[10px] font-normal text-muted-foreground">({t(`common:dataNote.status.${status}`)})</span>}
      </td>
      <td className="py-0.5 pr-2 font-normal text-muted-foreground">{t(`common:categories.${category}`)}</td>
      <td className="num py-0.5 pr-2 text-right">{isNum(v) ? formatScore(v) : NO_VALUE}</td>
      {region && <td className="num py-0.5 pr-2 text-right font-normal">{formatScore(indicatorValue(region, dim, groupKey))}</td>}
      {national && <td className="num py-0.5 pr-2 text-right font-normal">{formatScore(indicatorValue(national, dim, groupKey))}</td>}
      <td className="py-0.5 font-normal text-muted-foreground">{source || (first ? '' : t('detailed.noValue'))}</td>
    </tr>
  );
}
