import { Skeleton } from '@/components/ui/primitives';

export function PageLoader() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="mt-4 h-[420px]" />
    </div>
  );
}
