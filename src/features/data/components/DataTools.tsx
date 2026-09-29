/**
 * Data tools: export everything this person may see as JSON; in local (demo) mode also import a JSON
 * export (validated, re-submitted as PENDING submissions - never written straight into approved values)
 * and reset all browser-local data.
 */
import { ChevronDown, Download, FileJson, Loader2, Trash2, Upload, Wrench } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Progress } from '@/components/ui/primitives';
import { useData, useModel, useOverrides, useResetAll, useSubmissions } from '@/data-layer/DataProvider';
import { downloadText, formatNumber } from '@/lib/utils';
import { isOwnSubmission, useBatchOps, usePermissions } from '../hooks';
import { errorMessage } from '../lib/batch';
import { dateTime } from '../lib/format';
import { buildExport, exportFileName, MAX_IMPORT_BYTES, planImport, readExportFile, type ImportFile, type ReadError } from '../lib/io';
import { Callout, Checkbox } from './common';

export function DataToolsMenu() {
  const { t } = useTranslation('data');
  const { mode, profile } = useData();
  const { canSubmit: contributor, canReview: reviewer } = usePermissions();
  const overrides = useOverrides();
  const submissions = useSubmissions();
  const [importOpen, setImportOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const local = mode === 'local';

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Wrench /> {t('tools.menu')} <ChevronDown className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>{local ? t('tools.localLabel') : t('tools.sharedLabel')}</DropdownMenuLabel>
          <ExportItem overridesReady={!overrides.isLoading} submissionsReady={!submissions.isLoading} reviewer={reviewer} />
          {local && contributor && (
            <DropdownMenuItem onSelect={() => setImportOpen(true)}>
              <Upload /> {t('tools.import')}
            </DropdownMenuItem>
          )}
          {local && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger [&_svg]:!text-danger" onSelect={() => setResetOpen(true)}>
                <Trash2 /> {t('tools.reset')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {local && contributor && profile && <ImportDialog open={importOpen} onOpenChange={setImportOpen} />}
      {local && <ResetDialog open={resetOpen} onOpenChange={setResetOpen} />}
    </>
  );
}

function ExportItem({ overridesReady, submissionsReady, reviewer }: { overridesReady: boolean; submissionsReady: boolean; reviewer: boolean }) {
  const { t } = useTranslation('data');
  const { mode, profile, repo } = useData();
  const overrides = useOverrides();
  const submissions = useSubmissions();
  // The audit trail is reviewer-only in the shared database; in local mode it is this browser's own.
  const auditAllowed = reviewer || mode === 'local';
  const onExport = async () => {
    try {
      const all = submissions.data ?? [];
      // Never hand a sector user other people's submissions (the repository already filters in Supabase).
      const visible = reviewer ? all : all.filter((s) => profile && isOwnSubmission(s, profile, mode));
      const audit = auditAllowed ? await repo.listAudit(500) : undefined;
      const data = buildExport({ mode, overrides: overrides.data ?? {}, submissions: visible, audit, exportedBy: profile?.fullName });
      downloadText(exportFileName(), JSON.stringify(data, null, 2), 'application/json');
      toast.success(t('tools.exported'));
    } catch (e) {
      toast.error(t('tools.exportError'), { description: errorMessage(e) });
    }
  };
  return (
    <DropdownMenuItem disabled={!overridesReady || !submissionsReady} onSelect={() => void onExport()}>
      <Download /> {t('tools.export')}
    </DropdownMenuItem>
  );
}

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation(['data', 'common']);
  const model = useModel();
  const { submitMany, progress } = useBatchOps();
  const [file, setFile] = React.useState<{ name: string; data: ImportFile } | null>(null);
  const [error, setError] = React.useState<ReadError | 'read' | null>(null);
  const [opts, setOpts] = React.useState({ includeOverrides: true, includePending: true });
  const inputRef = React.useRef<HTMLInputElement>(null);
  const plan = React.useMemo(() => (file ? planImport(file.data, model, opts) : null), [file, model, opts]);
  const busy = progress != null;

  const reset = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const onFile = async (f: File | undefined) => {
    reset();
    if (!f) return;
    if (f.size > MAX_IMPORT_BYTES) {
      setError('tooLarge');
      return;
    }
    try {
      const res = readExportFile(await f.text());
      if (res.ok) setFile({ name: f.name, data: res.file });
      else setError(res.error);
    } catch {
      setError('read');
    }
  };
  const onImport = async () => {
    if (!plan?.submissions.length) return;
    try {
      const out = await submitMany(plan.submissions, false);
      const failed = out.filter((o) => !o.ok).length;
      if (failed) toast.warning(t('tools.importPartial', { ok: out.length - failed, failed }));
      else toast.success(t('tools.imported', { count: out.length }));
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(t('tools.importError'), { description: errorMessage(e) });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return;
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-xl" title={t('tools.importTitle')} description={t('tools.importLead')}>
        <div className="space-y-4 p-5">
          <label
            htmlFor="import-file"
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-input px-4 py-7 text-center transition-colors hover:border-foreground/40 hover:bg-muted/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
          >
            <FileJson className="size-5 text-muted-foreground" aria-hidden />
            <span className="text-sm font-semibold">{file ? file.name : t('tools.chooseFile')}</span>
            <span className="text-xs text-muted-foreground">{t('tools.fileHint', { size: formatNumber(MAX_IMPORT_BYTES / 1024 / 1024, i18n.language) })}</span>
            <input ref={inputRef} id="import-file" type="file" accept=".json,application/json" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
          {error && (
            <Callout tone="danger">
              <span role="alert">{t(`tools.errors.${error}`)}</span>
            </Callout>
          )}
          {file && plan && (
            <>
              <p className="text-sm text-muted-foreground">{file.data.exportedAt ? t('tools.exportedAt', { date: dateTime(file.data.exportedAt, i18n.language) }) : null}</p>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t('tools.includeLegend')}</legend>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={opts.includeOverrides} onChange={(e) => setOpts((o) => ({ ...o, includeOverrides: e.target.checked }))} />
                  {t('tools.includeOverrides', { count: plan.found.overrideValues })}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={opts.includePending} onChange={(e) => setOpts((o) => ({ ...o, includePending: e.target.checked }))} />
                  {t('tools.includePending', { count: plan.found.pendingSubmissions })}
                </label>
              </fieldset>
              <Callout tone={plan.submissions.length ? 'info' : 'warning'} title={t('tools.planTitle', { count: plan.submissions.length, values: plan.values })}>
                {t('tools.planLead', { unchanged: plan.unchanged })}
              </Callout>
              {plan.issues.length > 0 && (
                <div className="border-l-2 border-warning pl-4 text-xs">
                  <p className="font-semibold text-foreground">{t('tools.issues', { count: plan.issues.length })}</p>
                  <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-muted-foreground">
                    {plan.issues.slice(0, 50).map((i, n) => (
                      <li key={n}>
                        <span className="font-mono">{i.where}</span>: {t(`tools.issueKinds.${i.kind}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {progress && (
            <div aria-live="polite">
              <Progress value={(progress.done / Math.max(1, progress.total)) * 100} label={`${progress.done} / ${progress.total}`} />
              <p className="mt-1.5 text-xs text-muted-foreground">{t('paste.progress', { done: progress.done, total: progress.total })}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('common:actions.cancel')}
          </Button>
          <Button onClick={onImport} disabled={busy || !plan?.submissions.length}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />} {t('tools.importButton', { count: plan?.submissions.length ?? 0 })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation(['data', 'common']);
  const resetAll = useResetAll();
  const [ack, setAck] = React.useState(false);
  const onReset = async () => {
    try {
      await resetAll.mutateAsync();
      toast.success(t('tools.resetDone'));
      setAck(false);
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (resetAll.isPending) return;
        if (!o) setAck(false);
        onOpenChange(o);
      }}
    >
      <DialogContent title={t('tools.resetTitle')} description={t('tools.resetLead')}>
        <div className="space-y-4 p-5">
          <Callout tone="danger" title={t('tools.resetWarnTitle')}>
            {t('tools.resetWarn')}
          </Callout>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} />
            {t('tools.resetAck')}
          </label>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={resetAll.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button variant="danger" onClick={onReset} disabled={!ack || resetAll.isPending}>
            {resetAll.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />} {t('tools.resetConfirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
