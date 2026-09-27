import { ArrowDown, ArrowUp, ChevronDown, Download, Search } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input, Segmented, Select, SelectItem, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';
import { DIMENSION_KEYS, type DimensionKey } from '@/engine/risk/hierarchy';
import { AUTHORITIES } from '@/engine/risk/sources';
import { cn, downloadText } from '@/lib/utils';
import { ALL_SPECS, hasDenominator, isDecrease, isUsed, keyedLevel, REGISTER_ROWS, registerCsv, RESOLUTIONS, specDimension, workbookCsv, type RegisterRow, type Resolution } from '../data';
import { DocSection, ResolutionBadge } from '../ui';

type DimFilter = 'all' | DimensionKey;
const includes = (hay: Array<string | null | undefined>, q: string) => !q || hay.some((h) => h && h.toLowerCase().includes(q));

function Empty() {
  const { t } = useTranslation('methodology');
  return <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">{t('sources.empty')}</p>;
}

/** The line between the filters and the table: how many rows show, and the export of exactly those. */
function ResultBar({ shown, total, onDownload }: { shown: number; total: number; onDownload: () => void }) {
  const { t } = useTranslation('methodology');
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className="num text-[13px] text-muted-foreground" aria-live="polite">
        {t('sources.count', { shown, total })}
      </span>
      <Button variant="outline" size="sm" onClick={onDownload}>
        <Download /> {t('sources.download')}
      </Button>
    </div>
  );
}

/**
 * One register row on a phone: a disclosure showing the indicator, its place in the hierarchy and its
 * resolution; the authority, dataset and method open beneath it.
 */
function RegisterItem({ row, label, category }: { row: RegisterRow; label: string; category: string }) {
  const { t } = useTranslation(['methodology', 'common']);
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const lead = AUTHORITIES[row.source.by];
  return (
    <li>
      <button type="button" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 py-3.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t(`common:dimensions.${row.dim}Short`)} · {category}
            </span>
            <ResolutionBadge value={row.source.resolution} />
          </span>
        </span>
        <ChevronDown className={cn('mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <dl id={panelId} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 pb-4 text-xs leading-relaxed">
          <dt className="text-muted-foreground">{t('methodology:sources.col.authority')}</dt>
          <dd>
            <span className="font-medium">{lead.label}</span> · {lead.full}
          </dd>
          {row.source.also && row.source.also.length > 0 && (
            <>
              <dt className="text-muted-foreground">{t('methodology:sources.col.partners')}</dt>
              <dd>{row.source.also.map((a) => AUTHORITIES[a].label).join(', ')}</dd>
            </>
          )}
          <dt className="text-muted-foreground">{t('methodology:sources.col.dataset')}</dt>
          <dd>{row.source.dataset}</dd>
          <dt className="text-muted-foreground">{t('methodology:sources.col.method')}</dt>
          <dd>{row.source.method}</dd>
        </dl>
      )}
    </li>
  );
}

function useDimOptions() {
  const { t } = useTranslation(['methodology', 'common']);
  return [{ value: 'all' as DimFilter, label: t('methodology:sources.all') }, ...DIMENSION_KEYS.map((d) => ({ value: d as DimFilter, label: t(`common:dimensions.${d}Short`) }))];
}

function GroupsRegister() {
  const { t } = useTranslation(['methodology', 'common', 'indicators']);
  const [query, setQuery] = React.useState('');
  const [dim, setDim] = React.useState<DimFilter>('all');
  const [res, setRes] = React.useState<'all' | Resolution>('all');
  const q = React.useDeferredValue(query.trim().toLowerCase());
  const dimOptions = useDimOptions();

  const label = React.useCallback((r: RegisterRow) => t(`indicators:${r.key}`), [t]);
  const catLabel = React.useCallback((r: RegisterRow) => (r.category ? t(`common:categories.${r.category}`) : t('methodology:sources.exposure')), [t]);

  const rows = React.useMemo(
    () =>
      REGISTER_ROWS.filter((r) => {
        if (dim !== 'all' && r.dim !== dim) return false;
        if (res !== 'all' && r.source.resolution !== res) return false;
        const lead = AUTHORITIES[r.source.by];
        return includes([label(r), r.en, catLabel(r), lead.label, lead.full, r.source.dataset, r.source.method, ...(r.source.also ?? []).flatMap((a) => [AUTHORITIES[a].label, AUTHORITIES[a].full])], q);
      }),
    [dim, res, q, label, catLabel],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('methodology:sources.search')} aria-label={t('methodology:sources.search')} className="h-9 pl-9" type="search" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={dim} onValueChange={setDim} options={dimOptions} size="sm" className="max-w-full overflow-x-auto" aria-label={t('methodology:sources.dimension')} />
          <Select value={res} onValueChange={(v) => setRes(v as 'all' | Resolution)} aria-label={t('methodology:sources.resolution')} className="h-9 w-auto min-w-44">
            <SelectItem value="all">{t('methodology:sources.allResolutions')}</SelectItem>
            {RESOLUTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {t(`methodology:resolution.${r}`)}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <ResultBar shown={rows.length} total={REGISTER_ROWS.length} onDownload={() => downloadText('inform-tanzania-indicator-register.csv', registerCsv(rows), 'text/csv;charset=utf-8')} />

      <div className="mt-3">
        {rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* Small screens: one ruled disclosure per row, details on demand. */}
            <ul className="divide-y divide-border border-y border-border md:hidden">
              {rows.map((r) => (
                <RegisterItem key={r.ref} row={r} label={label(r)} category={catLabel(r)} />
              ))}
            </ul>

            {/* Table (md and up) */}
            <div
              role="region"
              aria-label={t('methodology:sources.captionGroups')}
              tabIndex={0}
              className="hidden max-h-[44rem] overflow-auto border-y border-border outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring md:block print:max-h-none print:overflow-visible"
            >
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <caption className="sr-only">{t('methodology:sources.captionGroups')}</caption>
                <thead className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_var(--border)]">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th scope="col" className="pr-4 py-2.5 font-medium">
                      {t('methodology:sources.col.indicator')}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      {t('methodology:sources.col.authority')}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      {t('methodology:sources.col.dataset')}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      {t('methodology:sources.col.method')}
                    </th>
                    <th scope="col" className="pl-4 py-2.5 font-medium">
                      {t('methodology:sources.col.resolution')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => {
                    const lead = AUTHORITIES[r.source.by];
                    return (
                      <tr key={r.ref} className="align-top">
                        <th scope="row" className="py-3.5 pr-4 text-left font-normal">
                          <div className="font-medium">{label(r)}</div>
                          <div className="text-xs text-muted-foreground">
                            {t(`common:dimensions.${r.dim}Short`)} · {catLabel(r)}
                          </div>
                        </th>
                        <td className="px-4 py-3.5">
                          <div className="font-medium">{lead.label}</div>
                          <div className="text-xs leading-snug text-muted-foreground">{lead.full}</div>
                          {r.source.also && r.source.also.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground" title={r.source.also.map((a) => AUTHORITIES[a].full).join(' · ')}>
                              + {r.source.also.map((a) => AUTHORITIES[a].label).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="max-w-64 px-4 py-3.5 text-[13px] leading-relaxed">{r.source.dataset}</td>
                        <td className="max-w-64 px-4 py-3.5 text-[13px] leading-relaxed text-muted-foreground">{r.source.method}</td>
                        <td className="py-3.5 pl-4">
                          <ResolutionBadge value={r.source.resolution} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WorkbookRegister() {
  const { t } = useTranslation(['methodology', 'common']);
  const [query, setQuery] = React.useState('');
  const [dim, setDim] = React.useState<DimFilter>('all');
  const [usedOnly, setUsedOnly] = React.useState(false);
  const q = React.useDeferredValue(query.trim().toLowerCase());
  const dimOptions = useDimOptions();
  const switchId = React.useId();

  const rows = React.useMemo(
    () =>
      ALL_SPECS.filter((s) => {
        if (usedOnly && !isUsed(s)) return false;
        if (dim !== 'all' && specDimension(s) !== dim) return false;
        return includes([s.id, s.name, s.component, s.category, s.unit], q);
      }),
    [dim, usedOnly, q],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('methodology:sources.searchWorkbook')} aria-label={t('methodology:sources.searchWorkbook')} className="h-9 pl-9" type="search" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented value={dim} onValueChange={setDim} options={dimOptions} size="sm" className="max-w-full overflow-x-auto" aria-label={t('methodology:sources.dimension')} />
          <label htmlFor={switchId} className="flex items-center gap-2 text-xs font-medium">
            <Switch id={switchId} checked={usedOnly} onCheckedChange={setUsedOnly} />
            {t('methodology:sources.usedOnly')}
          </label>
        </div>
      </div>
      <ResultBar shown={rows.length} total={ALL_SPECS.length} onDownload={() => downloadText('inform-tanzania-workbook-indicators.csv', workbookCsv(rows), 'text/csv;charset=utf-8')} />

      <div className="mt-3">
        {rows.length === 0 ? (
          <Empty />
        ) : (
          <div
            role="region"
            aria-label={t('methodology:sources.captionWorkbook')}
            tabIndex={0}
            className="max-h-[42rem] overflow-auto border-y border-border outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring print:max-h-none print:overflow-visible"
          >
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <caption className="sr-only">{t('methodology:sources.captionWorkbook')}</caption>
              <thead className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_var(--border)]">
                <tr className="text-left text-xs text-muted-foreground">
                  {(['code', 'indicator', 'unit', 'processing', 'reference', 'direction', 'level', 'use'] as const).map((c) => (
                    <th key={c} scope="col" className="px-3 py-2.5 font-medium whitespace-nowrap first:pl-0">
                      {t(`methodology:sources.col.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => {
                  const lvl = keyedLevel(s);
                  const steps = [hasDenominator(s) && `÷ ${s.denominator}`, s.outlier === 'Yes' && t('methodology:chips.cap'), s.transform === 'Logarithm' && t('methodology:chips.log')].filter(Boolean) as string[];
                  return (
                    <tr key={s.id} className={cn('align-top', !isUsed(s) && 'text-muted-foreground')}>
                      <td className="py-2.5 pr-3 font-mono text-[11px] whitespace-nowrap">{s.id}</td>
                      <th scope="row" className="px-3 py-2.5 text-left font-normal">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground">{s.component}</div>
                      </th>
                      <td className="px-3 py-2.5 text-xs">{s.unit ?? '—'}</td>
                      <td className="px-3 py-2.5">{steps.length ? <span className="text-xs">{steps.join(' · ')}</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="num px-3 py-2.5 font-mono text-[11px] whitespace-nowrap">
                        {typeof s.resolved_min === 'number' && typeof s.resolved_max === 'number' ? `${+s.resolved_min.toFixed(3)} – ${+s.resolved_max.toFixed(3)}` : '—'}
                        {s.normalisation && <div className="font-sans text-[11px] text-muted-foreground">{s.normalisation === 'Custom' ? t('methodology:sources.fixed') : t('methodology:sources.dataRange')}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        {s.sign ? (
                          <span className="inline-flex items-center gap-1">
                            {isDecrease(s) ? <ArrowDown className="size-3.5 text-success" aria-hidden /> : <ArrowUp className="size-3.5 text-danger" aria-hidden />}
                            {isDecrease(s) ? t('methodology:sources.decrease') : t('methodology:sources.increase')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{lvl ? t(`methodology:keyed.${lvl}`) : '—'}</td>
                      <td className="px-3 py-2.5 text-xs">{isUsed(s) ? <span className="font-medium text-success">{t('common:labels.yes')}</span> : t('common:labels.no')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function SourcesRegisterSection() {
  const { t } = useTranslation('methodology');
  return (
    <DocSection id="sources" label={t('sections.sources')} title={t('sources.title')} lead={t('sources.lead')}>
      <Tabs defaultValue="groups">
        <TabsList className="w-full">
          <TabsTrigger value="groups">{t('sources.tabGroups', { n: REGISTER_ROWS.length })}</TabsTrigger>
          <TabsTrigger value="workbook">{t('sources.tabWorkbook', { n: ALL_SPECS.length })}</TabsTrigger>
        </TabsList>
        <TabsContent value="groups" className="mt-6">
          <GroupsRegister />
        </TabsContent>
        <TabsContent value="workbook" className="mt-6">
          <p className="mb-5 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{t('sources.workbookLead')}</p>
          <WorkbookRegister />
        </TabsContent>
      </Tabs>
      <p className="mt-5 max-w-[72ch] text-[13px] leading-relaxed text-muted-foreground">{t('sources.note')}</p>
    </DocSection>
  );
}
