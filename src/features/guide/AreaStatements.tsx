/**
 * The area's statements (statements.ts) as sentences in the reader's language: the explorer's risk
 * communication panel and the risk card show the same ones. Names come from the indicator and guide
 * texts, numbers from the model; no warning level is named.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { hazardItemName, isCoastal } from './crosswalk';
import { useAreaGuide } from './data';
import { areaStatements, type AreaStatement, type GroupScore } from './statements';

/** "a, b and c" in English, "a, b na c" in Kiswahili. */
export function joinList(items: readonly string[], and: string): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

/** A name inside a sentence: its first letter in lower case unless it is an acronym. */
const inSentence = (s: string) => (/^[A-Z]{2,}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

export function statementText(t: TFunction, s: AreaStatement, unit: Unit, lang: string): string {
  const and = t('guide:statements.and');
  const cls = (k: string | null) => (k ? t(`common:classes.${k}`).toLowerCase() : '');
  const group = (g: GroupScore) => t('guide:statements.item', { name: inSentence(t(`indicators:${g.key}`)), score: formatScore(g.score) });
  switch (s.kind) {
    case 'overall':
      if (s.level === 'national') return t('guide:statements.overall.national', { cls: cls(s.cls), score: formatScore(s.score) });
      return t(`guide:statements.overall.${s.level}`, { name: unit.name, cls: cls(s.cls), score: formatScore(s.score), rank: s.rank, of: s.of, regionRank: s.regionRank, regionOf: s.regionOf, region: unit.region });
    case 'driver': {
      const dim = t(`common:dimensions.${s.dim}`);
      return s.national == null
        ? t('guide:statements.driverNational', { dim, score: formatScore(s.score) })
        : t('guide:statements.driver', { dim, score: formatScore(s.score), national: formatScore(s.national) });
    }
    case 'hazards': {
      const list = joinList(s.items.map((h) => t('guide:statements.item', { name: inSentence(hazardItemName(t, h, isCoastal(unit))), score: formatScore(h.score) })), and);
      return t('guide:statements.hazards', { count: s.items.length, list });
    }
    case 'hazardsLow':
      return s.top
        ? t('guide:statements.hazardsLow', { item: t('guide:statements.item', { name: inSentence(hazardItemName(t, s.top, isCoastal(unit))), score: formatScore(s.top.score) }) })
        : t('guide:statements.hazardsNone');
    case 'human':
      return t('guide:statements.human', { count: s.items.length, list: joinList(s.items.map(group), and) });
    case 'vulnerability':
      return s.groups.length
        ? t('guide:statements.vulnerabilityGroups', { cls: cls(s.cls), score: formatScore(s.score), list: joinList(s.groups.map(group), and) })
        : t('guide:statements.vulnerability', { cls: cls(s.cls), score: formatScore(s.score) });
    case 'coping':
      return s.groups.length
        ? t('guide:statements.copingGroups', { cls: cls(s.cls), score: formatScore(s.score), list: joinList(s.groups.map(group), and) })
        : t('guide:statements.coping', { cls: cls(s.cls), score: formatScore(s.score) });
    case 'people':
      return s.density != null
        ? t('guide:statements.people', { population: formatNumber(s.population, lang), density: formatNumber(Math.round(s.density), lang) })
        : t('guide:statements.peopleNoDensity', { population: formatNumber(s.population, lang) });
  }
}

/** The statements of an area as a list. */
export function AreaStatements({ model, unit, className }: { model: RiskModel; unit: Unit; className?: string }) {
  const { t, i18n } = useTranslation(['guide', 'common', 'indicators']);
  const guide = useAreaGuide(unit);
  const statements = React.useMemo(() => areaStatements(model, unit, guide.hazards), [model, unit, guide.hazards]);
  return (
    <div className={className}>
      <ul className="space-y-2 text-sm leading-relaxed">
        {statements.map((s, i) => (
          <li key={`${s.kind}-${i}`} className={cn('pl-3', s.kind === 'overall' && 'font-medium')} style={{ textIndent: '-0.75rem' }}>
            <span aria-hidden className="mr-1.5 text-muted-foreground">·</span>
            {statementText(t, s, unit, i18n.language)}
          </li>
        ))}
      </ul>
    </div>
  );
}
