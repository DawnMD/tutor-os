"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getArchivedScope } from "@/lib/archived-error";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { Archive, UserCog } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Wraps every student content component (rendered by the branched pages, not
 * the shared layout). Resolves the current student's own profile via
 * `student.me.get`:
 *   - loading  → skeleton
 *   - `null`   → "account being set up" (webhook lag) with Retry, polling
 *   - ARCHIVED → "archived by your tutor" read-only state
 *   - else     → children
 */
export function StudentGate({ children }: { children: ReactNode }) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    ...orpc.student.me.get.queryOptions(),
    // Poll while the row is still missing (webhook lag), then stop.
    refetchInterval: (query) => (query.state.data === null ? 5000 : false),
    retry: false,
  });

  if (isError && getArchivedScope(error) === "student") {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Archive />
          </EmptyMedia>
          <EmptyTitle>Account archived</EmptyTitle>
          <EmptyDescription>
            Your account has been archived by your tutor. Contact them if you
            think this is a mistake.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (data === null) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserCog />
          </EmptyMedia>
          <EmptyTitle>Your account is being set up</EmptyTitle>
          <EmptyDescription>
            We&apos;re finishing setting up your account. This usually only takes
            a moment.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => refetch()} disabled={isRefetching}>
            Retry
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return <>{children}</>;
}
