/**
 * ChartCard - a figure (title row over a hairline rule, no box) with built-in exports:
 *   • PNG: serialises the first <svg> inside the card (Recharts renders SVG) onto a canvas.
 *   • CSV: from the `csv` rows you pass.
 * Charts inside should use `chartTheme()` so they read correctly in day and night mode.
 */
import { Download, FileSpreadsheet, ImageDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/primitives';
import { cn, downloadText, slug, toCsv } from '@/lib/utils';

export async function exportSvgAsPng(svg: SVGSVGElement, filename: string, scale = 2): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const { width, height } = svg.getBoundingClientRect();
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  // Inline computed colours so CSS variables survive serialisation.
  const srcNodes = svg.querySelectorAll('*');
  clone.querySelectorAll('*').forEach((node, i) => {
    const cs = getComputedStyle(srcNodes[i] as Element);
    const el = node as SVGElement;
    for (const p of ['fill', 'stroke', 'color', 'font-family', 'font-size', 'font-weight', 'opacity', 'stroke-width']) {
      const v = cs.getPropertyValue(p);
      if (v) el.style.setProperty(p, v);
    }
  });
  // Figures sit on the page, so the export background is the page colour (not the card colour).
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#ffffff';
  const data = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml;charset=utf-8' }));
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  a.click();
}

export function ChartCard({
  title,
  description,
  csv,
  filename,
  actions,
  className,
  contentClassName,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Rows for CSV export; first row is the header. */
  csv?: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>;
  filename?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDivElement>(null);
  const name = filename ?? (typeof title === 'string' ? slug(title) : 'chart');
  const png = () => {
    // Prefer an explicitly marked export target, then the Recharts surface, then any SVG.
    const root = ref.current;
    const svg = (root?.querySelector('[data-export] svg, svg[data-export]') ?? root?.querySelector('svg.recharts-surface') ?? root?.querySelector('svg')) as SVGSVGElement | null;
    if (svg) void exportSvgAsPng(svg, `inform-tz-${name}`);
  };
  // A figure sits on the page under a hairline rule - no box (docs/DESIGN_LANGUAGE.md §7).
  return (
    <figure className={cn('flex flex-col border-t border-border pt-5', className)}>
      <figcaption className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug">{title}</h3>
          {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        <div className="no-print flex shrink-0 items-center gap-1">
          {actions}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('actions.download')}>
                <Download />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={png}>
                <ImageDown /> {t('actions.downloadPng')}
              </DropdownMenuItem>
              {csv && (
                <DropdownMenuItem onSelect={() => downloadText(`inform-tz-${name}.csv`, toCsv(csv), 'text/csv;charset=utf-8')}>
                  <FileSpreadsheet /> {t('actions.downloadCsv')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </figcaption>
      <div ref={ref} className={cn('min-h-0 flex-1', contentClassName)}>
        {children}
      </div>
    </figure>
  );
}
