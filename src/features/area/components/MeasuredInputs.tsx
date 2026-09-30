/** The figures institutions sent behind a council's recomputed score, each with the level it was recorded at. */
import { useTranslation } from 'react-i18next';
import { formatRaw, LevelTag } from '@/components/risk/Provenance';
import { isNum } from '@/engine/risk/math';
import { authorityLabel } from '@/engine/risk/sources';
import { ADVANCED_SPECS, SPECS } from '@/engine/risk/standardise';
import type { EditStamp } from '@/engine/risk/types';
import { specKey, unitKey } from '@/features/data/lib/raw';

/** Each measured figure with its level; the other indicators of the group keep the baseline. */
export default function MeasuredInputs({ edit }: { edit: EditStamp }) {
  // Indicator and unit names live with the data portal's text; until it loads, the workbook's English names show.
  const { t, i18n } = useTranslation(['area', 'data', 'common'], { useSuspense: false });
  const inputs = edit.inputs ?? [];
  const measured = inputs.filter((i) => i.level !== 'baseline');
  const rest = inputs.length - measured.length;
  return (
    <div className="mt-2 border-l-2 border-primary/30 pl-2.5 text-[11px] leading-snug text-muted-foreground">
      <p className="font-medium text-foreground">{t('table.measured')}</p>
      <ul className="mt-1 space-y-1.5">
        {measured.map((i) => {
          const spec = SPECS[i.specId] ?? ADVANCED_SPECS[i.specId];
          const unit = spec?.unit?.trim() ? t(`data:units.${unitKey(spec.unit)}`, { defaultValue: spec.unit.trim() }) : '';
          return (
            <li key={i.specId}>
              <span className="text-foreground">{t(`data:specs.${specKey(i.specId)}`, { defaultValue: spec?.name ?? i.specId })}</span>{' '}
              <span className="num font-medium text-foreground">{isNum(i.raw) ? formatRaw(i.raw, i18n.language) : t('common:classes.noData')}</span>
              {isNum(i.raw) && unit ? ` ${unit}` : ''} <LevelTag level={i.level} />
              {(i.institution || i.dataset) && <span className="block">{[i.institution && authorityLabel(i.institution), i.dataset, i.period].filter(Boolean).join(' · ')}</span>}
            </li>
          );
        })}
        {rest > 0 && <li>{t('table.baselineRest', { count: rest })}</li>}
      </ul>
    </div>
  );
}
