/**
 * The committee desk: what the disaster-management committees record, on the review chain of the Risk
 * Action Guide Book (decision D8).
 *   • DRR capacity: the arrangements of a council or region (EPRP, AA, ERT, RVCA, EOCC).
 *   • Guidance: "Know your risk" statements of a council (where the danger lies, what helps), in both
 *     languages, replacing or adding to the guide book's rows.
 *   • Event reports: a hazard event in a council with its impacts.
 *   • Warnings: an official warning transcribed from a TMA bulletin (hazard, level, areas, validity);
 *     published on entry by the NDRRC or PMO-DMD, withdrawable.
 *   • Reducing risk: the action library per INFORM vulnerability and coping group (PMO-DMD writes, the
 *     NDRRC reviews), stored as national guidance of topic 'vc' (D10).
 * Council records are approved by the RDRRC of the region, region records by the NDRRC, national records
 * by PMO-DMD; PMO-DMD and administrators may record and approve anywhere; nobody approves their own report.
 */
import { CircleCheck, Loader2, Send, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Label, Segmented, Select, SelectGroup, SelectItem, Textarea } from '@/components/ui/primitives';
import { useCommitteeRecords, useData, useModel, useReviewCommittee, useSubmitCommittee } from '@/data-layer/DataProvider';
import {
  canReview,
  canReviewCommittee,
  canSubmitCommittee,
  latestApproved,
  warningInForce,
  type CommitteeKind,
  type CommitteeRecord,
  type DrrFieldKey,
  type DrrFields,
  type EventPayload,
  type GuidancePayload,
  type NewCommitteeRecord,
  type Profile,
  type WarningPayload,
} from '@/data-layer/types';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { SECTOR_KEYS, sectorsFor } from '@/features/guide/sectors';
import { regionIdOf } from '@/engine/risk/rawValues';
import { authorityLabel } from '@/engine/risk/sources';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { ALERT_COLOR, onAlertColor } from '@/features/guide/alert';
import { ALERT_LEVELS, HAZARD_KEYS, useAreaGuide, type AlertLevel, type HazardKey } from '@/features/guide/data';
import { cn, formatDate } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton } from '../components/common';
import { NOTE_MAX } from '../components/SubmitPanel';
import { errorMessage } from '../lib/batch';

/** What the desk offers: the record kinds, plus the action library (national guidance of topic 'vc'). */
type DeskKind = CommitteeKind | 'vc';

interface ScopedUnit {
  unit: Unit;
  level: 'council' | 'region';
  regionId: string;
}

/** A district committee records its plan, assessment, anticipatory action and training, and its own functioning. */
const COUNCIL_KEYS: readonly DrrFieldKey[] = ['eprp', 'rvca', 'aa', 'training', 'committee', 'stakeholders', 'involvement'];
/** A regional committee records the region's centre and team, its training and its own functioning; they speak for its councils where a district record is silent. */
const REGION_KEYS: readonly DrrFieldKey[] = ['eocc', 'ert', 'training', 'committee', 'stakeholders', 'involvement'];
const drrKeysFor = (level: 'council' | 'region') => (level === 'region' ? REGION_KEYS : COUNCIL_KEYS);
type Answer = 'yes' | 'no' | 'unknown';
const toAnswer = (v: boolean | null | undefined): Answer => (v === true ? 'yes' : v === false ? 'no' : 'unknown');
const fromAnswer = (a: Answer): boolean | null => (a === 'yes' ? true : a === 'no' ? false : null);
const today = () => new Date().toISOString().slice(0, 10);

/** The areas this person may record for: their council, their region and its councils, or everything. */
export function scopedUnits(model: RiskModel, profile: Profile | null | undefined, kind: CommitteeKind): ScopedUnit[] {
  if (!profile) return [];
  const byName = (a: Unit, b: Unit) => a.name.localeCompare(b.name);
  const councilRow = (c: Unit): ScopedUnit => ({ unit: c, level: 'council', regionId: regionIdOf(c) });
  const regionRow = (r: Unit): ScopedUnit => ({ unit: r, level: 'region', regionId: r.id });
  const membersOf = (r: Unit) => [...(model.councilsByRegion.get(r.id.slice(2)) ?? [])].sort(byName);
  const withRegions = kind === 'drr'; // guidance and events are council content
  if (profile.role === 'ddrrc') {
    const c = profile.scopeUnitId ? model.byId.get(profile.scopeUnitId) : null;
    return c && c.level === 'council' ? [councilRow(c)] : [];
  }
  if (profile.role === 'rdrrc') {
    const r = profile.scopeUnitId ? model.byId.get(profile.scopeUnitId) : null;
    return r && r.level === 'region' ? [...(withRegions ? [regionRow(r)] : []), ...membersOf(r).map(councilRow)] : [];
  }
  if (profile.role === 'ndrrc' || canReview(profile.role))
    return [...(withRegions ? [...model.regions].sort(byName).map(regionRow) : []), ...[...model.councils].sort(byName).map(councilRow)];
  return [];
}

export function CommitteeDesk() {
  const { t } = useTranslation(['data', 'common', 'guide']);
  const { profile } = useData();
  const records = useCommitteeRecords();
  const canWarn = canSubmitCommittee(profile, { kind: 'warning', unitId: 'TZ', level: 'national', regionId: null });
  const canLibrary = canSubmitCommittee(profile, { kind: 'guidance', unitId: 'TZ', level: 'national', regionId: null });
  const [kind, setKind] = React.useState<DeskKind>('drr');
  const all = React.useMemo(() => records.data ?? [], [records.data]);

  const scopeLine = (() => {
    if (!profile) return '';
    if (profile.role === 'ddrrc') return t('committee.scope.ddrrc');
    if (profile.role === 'rdrrc') return t('committee.scope.rdrrc');
    if (profile.role === 'ndrrc') return t('committee.scope.ndrrc');
    if (canReview(profile.role)) return t('committee.scope.reviewer');
    return t('committee.scope.none');
  })();

  if (records.isLoading) return <ListSkeleton rows={3} />;
  if (records.isError) return <ErrorState error={records.error} onRetry={() => void records.refetch()} />;

  const kinds: DeskKind[] = ['drr', 'guidance', 'event', ...(canWarn ? (['warning'] as const) : []), ...(canLibrary ? (['vc'] as const) : [])];
  return (
    <div className="space-y-12">
      <div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('committee.lead')}</p>
        <p className="mt-2 max-w-3xl text-sm font-medium">{scopeLine}</p>
        <div className="mt-5 max-w-full overflow-x-auto">
          <Segmented value={kind} onValueChange={(v) => setKind(v as DeskKind)} options={kinds.map((k) => ({ value: k, label: t(`committee.kinds.${k}`) }))} aria-label={t('committee.kindLabel')} />
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t(`committee.kindLead.${kind}`)}</p>
      </div>

      {kind === 'warning' ? <WarningForm records={all} /> : kind === 'vc' ? <LibraryForm records={all} /> : <AreaForm kind={kind} records={all} />}
      <ReviewList records={all} profile={profile} />
      <ActiveWarnings records={all} profile={profile} />
      <History kind={kind} records={all} profile={profile} />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Council / region content: DRR arrangements, guidance statements, event reports                     */
/* ------------------------------------------------------------------------------------------------ */

function AreaForm({ kind, records }: { kind: Exclude<CommitteeKind, 'warning'>; records: readonly CommitteeRecord[] }) {
  const { t, i18n } = useTranslation(['data', 'common', 'guide']);
  const lang = i18n.language;
  const { profile } = useData();
  const model = useModel();
  const submit = useSubmitCommittee();
  const reviewer = canReview(profile?.role);
  const units = React.useMemo(() => scopedUnits(model, profile, kind), [model, profile, kind]);
  const [unitId, setUnitId] = React.useState('');
  const target = units.find((u) => u.unit.id === unitId) ?? units[0] ?? null;
  const approved = React.useMemo(() => (target && kind === 'drr' ? latestApproved(records, 'drr', target.unit.id) : null), [records, target, kind]);
  const pending = React.useMemo(() => (target ? records.find((r) => r.kind === kind && r.unitId === target.unit.id && r.status === 'pending') ?? null : null), [records, target, kind]);
  const guide = useAreaGuide(kind === 'guidance' ? (target?.unit ?? null) : null);

  // DRR fields
  const [answers, setAnswers] = React.useState<Partial<Record<DrrFieldKey, Answer>>>({});
  const [years, setYears] = React.useState({ eprpYear: '', rvcaYear: '' });
  // guidance fields
  const [replaces, setReplaces] = React.useState<string>('new');
  const [g, setG] = React.useState({ areaEn: '', areaSw: '', riskEn: '', riskSw: '', adviceEn: '', adviceSw: '' });
  // event fields
  const [ev, setEv] = React.useState({ hazard: 'floods' as HazardKey, date: today(), description: '', deaths: '', injured: '', affected: '', displaced: '' });
  const [source, setSource] = React.useState('');
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    const f = (approved?.payload ?? {}) as DrrFields;
    setAnswers(Object.fromEntries((target ? drrKeysFor(target.level) : []).map((k) => [k, toAnswer(f[k])])));
    setYears({ eprpYear: f.eprpYear ? String(f.eprpYear) : '', rvcaYear: f.rvcaYear ? String(f.rvcaYear) : '' });
  }, [approved, target]);
  React.useEffect(() => {
    // Replacing a guide row starts from that row's text.
    const rows = guide.entries[0]?.guide.know ?? [];
    const i = Number(replaces);
    const row = Number.isInteger(i) ? rows[i] : undefined;
    setG(row ? { areaEn: row.area.en, areaSw: row.area.sw, riskEn: row.risk.en, riskSw: row.risk.sw, adviceEn: row.advice.en, adviceSw: row.advice.sw } : { areaEn: '', areaSw: '', riskEn: '', riskSw: '', adviceEn: '', adviceSw: '' });
  }, [replaces, guide.entries]);

  const allowed = !!target && canSubmitCommittee(profile, { kind, unitId: target.unit.id, level: target.level, regionId: target.regionId });
  const drrKeys = target ? drrKeysFor(target.level) : [];
  const complete =
    kind === 'drr'
      ? drrKeys.some((k) => answers[k] && answers[k] !== 'unknown')
      : kind === 'guidance'
        ? (g.areaEn.trim() || g.areaSw.trim()) !== '' && (g.riskEn.trim() || g.riskSw.trim()) !== ''
        : ev.description.trim().length >= 5 && !!ev.date;
  const sourceOk = source.trim().length >= 3;
  const ready = allowed && complete && sourceOk;

  const send = async (applyNow: boolean) => {
    if (!target || !ready) return;
    let payload: NewCommitteeRecord['payload'];
    let hazard: string | null = null;
    if (kind === 'drr') {
      const f: DrrFields = {};
      for (const k of drrKeys) f[k] = fromAnswer(answers[k] ?? 'unknown');
      if (drrKeys.includes('eprp') && years.eprpYear.trim()) f.eprpYear = Number(years.eprpYear);
      if (drrKeys.includes('rvca') && years.rvcaYear.trim()) f.rvcaYear = Number(years.rvcaYear);
      payload = f;
    } else if (kind === 'guidance') {
      const p: GuidancePayload = {
        area: { en: g.areaEn.trim(), sw: g.areaSw.trim() },
        risk: { en: g.riskEn.trim(), sw: g.riskSw.trim() },
        advice: { en: g.adviceEn.trim(), sw: g.adviceSw.trim() },
        replaces: replaces === 'new' ? null : Number(replaces),
        topic: 'hazard',
      };
      payload = p;
    } else {
      const num = (s: string) => (s.trim() ? Number(s) : null);
      const p: EventPayload = { date: ev.date, description: ev.description.trim(), deaths: num(ev.deaths), injured: num(ev.injured), affected: num(ev.affected), displaced: num(ev.displaced) };
      payload = p;
      hazard = ev.hazard;
    }
    const input: NewCommitteeRecord = {
      kind,
      unitId: target.unit.id,
      level: target.level,
      unitName: target.unit.name,
      region: target.unit.level === 'region' ? target.unit.name : target.unit.region,
      regionId: target.regionId,
      hazard,
      payload,
      source: source.trim(),
      note: note.trim() || undefined,
    };
    try {
      await submit.mutateAsync({ input, applyNow });
      toast.success(t(applyNow ? 'committee.applied' : 'committee.sent'));
      setNote('');
      if (kind === 'event') setEv((e) => ({ ...e, description: '', deaths: '', injured: '', affected: '', displaced: '' }));
    } catch (e) {
      toast.error(t('committee.error'), { description: errorMessage(e) });
    }
  };

  if (!units.length || !target) return <EmptyState title={t('committee.noScopeTitle')} description={t('committee.scope.none')} />;

  return (
    <section aria-labelledby="committee-record-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-14">
      <div className="min-w-0">
        <h3 id="committee-record-title" className="font-display text-xl font-semibold">
          {t(`committee.recordTitle.${kind}`)}
        </h3>
        <div className="mt-4 max-w-md space-y-1.5">
          <Label htmlFor="committee-unit">{t('committee.unit')}</Label>
          {units.length === 1 ? (
            <p id="committee-unit" className="text-sm font-medium">
              {target.unit.name} <span className="font-normal text-muted-foreground">({t(`common:levels.${target.level}`).toLowerCase()})</span>
            </p>
          ) : (
            <Select value={target.unit.id} onValueChange={setUnitId} aria-label={t('committee.unit')} className="h-9 w-full">
              {units.some((u) => u.level === 'region') && (
                <SelectGroup label={t('common:levels.regions')}>
                  {units
                    .filter((u) => u.level === 'region')
                    .map((u) => (
                      <SelectItem key={u.unit.id} value={u.unit.id}>
                        {u.unit.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              )}
              <SelectGroup label={t('common:levels.councils')}>
                {units
                  .filter((u) => u.level === 'council')
                  .map((u) => (
                    <SelectItem key={u.unit.id} value={u.unit.id} description={u.unit.region}>
                      {u.unit.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </Select>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {kind === 'drr' && (approved ? t('committee.drr.current', { date: formatDate(approved.reviewedAt ?? approved.createdAt, lang), by: approved.reviewerName ?? approved.authorName }) : t('committee.drr.noCurrent'))}
          {pending && <span className="block text-warning">{t('committee.pendingNotice')}</span>}
        </p>

        <fieldset className="mt-6" disabled={!allowed}>
          <legend className="sr-only">{t(`committee.recordTitle.${kind}`)}</legend>
          {kind === 'drr' && (
            <ul className="divide-y divide-border border-y border-border">
              {drrKeys.map((k) => (
                <li key={k} className="grid gap-2 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                  <span className="text-sm font-medium">{t(`committee.drr.fields.${k}`)}</span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {(['yes', 'no', 'unknown'] as const).map((a) => (
                      <label key={a} className="flex cursor-pointer items-center gap-1.5">
                        <input type="radio" name={`drr-${k}`} value={a} checked={(answers[k] ?? 'unknown') === a} onChange={() => setAnswers((prev) => ({ ...prev, [k]: a }))} className="accent-primary" />
                        {t(`committee.drr.${a}`)}
                      </label>
                    ))}
                    {(k === 'eprp' || k === 'rvca') && answers[k] === 'yes' && (
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1990}
                        max={2100}
                        value={k === 'eprp' ? years.eprpYear : years.rvcaYear}
                        onChange={(e) => setYears((y) => ({ ...y, [k === 'eprp' ? 'eprpYear' : 'rvcaYear']: e.target.value }))}
                        aria-label={t('committee.drr.yearOf', { item: t(`committee.drr.fields.${k}`) })}
                        placeholder={t('committee.drr.year')}
                        className="num h-8 w-24"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {kind === 'guidance' && (
            <div className="grid gap-4">
              <div className="max-w-md space-y-1.5">
                <Label htmlFor="g-replaces">{t('committee.guidance.replaces')}</Label>
                <Select value={replaces} onValueChange={setReplaces} aria-label={t('committee.guidance.replaces')} className="h-9 w-full">
                  <SelectItem value="new">{t('committee.guidance.newStatement')}</SelectItem>
                  {(guide.entries[0]?.guide.know ?? []).map((row, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {row.area.en || row.area.sw}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              {(
                [
                  ['area', 'areaEn', 'areaSw'],
                  ['risk', 'riskEn', 'riskSw'],
                  ['advice', 'adviceEn', 'adviceSw'],
                ] as const
              ).map(([field, en, sw]) => (
                <div key={field} className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`g-${en}`}>
                      {t(`committee.guidance.${field}`)} <span className="font-normal text-muted-foreground">(English)</span>
                    </Label>
                    <Textarea id={`g-${en}`} value={g[en]} onChange={(e) => setG((x) => ({ ...x, [en]: e.target.value }))} maxLength={1500} className={field === 'area' ? 'min-h-10' : 'min-h-24'} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`g-${sw}`}>
                      {t(`committee.guidance.${field}`)} <span className="font-normal text-muted-foreground">(Kiswahili)</span>
                    </Label>
                    <Textarea id={`g-${sw}`} value={g[sw]} onChange={(e) => setG((x) => ({ ...x, [sw]: e.target.value }))} maxLength={1500} className={field === 'area' ? 'min-h-10' : 'min-h-24'} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {kind === 'event' && (
            <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ev-hazard">{t('committee.event.hazard')}</Label>
                <Select value={ev.hazard} onValueChange={(v) => setEv((e) => ({ ...e, hazard: v as HazardKey }))} aria-label={t('committee.event.hazard')} className="h-9 w-full">
                  {HAZARD_KEYS.map((h) => (
                    <SelectItem key={h} value={h}>
                      {t(`guide:hazards.${h}`)}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-date">{t('committee.event.date')}</Label>
                <Input id="ev-date" type="date" value={ev.date} max={today()} onChange={(e) => setEv((x) => ({ ...x, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ev-desc">{t('committee.event.description')}</Label>
                <Textarea id="ev-desc" value={ev.description} onChange={(e) => setEv((x) => ({ ...x, description: e.target.value }))} maxLength={2000} className="min-h-24" placeholder={t('committee.event.descriptionPlaceholder')} />
              </div>
              {(['deaths', 'injured', 'affected', 'displaced'] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={`ev-${k}`}>{t(`committee.event.${k}`)}</Label>
                  <Input id={`ev-${k}`} type="number" inputMode="numeric" min={0} value={ev[k]} onChange={(e) => setEv((x) => ({ ...x, [k]: e.target.value }))} className="num h-9" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 grid max-w-3xl gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="committee-source">{t(`committee.source.${kind}`)}</Label>
              <Input id="committee-source" value={source} onChange={(e) => setSource(e.target.value)} maxLength={500} placeholder={t(`committee.sourcePlaceholder.${kind}`)} aria-required="true" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="committee-note">{t('workflow.sheet.note')}</Label>
              <Textarea id="committee-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={NOTE_MAX} className="min-h-20" />
            </div>
          </div>
        </fieldset>
        {!allowed && <p className="mt-3 text-sm text-danger">{t('committee.notAllowed')}</p>}
        {allowed && !complete && <p className="mt-3 text-sm text-muted-foreground">{t(`committee.incomplete.${kind}`)}</p>}
        {allowed && complete && !sourceOk && <p className="mt-3 text-sm text-muted-foreground">{t('committee.needSource')}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => send(reviewer)} disabled={!ready || submit.isPending}>
            {submit.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {reviewer ? t('committee.apply') : t('committee.send')}
          </Button>
          {reviewer && (
            <Button variant="outline" onClick={() => send(false)} disabled={!ready || submit.isPending}>
              {t('committee.sendInstead')}
            </Button>
          )}
        </div>
      </div>
      <ChainAside />
    </section>
  );
}

function ChainAside() {
  const { t } = useTranslation('data');
  return (
    <aside className="rounded-lg border border-border bg-card p-5 text-sm leading-relaxed">
      <h4 className="font-semibold">{t('committee.chainTitle')}</h4>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground">
        <li>{t('committee.chain.council')}</li>
        <li>{t('committee.chain.region')}</li>
        <li>{t('committee.chain.national')}</li>
        <li>{t('committee.chain.warning')}</li>
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">{t('committee.chainNote')}</p>
    </aside>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Warnings                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

function WarningForm({ records }: { records: readonly CommitteeRecord[] }) {
  const { t } = useTranslation(['data', 'common', 'guide']);
  const model = useModel();
  const submit = useSubmitCommittee();
  const [hazard, setHazard] = React.useState<HazardKey>('heavyRainfall');
  const [level, setLevel] = React.useState<AlertLevel>(1);
  const [areas, setAreas] = React.useState<string[]>([]);
  const [pick, setPick] = React.useState('');
  const [from, setFrom] = React.useState(today());
  const [to, setTo] = React.useState('');
  const [issuer, setIssuer] = React.useState('TMA');
  const [bulletin, setBulletin] = React.useState('');
  const [title, setTitle] = React.useState('');
  const regions = React.useMemo(() => [...model.regions].sort((a, b) => a.name.localeCompare(b.name)), [model]);
  const councils = React.useMemo(() => [...model.councils].sort((a, b) => a.name.localeCompare(b.name)), [model]);
  const nameOf = (id: string) => (id === 'TZ' ? t('committee.warning.wholeCountry') : (model.byId.get(id)?.name ?? id));
  const add = (id: string) => {
    if (id && !areas.includes(id)) setAreas((a) => [...a, id]);
    setPick('');
  };
  const ready = areas.length > 0 && bulletin.trim().length >= 3 && !!from && (!to || to >= from);
  const inForce = React.useMemo(() => records.filter((r) => warningInForce(r, today())).length, [records]);

  const send = async () => {
    if (!ready) return;
    const payload: WarningPayload = { alertLevel: level, areas, issuer: issuer.trim() || 'TMA', bulletin: bulletin.trim(), title: title.trim() || null };
    const input: NewCommitteeRecord = { kind: 'warning', unitId: 'TZ', level: 'national', unitName: 'Tanzania', region: '', regionId: null, hazard, payload, source: bulletin.trim(), validFrom: from, validTo: to || null };
    try {
      await submit.mutateAsync({ input, applyNow: false });
      toast.success(t('committee.warning.published'));
      setAreas([]);
      setBulletin('');
      setTitle('');
    } catch (e) {
      toast.error(t('committee.error'), { description: errorMessage(e) });
    }
  };

  return (
    <section aria-labelledby="warning-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-14">
      <div className="min-w-0">
        <h3 id="warning-title" className="font-display text-xl font-semibold">
          {t('committee.recordTitle.warning')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('committee.warning.inForce', { count: inForce })}</p>
        <div className="mt-5 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="w-hazard">{t('committee.event.hazard')}</Label>
            <Select value={hazard} onValueChange={(v) => setHazard(v as HazardKey)} aria-label={t('committee.event.hazard')} className="h-9 w-full">
              {HAZARD_KEYS.map((h) => (
                <SelectItem key={h} value={h}>
                  {t(`guide:hazards.${h}`)}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('committee.warning.level')}</Label>
            <div className="flex flex-wrap gap-2">
              {ALERT_LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  aria-pressed={level === l}
                  className={cn('rounded-md border px-3 py-1.5 text-sm font-medium', level === l ? 'border-transparent' : 'border-border bg-background')}
                  style={level === l ? { background: ALERT_COLOR[l], color: onAlertColor(l) } : undefined}
                >
                  {t(`guide:levels.${l}.label`)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="w-areas">{t('committee.warning.areas')}</Label>
            <div className="flex flex-wrap gap-2">
              {areas.map((id) => (
                <span key={id} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm">
                  {nameOf(id)}
                  <button type="button" onClick={() => setAreas((a) => a.filter((x) => x !== id))} aria-label={t('committee.warning.removeArea', { name: nameOf(id) })} className="text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <Select value={pick} onValueChange={add} placeholder={t('committee.warning.addArea')} aria-label={t('committee.warning.addArea')} className="mt-2 h-9 w-full max-w-md">
              <SelectItem value="TZ">{t('committee.warning.wholeCountry')}</SelectItem>
              <SelectGroup label={t('common:levels.regions')}>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup label={t('common:levels.councils')}>
                {councils.map((c) => (
                  <SelectItem key={c.id} value={c.id} description={c.region}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-from">{t('committee.warning.from')}</Label>
            <Input id="w-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-to">{t('committee.warning.to')}</Label>
            <Input id="w-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-issuer">{t('committee.warning.issuer')}</Label>
            <Input id="w-issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-bulletin">{t('committee.warning.bulletin')}</Label>
            <Input id="w-bulletin" value={bulletin} onChange={(e) => setBulletin(e.target.value)} maxLength={500} placeholder={t('committee.warning.bulletinPlaceholder')} aria-required="true" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="w-title">{t('committee.warning.title')}</Label>
            <Input id="w-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder={t('committee.warning.titlePlaceholder')} />
          </div>
        </div>
        {!ready && <p className="mt-3 text-sm text-muted-foreground">{t('committee.warning.incomplete')}</p>}
        <div className="mt-5">
          <Button onClick={send} disabled={!ready || submit.isPending}>
            {submit.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {t('committee.warning.publish')}
          </Button>
        </div>
      </div>
      <ChainAside />
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* The vulnerability-and-coping action library (D10)                                                  */
/* ------------------------------------------------------------------------------------------------ */

/** Every indicator group of the three dimensions: the library covers hazards too (standing risk-reducing actions, not warning-level ones). */
const VC_GROUPS = DIMENSIONS.flatMap((d) => d.categories.flatMap((c) => c.indicators.map((i) => ({ dim: d.key, key: i.key, ref: `${d.key}:${i.key}` }))));

function LibraryForm({ records }: { records: readonly CommitteeRecord[] }) {
  const { t, i18n } = useTranslation(['data', 'common', 'indicators']);
  const { profile } = useData();
  const submit = useSubmitCommittee();
  const reviewer = canReview(profile?.role);
  const [group, setGroup] = React.useState(VC_GROUPS[0].ref);
  const proposal = React.useCallback((ref: string) => [...sectorsFor(ref.split(':')[0] as DimensionKey, ref.split(':')[1])], []);
  const [sectors, setSectors] = React.useState<string[]>(() => proposal(VC_GROUPS[0].ref));
  const [text, setText] = React.useState({ whyEn: '', whySw: '', actionsEn: '', actionsSw: '' });
  const [source, setSource] = React.useState('');
  const current = React.useMemo(
    () =>
      records
        .filter((r) => r.kind === 'guidance' && r.level === 'national' && r.status === 'approved' && (r.payload as GuidancePayload & { group?: string }).topic === 'vc' && (r.payload as { group?: string }).group === group)
        .sort((a, b) => (b.reviewedAt ?? b.createdAt).localeCompare(a.reviewedAt ?? a.createdAt))[0] ?? null,
    [records, group],
  );
  React.useEffect(() => {
    const p = current?.payload as GuidancePayload | undefined;
    setText(p ? { whyEn: p.risk.en, whySw: p.risk.sw, actionsEn: p.advice.en, actionsSw: p.advice.sw } : { whyEn: '', whySw: '', actionsEn: '', actionsSw: '' });
    // The published entry's sectors, else the proposal for the group.
    setSectors(p?.leadSectors?.length ? p.leadSectors : proposal(group));
  }, [current, group, proposal]);
  const complete = (text.actionsEn.trim() || text.actionsSw.trim()) !== '';
  const ready = complete && source.trim().length >= 3;
  const send = async (applyNow: boolean) => {
    if (!ready) return;
    const payload: GuidancePayload = {
      topic: 'vc',
      group,
      leadSectors: sectors,
      area: { en: '', sw: '' },
      risk: { en: text.whyEn.trim(), sw: text.whySw.trim() },
      advice: { en: text.actionsEn.trim(), sw: text.actionsSw.trim() },
      replaces: null,
    };
    const input: NewCommitteeRecord = { kind: 'guidance', unitId: 'TZ', level: 'national', unitName: 'Tanzania', region: '', regionId: null, payload, source: source.trim() };
    try {
      await submit.mutateAsync({ input, applyNow });
      toast.success(t(applyNow ? 'committee.applied' : 'committee.sent'));
    } catch (e) {
      toast.error(t('committee.error'), { description: errorMessage(e) });
    }
  };
  const groupLabel = (ref: string) => t(`indicators:${ref.split(':')[1]}`);
  return (
    <section aria-labelledby="library-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-14">
      <div className="min-w-0">
        <h3 id="library-title" className="font-display text-xl font-semibold">
          {t('committee.recordTitle.vc')}
        </h3>
        <div className="mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="vc-group">{t('committee.vc.group')}</Label>
            <Select value={group} onValueChange={setGroup} aria-label={t('committee.vc.group')} className="h-9 w-full">
              {DIMENSIONS.map((d) => (
                <SelectGroup key={d.key} label={t(`common:dimensions.${d.key}`)}>
                  {VC_GROUPS.filter((g) => g.dim === d.key).map((g) => (
                    <SelectItem key={g.ref} value={g.ref}>
                      {groupLabel(g.ref)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </Select>
          </div>
        </div>
        {/* The lead sectors: the proposal is pre-selected; PMO-DMD keeps or changes it. */}
        <fieldset className="mt-4 max-w-3xl">
          <legend className="text-sm font-medium">{t('committee.vc.leadSectors')}</legend>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('committee.vc.leadSectorsHint')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SECTOR_KEYS.map((k) => {
              const on = sectors.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSectors((cur) => (on ? cur.filter((x) => x !== k) : [...cur, k]))}
                  className={cn('rounded-md border px-2 py-1 text-xs transition-colors', on ? 'border-primary bg-secondary font-medium text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted')}
                >
                  {t(`common:sectors.${k}`)}
                </button>
              );
            })}
          </div>
        </fieldset>
        <p className="mt-3 text-sm text-muted-foreground">
          {current ? t('committee.vc.current', { date: formatDate(current.reviewedAt ?? current.createdAt, i18n.language), by: current.reviewerName ?? current.authorName }) : t('committee.vc.noCurrent')}
        </p>
        <div className="mt-5 grid max-w-3xl gap-4">
          {(
            [
              ['why', 'whyEn', 'whySw'],
              ['actions', 'actionsEn', 'actionsSw'],
            ] as const
          ).map(([field, en, sw]) => (
            <div key={field} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`vc-${en}`}>
                  {t(`committee.vc.${field}`)} <span className="font-normal text-muted-foreground">(English)</span>
                </Label>
                <Textarea id={`vc-${en}`} value={text[en]} onChange={(e) => setText((x) => ({ ...x, [en]: e.target.value }))} maxLength={2000} className="min-h-24" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`vc-${sw}`}>
                  {t(`committee.vc.${field}`)} <span className="font-normal text-muted-foreground">(Kiswahili)</span>
                </Label>
                <Textarea id={`vc-${sw}`} value={text[sw]} onChange={(e) => setText((x) => ({ ...x, [sw]: e.target.value }))} maxLength={2000} className="min-h-24" />
              </div>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="vc-source">{t('committee.source.vc')}</Label>
            <Input id="vc-source" value={source} onChange={(e) => setSource(e.target.value)} maxLength={500} placeholder={t('committee.sourcePlaceholder.vc')} aria-required="true" />
          </div>
        </div>
        {!complete && <p className="mt-3 text-sm text-muted-foreground">{t('committee.incomplete.vc')}</p>}
        {complete && source.trim().length < 3 && <p className="mt-3 text-sm text-muted-foreground">{t('committee.needSource')}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => send(reviewer)} disabled={!ready || submit.isPending}>
            {submit.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {reviewer ? t('committee.apply') : t('committee.send')}
          </Button>
          {reviewer && (
            <Button variant="outline" onClick={() => send(false)} disabled={!ready || submit.isPending}>
              {t('committee.sendInstead')}
            </Button>
          )}
        </div>
      </div>
      <ChainAside />
    </section>
  );
}

/** Warnings in force, with withdrawal for those allowed to decide. */
function ActiveWarnings({ records, profile }: { records: readonly CommitteeRecord[]; profile: Profile | null }) {
  const { t, i18n } = useTranslation(['data', 'common', 'guide']);
  const review = useReviewCommittee();
  const model = useModel();
  const items = React.useMemo(() => records.filter((r) => warningInForce(r, today())), [records]);
  if (!items.length) return null;
  const withdraw = async (r: CommitteeRecord) => {
    try {
      await review.mutateAsync({ id: r.id, decision: 'rejected', note: t('committee.warning.withdrawnNote') });
      toast.success(t('committee.warning.withdrawn'));
    } catch (e) {
      toast.error(t('review.error'), { description: errorMessage(e) });
    }
  };
  return (
    <section aria-labelledby="warnings-active-title">
      <h3 id="warnings-active-title" className="font-display text-xl font-semibold">
        {t('committee.warning.activeTitle', { count: items.length })}
      </h3>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {items.map((r) => {
          const w = r.payload as WarningPayload;
          return (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  <span className="rounded-sm px-1.5 py-px text-xs" style={{ background: ALERT_COLOR[w.alertLevel], color: onAlertColor(w.alertLevel) }}>
                    {t(`guide:levels.${w.alertLevel}.label`)}
                  </span>
                  {r.hazard ? t(`guide:hazards.${r.hazard}`) : ''}
                  {w.title && <span className="font-normal text-muted-foreground">· {w.title}</span>}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {(w.areas ?? []).map((id) => (id === 'TZ' ? t('committee.warning.wholeCountry') : (model.byId.get(id)?.name ?? id))).join(', ')} ·{' '}
                  {t(r.validTo ? 'committee.warning.validity' : 'committee.warning.validityOpen', { from: r.validFrom ? formatDate(r.validFrom, i18n.language) : '', to: r.validTo ? formatDate(r.validTo, i18n.language) : '' })} · {w.issuer}
                  {w.bulletin && ` · ${w.bulletin}`}
                </p>
              </div>
              {canReviewCommittee(profile, r) && (
                <Button variant="outline" size="sm" onClick={() => withdraw(r)} disabled={review.isPending}>
                  {t('committee.warning.withdraw')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Review and history                                                                                 */
/* ------------------------------------------------------------------------------------------------ */

function PayloadSummary({ r, className }: { r: CommitteeRecord; className?: string }) {
  const { t, i18n } = useTranslation(['data', 'guide', 'indicators']);
  const lang = i18n.language;
  if (r.kind === 'drr') {
    const f = r.payload as DrrFields;
    const keys = r.level === 'region' ? REGION_KEYS : COUNCIL_KEYS;
    return (
      <ul className={cn('flex flex-wrap gap-x-5 gap-y-1 text-sm', className)}>
        {keys.map((k) => {
          const v = f[k];
          const year = k === 'eprp' ? f.eprpYear : k === 'rvca' ? f.rvcaYear : null;
          return (
            <li key={k} className={cn(v === true ? 'text-success' : v === false ? 'text-danger' : 'text-muted-foreground')}>
              <span className="font-medium">{t(`committee.drr.fields.${k}`)}</span>: {t(`committee.drr.${toAnswer(v)}`)}
              {year ? ` (${year})` : ''}
            </li>
          );
        })}
      </ul>
    );
  }
  if (r.kind === 'guidance') {
    const p = r.payload as GuidancePayload;
    const text = (x: { en: string; sw: string }) => (lang.startsWith('sw') ? x.sw || x.en : x.en || x.sw);
    return (
      <div className={cn('text-sm', className)}>
        <p className="font-medium">{p.topic === 'vc' && p.group ? `${t(`indicators:${p.group.split(':')[1]}`)}${p.leadSectors?.length ? ` · ${p.leadSectors.map((k) => t(`common:sectors.${k}`, { defaultValue: k })).join(', ')}` : p.leadSector ? ` · ${authorityLabel(p.leadSector)}` : ''}` : text(p.area)}</p>
        <p className="mt-1 leading-relaxed">{text(p.risk)}</p>
        {text(p.advice) && (
          <p className="mt-1 leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{t('committee.guidance.advice')}: </span>
            {text(p.advice)}
          </p>
        )}
        {p.topic !== 'vc' && <p className="mt-1 text-xs text-muted-foreground">{p.replaces == null ? t('committee.guidance.newStatement') : t('committee.guidance.replacesRow', { n: p.replaces + 1 })}</p>}
      </div>
    );
  }
  if (r.kind === 'event') {
    const p = r.payload as EventPayload;
    const counts = (['deaths', 'injured', 'affected', 'displaced'] as const).filter((k) => p[k] != null).map((k) => `${t(`committee.event.${k}`)}: ${p[k]}`);
    return (
      <div className={cn('text-sm', className)}>
        <p className="font-medium">
          {r.hazard ? t(`guide:hazards.${r.hazard}`) : ''} · {formatDate(p.date, lang)}
        </p>
        <p className="mt-1 leading-relaxed">{p.description}</p>
        {counts.length > 0 && <p className="mt-1 text-muted-foreground">{counts.join(' · ')}</p>}
      </div>
    );
  }
  return null;
}

/** Records awaiting this person's decision (their scope), oldest first. */
function ReviewList({ records, profile }: { records: readonly CommitteeRecord[]; profile: Profile | null }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const review = useReviewCommittee();
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const items = React.useMemo(() => records.filter((r) => r.status === 'pending' && canReviewCommittee(profile, r)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [records, profile]);
  if (!items.length) return null;

  const decide = async (r: CommitteeRecord, decision: 'approved' | 'rejected') => {
    const note = (notes[r.id] ?? '').trim();
    if (decision === 'rejected' && !note) return;
    try {
      await review.mutateAsync({ id: r.id, decision, note: note || undefined });
      toast.success(t(decision === 'approved' ? 'committee.approved' : 'committee.rejected', { name: r.unitName }));
    } catch (e) {
      toast.error(t('review.error'), { description: errorMessage(e) });
    }
  };

  return (
    <section aria-labelledby="committee-review-title">
      <h3 id="committee-review-title" className="font-display text-xl font-semibold">
        {t('committee.reviewTitle', { count: items.length })}
      </h3>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {items.map((r) => {
          const noteId = `committee-review-note-${r.id}`;
          const note = notes[r.id] ?? '';
          return (
            <li key={r.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
              <div className="min-w-0">
                <p className="font-medium">
                  {r.unitName} <span className="font-normal text-muted-foreground">· {t(`committee.kinds.${r.kind}`)}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {r.authorRole ? t('committee.byLine', { name: r.authorName, role: t(`roles.${r.authorRole}`) }) : t('committee.byLineNoRole', { name: r.authorName })} · {formatDate(r.createdAt, i18n.language)}
                </p>
                <PayloadSummary r={r} className="mt-3" />
                <p className="mt-3 text-sm">
                  <span className="text-muted-foreground">{t(`committee.source.${r.kind}`)}: </span>
                  {r.source}
                </p>
                {r.note && <blockquote className="mt-2 border-l-2 border-border pl-3 text-sm whitespace-pre-wrap">{r.note}</blockquote>}
              </div>
              <div>
                <Label htmlFor={noteId}>{t('review.noteOptional')}</Label>
                <Textarea id={noteId} value={note} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} maxLength={NOTE_MAX} className="mt-1.5 min-h-16" placeholder={t('review.notePlaceholder')} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => decide(r, 'approved')} disabled={review.isPending}>
                    <CircleCheck aria-hidden /> {t('committee.approve')}
                  </Button>
                  <Button variant="outline" onClick={() => decide(r, 'rejected')} disabled={review.isPending || !note.trim()}>
                    {t('committee.reject')}
                  </Button>
                </div>
                {!note.trim() && <p className="mt-1.5 text-xs text-muted-foreground">{t('committee.reasonRequired')}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Approved records of the chosen kind in this person's area (latest per area for DRR; newest first otherwise). */
function History({ kind, records, profile }: { kind: DeskKind; records: readonly CommitteeRecord[]; profile: Profile | null }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const model = useModel();
  const items = React.useMemo(() => {
    if (kind === 'vc') return records.filter((r) => r.kind === 'guidance' && r.level === 'national' && r.status === 'approved' && (r.payload as GuidancePayload).topic === 'vc').slice(0, 30);
    const ids = new Set(scopedUnits(model, profile, kind === 'warning' ? 'drr' : kind).map((u) => u.unit.id));
    const approved = records.filter((r) => r.kind === kind && r.status === 'approved' && (kind === 'warning' || ids.has(r.unitId)) && (kind !== 'guidance' || (r.payload as GuidancePayload).topic !== 'vc'));
    if (kind !== 'drr') return approved.slice(0, 30);
    const latest = new Map<string, CommitteeRecord>();
    for (const r of approved) if (!latest.has(r.unitId)) latest.set(r.unitId, r);
    return [...latest.values()].sort((a, b) => a.unitName.localeCompare(b.unitName));
  }, [records, model, profile, kind]);
  return (
    <section aria-labelledby="committee-history-title">
      <h3 id="committee-history-title" className="font-display text-xl font-semibold">
        {t(`committee.historyTitle.${kind}`)}
      </h3>
      {!items.length ? (
        <p className="mt-3 text-sm text-muted-foreground">{t('committee.historyEmpty')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {items.map((r) => (
            <li key={r.id} className="py-4">
              <p className="font-medium">
                {r.unitName} <span className="font-normal text-muted-foreground">({t(`common:levels.${r.level}`).toLowerCase()})</span>
              </p>
              {r.kind === 'warning' ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.hazard ? t(`guide:hazards.${r.hazard}`, { ns: 'guide' }) : ''} · {t(r.validTo ? 'committee.warning.validity' : 'committee.warning.validityOpen', { from: r.validFrom ? formatDate(r.validFrom, i18n.language) : '', to: r.validTo ? formatDate(r.validTo, i18n.language) : '' })}
                </p>
              ) : (
                <PayloadSummary r={r} className="mt-2" />
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {r.source} · {t('committee.approvedBy', { name: r.reviewerName ?? r.authorName, date: formatDate(r.reviewedAt ?? r.createdAt, i18n.language) })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
