import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";

type StatusStyle = {
  label: string;
  className: string;
  dot: string;
};

/** Flat, colored status styles matching the owner attendance components. */
export const ATTENDANCE_STATUS_STYLES: Record<AttendanceStatus, StatusStyle> = {
  [AttendanceStatus.PRESENT]: {
    label: "Present",
    className: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  [AttendanceStatus.ABSENT]: {
    label: "Absent",
    className: "text-destructive",
    dot: "bg-destructive",
  },
  [AttendanceStatus.LATE]: {
    label: "Late",
    className: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  [AttendanceStatus.EXCUSED]: {
    label: "Excused",
    className: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
};

export function AttendanceStatusBadge({
  status,
  className,
}: {
  status: AttendanceStatus;
  className?: string;
}) {
  const style = ATTENDANCE_STATUS_STYLES[status];
  return (
    <Badge className={cn(style.className, className)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </Badge>
  );
}
