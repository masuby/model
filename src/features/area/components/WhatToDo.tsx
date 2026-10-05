/**
 * "What to do": the Risk Action Guide Book applied to this area.
 *  • Emergency numbers, as tap-to-call links.
 *  • Know your risk: where the danger lies and what helps, for the council (or each council of a region
 *    or source unit), as the guide states it.
 *  • When a warning is issued: the area's hazards (most relevant first) and the three alert levels, each
 *    with what people may see and what to do. Tabora's councils lead with their own council plan.
 *  • Incidents and accidents: the rapid-response guide, folded by default (open when printing).
 * Everything is shown in the reader's language; the guide is published in English and Kiswahili.
 */
import { ChevronDown, Phone } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Segmented, Select, SelectItem } from '@/components/ui/primitives';
import { CLASS_COLORS } from '@/engine/risk/classes';
import type { Unit } from '@/engine/risk/types';
import {
  ALERT_LEVELS,
  HAZARD_KEYS,
  isStatusRow,
  pick,
  pickList,
  useAreaGuide,
  useHazardGuide,
  useIncidentGuide,
  type AlertLevel,
  type GuideLevels,
  type GuideRow,
  type HazardKey,
} from '@/features/guide/data';
import { cn } from '@/lib/utils';
import { useDeferred } from './Deferred';

/** Alert colours follow the guide (yellow, orange, red), drawn from the INFORM class palette. */
const LEVEL_COLOR: Record<AlertLevel, string> = { 1: CLASS_COLORS.medium, 2: CLASS_COLORS.high, 3: CLASS_COLORS.veryHigh };
/** Rows shown before "Show more": the guide lists the most serious impacts first. */
const FIRST_ROWS = 4;
const PLAN = 'plan';

const EMERGENCY = [
  { number: '190', key: 'main' },
  { number: '114', key: 'fire' },
] as const;

export function WhatToDo({ unit }: { unit: Unit }) {
  const { t } = useTranslation('guide');
  const guide = useAreaGuide(unit);
  const national = unit.level === 'national';
  const plan = unit.level === 'council' ? guide.entries[0]?.guide.levels : undefined;
  const hazards: readonly HazardKey[] = national || !guide.hazards.length ? HAZARD_KEYS : guide.hazards;

  return (
    <div className="space-y-16">
      <p className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-4 text-sm">
        <span className="font-semibold">{t('emergency.label')}</span>
        {EMERGENCY.map((e) => (
          <a key={e.number} href={`tel:${e.number}`} className="inline-flex items-center gap-2 hover:underline" aria-label={t('emergency.call', { number: e.number, name: t(`emergency.${e.key}`) })}>
            <Phone className="size-4 text-muted-foreground" aria-hidden />
            <span className="num text-base font-semibold">{e.number}</span>
            <span className="text-muted-foreground">{t(`emergency.${e.key}`)}</span>
          </a>
        ))}
      </p>

      {!national && <KnowYourRisk unit={unit} guide={guide} />}
      {!guide.loading && <Warnings unit={unit} hazards={hazards} plan={plan} documented={!national && guide.hazards.length > 0} />}
      <Incidents />

      <p className="max-w-3xl border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">{t('source')}</p>
    </div>
  );
}

function SubHeading({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div className="mb-6 max-w-3xl">
      <h3 id={id} className="font-display text-xl font-semibold">
        {title}
      </h3>
      {lead && <p className="mt-1.5 leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

function KnowYourRisk({ unit, guide }: { unit: Unit; guide: ReturnType<typeof useAreaGuide> }) {
  const { t, i18n } = useTranslation('guide');
  const lang = i18n.language;
  const many = unit.level !== 'council';
  const rows = guide.entries.flatMap((e) => e.guide.know.map((row) => ({ council: e.council, row })));
  return (
    <section aria-labelledby="know-title">
      <SubHeading id="know-title" title={t('know.title')} lead={t(many ? 'know.leadMany' : 'know.lead', { name: unit.name })} />
      {guide.loading ? (
        <div className="space-y-3" aria-hidden>
          <div className="h-4 w-2/3 animate-pulse bg-muted" />
          <div className="h-4 w-1/2 animate-pulse bg-muted" />
        </div>
      ) : !rows.length ? (
        <p className="text-muted-foreground">{t('know.empty')}</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map(({ council, row }, i) => (
            <li key={`${council.id}-${i}`} className="grid gap-x-12 gap-y-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                {many && (
                  <Link to={`/area/${council.id}`} className="font-semibold hover:underline" aria-label={t('know.openCouncil', { name: council.name })}>
                    {council.name}
                  </Link>
                )}
                <p className={cn('text-sm text-muted-foreground', many && 'mt-0.5')}>{pick(row.area, lang)}</p>
                <p className="mt-2 leading-relaxed">{pick(row.risk, lang)}</p>
              </div>
              {pick(row.advice, lang) && (
                <div className="min-w-0 border-l-2 border-primary/40 pl-4">
                  <p className="text-xs font-semibold tracking-wide text-primary uppercase">{t('know.helps')}</p>
                  <p className="mt-1.5 leading-relaxed">{pick(row.advice, lang)}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LevelDot({ level, className }: { level: AlertLevel; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-full', className)} style={{ background: LEVEL_COLOR[level] }} />;
}

function Warnings({ unit, hazards, plan, documented }: { unit: Unit; hazards: readonly HazardKey[]; plan?: GuideLevels; documented: boolean }) {
  const { t } = useTranslation('guide');
  const [choice, setChoice] = React.useState<string>(plan ? PLAN : hazards[0]);
  const [level, setLevel] = React.useState<AlertLevel>(1);
  const others = HAZARD_KEYS.filter((h) => !hazards.includes(h));
  const hazard = choice === PLAN ? null : (choice as HazardKey);
  const q = useHazardGuide(hazard);
  const levels = choice === PLAN ? plan : q.data;
  const rows = levels?.[String(level) as '1' | '2' | '3'] ?? [];

  // Hazards the area documents are offered directly; the rest of the guide is one step away.
  const options = [
    ...(plan ? [{ value: PLAN, label: t('warnings.plan', { name: unit.name }) }] : []),
    ...hazards.map((h) => ({ value: h, label: t(`hazards.${h}`) })),
    ...(hazard && !hazards.includes(hazard) ? [{ value: hazard, label: t(`hazards.${hazard}`) }] : []),
  ];

  return (
    <section aria-labelledby="warnings-title">
      <SubHeading id="warnings-title" title={t('warnings.title')} lead={t('warnings.lead')} />
      <div className="flex flex-col gap-4">
        <div>
          <p id="warnings-hazards" className="mb-2 text-sm font-medium">
            {documented ? t('warnings.hazards', { name: unit.name }) : t('warnings.hazardsNational')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented aria-label={documented ? t('warnings.hazards', { name: unit.name }) : t('warnings.hazardsNational')} value={choice} onValueChange={setChoice} options={options} />
            {documented && others.length > 0 && (
              <Select value="" onValueChange={(v) => setChoice(v)} placeholder={t('warnings.other')} aria-label={t('warnings.other')} className="h-9 w-auto min-w-44">
                {others.map((h) => (
                  <SelectItem key={h} value={h}>
                    {t(`hazards.${h}`)}
                  </SelectItem>
                ))}
              </Select>
            )}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">{t('warnings.level')}</p>
          <Segmented
            aria-label={t('warnings.level')}
            value={String(level) as '1' | '2' | '3'}
            onValueChange={(v) => setLevel(Number(v) as AlertLevel)}
            options={ALERT_LEVELS.map((l) => ({
              value: String(l) as '1' | '2' | '3',
              icon: <LevelDot level={l} />,
              label: (
                <span>
                  {t(`levels.${l}.name`)}
                  <span className="hidden font-normal text-muted-foreground sm:inline"> · {t(`levels.${l}.call`)}</span>
                </span>
              ),
            }))}
          />
        </div>
      </div>

      <div className="mt-8" aria-live="polite">
        <p className="mb-3 flex items-center gap-2 text-sm">
          <LevelDot level={level} />
          <span className="font-semibold">
            {t(`levels.${level}.name`)}: {t(`levels.${level}.call`)}
          </span>
          <span className="text-muted-foreground">
            ({t(`levels.${level}.colour`)}, {t(`levels.${level}.short`)})
          </span>
        </p>
        {hazard && q.isLoading ? (
          <div className="space-y-3 border-y border-border py-6" aria-hidden>
            <div className="h-4 w-1/2 animate-pulse bg-muted" />
            <div className="h-4 w-2/3 animate-pulse bg-muted" />
            <div className="h-4 w-1/3 animate-pulse bg-muted" />
          </div>
        ) : hazard && q.isError ? (
          <p className="border-y border-border py-6 text-muted-foreground">{t('warnings.error')}</p>
        ) : (
          <LevelRows key={`${choice}-${level}`} rows={rows} />
        )}
      </div>
    </section>
  );
}

function LevelRows({ rows }: { rows: GuideRow[] }) {
  const { t, i18n } = useTranslation('guide');
  const { printing } = useDeferred();
  const lang = i18n.language;
  const [all, setAll] = React.useState(false);
  const body = rows.filter((r) => !isStatusRow(r));
  const status = rows.filter(isStatusRow);
  const shown = all || printing ? body : body.slice(0, FIRST_ROWS);
  return (
    <div>
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-10 border-b border-foreground/25 pb-2 text-xs font-medium text-muted-foreground md:grid">
        <span>{t('warnings.expect')}</span>
        <span>{t('warnings.do')}</span>
      </div>
      <ol className="divide-y divide-border border-b border-border md:border-t-0">
        {shown.map((r, i) => (
          <li key={i} className="grid gap-x-10 gap-y-2 py-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div>
              <p className="text-xs text-muted-foreground md:hidden">{t('warnings.expect')}</p>
              <p className="leading-snug font-medium">{pick(r.impact, lang)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground md:hidden">{t('warnings.do')}</p>
              <ul className="list-disc space-y-1.5 pl-5 leading-relaxed marker:text-muted-foreground">
                {pickList(r.actions, lang).map((a, k) => (
                  <li key={k}>{a}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      {body.length > FIRST_ROWS && !printing && (
        <Button variant="ghost" size="sm" className="mt-3" aria-expanded={all} onClick={() => setAll((v) => !v)}>
          <ChevronDown className={cn('transition-transform', all && 'rotate-180')} aria-hidden />
          {all ? t('warnings.less') : t('warnings.more', { count: body.length - FIRST_ROWS })}
        </Button>
      )}
      {status.map((r, i) => (
        <p key={i} className="mt-4 max-w-3xl border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{t('warnings.status')}:</span> {pickList(r.actions, lang).join(' ')}
        </p>
      ))}
    </div>
  );
}

function Incidents() {
  const { t, i18n } = useTranslation('guide');
  const { printing } = useDeferred();
  const lang = i18n.language;
  const q = useIncidentGuide();
  if (!q.data?.length) return null;
  return (
    <section aria-labelledby="incidents-title">
      <SubHeading id="incidents-title" title={t('incidents.title')} lead={t('incidents.lead')} />
      <div className="divide-y divide-border border-y border-border">
        {q.data.map((g) => (
          <details key={g.name.en} open={printing || undefined} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {pick(g.name, lang)}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="space-y-5 pb-6">
              {g.rows.map((r) => (
                <li key={r.incident.en} className="grid gap-x-10 gap-y-2 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <p className="leading-snug font-medium">{pick(r.incident, lang)}</p>
                  <ul className="list-disc space-y-1.5 pl-5 leading-relaxed marker:text-muted-foreground">
                    {pickList(r.actions, lang).map((a, k) => (
                      <li key={k}>{a}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
