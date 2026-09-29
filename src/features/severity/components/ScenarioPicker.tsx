/**
 * Step 1 - illustrative scenarios plus a blank / custom form, as one ruled radio list: name and blurb on
 * the left, headline figures and the resulting severity on the right. The "illustrative" disclosure is a
 * single note under the list (rendered by the page), not a tag on every row. Each radio is named by its
 * title alone; the blurb, figures and severity are its description.
 */
import { RadioGroup } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { computeSeverity } from '@/engine/severity/engine';
import { SEVERITY_SCENARIOS } from '@/engine/severity/scenarios';
import { formatCompact, formatScore } from '@/lib/utils';
import type { ScenarioChoice } from '../lib';
import { RadioMark, SeverityChip } from './bits';

/** Scenario previews are static - compute them once per session, not on every mount. */
let previewCache: Array<{ s: (typeof SEVERITY_SCENARIOS)[number]; r: ReturnType<typeof computeSeverity> }> | null = null;
const previews = () => (previewCache ??= SEVERITY_SCENARIOS.map((s) => ({ s, r: computeSeverity(s.input) })));

/** Element ids for a scenario row: the radio is named by its title and described by the rest. */
const ids = (id: string) => `sev-scenario-${id}`;

const rowCls =
  'group grid w-full grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 px-1 py-5 text-left outline-none transition-colors duration-150 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[state=checked]:bg-muted/50 sm:px-3 @2xl:grid-cols-[1.25rem_minmax(0,1fr)_auto]';

export function ScenarioPicker({ value, onChange }: { value: ScenarioChoice; onChange: (id: ScenarioChoice) => void }) {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const lang = i18n.language;
  const list = React.useMemo(previews, []);

  return (
    <RadioGroup.Root value={value} onValueChange={(v) => onChange(v as ScenarioChoice)} aria-label={t('scenario.aria')} className="@container divide-y divide-border border-y border-border">
      {list.map(({ s, r }) => (
        <RadioGroup.Item key={s.id} value={s.id} className={rowCls} aria-labelledby={`${ids(s.id)}-name`} aria-describedby={`${ids(s.id)}-desc ${ids(s.id)}-figs ${ids(s.id)}-sev`}>
          <RadioMark className="mt-1" />
          <span className="min-w-0">
            <span id={`${ids(s.id)}-name`} className="block text-base font-semibold">
              {t(`scenario.${s.id}.name`)}
            </span>
            <span id={`${ids(s.id)}-desc`} className="mt-1 block max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t(`scenario.${s.id}.blurb`)}
            </span>
            <span id={`${ids(s.id)}-figs`} className="num mt-2 block text-sm text-muted-foreground">
              {(
                [
                  ['peopleAffected', 'scenario.affected'],
                  ['displaced', 'scenario.displaced'],
                  ['fatalities', 'scenario.deaths'],
                ] as const
              ).map(([k, label], i) => (
                <React.Fragment key={k}>
                  {i > 0 && <span aria-hidden> · </span>}
                  <span className="font-medium text-foreground">{formatCompact(s.input[k], lang)}</span> {t(label)}
                </React.Fragment>
              ))}
            </span>
          </span>
          <span id={`${ids(s.id)}-sev`} className="col-start-2 flex items-center gap-3 @2xl:col-start-3 @2xl:flex-col @2xl:items-end @2xl:gap-1.5 @2xl:pt-0.5">
            <span className="text-sm text-muted-foreground">
              {t('scenario.severity')} <b className="num text-lg font-semibold text-foreground">{formatScore(r.severity)}</b>
            </span>
            <SeverityChip score={r.severity} size="sm" />
          </span>
        </RadioGroup.Item>
      ))}
      <RadioGroup.Item value="custom" className={rowCls} aria-labelledby={`${ids('custom')}-name`} aria-describedby={`${ids('custom')}-desc`}>
        <RadioMark className="mt-1" />
        <span className="min-w-0">
          <span id={`${ids('custom')}-name`} className="block text-base font-semibold">
            {t('scenario.custom.name')}
          </span>
          <span id={`${ids('custom')}-desc`} className="mt-1 block max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t('scenario.custom.blurb')}
          </span>
        </span>
      </RadioGroup.Item>
    </RadioGroup.Root>
  );
}
