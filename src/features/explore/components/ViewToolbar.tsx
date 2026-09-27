/** Map / Table switch, street-basemap toggle and "Copy link". */
import { Layers, Link2, Map as MapIcon, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Segmented, Tooltip } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import type { ExploreView } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';

export function ViewToolbar({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { t } = useTranslation('explore');
  const { state, actions } = useExplore();
  const streets = state.basemap === 'streets';
  const label = (text: string) => (compact ? <span className="sr-only">{text}</span> : text);
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Segmented<ExploreView>
        size="sm"
        value={state.view}
        onValueChange={(v) => actions.setView(v)}
        aria-label={t('view.label')}
        options={[
          { value: 'map', label: label(t('view.map')), icon: <MapIcon /> },
          { value: 'table', label: label(t('view.table')), icon: <Table2 /> },
        ]}
      />
      {state.view === 'map' && (
        <Tooltip
          content={
            <>
              <span className="block font-medium">{t('basemap.label')}</span>
              <span className="block opacity-80">{t('basemap.hint')}</span>
            </>
          }
          side="bottom"
        >
          <Button
            variant={streets ? 'secondary' : 'ghost'}
            size="icon-sm"
            aria-pressed={streets}
            aria-label={t('basemap.label')}
            onClick={() => actions.setBasemap(streets ? 'none' : 'streets')}
            className={cn(streets && 'text-primary')}
          >
            <Layers />
          </Button>
        </Tooltip>
      )}
      {compact ? (
        <Tooltip content={t('share.copy')} side="bottom">
          <Button variant="ghost" size="icon-sm" aria-label={t('share.copy')} onClick={actions.copyLink}>
            <Link2 />
          </Button>
        </Tooltip>
      ) : (
        <Button variant="ghost" size="sm" onClick={actions.copyLink}>
          <Link2 /> {t('share.copy')}
        </Button>
      )}
    </div>
  );
}
