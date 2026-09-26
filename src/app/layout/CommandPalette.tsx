import { Command } from 'cmdk';
import { BookOpen, Compass, Database, FileText, Gauge, Home, LineChart, MapPin, Search } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { ClassDot } from '@/components/risk/RiskBadge';
import { Kbd } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { formatScore } from '@/lib/utils';

const PAGES = [
  { to: '/', key: 'home', icon: Home },
  { to: '/explore', key: 'explore', icon: Compass },
  { to: '/insights', key: 'insights', icon: LineChart },
  { to: '/severity', key: 'severity', icon: Gauge },
  { to: '/learn', key: 'learn', icon: BookOpen },
  { to: '/methodology', key: 'methodology', icon: FileText },
  { to: '/data', key: 'data', icon: Database },
] as const;

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const model = useModel();
  const navigate = useNavigate();
  const [q, setQ] = React.useState('');
  const go = (to: string) => {
    onOpenChange(false);
    setQ('');
    navigate(to);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1500] bg-slate-950/40 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed top-[12vh] left-1/2 z-[1501] w-[min(calc(100vw-2rem),40rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-elevated shadow-2xl data-[state=open]:animate-fade-up">
          <DialogPrimitive.Title className="sr-only">{t('search.open')}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t('search.placeholder')}</DialogPrimitive.Description>
          <Command label={t('search.open')} loop className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-5 text-muted-foreground" />
              <Command.Input value={q} onValueChange={setQ} autoFocus placeholder={t('search.placeholder')} className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">{t('search.empty', { q })}</Command.Empty>
              <Command.Group heading={t('search.regions')}>
                {model.regions.map((r) => (
                  <Item key={r.id} value={`region ${r.name}`} onSelect={() => go(`/area/${r.id}`)} icon={<MapPin />} label={r.name} hint={t('levels.region')} score={r.risk} />
                ))}
              </Command.Group>
              <Command.Group heading={t('search.councils')}>
                {model.councils.map((c) => (
                  <Item key={c.id} value={`council ${c.name} ${c.region}`} onSelect={() => go(`/area/${c.id}`)} icon={<MapPin />} label={c.name} hint={c.region} score={c.risk} />
                ))}
              </Command.Group>
              <Command.Group heading={t('search.pages')}>
                {PAGES.map((p) => (
                  <Item key={p.to} value={`page ${t(`nav.${p.key}`)}`} onSelect={() => go(p.to)} icon={<p.icon />} label={t(`nav.${p.key}`)} />
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Item({ value, onSelect, icon, label, hint, score }: { value: string; onSelect: () => void; icon: React.ReactNode; label: string; hint?: string; score?: number | null }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground"
    >
      {icon}
      <span className="flex-1 truncate font-medium">{label}</span>
      {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      {score !== undefined && (
        <span className="num flex items-center gap-1.5 text-xs font-semibold">
          <ClassDot value={score} />
          {formatScore(score)}
        </span>
      )}
    </Command.Item>
  );
}
