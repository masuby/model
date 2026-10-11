/**
 * The locator map of an area: a lightweight SVG map (no Leaflet) zoomed on the area, or the whole
 * country, coloured by INFORM risk, with the area outlined and every other area one click from its
 * profile. First on the profile's Risk view, beside the hazards and the risk level.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Segmented } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import { cn } from '@/lib/utils';
import type { AreaView } from '../lib';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));

export function LocatorMap({ view, className }: { view: AreaView; className?: string }) {
  const { t } = useTranslation(['area', 'common']);
  const navigate = useNavigate();
  const { unit, model } = view;
  const [mode, setMode] = React.useState<'focus' | 'country'>('focus');
  const metric = React.useMemo(() => parseMetric('risk'), []);
  const isNational = unit.level === 'national';

  // Councils and regions have their own outline; an INFORM source unit is shown through the councils
  // that use its data. The nation is drawn by region.
  const { level, selected } = React.useMemo(() => {
    if (unit.level === 'region') return { level: 'region' as const, selected: [unit.id] };
    if (unit.level === 'national') return { level: 'region' as const, selected: [] as string[] };
    if (unit.level === 'source') return { level: 'council' as const, selected: model.councils.filter((c) => c.sourceId === unit.id).map((c) => c.id) };
    return { level: 'council' as const, selected: [unit.id] };
  }, [unit, model]);
  const focusId = !isNational && mode === 'focus' ? (selected[0] ?? null) : null;

  return (
    <figure className={cn('flex flex-col', className)}>
      <figcaption className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold">{t('map.title')}</h3>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{isNational ? t('map.descNational') : t('map.desc', { name: unit.name })}</p>
        </div>
        {!isNational && selected.length > 0 && (
          <Segmented
            size="sm"
            className="no-print shrink-0 self-start"
            aria-label={t('map.viewLabel')}
            value={mode}
            onValueChange={setMode}
            options={[
              { value: 'focus', label: t('map.focus') },
              { value: 'country', label: t('map.country') },
            ]}
          />
        )}
      </figcaption>
      <div className="mt-4 aspect-[4/3] w-full">
        <React.Suspense fallback={<div className="size-full bg-muted/50" />}>
          <StaticMap
            model={model}
            level={level}
            metric={metric}
            selectedIds={selected}
            focusId={focusId}
            hint={t('map.hint')}
            onSelect={(u) => {
              if (u.id !== unit.id) navigate(`/area/${u.id}`);
            }}
            className="size-full"
            aria-label={isNational ? t('map.descNational') : t('map.desc', { name: unit.name })}
          />
        </React.Suspense>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{t('common:informRisk')}</span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{t('common:classes.veryLow')}</span>
          {CLASS_KEYS.map((k) => (
            <span key={k} className="h-2 w-5" style={{ background: CLASS_COLORS[k] }} title={t(`common:classes.${k}`)} aria-hidden />
          ))}
          <span>{t('common:classes.veryHigh')}</span>
        </span>
      </div>
    </figure>
  );
}
