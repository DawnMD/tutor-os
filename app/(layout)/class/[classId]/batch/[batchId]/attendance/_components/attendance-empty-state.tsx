"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ClipboardCheck, Play } from "lucide-react";
import { toast } from "sonner";

interface AttendanceEmptyStateProps {
  batchId: string;
  hasStudents: boolean;
}

export function AttendanceEmptyState({
  batchId,
  hasStudents,
}: AttendanceEmptyStateProps) {
  const queryClient = useQueryClient();
  const startMutation = useMutation(
    orpc.owner.batchSession.createSession.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.attendance.getAttendanceOverview.queryKey({
            input: { batchId },
          }),
        });
      },
    }),
  );

  const startToday = () => {
    const today = new Date();
    toast.promise(
      startMutation.mutateAsync({
        batchId,
        classDate: today,
        topic: `Class · ${format(today, "d MMM yyyy")}`,
      }),
      {
        loading: "Starting today's session...",
        success: "Today's session started",
        error: (err) =>
          err instanceof Error ? err.message : "Could not start session",
      },
    );
  };

  return (
    <Card className="border-dashed py-0">
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-full">
            <ClipboardCheck className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No Attendance Records</EmptyTitle>
          <EmptyDescription>
            {hasStudents
              ? "Start today's session and mark attendance to begin tracking who's in class."
              : "Add students to this batch first, then start a session to mark attendance."}
          </EmptyDescription>
        </EmptyHeader>
        <Button
          onClick={startToday}
          disabled={!hasStudents || startMutation.isPending}
        >
          <Play className="size-4" />
          Start Session
        </Button>
      </Empty>
    </Card>
  );
}
