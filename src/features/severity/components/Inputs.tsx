/**
 * Steps 3–6 - the assessment inputs, grouped by the official INFORM Severity structure:
 *   Impact (Geographical ⅓, Human ⅔) · Conditions (people by level of humanitarian conditions)
 *   Complexity (Society & safety, Operating environment) · Reliability (reported separately).
 * Layout: ruled sub-sections on the page (docs/DESIGN_LANGUAGE.md), not stacked boxes.
 */
import { RotateCcw } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Note } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
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
import { fractionLabel, RadioMark, SeverityMeter, WeightTag } from './bits';
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

/** Live score as a short flat bar plus the number. */
function ScoreLine({ score, className }: { score: number | null | undefined; className?: string }) {
  const { t } = useTranslation('severity');
  return (
    <span className={cn('flex w-36 items-center gap-2.5', className)}>
      <SeverityMeter value={score} thin />
      <span className="num w-7 text-right text-sm font-semibold">
        <span className="sr-only">{t('steps.dimScore')} </span>
        {formatScore(score)}
      </span>
    </span>
  );
}

/**
 * Sub-group heading on one ruled line: title (with its weight, which wraps under the title on phones)
 * on the left and the live score on the right at every width; lead beneath.
 */
function SubHead({ title, weight, score, lead }: { title: React.ReactNode; weight?: string; score: number | null | undefined; lead?: React.ReactNode }) {
  const { t } = useTranslation('severity');
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-2.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h3 className="text-base font-semibold">{title}</h3>
          {weight && <WeightTag>{t('weight', { w: weight })}</WeightTag>}
        </div>
        <ScoreLine score={score} className="w-24 shrink-0 sm:w-36" />
      </div>
      {lead && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

/** "= 1.5% of Tanzania's land area" under an input. */
function Derived({ children }: { children: React.ReactNode }) {
  return <p className="num text-xs font-medium text-foreground">{children}</p>;
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
    <div className="@container grid gap-12">
      <div>
        <SubHead title={t('cat.geographical')} weight={fractionLabel(catWeight('impact', 'geographical'))} score={findNode(impact, 'geographical')?.score} lead={t('sub.geographicalLead')} />
        <div className="grid gap-x-8 gap-y-7 @xl:grid-cols-2">
          {field('areaAffectedKm2', t('unit.km2'), isNum(ind.areaAffectedPct?.raw) && <Derived>= {t('derived.areaPct', { v: pct(ind.areaAffectedPct.raw) })}</Derived>)}
          {field('peopleInArea', t('unit.people'), isNum(ind.peopleInAreaPct?.raw) && <Derived>= {t('derived.peoplePct', { v: pct(ind.peopleInAreaPct.raw) })}</Derived>)}
        </div>
      </div>
      <div>
        <SubHead title={t('cat.human')} weight={fractionLabel(catWeight('impact', 'human'))} score={findNode(impact, 'human')?.score} lead={t('sub.humanLead')} />
        <div className="grid gap-x-6 gap-y-7 @xl:grid-cols-2 @[44rem]:grid-cols-3">
          {field(
            'peopleAffected',
            t('unit.people'),
            isNum(ind.peopleAffectedPct?.raw) && (
              <Derived>
                ={' '}
                {t('derived.affectedPct', {
                  v: pct(ind.peopleAffectedPct.raw),
                })}
              </Derived>
            ),
          )}
          {field('displaced', t('unit.people'), isNum(ind.displacedPct?.raw) && <Derived>= {t('derived.displacedPct', { v: pct(ind.displacedPct.raw) })}</Derived>)}
          {field(
            'fatalities',
            t('unit.people'),
            isNum(ind.fatalitiesPer10k?.raw) && (
              <Derived>
                ={' '}
                {t('derived.fatalRate', {
                  v: formatNumber(ind.fatalitiesPer10k.raw, lang, {
                    maximumFractionDigits: 2,
                  }),
                })}
              </Derived>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Conditions                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

/** Level number on its severity colour (a class key, like the distribution bar below). */
function LevelBadge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const key = (['veryLow', 'low', 'medium', 'high', 'veryHigh'] as const)[level - 1];
  return (
    <span className="num flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold" style={{ background: levelColor(level), color: ON_SEVERITY[key] }} aria-hidden>
      {level}
    </span>
  );
}

export function ConditionsInputs({
  input,
  result,
  issues,
  issueText,
  setLevel,
}: InputsProps & {
  setLevel: (level: ConditionLevel, v: number | null) => void;
}) {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const lang = i18n.language;
  const dist = levelDistribution(input);
  const levelIssues = issues.filter((i) => i.fields.some((f) => f.startsWith('level')) && i.key !== 'negative');
  const pin = result.indicators.peopleInNeed;
  const conc = result.indicators.concentrationLevel;
  const conditions = result.dimensions.conditions;
  const remainder = dist?.find((d) => d.level === 1)?.count ?? null;
  const rowCls = 'grid gap-3 py-4 @2xl:grid-cols-[minmax(0,1fr)_14rem] @2xl:items-center @2xl:gap-10';

  return (
    <div className="@container grid gap-10">
      <div>
        <ol className="divide-y divide-border border-y border-border">
          {CONDITION_LEVELS.map((l) => (
            <li key={l} className={rowCls}>
              <div className="flex gap-3.5">
                <LevelBadge level={l} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold">{t(`level.${l}.name`)}</span>
                    {l >= 3 && <span className="text-xs text-muted-foreground">· {t('conditions.inNeedTag')}</span>}
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t(`level.${l}.desc`)}</p>
                </div>
              </div>
              <NumberField
                id={fieldDomId(`level${l}` as InputFieldId)}
                label={t('level.inputLabel', {
                  n: l,
                  name: t(`level.${l}.name`),
                })}
                srOnlyLabel
                unit={t('unit.people')}
                value={input.levels?.[l]}
                onChange={(v) => setLevel(l, v)}
              />
            </li>
          ))}
          <li className={rowCls}>
            <div className="flex gap-3.5">
              <LevelBadge level={1} />
              <div className="min-w-0">
                <span className="text-sm font-semibold">{t('level.1.name')}</span>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t('level.1.desc')}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex h-10 items-stretch border border-transparent">
                <span className="num flex min-w-0 flex-1 items-center justify-end px-3 text-[15px] font-medium">{formatNumber(remainder, lang)}</span>
                <span className="flex shrink-0 items-center pr-3 pl-1 text-xs whitespace-nowrap text-muted-foreground">{t('unit.people')}</span>
              </div>
              <span className="pr-3 text-right text-xs text-muted-foreground">{t('conditions.remainder')}</span>
            </div>
          </li>
        </ol>

        {levelIssues.length > 0 && (
          <div role="status" className="mt-5 grid gap-2">
            {levelIssues.map((i) => (
              <Note key={i.key} tone="warning">
                <span className="font-medium text-foreground">{issueText(i)}</span>
              </Note>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-base font-semibold">{t('conditions.distribution')}</h3>
          {isNum(input.peopleInArea) && (
            <span className="num text-sm text-muted-foreground">
              {t('conditions.ofPeople', {
                n: formatNumber(input.peopleInArea, lang),
              })}
            </span>
          )}
        </div>
        {dist ? (
          <>
            <div className="flex h-3 overflow-hidden bg-muted" role="img" aria-label={dist.map((d) => `${t('level.short', { n: d.level })}: ${Math.round(d.share * 1000) / 10}%`).join(', ')}>
              {dist.map((d) => (
                <div
                  key={d.level}
                  className="h-full transition-[width] duration-150"
                  style={{
                    width: `${d.share * 100}%`,
                    background: levelColor(d.level),
                  }}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              {dist.map((d) => (
                <li key={d.level} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[2px] ring-1 ring-foreground/20 ring-inset" style={{ background: levelColor(d.level) }} aria-hidden />
                  {t('level.short', { n: d.level })}
                  <b className="num font-semibold text-foreground">
                    {formatNumber(d.share * 100, lang, {
                      maximumFractionDigits: d.share < 0.01 && d.share > 0 ? 2 : 1,
                    })}
                    %
                  </b>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Note>{t('conditions.needArea')}</Note>
        )}
      </div>

      <dl className="grid gap-y-8 border-t border-border pt-7 @xl:grid-cols-2 @xl:divide-x @xl:divide-border">
        <div className="flex flex-col @xl:pr-8">
          <dt className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">{t('cat.peopleInNeed')}</span>
            <WeightTag>
              {t('weight', {
                w: fractionLabel(catWeight('conditions', 'peopleInNeed')),
              })}
            </WeightTag>
          </dt>
          <dd className="num mt-2 text-3xl font-semibold tracking-tight">{formatNumber(pin?.raw, lang)}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">{t('conditions.pinSub')}</dd>
          <dd className="mt-auto pt-4">
            <ScoreLine score={findNode(conditions, 'peopleInNeed')?.score} className="w-full" />
          </dd>
        </div>
        <div className="flex flex-col @xl:pl-8">
          <dt className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">{t('cat.concentration')}</span>
            <WeightTag>
              {t('weight', {
                w: fractionLabel(catWeight('conditions', 'concentration')),
              })}
            </WeightTag>
          </dt>
          <dd className="mt-2 flex min-h-9 items-center gap-2.5">
            {isNum(conc?.raw) ? (
              <>
                <LevelBadge level={conc.raw as 1 | 2 | 3 | 4 | 5} />
                <span className="text-xl font-semibold">{t(`level.${conc.raw}.name`)}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{t('results.notComputed')}</span>
            )}
          </dd>
          <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('conditions.concentrationSub')}</dd>
          <dd className="mt-auto pt-4">
            <ScoreLine score={findNode(conditions, 'concentration')?.score} className="w-full" />
          </dd>
        </div>
      </dl>
    </div>
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
    <p className="text-xs leading-relaxed text-muted-foreground">
      {t(`source.${field}`, { defaultValue: def.defaultSource })}
      <span aria-hidden> · </span>
      {isDefault ? (
        <span>{t('defaults.national')}</span>
      ) : (
        <>
          <span className="font-medium text-foreground">{t('defaults.edited')}</span>
          <span aria-hidden> · </span>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <RotateCcw className="size-3" aria-hidden />
            {t('defaults.reset', {
              value: formatNumber(def.default, i18n.language, {
                maximumFractionDigits: 3,
              }),
            })}
          </button>
        </>
      )}
    </p>
  );
}

/** Row class for a compact radio option (RadioMark + label), shared by the access scales. */
const optionCls =
  'group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors duration-150 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:font-semibold';

function AccessInput({ field, value, onChange }: { field: AccessField; value: number | null | undefined; onChange: (v: number | null) => void }) {
  const { t } = useTranslation(['severity', 'common']);
  const id = fieldDomId(field);
  return (
    <li className="grid gap-3 py-5 @2xl:grid-cols-[minmax(0,1fr)_17rem] @2xl:gap-10">
      <div className="min-w-0">
        <div id={`${id}-label`} className="text-sm font-semibold">
          {t(`field.${field}.label`)}
        </div>
        <p id={`${id}-help`} className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t(`field.${field}.help`)}
        </p>
      </div>
      <div className="min-w-0">
        <RadioGroup.Root
          id={id}
          value={isNum(value) ? String(value) : ''}
          onValueChange={(v) => onChange(Number(v))}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help`}
          className="-mx-2 grid"
        >
          {[0, 1, 2, 3].map((n) => (
            <RadioGroup.Item key={n} value={String(n)} className={optionCls}>
              <RadioMark />
              <span className="num w-2.5 text-muted-foreground group-data-[state=checked]:text-foreground">{n}</span>
              <span className="min-w-0">{t(`access.level.${n}.name`)}</span>
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          <span aria-live="polite">{isNum(value) ? t(`access.level.${value}.desc`) : t('access.notSet')}</span>
          {isNum(value) && (
            <>
              <span aria-hidden> · </span>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={`${t('common:actions.clear')}: ${t(`field.${field}.short`)}`}
              >
                {t('common:actions.clear')}
              </button>
            </>
          )}
        </p>
      </div>
    </li>
  );
}

export function ComplexityInputs({ input, result, patch, toggleGroup }: InputsProps & { patch: Patch; toggleGroup: (g: AffectedGroup) => void }) {
  const { t } = useTranslation(['severity', 'common']);
  const complexity = result.dimensions.complexity;
  const anyEdited = STRUCTURAL_FIELDS.some((f) => input[f] !== STRUCTURAL_DEFAULTS[f]);
  const groups = input.groups;

  return (
    <div className="@container grid gap-12">
      <div>
        <SubHead
          title={t('cat.societySafety')}
          weight={fractionLabel(catWeight('complexity', 'societySafety'))}
          score={findNode(complexity, 'societySafety')?.score}
          lead={t('sub.societySafetyLead')}
        />
        <div className="grid gap-x-8 gap-y-7 @xl:grid-cols-2">
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
          <Button variant="outline" size="sm" className="mt-6" onClick={() => patch(Object.fromEntries(STRUCTURAL_FIELDS.map((f) => [f, STRUCTURAL_DEFAULTS[f]])))}>
            <RotateCcw /> {t('defaults.resetAll')}
          </Button>
        )}
      </div>

      <div>
        <SubHead
          title={t('cat.operatingEnvironment')}
          weight={fractionLabel(catWeight('complexity', 'operatingEnvironment'))}
          score={findNode(complexity, 'operatingEnvironment')?.score}
          lead={t('sub.operatingEnvironmentLead')}
        />
        <fieldset id={fieldDomId('groups')} aria-describedby={`${fieldDomId('groups')}-help`}>
          <legend className="float-left flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-sm font-semibold">{t('field.groups.label')}</span>
            <span className="num text-sm text-muted-foreground">{groups ? t('groups.count', { count: groups.length }) : t('groups.notSet')}</span>
          </legend>
          <p id={`${fieldDomId('groups')}-help`} className="clear-left pt-1 text-sm leading-relaxed text-muted-foreground">
            {t('field.groups.help')}
          </p>
          <div className="mt-3 grid gap-x-8 @lg:grid-cols-2 @3xl:grid-cols-3">
            {AFFECTED_GROUPS.map((g) => (
              <label key={g} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm">
                <input type="checkbox" className="size-4 shrink-0 cursor-pointer accent-primary" checked={!!groups?.includes(g)} onChange={() => toggleGroup(g)} />
                {t(`group.${g}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <ul className="mt-8 divide-y divide-border border-t border-border">
          {ACCESS_FIELDS.map((f) => (
            <AccessInput key={f} field={f} value={input[f]} onChange={(v) => patch({ [f]: v })} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Reliability                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export function ReliabilityInputs({ input, patch }: { input: SeverityInput; patch: Patch }) {
  const { t } = useTranslation('severity');
  const id = fieldDomId('dataReliability');
  return (
    <div className="@container">
      <div className="grid gap-10 @2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @2xl:gap-12">
        <div>
          <div id={`${id}-label`} className="text-sm font-semibold">
            {t('field.dataReliability.label')}
          </div>
          <RadioGroup.Root
            id={id}
            value={input.dataReliability ?? ''}
            onValueChange={(v) => patch({ dataReliability: v as 'low' | 'medium' | 'high' })}
            aria-labelledby={`${id}-label`}
            className="mt-3 divide-y divide-border border-t border-border"
          >
            {(['low', 'medium', 'high'] as const).map((k) => (
              <RadioGroup.Item
                key={k}
                value={k}
                aria-labelledby={`${id}-${k}-name`}
                aria-describedby={`${id}-${k}-desc`}
                className="group grid w-full grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 px-1 py-3.5 text-left outline-none transition-colors duration-150 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[state=checked]:bg-muted/50 sm:px-2"
              >
                <RadioMark className="mt-px" />
                <span className="min-w-0">
                  <span id={`${id}-${k}-name`} className="block text-sm font-semibold">
                    {t(`reliabilityInput.${k}.name`)}
                  </span>
                  <span id={`${id}-${k}-desc`} className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                    {t(`reliabilityInput.${k}.desc`)}
                  </span>
                </span>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </div>
        <div className="flex flex-col gap-6">
          <NumberField
            id={fieldDomId('daysSinceUpdate')}
            label={t('field.daysSinceUpdate.label')}
            help={t('field.daysSinceUpdate.help')}
            unit={t('unit.days')}
            value={input.daysSinceUpdate}
            onChange={(v) => patch({ daysSinceUpdate: v })}
          />
          <Note>{t('reliabilityNote')}</Note>
        </div>
      </div>
    </div>
  );
}
