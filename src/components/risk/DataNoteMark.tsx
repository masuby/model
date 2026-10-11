/**
 * A data note beside a value: a small mark whose tooltip carries the note (a workbook value under query,
 * a known artefact, or an explanation), and a one-word status line for where there is room. The note is
 * printed in full, since tooltips do not print.
 */
import { CircleAlert, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@/components/ui/primitives';
import { noteText, worstStatus, type DataNote } from '@/engine/risk/notes';
import { cn } from '@/lib/utils';

export function DataNoteMark({ notes, className, focusable = true }: { notes: readonly DataNote[]; className?: string; focusable?: boolean }) {
  const { t, i18n } = useTranslation('common');
  if (!notes.length) return null;
  const status = worstStatus(notes)!;
  const Icon = status === 'explained' ? Info : CircleAlert;
  return (
    <Tooltip
      content={
        <span className="block max-w-80 whitespace-normal">
          {notes.map((n) => (
            <span key={n.id} className="mt-1.5 block first:mt-0">
              {noteText(n, i18n.language)}
            </span>
          ))}
        </span>
      }
    >
      {/* Inside a button the mark is not a second tab stop: the button's tooltip-less label stays the control. */}
      <span role="img" tabIndex={focusable ? 0 : undefined} aria-label={`${t('dataNote.label')}: ${t(`dataNote.status.${status}`)}`} className={cn('inline-flex cursor-help items-center align-middle', className)}>
        <Icon className={cn('size-3.5', status === 'explained' ? 'text-muted-foreground' : 'text-warning')} aria-hidden />
      </span>
    </Tooltip>
  );
}

/** The status word ("Value under query", or "Withheld from the live model") as a short line, plus the full note when printing. */
export function DataNoteLine({ notes, className, withheld = false }: { notes: readonly DataNote[]; className?: string; withheld?: boolean }) {
  const { t, i18n } = useTranslation('common');
  if (!notes.length) return null;
  const status = worstStatus(notes)!;
  return (
    <span className={cn('block text-xs', status === 'explained' ? 'text-muted-foreground' : 'text-warning', className)}>
      <span className="print:hidden">{withheld ? t(status === 'decision' ? 'dataNote.withheldDecision' : 'dataNote.withheld') : t(`dataNote.status.${status}`)}</span>
      <span className="hidden print:inline">{notes.map((n) => noteText(n, i18n.language)).join(' ')}</span>
    </span>
  );
}
