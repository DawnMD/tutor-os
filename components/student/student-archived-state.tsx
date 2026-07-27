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
import { Archive } from "lucide-react";
import Link from "next/link";

/**
 * Read-only "no longer available" state shown on a student batch sub-page when
 * the batch — or its parent class — has been archived by the tutor. Unlike the
 * owner `BatchArchivedState`, students have no Restore action; they're offered
 * a way back to their dashboard.
 */
export function StudentArchivedState({ scope }: { scope: "batch" | "class" }) {
  const isClass = scope === "class";

  return (
    <Card className="border-dashed py-0">
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Archive />
          </EmptyMedia>
          <EmptyTitle>No longer available</EmptyTitle>
          <EmptyDescription>
            {isClass
              ? "This batch's class has been archived by your tutor, so its pages are no longer available."
              : "This batch has been archived by your tutor, so its pages are no longer available."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Back to Dashboard
          </Button>
        </EmptyContent>
      </Empty>
    </Card>
  );
}
