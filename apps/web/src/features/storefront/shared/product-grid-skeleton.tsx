export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col overflow-hidden rounded-lg border border-brand-100">
          <div className="aspect-square w-full animate-pulse bg-brand-100" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-brand-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-brand-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-brand-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
