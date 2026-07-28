"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatPaise } from "@/lib/currency";
import {
  BanknoteArrowUp,
  Clock,
  LucideIcon,
  ReceiptText,
  Users,
} from "lucide-react";
import type { FeesKpis } from "./utils";

interface FeesKpiCardsProps {
  kpis: FeesKpis;
}

interface Kpi {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function FeesKpiCards({ kpis }: FeesKpiCardsProps) {
  const list: Kpi[] = [
    {
      label: "Expected",
      value: formatPaise(kpis.expectedPaise),
      hint: `${kpis.dueCount} ${kpis.dueCount === 1 ? "student due" : "students due"}`,
      icon: ReceiptText,
    },
    {
      label: "Collected",
      value: formatPaise(kpis.collectedPaise),
      hint: "Paid this month",
      icon: BanknoteArrowUp,
    },
    {
      label: "Paid",
      value: `${kpis.paidCount} of ${kpis.dueCount}`,
      hint: "Students paid",
      icon: Users,
    },
    {
      label: "Pending",
      value: formatPaise(kpis.pendingPaise),
      hint:
        kpis.dueCount - kpis.paidCount === 1
          ? "1 student pending"
          : `${kpis.dueCount - kpis.paidCount} students pending`,
      icon: Clock,
      accent: kpis.pendingPaise > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((kpi) => (
        <Card key={kpi.label} size="sm">
          <CardContent className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {kpi.label}
              </p>
              <p className="truncate text-2xl font-bold tracking-tight">
                {kpi.value}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {kpi.hint}
              </p>
            </div>
            <div
              className={
                kpi.accent
                  ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              }
            >
              <kpi.icon className="size-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
