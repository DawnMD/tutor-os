"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  Archive,
  ArchiveRestore,
  ArrowRightLeft,
  CalendarDays,
  GraduationCap,
  Layers,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { useStudentActions } from "./student-actions";
import { getInitials, StudentDashboard } from "./utils";

interface StudentHeaderProps {
  student: StudentDashboard;
}

export function StudentHeader({ student }: StudentHeaderProps) {
  const membership = student.batches[0];
  const batchName = membership?.batch.name ?? "—";
  const className = membership?.batch.class.name ?? "—";
  const joinedAt = membership?.joinedAt;
  const isActive = !student.archivedAt;

  const { openEdit, openMove, openArchive, unarchive, isArchived } =
    useStudentActions();

  return (
    <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <Avatar size="lg" className="size-16 text-base">
          <AvatarFallback className="text-base font-semibold">
            {getInitials(student.fullName, student.email)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {student.fullName ?? student.email}
            </h1>
            <Badge
              className={
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }
            >
              <span
                className={`size-1.5 rounded-full ${
                  isActive ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
                aria-hidden
              />
              {isActive ? "Active" : "Archived"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="size-3.5" />
              {batchName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="size-3.5" />
              {className}
            </span>
            {joinedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Joined {format(new Date(joinedAt), "d MMM yyyy")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            <MoreHorizontal />
            <span>Actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openEdit} disabled={isArchived}>
              <Pencil />
              Edit Student
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openMove} disabled={isArchived}>
              <ArrowRightLeft />
              Move to Another Batch
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isArchived ? (
              <DropdownMenuItem onClick={unarchive}>
                <ArchiveRestore />
                Unarchive Student
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive"
                onClick={openArchive}
              >
                <Archive />
                Archive Student
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
