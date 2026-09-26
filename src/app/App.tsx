import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, Link, RouterProvider, useRouteError } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import { resolveTheme, usePrefs } from '@/state/prefs';
import { AppShell } from './layout/AppShell';
import { PageLoader } from './PageLoader';

const lazyPage = (factory: () => Promise<{ default: React.ComponentType }>) => {
  const C = React.lazy(factory);
  return (
    <React.Suspense fallback={<PageLoader />}>
      <C />
    </React.Suspense>
  );
};

function RouteError() {
  const error = useRouteError() as Error | undefined;
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <div className="rounded-2xl bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">Error</div>
      <h1 className="mt-4 text-3xl font-bold">{t('states.error')}</h1>
      <p className="mt-3 text-muted-foreground">{t('states.errorDetail')}</p>
      {error?.message && <pre className="mt-6 w-full overflow-auto rounded-xl bg-muted p-4 text-left text-xs">{error.message}</pre>}
      <div className="mt-8 flex gap-3">
        <Button onClick={() => window.location.reload()}>{t('actions.tryAgain')}</Button>
        <Button variant="outline" asChild>
          <Link to="/">{t('states.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: lazyPage(() => import('@/features/home/HomePage')) },
      { path: 'explore', element: lazyPage(() => import('@/features/explore/ExplorePage')) },
      { path: 'area/:id', element: lazyPage(() => import('@/features/area/AreaPage')) },
      { path: 'insights', element: lazyPage(() => import('@/features/insights/InsightsPage')) },
      { path: 'severity', element: lazyPage(() => import('@/features/severity/SeverityPage')) },
      { path: 'learn', element: lazyPage(() => import('@/features/learn/LearnPage')) },
      { path: 'learn/:lessonId', element: lazyPage(() => import('@/features/learn/LearnPage')) },
      { path: 'methodology', element: lazyPage(() => import('@/features/methodology/MethodologyPage')) },
      { path: 'data', element: lazyPage(() => import('@/features/data/DataPortalPage')) },
      // Legacy routes from the previous app
      { path: 'risk', element: lazyPage(() => import('@/features/explore/ExplorePage')) },
      { path: 'education', element: lazyPage(() => import('@/features/learn/LearnPage')) },
      { path: 'data-entry', element: lazyPage(() => import('@/features/data/DataPortalPage')) },
      { path: '*', element: lazyPage(() => import('./NotFound')) },
    ],
  },
]);

function ThemedToaster() {
  const theme = resolveTheme(usePrefs((s) => s.theme));
  return <Toaster theme={theme} position="bottom-right" richColors closeButton />;
}

export default function App() {
  return (
    <DataProvider>
      <TooltipProvider delayDuration={150}>
        <RouterProvider router={router} />
        <ThemedToaster />
      </TooltipProvider>
    </DataProvider>
  );
}
