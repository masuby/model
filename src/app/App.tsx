import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, Link, Navigate, RouterProvider, useRouteError } from 'react-router-dom';
import { Toaster } from 'sonner';
import { PageContainer } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/overlays';
import { DataProvider } from '@/data-layer/DataProvider';
import { resolveTheme, usePrefs } from '@/state/prefs';
import { AppShell } from './layout/AppShell';
import { PageLoader } from './PageLoader';
import { loadRoute, type RouteKey } from './routes';
import { isStaleCodeError, reloadForUpdate } from './updateReload';

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
  // A page's code went missing because a new version was deployed while this tab was open: reload once.
  React.useEffect(() => {
    if (isStaleCodeError(error)) reloadForUpdate();
  }, [error]);
  return (
    <PageContainer className="py-24 sm:py-32">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-danger">{t('states.errorLabel')}</p>
        <h1 className="mt-3 text-[2.4rem] leading-tight">{t('states.error')}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t('states.errorDetail')}</p>
        {error?.message && <pre className="mt-6 w-full overflow-auto rounded-md border border-border bg-muted p-4 text-left text-xs">{error.message}</pre>}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8">
          <Button onClick={() => window.location.reload()}>{t('actions.tryAgain')}</Button>
          <Button variant="outline" asChild>
            <Link to="/">{t('states.goHome')}</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
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
      // Legacy routes from the previous app (keep old links and bookmarks working). vercel.json answers
      // these with permanent redirects too; these cover navigations served by the service worker.
      { path: 'risk', element: <Navigate to="/explore" replace /> },
      { path: 'education', element: <Navigate to="/learn" replace /> },
      { path: 'data-entry', element: <Navigate to="/data" replace /> },
      { path: 'index.html', element: <Navigate to="/" replace /> },
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
