import { Skeleton } from "@/components/ui/skeleton";

export default function BatchOverviewLoading() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-3">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Session */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>

          {/* Attendance Chart */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>

          {/* Recent Sessions */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border border-border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Student Summary */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-3 border border-border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-3">
            <Skeleton className="h-6 w-32 rounded-lg" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
