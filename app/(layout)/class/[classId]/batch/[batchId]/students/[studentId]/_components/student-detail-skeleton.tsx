import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} size="sm" className="gap-3">
            <div className="px-(--card-spacing)">
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-2 px-(--card-spacing)">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </Card>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-9 w-full max-w-md" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
