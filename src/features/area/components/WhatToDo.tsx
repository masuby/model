/**
 * "Know the risk": the standing risk of this area, communicated for people to live and plan with.
 *  • The risk level: the area's INFORM risk class in its colour band (very low and low yellow, medium
 *    and high orange, very high red), with what it means for people who live and work here and for
 *    those who plan, build, invest or settle here. No warning level is derived from it.
 *  • The emergency number, 190, as a tap-to-call link: the number alone, no institution named with it.
 *  • Hazards in this area: one reconciled list, the guide's documented hazards joined with the INFORM
 *    groups scored for the area, each with a priority band (the D7 display rule, not an INFORM class).
 *  • The area and its hazards: what the Risk Action Guide Book records about the nature of the council
 *    (or each council of a region), one click away, with the events the committees reported.
 *  • Reducing risk over time: the PMO-DMD action library for the area's top vulnerability and coping
 *    drivers, reviewed by the NDRRC, folded.
 * Warnings for a hazard and a period are not communicated here: the committees publish them through
 * the Data portal and the hero shows them while in force. Printing opens every fold.
 * Everything is shown in the reader's language; the guide is published in English and Kiswahili.
 */
import { ChevronDown, Phone } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Unit } from '@/engine/risk/types';
import { type AreaRisk, planMessage, riskBandFor } from '@/features/guide/alert';
import { RiskBandBadge } from '@/features/guide/AlertBadge';
import { hazardItemName, reconciledHazards, type HazardItem } from '@/features/guide/crosswalk';
import { topDrivers } from '@/engine/risk/model';
import { dataNotesFor } from '@/engine/risk/notes';
import type { DimensionKey } from '@/engine/risk/hierarchy';
import { authorityLabel } from '@/engine/risk/sources';
import { DataNoteMark } from '@/components/risk/DataNoteMark';
import { applyGuidance, pick, useAreaGuide, useAreaRecords, vcActions } from '@/features/guide/data';
import type { CommitteeRecord, EventPayload } from '@/data-layer/types';
import { cn, formatDate, formatScore } from '@/lib/utils';
import type { AreaView } from '../lib';
import { AreaFigures } from './AreaHero';
import { useMediaQuery } from './bits';
import { LocatorMap } from './LocatorMap';
import { useDeferred } from './Deferred';

/** Statements about the area shown before "Show more" (one on a phone). */
const FIRST_STATEMENTS = 2;
const FIRST_STATEMENTS_PHONE = 1;
/** Councils listed on a region's block before "Show all". */
const FIRST_COUNCILS = 4;
/** Hazards shown before "Show all": the highest priority bands first. */
const FIRST_HAZARDS = 3;
const PHONE = '(max-width: 639px)';

/** One number for every emergency, stated on its own (PMO-DMD: 190 is not the Fire and Rescue Force's line). */
export const EMERGENCY_NUMBER = '190';

export function WhatToDo({ view }: { view: AreaView }) {
  const { t } = useTranslation('guide');
  const { unit } = view;
  const guide = useAreaGuide(unit);
  const national = unit.level === 'national';
  const many = unit.level !== 'council';
  const phone = useMediaQuery(PHONE);
  // One hazard picture: the guide's documented hazards and the model's scored groups, reconciled (RC-03).
  const items = React.useMemo(() => reconciledHazards(unit, guide.hazards), [unit, guide.hazards]);
  const risk = riskBandFor(unit.risk);

  return (
    <div className={many ? 'space-y-8 sm:space-y-10' : 'space-y-10 sm:space-y-12'}>
      {/* The key figures sit here on a phone (the hero keeps them from tablets up). */}
      {phone && <AreaFigures view={view} className="border-b border-border pb-6" />}

      {/* One row across the width: where the area lies, its hazards, and the risk level with the emergency number. */}
      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
        <LocatorMap view={view} />
        {!guide.loading && <HazardList unit={unit} items={items} />}
        <div className="space-y-6">
          {risk && <RiskStatus unit={unit} risk={risk} />}
          <p className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-4 text-sm">
            <span className="font-semibold">{t('emergency.label')}</span>
            <a href={`tel:${EMERGENCY_NUMBER}`} className="inline-flex items-center gap-2 hover:underline" aria-label={t('emergency.call', { number: EMERGENCY_NUMBER })}>
              <Phone className="size-4 text-muted-foreground" aria-hidden />
              <span className="num text-base font-semibold">{EMERGENCY_NUMBER}</span>
            </a>
          </p>
        </div>
      </div>

      {!national && <AreaNature unit={unit} guide={guide} />}
      <ReducingRisk unit={unit} />
    </div>
  );
}

/**
 * The area's risk level: its INFORM class on its colour band, and what that level means for people who
 * live and work here and for those who plan, build, invest or settle here. Risk to live with, not a warning.
 */
function RiskStatus({ unit, risk }: { unit: Unit; risk: AreaRisk }) {
  const { t } = useTranslation(['guide', 'common']);
  const cls = t(`common:classes.${risk.cls}`);
  const vars = { cls: cls.toLowerCase(), name: unit.name };
  const plan = planMessage(unit, risk);
  const planVars = plan.hazard ? { ...vars, hazard: t(`indicators:${plan.hazard.key}`).toLowerCase(), score: formatScore(plan.hazard.score) } : vars;
  return (
    <section aria-labelledby="risk-title" className="border-l-4 py-1 pl-5" style={{ borderColor: risk.color }}>
      <h3 id="risk-title" className="text-sm font-medium text-muted-foreground">
        {t('risk.for', { name: unit.name })}
      </h3>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <RiskBandBadge risk={risk.score} />
        <span className="num text-sm text-muted-foreground">{t('risk.basis', { cls, score: formatScore(risk.score) })}</span>
      </p>
      <dl className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('risk.live')}</dt>
          <dd className="mt-1.5 leading-relaxed">{t(`risk.band.${risk.band}.live`, vars)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('risk.plan')}</dt>
          <dd className="mt-1.5 leading-relaxed">{t(plan.key, planVars)}</dd>
        </div>
      </dl>
    </section>
  );
}

function SubHeading({ id, title, lead, className }: { id: string; title: string; lead?: string; className?: string }) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <h3 id={id} className="font-display text-xl font-semibold">
        {title}
      </h3>
      {lead && <p className="mt-1.5 leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

/**
 * A block folded behind its heading (a native disclosure: the heading is the control, the content is
 * hidden until opened). Open when printing, so paper is complete, or when `open` asks for it.
 */
function Fold({ id, title, lead, summary, open, children }: { id: string; title: string; lead?: string; summary?: string; open?: boolean; children: React.ReactNode }) {
  const { printing } = useDeferred();
  return (
    <section aria-labelledby={id}>
      <details open={printing || open || undefined} className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <div className="max-w-3xl">
            <h3 id={id} className="font-display text-xl font-semibold">
              {title}
            </h3>
            {/* Closed: one line says what is inside; open: the lead, as for an open section. */}
            {summary && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground group-open:hidden">{summary}</p>}
            {lead && <p className="mt-1.5 hidden leading-relaxed text-muted-foreground group-open:block">{lead}</p>}
          </div>
          <ChevronDown className="mt-1.5 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-6">{children}</div>
      </details>
    </section>
  );
}

/** The first `first` items, the rest behind one button (printing shows them all). */
function useShowMore<T>(items: readonly T[], first: number) {
  const { printing } = useDeferred();
  const [all, setAll] = React.useState(false);
  const open = all || printing;
  const shown = open ? items : items.slice(0, first);
  return { shown, all, hidden: items.length - shown.length, more: items.length > first && !printing, toggle: () => setAll((v) => !v) };
}

function MoreButton({ all, label, less, onClick, className }: { all: boolean; label: string; less: string; onClick: () => void; className?: string }) {
  return (
    <Button variant="ghost" size="sm" className={cn('no-print mt-3', className)} aria-expanded={all} onClick={onClick}>
      <ChevronDown className={cn('transition-transform', all && 'rotate-180')} aria-hidden />
      {all ? less : label}
    </Button>
  );
}

/**
 * The nature of the area as the Risk Action Guide Book records it (the committees' approved updates in
 * their place), one click away: the statements say where the hazards lie, not what to do.
 */
function AreaNature({ unit, guide }: { unit: Unit; guide: ReturnType<typeof useAreaGuide> }) {
  const { t, i18n } = useTranslation(['guide', 'data']);
  const lang = i18n.language;
  const many = unit.level !== 'council';
  const area = useAreaRecords(unit);
  const phone = useMediaQuery(PHONE);
  const rows = guide.entries.flatMap((e) => applyGuidance(e.guide.know, area.records, e.council.id).map((row) => ({ council: e.council, row })));
  const statements = useShowMore(rows, phone ? FIRST_STATEMENTS_PHONE : FIRST_STATEMENTS);
  const councils = useShowMore(guide.entries, FIRST_COUNCILS);
  const names = guide.entries.map((e) => e.council.name);
  const body = guide.loading ? (
    <div className="space-y-3" aria-hidden>
      <div className="h-4 w-2/3 animate-pulse bg-muted" />
      <div className="h-4 w-1/2 animate-pulse bg-muted" />
    </div>
  ) : !rows.length ? (
    <p className="text-muted-foreground">{t('know.empty')}</p>
  ) : many ? (
    <>
      <ul className="divide-y divide-border border-y border-border">
        {councils.shown.map((e) => (
          <li key={e.council.id} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-baseline">
            <Link to={`/area/${e.council.id}#actions`} className="font-semibold hover:underline" aria-label={t('know.openCouncil', { name: e.council.name })}>
              {e.council.name}
            </Link>
            <span className="text-sm text-muted-foreground">{e.guide.hazards.map((h) => t(`hazards.${h}`)).join(', ')}</span>
          </li>
        ))}
      </ul>
      {councils.more && <MoreButton all={councils.all} label={t('more.councils', { count: guide.entries.length })} less={t('more.less')} onClick={councils.toggle} />}
    </>
  ) : (
    <>
      <ul className="divide-y divide-border border-y border-border">
        {statements.shown.map(({ council, row }, i) => (
          <li key={`${council.id}-${i}`} className="max-w-3xl py-5">
            <p className="text-sm text-muted-foreground">{pick(row.area, lang)}</p>
            <p className="mt-2 leading-relaxed">{pick(row.risk, lang)}</p>
            {row.from === 'committee' && row.record && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t('know.updated', {
                  role: row.record.authorRole ? t(`data:roles.${row.record.authorRole}`) : row.record.authorName,
                  by: row.record.reviewerName ?? row.record.authorName,
                  date: formatDate(row.record.reviewedAt ?? row.record.createdAt, lang),
                })}
              </p>
            )}
          </li>
        ))}
      </ul>
      {statements.more && <MoreButton all={statements.all} label={t('more.statements', { count: statements.hidden })} less={t('more.less')} onClick={statements.toggle} />}
    </>
  );
  const summary = many
    ? t('know.summaryMany', { count: names.length, names: names.slice(0, 4).join(', ') + (names.length > 4 ? ' …' : '') })
    : rows.length
      ? t('know.summaryOne', { count: rows.length, area: pick(rows[0].row.area, lang) })
      : t('know.summaryNone');
  return (
    // A region or the nation opens on its councils and their hazards; a council keeps the fold closed behind its summary line.
    <Fold id="know-title" title={t('know.title')} lead={many ? t('know.leadMany', { name: unit.name }) : t('know.lead', { name: unit.name })} summary={summary} open={many}>
      {body}
      <ReportedEvents events={area.events} many={many} />
    </Fold>
  );
}

/** Hazard events the committees reported and the region validated, newest first. */
function ReportedEvents({ events, many }: { events: readonly CommitteeRecord[]; many: boolean }) {
  const { t, i18n } = useTranslation(['guide', 'data']);
  if (!events.length) return null;
  return (
    <div className="mt-8">
      <h4 className="text-sm font-semibold">{t('events.title')}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{t('events.lead')}</p>
      <ul className="mt-3 divide-y divide-border border-y border-border text-sm">
        {events.map((r) => {
          const p = r.payload as EventPayload;
          const counts = (['deaths', 'injured', 'affected', 'displaced'] as const).filter((k) => p[k] != null).map((k) => `${t(`data:committee.event.${k}`)}: ${p[k]}`);
          return (
            <li key={r.id} className="py-3">
              <p className="font-medium">
                {formatDate(p.date, i18n.language)} · {r.hazard ? t(`hazards.${r.hazard}`) : ''}
                {many && <span className="font-normal text-muted-foreground"> · {r.unitName}</span>}
              </p>
              <p className="mt-1 leading-relaxed">{p.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {counts.length > 0 && `${counts.join(' · ')} · `}
                {t('events.validated', { by: r.reviewerName ?? r.authorName, date: formatDate(r.reviewedAt ?? r.createdAt, i18n.language) })}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The reconciled hazard list: basis, INFORM score and priority band (a display rule), and whether
 * guidance exists. The highest bands come first; the rest of the list is one tap away.
 */
function HazardList({ unit, items }: { unit: Unit; items: readonly HazardItem[] }) {
  const { t } = useTranslation(['guide', 'common', 'indicators']);
  const list = useShowMore(items, FIRST_HAZARDS);
  if (!items.length) return null;
  const name = (i: HazardItem) => hazardItemName(t, i);
  // The data notes of the INFORM groups behind the hazard (a workbook value under query travels with the score).
  const notesOf = (i: HazardItem) => i.groups.flatMap((g) => dataNotesFor(unit, g.split(':')[0] as DimensionKey, g.split(':')[1]));
  const many = unit.level !== 'council';
  const body = (
    <>
      <ul className="divide-y divide-border border-y border-border">
        {list.shown.map((i) => (
          <li key={i.key} className="grid gap-x-6 gap-y-0.5 py-2.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)] sm:items-center">
            <div className="flex items-baseline justify-between gap-3 sm:block">
              <p className="font-medium">{name(i)}</p>
              <p className="shrink-0 text-sm sm:hidden">
                <Band item={i} />
                <DataNoteMark notes={notesOf(i)} className="ml-1.5" />
              </p>
            </div>
            <p className="hidden text-sm sm:block">
              <Band item={i} />
              <DataNoteMark notes={notesOf(i)} className="ml-1.5" />
            </p>
          </li>
        ))}
      </ul>
      {list.more && <MoreButton all={list.all} label={t('more.hazards', { count: items.length })} less={t('more.less')} onClick={list.toggle} />}
    </>
  );
  // A region's list is folded behind its highest-priority hazards (UX-03).
  if (many)
    return (
      <Fold
        id="hazard-list-title"
        title={t('hazardList.title', { name: unit.name })}
        summary={t('hazardList.summary', { count: items.length, top: items.slice(0, 3).map((i) => (i.band ? `${name(i)} (${t(`common:classes.${i.band}`)})` : name(i))).join(', ') })}
      >
        {body}
      </Fold>
    );
  return (
    <section aria-labelledby="hazard-list-title">
      <SubHeading id="hazard-list-title" title={t('hazardList.title', { name: unit.name })} className="mb-5" />
      {body}
    </section>
  );
}

function Band({ item }: { item: HazardItem }) {
  const { t } = useTranslation(['guide', 'common']);
  if (!item.band) return <span className="text-muted-foreground">{t('hazardList.noScore')}</span>;
  return (
    <>
      <span className="font-medium">{t(`common:classes.${item.band}`)}</span>
      <span className="num text-muted-foreground"> · {formatScore(item.score)}</span>
    </>
  );
}

/** The action library for the area's top vulnerability and coping drivers (PMO-DMD writes, the NDRRC reviews). Folded. */
function ReducingRisk({ unit }: { unit: Unit }) {
  const { t, i18n } = useTranslation(['guide', 'common', 'indicators']);
  const lang = i18n.language;
  const { records } = useAreaRecords(unit);
  const library = React.useMemo(() => vcActions(records), [records]);
  const drivers = React.useMemo(() => [...topDrivers(unit, 3, 'vulnerability'), ...topDrivers(unit, 3, 'coping')], [unit]);
  if (!drivers.length) return null;
  const published = drivers.filter((d) => library.has(`${d.dim}:${d.key}`)).length;
  return (
    <Fold id="reducing-title" title={t('vc.title')} lead={t('vc.lead', { name: unit.name })} summary={t('vc.summary', { count: drivers.length, n: published })}>
      <ul className="divide-y divide-border border-y border-border">
        {drivers.map((d) => {
          const action = library.get(`${d.dim}:${d.key}`);
          return (
            <li key={`${d.dim}:${d.key}`} className="grid gap-x-10 gap-y-2 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div>
                <p className="font-medium">{t(`indicators:${d.key}`)}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`common:dimensions.${d.dim}Short`)} · <span className="num">{formatScore(d.value)}</span>
                  {action && (action.leadSectors.length || action.leadSector) && ` · ${t('vc.lead_sector', { sector: action.leadSectors.length ? action.leadSectors.map((k) => t(`common:sectors.${k}`, { defaultValue: k })).join(', ') : authorityLabel(action.leadSector!) })}`}
                </p>
              </div>
              {action ? (
                <div className="text-sm leading-relaxed">
                  {pick(action.why, lang) && <p className="text-muted-foreground">{pick(action.why, lang)}</p>}
                  <p className={cn(pick(action.why, lang) && 'mt-1.5')}>{pick(action.actions, lang)}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{t('vc.by', { by: action.record.reviewerName ?? action.record.authorName, date: formatDate(action.record.reviewedAt ?? action.record.createdAt, lang) })}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('vc.none')}</p>
              )}
            </li>
          );
        })}
      </ul>
    </Fold>
  );
}
