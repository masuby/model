/**
 * One measured value behind an indicator group, as the risk panel and the detailed risk card show it:
 * the dataset's name, the raw value with its unit and score, the source's short detail decoded, and its
 * origin, period and institution.
 */
import { useTranslation } from 'react-i18next';
import { formatRaw } from '@/components/risk/Provenance';
import { parseArrangementsDetail, parseCommitteeDetail } from '@/engine/risk/institutional';
import { isDecision, noteById } from '@/engine/risk/notes';
import { authorityLabel } from '@/engine/risk/sources';
import { ADVANCED_SPECS, ACTIVE_SPECS } from '@/engine/risk/standardise';
import { specKey, unitKey } from '@/features/data/lib/raw';
import { formatScore, NO_VALUE } from '@/lib/utils';
import type { EvidenceLine } from '../lib/riskPanel';

/** The text of a source's short detail code (see scripts/build-benchmark.py). */
export function useDetailText() {
  const { t, i18n } = useTranslation('explore');
  const lang = i18n.language;
  return (code: string): string => {
    const [kind, payload = ''] = code.split(/:(.*)/s);
    switch (kind) {
      case 'storms':
        return t('riskPanel.group.detail.storms', { list: payload });
      case 'segments': {
        const [retreating, all] = payload.split('/');
        return t('riskPanel.group.detail.segments', { retreating, all });
      }
      case 'police':
        return t('riskPanel.group.detail.police', { name: payload });
      case 'ipc': {
        const [district, phase] = payload.split('/');
        return t('riskPanel.group.detail.ipc', { district, phase });
      }
      case 'grid':
        return t('riskPanel.group.detail.grid');
      case 'nocell':
        return t('riskPanel.group.detail.nocell');
      case 'events':
        return t('riskPanel.group.detail.events', { count: Number(payload) });
      case 'quakes':
        return t('riskPanel.group.detail.quakes', { count: Number(payload) });
      case 'rain':
        return t('riskPanel.group.detail.rain', { mm: formatRaw(Number(payload), lang) });
      case 'crashes': {
        const [region, regionCrashes, crashes] = payload.split('/');
        const about = (n: number) => formatRaw(n >= 10 ? Math.round(n) : Math.round(n * 10) / 10, lang);
        return t('riskPanel.group.detail.crashes', { region, regionCrashes: about(Number(regionCrashes)), crashes: about(Number(crashes)) });
      }
      case 'drr': {
        const { met, not } = parseArrangementsDetail(code);
        const inList = met.map((m) => `${t(`riskPanel.group.detail.drrItems.${m.key}`)}${m.year ? ` (${m.year})` : ''}`).join(', ');
        const outList = not.map((k) => t(`riskPanel.group.detail.drrItems.${k}`)).join(', ');
        if (!inList) return `${t('riskPanel.group.detail.drrNone')}; ${t('riskPanel.group.detail.drrOut', { list: outList })}`;
        return outList ? `${t('riskPanel.group.detail.drrIn', { list: inList })}; ${t('riskPanel.group.detail.drrOut', { list: outList })}` : t('riskPanel.group.detail.drrIn', { list: inList });
      }
      case 'gov': {
        const { met, not } = parseCommitteeDetail(code);
        const name = (k: string) => t(`riskPanel.group.detail.drrItems.${k}`);
        const parts = [met.length && t('riskPanel.group.detail.govMet', { list: met.map(name).join(', ') }), not.length && t('riskPanel.group.detail.govNot', { list: not.map(name).join(', ') })].filter(Boolean);
        return parts.join('; ');
      }
      case 'sites': {
        const [all, fuel, industrial, mining, waste, health, nemc] = payload.split('/').map(Number);
        const parts = [
          [fuel, 'sitesFuel'],
          [industrial, 'sitesIndustrial'],
          [mining, 'sitesMining'],
          [waste, 'sitesWaste'],
          [health, 'sitesHealth'],
        ]
          .filter(([n]) => (n as number) > 0)
          .map(([n, k]) => t(`riskPanel.group.detail.${k}`, { count: n as number }));
        const text = `${t('riskPanel.group.detail.sites', { count: all })}: ${parts.join(', ')}`;
        return nemc > 0 ? `${text}; ${t('riskPanel.group.detail.sitesNemc', { count: nemc })}` : text;
      }
      default:
        return code;
    }
  };
}

export function EvidenceItem({ line, lang }: { line: EvidenceLine; lang: string }) {
  const { t } = useTranslation(['explore', 'data', 'common'], { useSuspense: false });
  const detailText = useDetailText();
  const spec = ACTIVE_SPECS[line.specId] ?? ADVANCED_SPECS[line.specId];
  const name = t(`data:specs.${specKey(line.specId)}`, { defaultValue: spec?.name ?? line.specId });
  const unitLabel = line.unit ? t(`data:units.${unitKey(line.unit)}`, { defaultValue: line.unit }) : '';
  // Origin, period and institution only: the dataset's description stays in the Data portal and the methodology.
  const meta = [t(`riskPanel.group.origin.${line.origin}`), line.period, line.institution && line.institution !== 'INFORM' ? authorityLabel(line.institution) : null].filter(Boolean).join(' · ');
  return (
    <li className="py-2.5">
      <p className="text-sm font-medium">{name}</p>
      {line.withheld ? (
        <p className="mt-0.5 text-sm text-warning">{t(isDecision(noteById(line.withheld)) ? 'riskPanel.group.withheldDecision' : 'riskPanel.group.withheld', { note: line.withheld })}</p>
      ) : (
        <p className="mt-0.5 text-sm">
          <span className="num font-semibold">{line.raw == null ? NO_VALUE : formatRaw(line.raw, lang)}</span>
          {line.raw != null && unitLabel ? ` ${unitLabel}` : ''}
          {line.score != null && <span className="text-muted-foreground"> · {t('riskPanel.group.scoreOf', { score: formatScore(line.score) })}</span>}
        </p>
      )}
      {line.detail && <p className="mt-0.5 text-sm">{detailText(line.detail)}</p>}
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{meta}</p>
    </li>
  );
}
