import { ArrowDown, ArrowUp, Download, Search } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input, Segmented, Select, SelectItem, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';
import { DIMENSION_KEYS, type DimensionKey } from '@/engine/risk/hierarchy';
import { AUTHORITIES } from '@/engine/risk/sources';
import { cn, downloadText } from '@/lib/utils';
import {
  ALL_SPECS,
  hasDenominator,
  isDecrease,
  isUsed,
  keyedLevel,
  REGISTER_ROWS,
  registerCsv,
  RESOLUTIONS,
  specDimension,
  workbookCsv,
  type RegisterRow,
  type Resolution,
} from '../data';
import { DocSection, ResolutionBadge } from '../ui';

type DimFilter = 'all' | DimensionKey;
const includes = (hay: Array<string | null | undefined>, q: string) => !q || hay.some((h) => h && h.toLowerCase().includes(q));

function Empty() {
  const { t } = useTranslation('methodology');
  return <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">{t('sources.empty')}</div>;
}

function useDimOptions() {
  const { t } = useTranslation(['methodology', 'common']);
  return [
    { value: 'all' as DimFilter, label: t('methodology:sources.all') },
    ...DIMENSION_KEYS.map((d) => ({ value: d as DimFilter, label: t(`common:dimensions.${d}Short`) })),
  ];
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
        return includes(
          [label(r), r.en, catLabel(r), lead.label, lead.full, r.source.dataset, r.source.method, ...(r.source.also ?? []).flatMap((a) => [AUTHORITIES[a].label, AUTHORITIES[a].full])],
          q,
        );
      }),
    [dim, res, q, label, catLabel],
  );

  return (
    <div>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative w-full xl:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('methodology:sources.search')} aria-label={t('methodology:sources.search')} className="pl-9" type="search" />
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
        <div className="flex items-center gap-3 xl:ml-auto">
          <span className="num text-xs text-muted-foreground" aria-live="polite">
            {t('methodology:sources.count', { shown: rows.length, total: REGISTER_ROWS.length })}
          </span>
          <Button variant="outline" size="sm" onClick={() => downloadText('inform-tanzania-indicator-register.csv', registerCsv(rows), 'text/csv;charset=utf-8')}>
            <Download /> {t('methodology:sources.download')}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* Cards (small screens) */}
            <ul className="grid gap-3 md:hidden">
              {rows.map((r) => {
                const lead = AUTHORITIES[r.source.by];
                return (
                  <li key={r.ref} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{label(r)}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {t(`common:dimensions.${r.dim}Short`)} · {catLabel(r)}
                        </div>
                      </div>
                      <ResolutionBadge value={r.source.resolution} />
                    </div>
                    <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
                      <dt className="text-muted-foreground">{t('methodology:sources.col.authority')}</dt>
                      <dd>
                        <span className="font-semibold">{lead.label}</span> · {lead.full}
                      </dd>
                      {r.source.also && r.source.also.length > 0 && (
                        <>
                          <dt className="text-muted-foreground">{t('methodology:sources.col.partners')}</dt>
                          <dd>{r.source.also.map((a) => AUTHORITIES[a].label).join(', ')}</dd>
                        </>
                      )}
                      <dt className="text-muted-foreground">{t('methodology:sources.col.dataset')}</dt>
                      <dd>{r.source.dataset}</dd>
                      <dt className="text-muted-foreground">{t('methodology:sources.col.method')}</dt>
                      <dd>{r.source.method}</dd>
                    </dl>
                  </li>
                );
              })}
            </ul>

            {/* Table (md and up) */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] md:block">
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <caption className="sr-only">{t('methodology:sources.captionGroups')}</caption>
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {t('methodology:sources.col.indicator')}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {t('methodology:sources.col.authority')}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {t('methodology:sources.col.dataset')}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {t('methodology:sources.col.method')}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      {t('methodology:sources.col.resolution')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const lead = AUTHORITIES[r.source.by];
                    return (
                      <tr key={r.ref} className="border-b border-border align-top transition-colors last:border-b-0 hover:bg-muted/40">
                        <th scope="row" className="px-4 py-3 text-left font-normal">
                          <div className="font-semibold">{label(r)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {t(`common:dimensions.${r.dim}Short`)} · {catLabel(r)}
                          </div>
                        </th>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{lead.label}</div>
                          <div className="text-[11px] leading-snug text-muted-foreground">{lead.full}</div>
                          {r.source.also && r.source.also.length > 0 && (
                            <div className="mt-1 text-[11px] text-muted-foreground" title={r.source.also.map((a) => AUTHORITIES[a].full).join(' · ')}>
                              + {r.source.also.map((a) => AUTHORITIES[a].label).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="max-w-64 px-4 py-3 text-[13px]">{r.source.dataset}</td>
                        <td className="max-w-64 px-4 py-3 text-[13px] text-muted-foreground">{r.source.method}</td>
                        <td className="px-4 py-3">
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
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative w-full xl:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('methodology:sources.searchWorkbook')} aria-label={t('methodology:sources.searchWorkbook')} className="pl-9" type="search" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented value={dim} onValueChange={setDim} options={dimOptions} size="sm" className="max-w-full overflow-x-auto" aria-label={t('methodology:sources.dimension')} />
          <label htmlFor={switchId} className="flex items-center gap-2 text-xs font-medium">
            <Switch id={switchId} checked={usedOnly} onCheckedChange={setUsedOnly} />
            {t('methodology:sources.usedOnly')}
          </label>
        </div>
        <div className="flex items-center gap-3 xl:ml-auto">
          <span className="num text-xs text-muted-foreground" aria-live="polite">
            {t('methodology:sources.count', { shown: rows.length, total: ALL_SPECS.length })}
          </span>
          <Button variant="outline" size="sm" onClick={() => downloadText('inform-tanzania-workbook-indicators.csv', workbookCsv(rows), 'text/csv;charset=utf-8')}>
            <Download /> {t('methodology:sources.download')}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <Empty />
        ) : (
          <div className="max-h-[42rem] overflow-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <caption className="sr-only">{t('methodology:sources.captionWorkbook')}</caption>
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
                  {(['code', 'indicator', 'unit', 'processing', 'reference', 'direction', 'level', 'use'] as const).map((c) => (
                    <th key={c} scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      {t(`methodology:sources.col.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const lvl = keyedLevel(s);
                  const steps = [
                    hasDenominator(s) && `÷ ${s.denominator}`,
                    s.outlier === 'Yes' && t('methodology:chips.cap'),
                    s.transform === 'Logarithm' && t('methodology:chips.log'),
                  ].filter(Boolean) as string[];
                  return (
                    <tr key={s.id} className={cn('border-b border-border align-top last:border-b-0 hover:bg-muted/40', !isUsed(s) && 'text-muted-foreground')}>
                      <td className="px-3 py-2.5 font-mono text-[11px] whitespace-nowrap">{s.id}</td>
                      <th scope="row" className="px-3 py-2.5 text-left font-normal">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground">{s.component}</div>
                      </th>
                      <td className="px-3 py-2.5 text-xs">{s.unit ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        {steps.length ? (
                          <span className="flex flex-wrap gap-1">
                            {steps.map((x) => (
                              <span key={x} className="rounded-md bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
                                {x}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="num px-3 py-2.5 font-mono text-[11px] whitespace-nowrap">
                        {typeof s.resolved_min === 'number' && typeof s.resolved_max === 'number' ? `${+s.resolved_min.toFixed(3)} – ${+s.resolved_max.toFixed(3)}` : '—'}
                        {s.normalisation && <div className="font-sans text-[10px] text-muted-foreground">{s.normalisation === 'Custom' ? t('methodology:sources.fixed') : t('methodology:sources.dataRange')}</div>}
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
                      <td className="px-3 py-2.5 text-xs">{isUsed(s) ? <span className="font-semibold text-success">{t('common:labels.yes')}</span> : t('common:labels.no')}</td>
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
    <DocSection id="sources" number="09" eyebrow={t('sections.sources')} title={t('sources.title')} lead={t('sources.lead')}>
      <Tabs defaultValue="groups">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="groups">{t('sources.tabGroups', { n: REGISTER_ROWS.length })}</TabsTrigger>
          <TabsTrigger value="workbook">{t('sources.tabWorkbook', { n: ALL_SPECS.length })}</TabsTrigger>
        </TabsList>
        <TabsContent value="groups" className="mt-5">
          <GroupsRegister />
        </TabsContent>
        <TabsContent value="workbook" className="mt-5">
          <p className="mb-4 max-w-[72ch] text-sm leading-relaxed text-muted-foreground">{t('sources.workbookLead')}</p>
          <WorkbookRegister />
        </TabsContent>
      </Tabs>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('sources.note')}</p>
    </DocSection>
  );
}
