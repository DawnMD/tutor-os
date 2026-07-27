"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckSquare,
  FileText,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import { useStudentActions } from "./student-actions";

export function QuickActionsCard() {
  const { openMarkAttendance, openAddExamResult, isArchived } =
    useStudentActions();

  const actions = [
    { icon: CheckSquare, label: "Mark Attendance", onClick: openMarkAttendance },
    { icon: GraduationCap, label: "Add Exam Result", onClick: openAddExamResult },
  ] as const;

  const comingSoon = [
    { icon: FileText, label: "Upload Notes" },
    { icon: Megaphone, label: "Send Announcement" },
  ] as const;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={action.onClick}
            disabled={isArchived}
          >
            <action.icon />
            {action.label}
          </Button>
        ))}

        {comingSoon.map((action) => (
          <Tooltip key={action.label}>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled
                />
              }
            >
              <action.icon />
              {action.label}
              <span className="ml-auto text-xs text-muted-foreground">
                Soon
              </span>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        ))}
      </CardContent>
    </Card>
  );
}
