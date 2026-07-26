"use client";

import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { STATUS_META, STATUS_ORDER } from "./utils";

interface StatusSegmentedProps {
  value: AttendanceStatus | null;
  onChange: (status: AttendanceStatus) => void;
  /** Compact variant packs the buttons tighter for narrow / mobile layouts. */
  size?: "default" | "sm";
  disabled?: boolean;
  className?: string;
}

/**
 * A one-tap segmented selector for a student's attendance status. Buttons are
 * removed from the tab order (`tabIndex={-1}`) so keyboard users move row-to-row
 * and set status with the P/A/L/E shortcuts handled by the parent list.
 */
export function StatusSegmented({
  value,
  onChange,
  size = "default",
  disabled,
  className,
}: StatusSegmentedProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Attendance status"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted/60 p-0.5",
        className,
      )}
    >
      {STATUS_ORDER.map((status) => {
        const meta = STATUS_META[status];
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={meta.label}
            title={`${meta.label} (${meta.short})`}
            tabIndex={-1}
            disabled={disabled}
            onClick={() => onChange(status)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              size === "sm"
                ? "h-7 px-2 text-xs"
                : "h-8 px-2.5 text-xs sm:px-3 sm:text-sm",
              active
                ? meta.active
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                active ? meta.dot : "bg-current opacity-40",
              )}
            />
            <span className={size === "sm" ? "hidden sm:inline" : ""}>
              {meta.label}
            </span>
            <span className={size === "sm" ? "sm:hidden" : "hidden"}>
              {meta.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
