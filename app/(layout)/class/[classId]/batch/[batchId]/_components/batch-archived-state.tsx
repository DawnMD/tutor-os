"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface BatchArchivedStateProps {
  scope: "batch" | "class";
}

/**
 * Full-page state shown on a batch sub-page (exams / sessions / attendance /
 * students / student detail) when the batch — or its parent class — is archived.
 * Offers a scope-appropriate Restore action plus navigation back to safe pages.
 */
export function BatchArchivedState({ scope }: BatchArchivedStateProps) {
  const params = useParams<{ classId: string; batchId: string }>();
  const { classId, batchId } = params;
  const queryClient = useQueryClient();

  const { mutateAsync: unArchieveBatch, isPending: isUnarchivingBatch } =
    useMutation(orpc.owner.batch.unArchieveBatch.mutationOptions());
  const { mutateAsync: unArchieveClass, isPending: isUnarchivingClass } =
    useMutation(orpc.owner.class.unArchieveClass.mutationOptions());

  const isPending = isUnarchivingBatch || isUnarchivingClass;

  const restore = () => {
    const promise =
      scope === "class"
        ? unArchieveClass({ id: classId })
        : unArchieveBatch({ batchId });

    toast.promise(
      promise.then(() => {
        // Coming from an error page — refetch everything so the restored
        // batch's pages hydrate correctly.
        queryClient.invalidateQueries();
      }),
      {
        loading: scope === "class" ? "Restoring class..." : "Restoring batch...",
        success: scope === "class" ? "Class restored" : "Batch restored",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to restore",
      },
    );
  };

  const isClass = scope === "class";

  return (
    <Card className="border-dashed py-0">
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Archive />
          </EmptyMedia>
          <EmptyTitle>
            {isClass ? "Class archived" : "Batch archived"}
          </EmptyTitle>
          <EmptyDescription>
            {isClass
              ? "This batch's class is archived, so its pages are unavailable. Restore the class to make changes again."
              : "This batch is archived, so its pages are unavailable. Restore it to make changes again."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={restore} disabled={isPending}>
            {isClass ? "Restore Class" : "Restore Batch"}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/class/${classId}/batch/${batchId}/overview`} />
              }
            >
              Go to Overview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/class" />}
            >
              Back to Classes
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </Card>
  );
}
