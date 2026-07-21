"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, CheckIcon } from "lucide-react";
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

  const { mutateAsync: unqrchieveClass } = useMutation(
    orpc.owner.class.unArchieveClass.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.class.getAllClass.queryKey(),
        });
      },
    }),
  );

  if (!data || isLoading) {
    return (
      <Card className="w-full max-w-sm p-0">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <Skeleton className="h-3 w-[20%]" />
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-6 w-[60%]" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
          <div className="border-t p-3">
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building />
          </EmptyMedia>
          <EmptyTitle>Cloud Storage Empty</EmptyTitle>
          <EmptyDescription>
            Upload files to your cloud storage to access them anywhere.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm">
            Upload Files
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return data.map((item) => (
    <Card key={item.id} className="w-full p-0">
      <CardContent className="p-0 flex flex-col h-full">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <Badge variant="secondary">
            <CheckIcon aria-hidden="true" />
            Live
          </Badge>
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
                    loading: "Arcieving...",
                    success: "Archieved",
                    error: "Failed to archieve",
                  },
                )
              }
            >
              Archieve
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() =>
                toast.promise(
                  unqrchieveClass({
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
          <p className="text-muted-foreground text-sm">{item.description}</p>
          <AvatarGroup>
            <Avatar className="size-6">
              <AvatarImage
                src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80"
                alt="User 1"
              />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <Avatar className="size-6">
              <AvatarImage
                src="https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80"
                alt="User 2"
              />
              <AvatarFallback>MR</AvatarFallback>
            </Avatar>
            <Avatar className="size-6">
              <AvatarImage
                src="https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=96&h=96&dpr=2&q=80"
                alt="User 3"
              />
              <AvatarFallback>EW</AvatarFallback>
            </Avatar>
            <AvatarGroupCount className="size-6 border text-[10px]">
              +3
            </AvatarGroupCount>
          </AvatarGroup>
        </div>
        <div className="border-t p-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={!!item.archivedAt}
          >
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  ));
};
