/** Skeleton block used while a list/table is loading. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-input bg-background-secondary ${className}`}
    />
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 border-b border-background-secondary p-5">
          <Skeleton className="h-4 w-20 shrink-0" />
          <Skeleton className="h-4 w-24 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
