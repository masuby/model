import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS, DIMENSION_TEXT } from '@/components/charts/theme';
import { Button } from '@/components/ui/button';
import { ALL_INDICATORS, DIMENSIONS, type DimensionDef, type IndicatorDef } from '@/engine/risk/hierarchy';
import { AUTHORITIES, sourceFor } from '@/engine/risk/sources';
import { cn } from '@/lib/utils';
import { hasDenominator, isDecrease, isUsed, KEYED_LEVELS, keyedLevel, leafRef, RESOLUTIONS, SPEC_STATS, WORKBOOK_BY_LEAF } from '../data';
import { LEVEL_CLASS } from '../tokens';
import { DocSection, P, ResolutionBadge, ResolutionDot, SubHeading } from '../ui';

const DIM_TAG = { hazard: 'H', vulnerability: 'V', coping: 'LCC' } as const;

/**
 * One indicator group: a disclosure (heading + button with aria-expanded) whose details mount only while
 * open. Memoised so toggling one group re-renders only that group.
 */
const Leaf = React.memo(function Leaf({ dim, ind, open, onToggle }: { dim: DimensionDef; ind: IndicatorDef; open: boolean; onToggle: (ref: string) => void }) {
  const { t } = useTranslation(['methodology', 'indicators']);
  const ref = `${dim.key}:${ind.key}`;
  const panelId = `structure-leaf-${dim.key}-${ind.key}`;
  const src = sourceFor(dim.key, ind.key);
  const specs = WORKBOOK_BY_LEAF.get(ref) ?? [];
  const used = specs.filter(isUsed).length;
  const lead = AUTHORITIES[src.by];

  return (
    <div className="border-t border-border first:border-t-0">
      <h4>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => onToggle(ref)}
          className="flex w-full items-center gap-2.5 py-2.5 text-left text-sm transition-colors duration-150 hover:text-primary"
        >
          <ResolutionDot value={src.resolution} />
          <span className={cn('min-w-0 flex-1', open ? 'font-medium' : 'font-normal')}>{t(`indicators:${ind.key}`)}</span>
          {specs.length > 0 && (
            <span className="num text-xs text-muted-foreground" aria-hidden>
              {used}/{specs.length}
            </span>
          )}
          <span className="sr-only">
            {t(`methodology:resolution.${src.resolution}`)}
            {specs.length > 0 && ` · ${t('methodology:structure.leaf.workbookCount', { used, total: specs.length })}`}
          </span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} aria-hidden />
        </button>
      </h4>
      {open && (
        <div id={panelId} className="pb-5 pl-[18px] text-sm">
          <p className="leading-relaxed text-muted-foreground">{t(`indicators:desc.${ind.key}`)}</p>
          <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-xs leading-relaxed">
            <dt className="text-muted-foreground">{t('methodology:structure.leaf.lead')}</dt>
            <dd>
              <span className="font-medium">{lead.label}</span>
              <span className="text-muted-foreground"> · {lead.full}</span>
            </dd>
            {src.also && src.also.length > 0 && (
              <>
                <dt className="text-muted-foreground">{t('methodology:structure.leaf.partners')}</dt>
                <dd>{src.also.map((a) => AUTHORITIES[a].full).join(' · ')}</dd>
              </>
            )}
            <dt className="text-muted-foreground">{t('methodology:structure.leaf.dataset')}</dt>
            <dd>{src.dataset}</dd>
            <dt className="text-muted-foreground">{t('methodology:structure.leaf.method')}</dt>
            <dd>{src.method}</dd>
            <dt className="text-muted-foreground">{t('methodology:structure.leaf.resolution')}</dt>
            <dd>
              <ResolutionBadge value={src.resolution} />
            </dd>
          </dl>

          <div className="mt-4 border-t border-border pt-3">
            <p className="flex items-baseline justify-between gap-2 text-xs font-medium">
              <span>{t('methodology:structure.leaf.workbook')}</span>
              {specs.length > 0 && <span className="num font-normal text-muted-foreground">{t('methodology:structure.leaf.workbookCount', { used, total: specs.length })}</span>}
            </p>
            {specs.length ? (
              <ul className="mt-2 space-y-2">
                {specs.map((s) => {
                  const lvl = keyedLevel(s);
                  const notes = [
                    lvl && t(`methodology:keyed.${lvl}`),
                    hasDenominator(s) && `÷ ${s.denominator}`,
                    s.outlier === 'Yes' && t('methodology:chips.cap'),
                    s.transform === 'Logarithm' && t('methodology:chips.log'),
                    isDecrease(s) && t('methodology:chips.inverted'),
                    !isUsed(s) && t('methodology:chips.notUsed'),
                  ].filter(Boolean) as string[];
                  return (
                    <li key={s.id} className={cn('text-xs leading-snug', !isUsed(s) && 'text-muted-foreground')}>
                      <span className="mr-2 font-mono text-[11px] text-muted-foreground">{s.id}</span>
                      {s.name}
                      {notes.length > 0 && <span className="block pt-0.5 text-[11px] text-muted-foreground">{notes.join(' · ')}</span>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t('methodology:structure.leaf.noWorkbook')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

function DimensionBlock({ dim, open, onToggle, className }: { dim: DimensionDef; open: ReadonlySet<string>; onToggle: (ref: string) => void; className?: string }) {
  const { t } = useTranslation(['methodology', 'common']);
  const groups = dim.categories.reduce((n, c) => n + c.indicators.length, 0);
  return (
    <div className={className}>
      <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: DIMENSION_TEXT[dim.key] }}>
        <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: DIMENSION_COLORS[dim.key] }} aria-hidden />
        {DIM_TAG[dim.key]}
      </p>
      <h3 className="mt-1 text-lg font-semibold">{t(`common:dimensions.${dim.key}`)}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t(`common:dimensions.${dim.key}Desc`)}</p>
      <p className="mt-2 text-xs text-muted-foreground">{t('methodology:structure.dimMeta', { categories: dim.categories.length, groups })}</p>

      {dim.categories.map((cat) => (
        <div key={cat.key} className="mt-6">
          <p className="flex items-baseline justify-between gap-2 border-b border-foreground/25 pb-1.5 text-[13px] font-semibold">
            <span>{t(`common:categories.${cat.key}`)}</span>
            <span className="num text-xs font-normal text-muted-foreground">{t('methodology:structure.groupCount', { count: cat.indicators.length })}</span>
          </p>
          <div>
            {cat.indicators.map((ind) => (
              <Leaf key={ind.key} dim={dim} ind={ind} open={open.has(`${dim.key}:${ind.key}`)} onToggle={onToggle} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StructureSection() {
  const { t } = useTranslation(['methodology', 'common']);
  const allRefs = React.useMemo(() => ALL_INDICATORS.map(leafRef), []);
  const [open, setOpen] = React.useState<ReadonlySet<string>>(() => new Set(['hazard:drought']));
  const toggle = React.useCallback(
    (ref: string) =>
      setOpen((prev) => {
        const next = new Set(prev);
        if (!next.delete(ref)) next.add(ref);
        return next;
      }),
    [],
  );
  const allOpen = open.size === allRefs.length;
  const [hazard, ...others] = DIMENSIONS;

  return (
    <DocSection id="structure" label={t('sections.structure')} title={t('structure.title')} lead={t('structure.lead')}>
      <div className="max-w-3xl">
        <SubHeading>{t('structure.levels.title', { used: SPEC_STATS.used })}</SubHeading>
        <div className="mt-4 flex h-2.5 gap-px overflow-hidden" role="img" aria-label={KEYED_LEVELS.map((l) => `${t(`keyed.${l}`)} ${SPEC_STATS.byLevel[l]}`).join(', ')}>
          {KEYED_LEVELS.map((l) => (
            <div key={l} className={LEVEL_CLASS[l]} style={{ width: `${(SPEC_STATS.byLevel[l] / SPEC_STATS.used) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
          {KEYED_LEVELS.map((l) => (
            <li key={l} className="flex items-center gap-2">
              <span className={cn('size-2.5 rounded-[2px]', LEVEL_CLASS[l])} aria-hidden />
              <span className="text-muted-foreground">{t(`keyed.${l}`)}</span>
              <span className="num font-semibold">{SPEC_STATS.byLevel[l]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{t('structure.levels.note', { used: SPEC_STATS.used, total: SPEC_STATS.total })}</p>
      </div>

      <div className="mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xl">
            {t('common:informRisk')} <span className="text-muted-foreground">=</span> ∛(<i>H</i> × <i>V</i> × <i>LCC</i>)
          </p>
          <P className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('structure.treeHint')}</P>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-xs text-muted-foreground">{t('structure.legend')}</span>
            {RESOLUTIONS.map((r) => (
              <ResolutionBadge key={r} value={r} />
            ))}
          </div>
        </div>
        {/* The label carries the state, so no aria-pressed (which would read "Collapse all, pressed"). */}
        <Button variant="outline" size="sm" onClick={() => setOpen(new Set(allOpen ? [] : allRefs))} className="no-print self-start sm:self-auto">
          <ChevronsUpDown /> {allOpen ? t('structure.collapseAll') : t('structure.expandAll')}
        </Button>
      </div>

      {/* Two balanced columns on wide screens: Hazard (17 groups) | Vulnerability and Coping (15). */}
      <div className="mt-8 grid items-start gap-10 xl:grid-cols-2 xl:gap-0 xl:divide-x xl:divide-border xl:border-t xl:border-border">
        <DimensionBlock dim={hazard} open={open} onToggle={toggle} className="border-t border-border pt-6 xl:border-t-0 xl:pr-8" />
        <div className="grid gap-10 xl:gap-0 xl:pl-8">
          {others.map((d, i) => (
            <DimensionBlock key={d.key} dim={d} open={open} onToggle={toggle} className={cn('border-t border-border pt-6', i === 0 && 'xl:border-t-0', i > 0 && 'xl:mt-12')} />
          ))}
        </div>
      </div>
    </DocSection>
  );
}
