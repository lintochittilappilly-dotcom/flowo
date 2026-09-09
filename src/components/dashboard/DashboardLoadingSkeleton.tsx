import { SkeletonCard, SkeletonChart, SkeletonList } from "@/components/ui/loading-skeletons";

const DashboardLoadingSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted/70 animate-pulse" />
      </div>
      <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
    </div>

    {/* Stat cards */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>

    {/* Chart + list */}
    <div className="grid gap-6 lg:grid-cols-3">
      <SkeletonChart className="lg:col-span-2" />
      <SkeletonList count={4} />
    </div>
  </div>
);

export default DashboardLoadingSkeleton;
