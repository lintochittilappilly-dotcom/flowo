const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-md border border-border bg-card p-5 shadow-sm ${className}`}>
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-md bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="h-3 w-28 rounded bg-muted" />
      </div>
    </div>
    <div className="mt-3 h-3 w-16 rounded bg-muted" />
  </div>
);

const SkeletonChart = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-md border border-border bg-card p-5 shadow-sm ${className}`}>
    <div className="h-4 w-32 rounded bg-muted" />
    <div className="mt-4 h-64 rounded bg-muted/50" />
  </div>
);

const SkeletonList = ({ count = 5, className = "" }: { count?: number; className?: string }) => (
  <div className={`animate-pulse rounded-md border border-border bg-card p-5 shadow-sm ${className}`}>
    <div className="h-4 w-28 rounded bg-muted mb-4" />
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonTable = ({ rows = 4, cols = 4, className = "" }: { rows?: number; cols?: number; className?: string }) => (
  <div className={`animate-pulse rounded-md border border-border bg-card shadow-sm overflow-hidden ${className}`}>
    <div className="p-5 pb-3">
      <div className="h-4 w-32 rounded bg-muted" />
    </div>
    <div className="px-5">
      <div className="flex gap-4 border-b border-border pb-2 mb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-muted" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3 flex-1 rounded bg-muted/70" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export { SkeletonCard, SkeletonChart, SkeletonList, SkeletonTable };
