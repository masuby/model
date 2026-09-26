import { PageContainer } from '@/components/layout/Page';
import { Skeleton } from '@/components/ui/overlays';

/** Quiet placeholder while a page's code loads: title and text lines, no box grid. */
export function PageLoader() {
  return (
    <div aria-busy="true" className="border-b border-border">
      <PageContainer className="pt-12 pb-10 sm:pt-16">
        <Skeleton className="h-10 w-2/3 max-w-xl rounded-md" />
        <Skeleton className="mt-5 h-4 w-full max-w-2xl rounded" />
        <Skeleton className="mt-2.5 h-4 w-4/5 max-w-xl rounded" />
      </PageContainer>
    </div>
  );
}
