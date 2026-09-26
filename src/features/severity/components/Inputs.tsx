/**
 * Steps 3–6 — the assessment inputs, grouped by the official INFORM Severity structure:
 *   Impact (Geographical ⅓, Human ⅔) · Conditions (people by level of humanitarian conditions)
 *   Complexity (Society & safety, Operating environment) · Reliability (reported separately).
 */
import { Database, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AFFECTED_GROUPS, CONDITION_LEVELS, SEVERITY_INDICATOR_BY_ID, SEVERITY_MODEL, type AffectedGroup } from '@/engine/severity/definitions';
import type { ScoreNode, SeverityInput, SeverityResult } from '@/engine/severity/engine';
import { STRUCTURAL_DEFAULTS } from '@/engine/severity/scenarios';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import {
  ACCESS_FIELDS,
  fieldDomId,
  isNum,
  levelColor,
  levelDistribution,
  ON_SEVERITY,
  STRUCTURAL_FIELDS,
  type AccessField,
  type ConditionLevel,
  type InputFieldId,
  type InputIssue,
  type StructuralField,
} from '../lib';
import { fractionLabel, SeverityMeter, WeightTag } from './bits';
import { NumberField } from './NumberField';

type Patch = (p: Partial<SeverityInput>) => void;

export interface InputsProps {
  input: SeverityInput;
  result: SeverityResult;
  issues: InputIssue[];
  issueText: (i: InputIssue) => string;
}

const findNode = (node: ScoreNode, id: string) => node.children?.find((c) => c.id === id) ?? null;
const catWeight = (dim: string, cat: string) => SEVERITY_MODEL.find((d) => d.id === dim)?.categories.find((c) => c.id === cat)?.weight ?? 0;

/** Sub-group heading with weight and live score. */
function SubHead({ title, weight, score, lead }: { title: React.ReactNode; weight?: string; score: number | null | undefined; lead?: React.ReactNode }) {
  const { t } = useTranslation('severity');
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-sm font-bold tracking-wide uppercase">{title}</h3>
        {weight && <WeightTag>{t('weight', { w: weight })}</WeightTag>}
        <span className="ml-auto flex w-32 items-center gap-2">
          <SeverityMeter value={score} thin />
          <span className="num w-7 text-right font-display text-sm font-bold">
            <span className="sr-only">{t('steps.dimScore')} </span>
            {formatScore(score)}
          </span>
        </span>
      </div>
      {lead && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

/** "= 1.5% of Tanzania's land area" under an input. */
function Derived({ children }: { children: React.ReactNode }) {
  return <p className="num inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary">{children}</p>;
}

function warnFor(issues: InputIssue[], issueText: (i: InputIssue) => string, field: InputFieldId) {
  const hit = issues.find((i) => i.key !== 'negative' && i.fields.includes(field) && !i.fields.some((f) => f.startsWith('level')));
  return hit ? issueText(hit) : undefined;
}

/* ------------------------------------------------------------------------------------------------ */
/* Impact                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

export function ImpactInputs({ input, result, issues, issueText, patch }: InputsProps & { patch: Patch }) {
  const { t, i18n } = useTranslation('severity');
  const lang = i18n.language;
  const ind = result.indicators;
  const impact = result.dimensions.impact;
  const pct = (v: number | null | undefined) => formatNumber(v, lang, { maximumFractionDigits: isNum(v) && v < 1 ? 2 : 1 });
  const field = (f: 'areaAffectedKm2' | 'peopleInArea' | 'peopleAffected' | 'displaced' | 'fatalities', unit: string, derived?: React.ReactNode) => (
    <NumberField
      id={fieldDomId(f)}
      label={t(`field.${f}.label`)}
      help={t(`field.${f}.help`)}
      unit={unit}
      value={input[f]}
      onChange={(v) => patch({ [f]: v })}
      warning={warnFor(issues, issueText, f)}
      footer={derived}
    />
  );

  return (
    <Card className="@container">
      <CardContent className="grid gap-7 pt-5 sm:pt-6">
        <div>
          <SubHead title={t('cat.geographical')} weight={fractionLabel(catWeight('impact', 'geographical'))} score={findNode(impact, 'geographical')?.score} lead={t('sub.geographicalLead')} />
          <div className="grid gap-4 @xl:grid-cols-2">
            {field('areaAffectedKm2', t('unit.km2'), isNum(ind.areaAffectedPct?.raw) && <Derived>= {t('derived.areaPct', { v: pct(ind.areaAffectedPct.raw) })}</Derived>)}
            {field('peopleInArea', t('unit.people'), isNum(ind.peopleInAreaPct?.raw) && <Derived>= {t('derived.peoplePct', { v: pct(ind.peopleInAreaPct.raw) })}</Derived>)}
          </div>
        </div>
        <div className="border-t border-border pt-6">
          <SubHead title={t('cat.human')} weight={fractionLabel(catWeight('impact', 'human'))} score={findNode(impact, 'human')?.score} lead={t('sub.humanLead')} />
          <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
            {field('peopleAffected', t('unit.people'), isNum(ind.peopleAffectedPct?.raw) && <Derived>= {t('derived.affectedPct', { v: pct(ind.peopleAffectedPct.raw) })}</Derived>)}
            {field('displaced', t('unit.people'), isNum(ind.displacedPct?.raw) && <Derived>= {t('derived.displacedPct', { v: pct(ind.displacedPct.raw) })}</Derived>)}
            {field(
              'fatalities',
              t('unit.people'),
              isNum(ind.fatalitiesPer10k?.raw) && <Derived>= {t('derived.fatalRate', { v: formatNumber(ind.fatalitiesPer10k.raw, lang, { maximumFractionDigits: 2 }) })}</Derived>,
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Conditions                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

function LevelBadge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const key = (['veryLow', 'low', 'medium', 'high', 'veryHigh'] as const)[level - 1];
  return (
    <span className="num flex size-9 shrink-0 items-center justify-center rounded-xl font-display text-base font-extrabold ring-1 ring-black/5" style={{ background: levelColor(level), color: ON_SEVERITY[key] }} aria-hidden>
      {level}
    </span>
  );
}

export function ConditionsInputs({ input, result, issues, issueText, setLevel }: InputsProps & { setLevel: (level: ConditionLevel, v: number | null) => void }) {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const lang = i18n.language;
  const dist = levelDistribution(input);
  const levelIssues = issues.filter((i) => i.fields.some((f) => f.startsWith('level')) && i.key !== 'negative');
  const pin = result.indicators.peopleInNeed;
  const conc = result.indicators.concentrationLevel;
  const conditions = result.dimensions.conditions;
  const remainder = dist?.find((d) => d.level === 1)?.count ?? null;

  return (
    <Card className="@container">
      <CardContent className="grid gap-6 pt-5 sm:pt-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{t('sub.conditionsLead')}</p>

        <ol className="divide-y divide-border rounded-2xl border border-border">
          {CONDITION_LEVELS.map((l) => (
            <li key={l} className="grid gap-3 p-3.5 @2xl:grid-cols-[1fr_15rem] @2xl:items-center sm:p-4">
              <div className="flex gap-3">
                <LevelBadge level={l} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{t(`level.${l}.name`)}</span>
                    {l >= 3 && <span className="rounded-md bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-danger uppercase">{t('conditions.inNeedTag')}</span>}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(`level.${l}.desc`)}</p>
                </div>
              </div>
              <NumberField
                id={fieldDomId(`level${l}` as InputFieldId)}
                label={t('level.inputLabel', { n: l, name: t(`level.${l}.name`) })}
                srOnlyLabel
                unit={t('unit.people')}
                value={input.levels?.[l]}
                onChange={(v) => setLevel(l, v)}
              />
            </li>
          ))}
          <li className="grid gap-3 bg-muted/30 p-3.5 @2xl:grid-cols-[1fr_15rem] @2xl:items-center sm:p-4">
            <div className="flex gap-3">
              <LevelBadge level={1} />
              <div className="min-w-0">
                <span className="text-sm font-semibold">{t('level.1.name')}</span>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t('level.1.desc')}</p>
              </div>
            </div>
            <div className="flex h-10 items-center justify-end rounded-xl border border-dashed border-border px-3 text-sm">
              <span className="num font-semibold">{formatNumber(remainder, lang)}</span>
              <span className="ml-2 text-xs text-muted-foreground">{t('conditions.remainder')}</span>
            </div>
          </li>
        </ol>

        {levelIssues.map((i) => (
          <p key={i.key} role="status" className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-xs font-medium text-warning">
            <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
            {issueText(i)}
          </p>
        ))}

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">{t('conditions.distribution')}</h3>
            {isNum(input.peopleInArea) && <span className="num text-xs text-muted-foreground">{t('conditions.ofPeople', { n: formatNumber(input.peopleInArea, lang) })}</span>}
          </div>
          {dist ? (
            <>
              <div className="flex h-4 overflow-hidden rounded-full bg-muted ring-1 ring-black/5" role="img" aria-label={dist.map((d) => `${t('level.short', { n: d.level })}: ${Math.round(d.share * 1000) / 10}%`).join(', ')}>
                {dist.map((d) => (
                  <div key={d.level} className="h-full transition-[width] duration-700 ease-out" style={{ width: `${d.share * 100}%`, background: levelColor(d.level) }} />
                ))}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                {dist.map((d) => (
                  <li key={d.level} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[3px] ring-1 ring-black/10" style={{ background: levelColor(d.level) }} />
                    {t('level.short', { n: d.level })}
                    <b className="num text-foreground">{formatNumber(d.share * 100, lang, { maximumFractionDigits: d.share < 0.01 && d.share > 0 ? 2 : 1 })}%</b>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">{t('conditions.needArea')}</p>
          )}
        </div>

        <div className="grid gap-3 @xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{t('cat.peopleInNeed')}</span>
              <WeightTag>{t('weight', { w: fractionLabel(catWeight('conditions', 'peopleInNeed')) })}</WeightTag>
            </div>
            <div className="num mt-1.5 font-display text-2xl font-extrabold">{formatNumber(pin?.raw, lang)}</div>
            <div className="text-[11px] text-muted-foreground">{t('conditions.pinSub')}</div>
            <div className="mt-2 flex items-center gap-2">
              <SeverityMeter value={findNode(conditions, 'peopleInNeed')?.score} thin />
              <span className="num w-7 text-right text-xs font-bold">{formatScore(pin?.score)}</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{t('cat.concentration')}</span>
              <WeightTag>{t('weight', { w: fractionLabel(catWeight('conditions', 'concentration')) })}</WeightTag>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              {isNum(conc?.raw) ? <LevelBadge level={conc.raw as 1 | 2 | 3 | 4 | 5} /> : <span className="num font-display text-2xl font-extrabold">—</span>}
              {isNum(conc?.raw) && <span className="text-sm font-semibold">{t(`level.${conc.raw}.name`)}</span>}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{t('conditions.concentrationSub')}</div>
            <div className="mt-2 flex items-center gap-2">
              <SeverityMeter value={findNode(conditions, 'concentration')?.score} thin />
              <span className="num w-7 text-right text-xs font-bold">{formatScore(conc?.score)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Complexity                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

const STRUCTURAL_CFG: Record<StructuralField, { decimals: number; max?: number; unit: string }> = {
  gini: { decimals: 1, max: 100, unit: '0–100' },
  genderInequality: { decimals: 3, max: 1, unit: '0–1' },
  conflictIntensity: { decimals: 1, max: 5, unit: '0–5' },
  violenceFatalities: { decimals: 0, unit: 'people' },
  corruptionPerception: { decimals: 0, max: 100, unit: '0–100' },
  ruleOfLawPercentile: { decimals: 1, max: 100, unit: '0–100' },
};

function SourceLine({ field, value, onReset }: { field: StructuralField; value: number | null | undefined; onReset: () => void }) {
  const { t, i18n } = useTranslation('severity');
  const def = SEVERITY_INDICATOR_BY_ID[field];
  const isDefault = value === def.default;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Database className="size-3 shrink-0" aria-hidden />
        {t(`source.${field}`, { defaultValue: def.defaultSource })}
      </span>
      {isDefault ? (
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-semibold">{t('defaults.national')}</span>
      ) : (
        <>
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">{t('defaults.edited')}</span>
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1 rounded font-semibold text-primary hover:underline">
            <RotateCcw className="size-3" aria-hidden />
            {t('defaults.reset', { value: formatNumber(def.default, i18n.language, { maximumFractionDigits: 3 }) })}
          </button>
        </>
      )}
    </div>
  );
}

function AccessInput({ field, value, onChange }: { field: AccessField; value: number | null | undefined; onChange: (v: number | null) => void }) {
  const { t } = useTranslation('severity');
  const id = fieldDomId(field);
  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div id={`${id}-label`} className="text-sm font-medium">
            {t(`field.${field}.label`)}
          </div>
          <p id={`${id}-help`} className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {t(`field.${field}.help`)}
          </p>
        </div>
        {isNum(value) && (
          <Button variant="ghost" size="sm" className="-mt-1 -mr-1 h-7 px-2 text-[11px]" onClick={() => onChange(null)}>
            {t('common:actions.clear')}
          </Button>
        )}
      </div>
      <RadioGroup.Root
        id={id}
        value={isNum(value) ? String(value) : ''}
        onValueChange={(v) => onChange(Number(v))}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help`}
        orientation="horizontal"
        className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-muted p-1"
      >
        {[0, 1, 2, 3].map((n) => (
          <RadioGroup.Item
            key={n}
            value={String(n)}
            className="flex min-w-0 flex-col items-center rounded-lg px-1 py-1.5 text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:shadow-sm"
          >
            <span className="num font-display text-sm font-bold">{n}</span>
            <span className="w-full truncate text-center text-[10px] font-medium">{t(`access.level.${n}.name`)}</span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      <p className="mt-2 min-h-8 text-xs leading-relaxed text-muted-foreground" aria-live="polite">
        {isNum(value) ? t(`access.level.${value}.desc`) : t('access.notSet')}
      </p>
    </div>
  );
}

export function ComplexityInputs({ input, result, patch, toggleGroup }: InputsProps & { patch: Patch; toggleGroup: (g: AffectedGroup) => void }) {
  const { t } = useTranslation(['severity', 'common']);
  const complexity = result.dimensions.complexity;
  const anyEdited = STRUCTURAL_FIELDS.some((f) => input[f] !== STRUCTURAL_DEFAULTS[f]);
  const groups = input.groups;

  return (
    <Card className="@container">
      <CardContent className="grid gap-7 pt-5 sm:pt-6">
        <div>
          <SubHead title={t('cat.societySafety')} weight={fractionLabel(catWeight('complexity', 'societySafety'))} score={findNode(complexity, 'societySafety')?.score} lead={t('sub.societySafetyLead')} />
          <div className="grid gap-x-4 gap-y-5 @xl:grid-cols-2">
            {STRUCTURAL_FIELDS.map((f) => {
              const cfg = STRUCTURAL_CFG[f];
              return (
                <NumberField
                  key={f}
                  id={fieldDomId(f)}
                  label={t(`field.${f}.label`)}
                  help={t(`field.${f}.help`)}
                  unit={cfg.unit === 'people' ? t('unit.people') : cfg.unit}
                  decimals={cfg.decimals}
                  max={cfg.max}
                  value={input[f]}
                  onChange={(v) => patch({ [f]: v })}
                  footer={<SourceLine field={f} value={input[f]} onReset={() => patch({ [f]: STRUCTURAL_DEFAULTS[f] })} />}
                />
              );
            })}
          </div>
          {anyEdited && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => patch(Object.fromEntries(STRUCTURAL_FIELDS.map((f) => [f, STRUCTURAL_DEFAULTS[f]])))}>
              <RotateCcw /> {t('defaults.resetAll')}
            </Button>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <SubHead
            title={t('cat.operatingEnvironment')}
            weight={fractionLabel(catWeight('complexity', 'operatingEnvironment'))}
            score={findNode(complexity, 'operatingEnvironment')?.score}
            lead={t('sub.operatingEnvironmentLead')}
          />
          <fieldset id={fieldDomId('groups')} className="rounded-xl border border-border p-3.5">
            <legend className="sr-only">{t('field.groups.label')}</legend>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium" aria-hidden>
                {t('field.groups.label')}
              </span>
              <span className="num text-xs font-semibold text-muted-foreground">{groups ? t('groups.count', { count: groups.length }) : t('groups.notSet')}</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t('field.groups.help')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AFFECTED_GROUPS.map((g) => {
                const checked = !!groups?.includes(g);
                return (
                  <label key={g} className="cursor-pointer">
                    <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => toggleGroup(g)} />
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all peer-checked:border-primary/50 peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:bg-muted">
                      <span className={cn('flex size-3.5 items-center justify-center rounded-[4px] border', checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input')} aria-hidden>
                        {checked && (
                          <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M2.5 6.2 5 8.6l4.5-5.2" />
                          </svg>
                        )}
                      </span>
                      {t(`group.${g}`)}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-4 grid gap-3 @3xl:grid-cols-3">
            {ACCESS_FIELDS.map((f) => (
              <AccessInput key={f} field={f} value={input[f]} onChange={(v) => patch({ [f]: v })} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Reliability                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export function ReliabilityInputs({ input, patch }: { input: SeverityInput; patch: Patch }) {
  const { t } = useTranslation('severity');
  const id = fieldDomId('dataReliability');
  return (
    <Card className="@container">
      <CardContent className="grid gap-6 pt-5 sm:pt-6 @2xl:grid-cols-[1.4fr_1fr]">
        <div>
          <div id={`${id}-label`} className="text-sm font-medium">
            {t('field.dataReliability.label')}
          </div>
          <RadioGroup.Root
            id={id}
            value={input.dataReliability ?? ''}
            onValueChange={(v) => patch({ dataReliability: v as 'low' | 'medium' | 'high' })}
            aria-labelledby={`${id}-label`}
            className="mt-2 grid gap-2 @md:grid-cols-3 @2xl:grid-cols-1 @4xl:grid-cols-3"
          >
            {(['low', 'medium', 'high'] as const).map((k) => (
              <RadioGroup.Item
                key={k}
                value={k}
                className="flex flex-col items-start rounded-xl border border-border bg-card p-3 text-left transition-all outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:border-primary/60 data-[state=checked]:bg-primary/5 data-[state=checked]:ring-1 data-[state=checked]:ring-primary/30"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex gap-0.5" aria-hidden>
                    {[0, 1, 2].map((b) => (
                      <span key={b} className={cn('h-3 w-1 rounded-full', b <= ['low', 'medium', 'high'].indexOf(k) ? 'bg-primary' : 'bg-muted-foreground/25')} />
                    ))}
                  </span>
                  {t(`reliabilityInput.${k}.name`)}
                </span>
                <span className="mt-1 text-[11px] leading-snug text-muted-foreground">{t(`reliabilityInput.${k}.desc`)}</span>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </div>
        <div className="flex flex-col gap-4">
          <NumberField
            id={fieldDomId('daysSinceUpdate')}
            label={t('field.daysSinceUpdate.label')}
            help={t('field.daysSinceUpdate.help')}
            unit={t('unit.days')}
            value={input.daysSinceUpdate}
            onChange={(v) => patch({ daysSinceUpdate: v })}
          />
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-px size-4 shrink-0 text-primary" aria-hidden />
            {t('reliabilityNote')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

