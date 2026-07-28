import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BatchOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-52" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-6">
          {/* Student summary */}
          <Skeleton className="h-56" />
          {/* Upcoming exams */}
          <Skeleton className="h-56" />
          {/* Notes */}
          <Skeleton className="h-56" />
          {/* Quick actions */}
          <Skeleton className="h-72" />
        </div>
      </div>

      {/* Chart */}
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
