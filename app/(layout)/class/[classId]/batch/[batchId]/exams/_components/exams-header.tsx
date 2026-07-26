"use client";

import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Plus } from "lucide-react";
import { ExamsPage } from "./utils";

interface ExamsHeaderProps {
  batch: ExamsPage;
  onCreate: () => void;
}

export function ExamsHeader({ batch, onCreate }: ExamsHeaderProps) {
  const studentCount = batch._count.students;

  return (
    <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {batch.class.name}
          </h1>
          <span className="text-2xl font-bold tracking-tight text-muted-foreground sm:text-3xl">
            {batch.name}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {studentCount} active {studentCount === 1 ? "student" : "students"}
          </span>
          <span>Exams &amp; results</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Create Exam</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
    </div>
  );
}
