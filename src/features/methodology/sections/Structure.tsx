import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Accordion } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ALL_INDICATORS, DIMENSIONS, type DimensionDef, type IndicatorDef } from '@/engine/risk/hierarchy';
import { AUTHORITIES, sourceFor } from '@/engine/risk/sources';
import { cn } from '@/lib/utils';
import { hasDenominator, isDecrease, isUsed, KEYED_LEVELS, keyedLevel, leafRef, RESOLUTIONS, SPEC_STATS, WORKBOOK_BY_LEAF } from '../data';
import { fadeIn, RESOLUTION_STYLE } from '../tokens';
import { DocSection, P, ResolutionBadge } from '../ui';

const DIM_TAG = { hazard: 'H', vulnerability: 'V', coping: 'LCC' } as const;
const LEVEL_STYLE = { adm2: 'bg-sky-500', adm1: 'bg-violet-500', national: 'bg-slate-400' } as const;

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <span className={cn('rounded-md px-1.5 py-px text-[10px] font-semibold whitespace-nowrap', muted ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>{children}</span>;
}

function Leaf({ dim, ind }: { dim: DimensionDef; ind: IndicatorDef }) {
  const { t } = useTranslation(['methodology', 'indicators']);
  const ref = `${dim.key}:${ind.key}`;
  const src = sourceFor(dim.key, ind.key);
  const specs = WORKBOOK_BY_LEAF.get(ref) ?? [];
  const used = specs.filter(isUsed).length;
  const lead = AUTHORITIES[src.by];

  return (
    <Accordion.Item value={ref} className="border-t border-border/60 first:border-t-0">
      <Accordion.Header asChild>
        <h4>
          <Accordion.Trigger className="group flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 data-[state=open]:bg-primary/[0.05]">
            <span className={cn('size-2 shrink-0 rounded-full', RESOLUTION_STYLE[src.resolution].dot)} aria-hidden />
            <span className="min-w-0 flex-1 font-medium">{t(`indicators:${ind.key}`)}</span>
            {specs.length > 0 && (
              <span className="num text-[11px] text-muted-foreground" aria-hidden>
                {used}/{specs.length}
              </span>
            )}
            <span className="sr-only">
              {t(`methodology:resolution.${src.resolution}`)}
              {specs.length > 0 && ` · ${t('methodology:structure.leaf.workbookCount', { used, total: specs.length })}`}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
          </Accordion.Trigger>
        </h4>
      </Accordion.Header>
      <Accordion.Content className="px-5 pt-1 pb-5 text-sm data-[state=open]:animate-fade-up">
        <p className="leading-relaxed text-muted-foreground">{t(`indicators:desc.${ind.key}`)}</p>
        <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs">
          <dt className="text-muted-foreground">{t('methodology:structure.leaf.lead')}</dt>
          <dd>
            <span className="font-semibold">{lead.label}</span>
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
        <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <span>{t('methodology:structure.leaf.workbook')}</span>
            {specs.length > 0 && <span className="num tracking-normal normal-case">{t('methodology:structure.leaf.workbookCount', { used, total: specs.length })}</span>}
          </div>
          {specs.length ? (
            <ul className="mt-2 space-y-1.5">
              {specs.map((s) => (
                <li key={s.id} className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs', !isUsed(s) && 'opacity-60')}>
                  <code className="font-mono text-[10.5px] text-muted-foreground">{s.id}</code>
                  <span className="min-w-0 flex-1">{s.name}</span>
                  <span className="flex flex-wrap gap-1">
                    {keyedLevel(s) && <Chip muted>{t(`methodology:keyed.${keyedLevel(s)}`)}</Chip>}
                    {hasDenominator(s) && <Chip>÷ {s.denominator}</Chip>}
                    {s.outlier === 'Yes' && <Chip>{t('methodology:chips.cap')}</Chip>}
                    {s.transform === 'Logarithm' && <Chip>{t('methodology:chips.log')}</Chip>}
                    {isDecrease(s) && <Chip>{t('methodology:chips.inverted')}</Chip>}
                    {!isUsed(s) && <Chip muted>{t('methodology:chips.notUsed')}</Chip>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t('methodology:structure.leaf.noWorkbook')}</p>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

function DimensionColumn({ dim }: { dim: DimensionDef }) {
  const { t } = useTranslation(['methodology', 'common']);
  const groups = dim.categories.reduce((n, c) => n + c.indicators.length, 0);
  const color = DIMENSION_COLORS[dim.key];
  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ background: color }} aria-hidden />
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-xs font-extrabold tracking-wider" style={{ color }}>
            {DIM_TAG[dim.key]}
          </span>
          <span className="text-[11px] text-muted-foreground">{t('methodology:structure.dimMeta', { categories: dim.categories.length, groups })}</span>
        </div>
        <h3 className="mt-1 text-lg font-bold">{t(`common:dimensions.${dim.key}`)}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`common:dimensions.${dim.key}Desc`)}</p>
      </div>
      {dim.categories.map((cat) => (
        <div key={cat.key} className="border-t border-border">
          <div className="flex items-center justify-between bg-muted/50 px-5 py-2 text-xs font-semibold">
            <span>{t(`common:categories.${cat.key}`)}</span>
            <span className="num font-normal text-muted-foreground">{t('methodology:structure.groupCount', { count: cat.indicators.length })}</span>
          </div>
          <div>
            {cat.indicators.map((ind) => (
              <Leaf key={ind.key} dim={dim} ind={ind} />
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}

export function StructureSection() {
  const { t } = useTranslation(['methodology', 'common']);
  const allRefs = React.useMemo(() => ALL_INDICATORS.map(leafRef), []);
  const [open, setOpen] = React.useState<string[]>(['hazard:drought']);
  const allOpen = open.length === allRefs.length;
  const categories = DIMENSIONS.reduce((n, d) => n + d.categories.length, 0);

  const tiles = [
    { label: t('structure.tiles.dimensions'), value: DIMENSIONS.length },
    { label: t('structure.tiles.categories'), value: categories },
    { label: t('structure.tiles.groups'), value: ALL_INDICATORS.length },
    { label: t('structure.tiles.workbook'), value: `${SPEC_STATS.used}/${SPEC_STATS.total}`, sub: t('structure.tiles.workbookSub', { used: SPEC_STATS.used, total: SPEC_STATS.total }) },
  ];

  return (
    <DocSection id="structure" number="02" eyebrow={t('sections.structure')} title={t('structure.title')} lead={t('structure.lead')}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((x) => (
          <div key={x.label} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="text-xs font-medium text-muted-foreground">{x.label}</div>
            <div className="num mt-1 font-display text-2xl font-extrabold tracking-tight">{x.value}</div>
            {x.sub && <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{x.sub}</div>}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
        <div className="text-sm font-semibold">{t('structure.levels.title', { used: SPEC_STATS.used })}</div>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={KEYED_LEVELS.map((l) => `${t(`keyed.${l}`)} ${SPEC_STATS.byLevel[l]}`).join(', ')}>
          {KEYED_LEVELS.map((l) => (
            <div key={l} className={LEVEL_STYLE[l]} style={{ width: `${(SPEC_STATS.byLevel[l] / SPEC_STATS.used) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
          {KEYED_LEVELS.map((l) => (
            <li key={l} className="flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-[3px]', LEVEL_STYLE[l])} aria-hidden />
              <span>{t(`keyed.${l}`)}</span>
              <span className="num font-semibold">{SPEC_STATS.byLevel[l]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('structure.levels.note')}</p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <P className="text-sm sm:text-sm">{t('structure.treeHint')}</P>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted-foreground">{t('structure.legend')}</span>
            {RESOLUTIONS.map((r) => (
              <ResolutionBadge key={r} value={r} />
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(allOpen ? [] : allRefs)} aria-pressed={allOpen}>
          <ChevronsUpDown /> {allOpen ? t('structure.collapseAll') : t('structure.expandAll')}
        </Button>
      </div>

      {/* Root node + connectors */}
      <motion.div {...fadeIn} className="mt-6 flex justify-center">
        <div className="inline-flex flex-col items-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/12 to-primary/[0.03] px-6 py-3 text-center shadow-[var(--shadow-soft)]">
          <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{t('common:informRisk')}</span>
          <span className="mt-0.5 font-serif text-lg">
            ∛(<i>H</i> × <i>V</i> × <i>LCC</i>)
          </span>
        </div>
      </motion.div>
      <div className="relative hidden h-10 xl:block" aria-hidden>
        <span className="absolute top-0 left-1/2 h-5 w-px bg-border" />
        <span className="absolute top-5 h-px bg-border" style={{ left: 'calc((100% - 2.5rem) / 6)', right: 'calc((100% - 2.5rem) / 6)' }} />
        {['calc((100% - 2.5rem) / 6)', '50%', 'calc(100% - (100% - 2.5rem) / 6)'].map((x) => (
          <span key={x} className="absolute top-5 h-5 w-px bg-border" style={{ left: x }} />
        ))}
      </div>

      <Accordion.Root type="multiple" value={open} onValueChange={setOpen} className="mt-4 grid items-start gap-5 xl:mt-0 xl:grid-cols-3">
        {DIMENSIONS.map((d) => (
          <DimensionColumn key={d.key} dim={d} />
        ))}
      </Accordion.Root>
    </DocSection>
  );
}
