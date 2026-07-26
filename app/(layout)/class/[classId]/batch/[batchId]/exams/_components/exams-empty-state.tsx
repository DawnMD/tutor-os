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
import { GraduationCap, Plus } from "lucide-react";

export function ExamsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed py-0">
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-full">
            <GraduationCap className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No Exams Yet</EmptyTitle>
          <EmptyDescription>
            Create your first exam to start recording marks and tracking this
            batch&apos;s progress.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={onCreate}>
          <Plus className="size-4" />
          Create Exam
        </Button>
      </Empty>
    </Card>
  );
}
