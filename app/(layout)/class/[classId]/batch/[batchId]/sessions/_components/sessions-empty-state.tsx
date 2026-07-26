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
import { CalendarPlus, Plus } from "lucide-react";

export function SessionsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed py-0">
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-full">
            <CalendarPlus className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No Sessions Yet</EmptyTitle>
          <EmptyDescription>
            Start your first class session to begin tracking attendance, topics
            and homework.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={onCreate}>
          <Plus className="size-4" />
          Create Session
        </Button>
      </Empty>
    </Card>
  );
}
