import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { ATTENDANCE_STATUS_STYLES } from "./utils";

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
}

export function AttendanceStatusBadge({
  status,
  className,
}: AttendanceStatusBadgeProps) {
  const style = ATTENDANCE_STATUS_STYLES[status];
  return (
    <Badge className={cn(style.className, className)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </Badge>
  );
}
