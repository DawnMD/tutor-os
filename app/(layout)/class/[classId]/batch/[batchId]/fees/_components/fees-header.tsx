"use client";

import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/currency";
import type { FeePeriod } from "@/lib/fee-periods";
import { ChevronLeft, ChevronRight, Pencil, Users } from "lucide-react";
import { isAtOrAfterCurrent, periodLabel, type FeesPage } from "./utils";

interface FeesHeaderProps {
  batch: FeesPage;
  period: FeePeriod;
  onPrev: () => void;
  onNext: () => void;
  onEditFee: () => void;
}

export function FeesHeader({
  batch,
  period,
  onPrev,
  onNext,
  onEditFee,
}: FeesHeaderProps) {
  const studentCount = batch.students.length;
  const atCurrent = isAtOrAfterCurrent(period);

  return (
    <div
      data-tour="fees-header"
      className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between"
    >
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
          {batch.monthlyFeePaise != null && (
            <span>
              Monthly fee{" "}
              <span className="font-medium text-foreground">
                {formatPaise(batch.monthlyFeePaise)}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrev}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium tabular-nums">
            {periodLabel(period)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={atCurrent}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button variant="outline" data-tour="fees-set-fee" onClick={onEditFee}>
          <Pencil className="size-4" />
          <span className="hidden sm:inline">Edit fee</span>
        </Button>
      </div>
    </div>
  );
}
