/**
 * The institution's template (DE-03): download one CSV with every indicator it keeps and every area,
 * fill it offline, upload it back. The upload is read into one pending submission per indicator (the
 * same path as the entry sheet: measured values or 0-10 scores with a citable source, reviewed by PMO),
 * with every problem listed by row before anything is sent.
 */
import { Download, FileUp, Loader2, Send } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/primitives';
import { loadBaseline, useModel, useRawValues, useRequests, useSubmitRaw } from '@/data-layer/DataProvider';
import { indexRawValues } from '@/engine/risk/rawValues';
import { ACTIVE_SPECS } from '@/engine/risk/standardise';
import { exportFileName, exportPreamble, exportStamp } from '@/lib/exports';
import { downloadText, toCsv } from '@/lib/utils';
import { errorMessage } from '../lib/batch';
import { parseTemplate, templateRows, type ParsedTemplate } from '../lib/template';
import { rowsToCsv, toolToTemplateRows } from '../lib/tool-import';
import { buildSheet, specLabel } from '../lib/workflow';
import { openXlsx } from '../lib/xlsx-lite';

const MAX_FILE = 5 * 1024 * 1024;

/**
 * `allowAll` (the Office's import on the Data control tab) accepts every indicator of a filled tool;
 * an institution's import keeps only its own indicators.
 */
export function TemplateIO({ specIds, institution, allowAll = false }: { specIds: readonly string[]; institution: string; allowAll?: boolean }) {
  const { t } = useTranslation(['data', 'common']);
  const model = useModel();
  const rawValues = useRawValues();
  const requests = useRequests();
  const submit = useSubmitRaw();
  const [parsed, setParsed] = React.useState<(ParsedTemplate & { name: string }) | null>(null);
  const [dataset, setDataset] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const fileId = React.useId();

  const download = async () => {
    try {
      const baseline = await loadBaseline();
      const idx = indexRawValues(rawValues.data ?? []);
      const inputs = specIds.flatMap((id) => (ACTIVE_SPECS[id] ? [{ spec: ACTIVE_SPECS[id], sheet: buildSheet(model, ACTIVE_SPECS[id], idx, baseline) }] : []));
      const rows = templateRows(inputs, { national: t('common:levels.national'), region: t('common:levels.region'), council: t('common:levels.council') });
      const stamp = exportStamp(t('template.scope', { institution, count: inputs.length }));
      downloadText(exportFileName(`template-${institution.toLowerCase()}`, stamp), toCsv([...exportPreamble(t, stamp), ...rows]), 'text/csv;charset=utf-8');
      toast.success(t('template.downloaded', { count: inputs.length }));
    } catch (e) {
      toast.error(t('template.error'), { description: errorMessage(e) });
    }
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE) {
      toast.error(t('template.tooLarge'));
      return;
    }
    try {
      let text: string;
      if (/\.xlsx$/i.test(file.name)) {
        // A filled collection tool: its 'Council Entry' sheet becomes template rows (tool-import.ts).
        const book = await openXlsx(await file.arrayBuffer());
        const sheetName = book.sheets.find((n) => /council entry/i.test(n)) ?? book.sheets[0];
        const imported = toolToTemplateRows(await book.rows(sheetName), ACTIVE_SPECS, allowAll ? null : new Set(specIds));
        if (imported.skipped.length || imported.unknown.length) toast.message(t('template.toolIgnored', { skipped: imported.skipped.length, unknown: imported.unknown.length }));
        text = rowsToCsv(imported.rows);
      } else text = await file.text();
      const p = parseTemplate(text, model, ACTIVE_SPECS);
      setParsed({ ...p, name: file.name });
    } catch (e) {
      toast.error(t('template.error'), { description: errorMessage(e) });
    }
  };

  const openRequestFor = (specId: string) => (requests.data ?? []).find((r) => r.specId === specId && (r.status === 'open' || r.status === 'submitted'))?.id ?? null;
  const datasetOk = dataset.trim().length >= 2;
  const canSend = !!parsed && parsed.submissions.length > 0 && parsed.issues.length === 0 && datasetOk && !busy;

  const send = async () => {
    if (!parsed || !canSend) return;
    setBusy(true);
    let sent = 0;
    try {
      for (const s of parsed.submissions) {
        await submit.mutateAsync({
          input: {
            specId: s.specId,
            entries: s.entries,
            valueType: s.valueType,
            method: s.valueType === 'score' ? 'inform' : undefined,
            source: s.source ?? undefined,
            dataset: dataset.trim(),
            period: period.trim() || undefined,
            note: t('template.note', { file: parsed.name }),
            requestId: openRequestFor(s.specId),
          },
          applyNow: false,
        });
        sent++;
      }
      toast.success(t('template.sent', { count: sent, values: parsed.filled }));
      setParsed(null);
    } catch (e) {
      toast.error(t('template.error'), { description: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="template-title" className="mt-6 border-y border-border py-5">
      <h3 id="template-title" className="font-display text-lg font-semibold">
        {t('template.title')}
      </h3>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('template.lead', { count: specIds.length })}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void download()} disabled={!specIds.length || rawValues.isLoading}>
          <Download /> {t('template.download')}
        </Button>
        <Label htmlFor={fileId} className="sr-only">
          {t('template.upload')}
        </Label>
        <Input id={fileId} type="file" accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="h-9 w-auto max-w-xs" aria-label={t('template.upload')} onChange={(e) => void onFile(e.target.files?.[0] ?? null)} />
        <FileUp className="size-4 text-muted-foreground" aria-hidden />
      </div>

      {parsed && (
        <div className="mt-4 max-w-3xl space-y-3 border-l-2 border-border pl-4">
          <p className="text-sm">{t('template.read', { file: parsed.name, rows: parsed.rows, filled: parsed.filled, indicators: parsed.submissions.length })}</p>
          {parsed.submissions.length > 0 && (
            <ul className="text-sm text-muted-foreground">
              {parsed.submissions.map((s) => (
                <li key={s.specId}>
                  {specLabel(t, s.specId)}: {t('template.perIndicator', { count: s.entries.length })}
                  {s.valueType === 'score' && ` · ${t('workflow.sheet.method.inform')}`}
                  {openRequestFor(s.specId) && ` · ${t('template.answersRequest')}`}
                </li>
              ))}
            </ul>
          )}
          {parsed.issues.length > 0 && (
            <div className="text-sm text-danger" role="alert">
              <p className="font-medium">{t('template.issues', { count: parsed.issues.length })}</p>
              <ul className="mt-1 list-disc pl-5">
                {parsed.issues.slice(0, 20).map((i, k) => (
                  <li key={k}>{t(`template.issue.${i.kind}`, { line: i.line, detail: i.detail })}</li>
                ))}
              </ul>
            </div>
          )}
          {parsed.submissions.length > 0 && parsed.issues.length === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="template-dataset">{t('workflow.sheet.dataset')}</Label>
                <Input id="template-dataset" value={dataset} onChange={(e) => setDataset(e.target.value)} maxLength={200} placeholder={t('workflow.sheet.datasetPlaceholder')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="template-period">{t('workflow.sheet.period')}</Label>
                <Input id="template-period" value={period} onChange={(e) => setPeriod(e.target.value)} maxLength={40} placeholder="2024" />
              </div>
              <div className="sm:col-span-2">
                <Button size="sm" disabled={!canSend} onClick={() => void send()}>
                  {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} {t('template.send', { count: parsed.submissions.length })}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
