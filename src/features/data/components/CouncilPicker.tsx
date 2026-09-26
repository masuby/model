/**
 * Searchable council picker (grouped by region, accent-insensitive search on name, region or id) plus
 * the council context card and the "discard unsaved changes?" dialog shared by the entry tabs.
 */
import { Command } from 'cmdk';
import { ArrowUpRight, Check, ChevronsUpDown, MapPin, Search, Share2 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ClassBadge, ClassDot } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { dataCoverage } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { listNames, matchesQuery } from '../lib/format';
import { siblingsOf } from '../lib/targets';

export function CouncilPicker({ value, onChange, id, className }: { value: string | null; onChange: (id: string) => void; id?: string; className?: string }) {
  const { t } = useTranslation('data');
  const model = useModel();
  const [open, setOpen] = React.useState(false);
  const selected = value ? model.byId.get(value) : null;

  const groups = React.useMemo(() => {
    const m = new Map<string, Unit[]>();
    for (const c of model.councils) {
      if (!m.has(c.region)) m.set(c.region, []);
      m.get(c.region)!.push(c);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([region, list]) => [region, [...list].sort((a, b) => a.name.localeCompare(b.name))] as const);
  }, [model]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={selected ? t('picker.selected', { name: selected.name, region: selected.region }) : t('picker.placeholder')}
          className={cn(
            'flex h-14 w-full items-center gap-3 rounded-xl border border-input bg-card px-3.5 text-left shadow-xs transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring',
            className,
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="size-4" aria-hidden />
          </span>
          {selected ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{selected.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{selected.region}</span>
            </span>
          ) : (
            <span className="flex-1 text-sm text-muted-foreground">{t('picker.placeholder')}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(calc(100vw-2rem),var(--radix-popover-trigger-width))] min-w-72 p-0" align="start">
        <Command
          label={t('picker.label')}
          loop
          filter={(v, search) => (matchesQuery(search, v) ? 1 : 0)}
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <Command.Input autoFocus placeholder={t('picker.search')} className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <Command.List className="max-h-[min(22rem,55dvh)] overflow-y-auto p-1">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">{t('picker.empty')}</Command.Empty>
            {groups.map(([region, list]) => (
              <Command.Group key={region} heading={region}>
                {list.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={`${c.name} ${c.region} ${c.id}`}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm data-[selected=true]:bg-muted"
                  >
                    <ClassDot value={c.risk} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="num text-xs text-muted-foreground">{formatScore(c.risk)}</span>
                    {c.id === value && <Check className="size-4 text-primary" aria-hidden />}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Council selector with context: risk class, source unit and the councils that share it. */
export function CouncilContextCard({
  idPrefix,
  council,
  onChange,
  title,
  description,
}: {
  idPrefix: string;
  council: Unit | null;
  onChange: (id: string) => void;
  title: string;
  description: string;
}) {
  const { t } = useTranslation('data');
  const model = useModel();
  const siblings = React.useMemo(() => (council ? siblingsOf(model, council) : []), [model, council]);
  return (
    <Card className="p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <label htmlFor={`${idPrefix}-council`} className="text-sm font-semibold">
            {title}
          </label>
          <p className="mt-0.5 mb-3 text-sm text-muted-foreground">{description}</p>
          <CouncilPicker id={`${idPrefix}-council`} value={council?.id ?? null} onChange={onChange} />
        </div>
        {council && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-muted/40 p-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{t('context.risk')}</dt>
              <dd className="mt-1">
                <ClassBadge value={council.risk} showScore />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('context.coverage')}</dt>
              <dd className="num mt-1 font-semibold">{dataCoverage(council)}%</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">{t('context.source')}</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="font-semibold">{council.sourceName ?? council.name}</span>
                {siblings.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Share2 className="size-3" aria-hidden />
                    {t('context.sharedWith', { names: listNames(siblings.map((s) => s.name), 3, (n) => t('context.andMore', { count: n })) })}
                  </span>
                )}
              </dd>
            </div>
            <div className="col-span-2">
              <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                <Link to={`/area/${council.id}`}>
                  {t('context.viewProfile')} <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </dl>
        )}
      </div>
    </Card>
  );
}

/** Confirm discarding unsaved draft values before switching council. */
export function DiscardDialog({ open, count, onCancel, onConfirm }: { open: boolean; count: number; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation('data');
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent title={t('discard.title')} description={t('discard.lead', { count })}>
        <div className="flex justify-end gap-2 px-5 py-4">
          <Button variant="outline" onClick={onCancel}>
            {t('discard.keep')}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {t('discard.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
