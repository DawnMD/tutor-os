"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveBatchColor } from "@/lib/batch-colors";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Building, CheckIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export const ClassCards = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    orpc.owner.class.getAllClass.queryOptions(),
  );

  const { mutateAsync: archieveClass } = useMutation(
    orpc.owner.class.archieveClass.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.class.getAllClass.queryKey(),
        });
      },
    }),
  );

  const { mutateAsync: unarchiveClass } = useMutation(
    orpc.owner.class.unArchieveClass.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.class.getAllClass.queryKey(),
        });
      },
    }),
  );

  if (isLoading || !data) {
    return (
      <>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="w-full p-0">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <Skeleton className="h-6 w-[20%]" />
                <Skeleton className="h-10 w-[20%]" />
              </div>
              <div className="space-y-3 p-4 grow">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-6 w-[60%]" />
                </div>
                <Skeleton className="h-4 w-[60%]" />
                <Skeleton className="h-4 w-[60%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
              <div className="border-t p-3 mt-auto flex gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`button-${index}`} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (data.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building />
          </EmptyMedia>
          <EmptyTitle>No classes yet</EmptyTitle>
          <EmptyDescription>
            Create your first class to start adding batches and students.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return data.map((item) => (
    <Card key={item.id} className={cn("w-full p-0", item.archivedAt && "opacity-60")}>
      <CardContent className="p-0 flex flex-col h-full">
        <div className="flex items-center justify-between border-b px-3 py-2">
          {item.archivedAt ? (
            <Badge variant="outline">
              <Archive aria-hidden="true" />
              Archived
            </Badge>
          ) : (
            <Badge variant="secondary">
              <CheckIcon aria-hidden="true" />
              Live
            </Badge>
          )}
          {!item.archivedAt ? (
            <Button
              variant="destructive"
              disabled={!!item.archivedAt}
              onClick={() =>
                toast.promise(
                  archieveClass({
                    id: item.id,
                  }),
                  {
                    loading: "Archiving...",
                    success: "Archived",
                    error: "Failed to archive",
                  },
                )
              }
            >
              Archive
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() =>
                toast.promise(
                  unarchiveClass({
                    id: item.id,
                  }),
                  {
                    loading: "Restoring...",
                    success: "Restored",
                    error: "Failed to restore",
                  },
                )
              }
            >
              Restore
            </Button>
          )}
        </div>
        <div className="space-y-3 p-4 grow">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm leading-tight font-medium">{item.name}</h3>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {item.description ?? "No description"}
          </p>
          <div className="flex flex-col gap-2">
            <Badge variant={"ghost"}>Batches: {item.batches.length}</Badge>
            <Badge variant={"ghost"}>Students: {item.studentCount}</Badge>
          </div>
        </div>
        {!!item.batches.length && (
          <div className="border-t p-3 flex flex-wrap gap-2">
            {item.batches.map((batch) => (
              <Button
                key={batch.id}
                variant="outline"
                disabled={!!item.archivedAt}
                nativeButton={false}
                render={
                  <Link href={`/class/${item.id}/batch/${batch.id}/overview`} />
                }
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    resolveBatchColor(batch.color, batch.id).dot,
                  )}
                />
                {`Open ${batch.name}`}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  ));
};
