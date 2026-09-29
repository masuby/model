/** "The current values are still correct": answers an open validation request, or records a check. */
import { BadgeCheck, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, Label, Textarea } from '@/components/ui/primitives';
import { useConfirmValues } from '@/data-layer/DataProvider';
import type { DataRequest } from '@/data-layer/types';
import { NOTE_MAX } from '../components/SubmitPanel';
import { errorMessage } from '../lib/batch';
import { specLabel } from '../lib/workflow';

export function ConfirmValuesDialog({ specId, request, onClose }: { specId: string | null; request: DataRequest | null; onClose: () => void }) {
  const { t } = useTranslation(['data', 'common']);
  const confirm = useConfirmValues();
  const [note, setNote] = React.useState('');
  const openRequest = request && (request.status === 'open' || request.status === 'submitted') ? request : null;

  const run = async () => {
    if (!specId) return;
    try {
      await confirm.mutateAsync({ specId, requestId: openRequest?.kind === 'validate' ? openRequest.id : null, note: note.trim() || undefined });
      toast.success(t('workflow.confirm.done'));
      setNote('');
      onClose();
    } catch (e) {
      toast.error(t('workflow.confirm.error'), { description: errorMessage(e) });
    }
  };

  return (
    <Dialog open={specId != null} onOpenChange={(o) => !o && !confirm.isPending && onClose()}>
      <DialogContent title={t('workflow.confirm.title')} description={specId ? t('workflow.confirm.lead', { name: specLabel(t, specId) }) : undefined}>
        <div className="space-y-1.5 p-5">
          <Label htmlFor="confirm-note">{t('workflow.confirm.noteLabel')}</Label>
          <Textarea id="confirm-note" value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} placeholder={t('workflow.confirm.notePlaceholder')} />
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={confirm.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button onClick={run} disabled={confirm.isPending}>
            {confirm.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <BadgeCheck aria-hidden />} {t('workflow.confirm.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
