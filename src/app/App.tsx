import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, Link, Navigate, RouterProvider, useRouteError } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import { resolveTheme, usePrefs } from '@/state/prefs';
import { AppShell } from './layout/AppShell';
import { PageLoader } from './PageLoader';
import { loadRoute, type RouteKey } from './routes';

const lazyPage = (key: RouteKey) => {
  const C = React.lazy(() => loadRoute(key));
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
      { index: true, element: lazyPage('home') },
      { path: 'explore', element: lazyPage('explore') },
      { path: 'area/:id', element: lazyPage('area') },
      { path: 'insights', element: lazyPage('insights') },
      { path: 'severity', element: lazyPage('severity') },
      { path: 'learn', element: lazyPage('learn') },
      { path: 'learn/:lessonId', element: lazyPage('learn') },
      { path: 'methodology', element: lazyPage('methodology') },
      { path: 'data', element: lazyPage('data') },
      // Legacy routes from the previous app (keep old links and bookmarks working)
      { path: 'risk', element: <Navigate to="/explore" replace /> },
      { path: 'education', element: <Navigate to="/learn" replace /> },
      { path: 'data-entry', element: <Navigate to="/data" replace /> },
      { path: '*', element: lazyPage('notFound') },
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
        {/* The shared catalogues load asynchronously on first paint (see src/i18n). */}
        <React.Suspense fallback={<div className="min-h-dvh bg-background" />}>
          <RouterProvider router={router} />
          <ThemedToaster />
        </React.Suspense>
      </TooltipProvider>
    </DataProvider>
  );
}
