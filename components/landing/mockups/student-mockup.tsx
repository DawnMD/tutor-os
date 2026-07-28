import { CalendarCheck, IndianRupee, NotebookPen } from "lucide-react";

export function StudentMockup() {
  return (
    <div
      aria-hidden
      className="pointer-events-none mx-auto w-full max-w-[15rem] select-none text-xs"
    >
      <div className="overflow-hidden bg-card ring-1 ring-foreground/5">
        {/* Phone status bar */}
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 text-[0.5625rem] text-muted-foreground">
          <span>9:41</span>
          <span className="font-heading tracking-wider uppercase">TutorOS</span>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <p className="text-[0.625rem] text-muted-foreground">Welcome back,</p>
            <p className="font-heading text-sm font-semibold tracking-wide uppercase">
              Ananya Sharma
            </p>
          </div>

          {/* Attendance */}
          <div className="bg-background p-3 ring-1 ring-foreground/5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarCheck className="size-3.5" />
              <span className="text-[0.625rem] tracking-wide uppercase">
                My attendance
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              94%
            </p>
            <p className="text-[0.5625rem] text-muted-foreground">
              Physics XI-A · this term
            </p>
          </div>

          {/* Next exam */}
          <div className="flex items-center gap-2 bg-background p-3 ring-1 ring-foreground/5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <NotebookPen className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                Next exam
              </p>
              <p className="truncate font-medium">Unit Test 3 · 4 Nov</p>
            </div>
          </div>

          {/* Fee */}
          <div className="bg-background p-3 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.5625rem] tracking-wide text-muted-foreground uppercase">
                  October fee
                </p>
                <p className="text-sm font-bold tracking-tight">₹1,500</p>
              </div>
              <span className="bg-amber-500/10 px-2 py-1 text-[0.5625rem] font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                Due
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 bg-primary py-2 text-[0.625rem] font-semibold tracking-widest text-primary-foreground uppercase">
              <IndianRupee className="size-3" />
              Pay via UPI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
