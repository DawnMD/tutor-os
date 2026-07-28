import {
  CalendarCheck,
  IndianRupee,
  LayoutDashboard,
  Layers,
  NotebookPen,
  TrendingUp,
  Users,
} from "lucide-react";

const KPIS = [
  { label: "Active students", value: "128", hint: "6 classes", icon: Users },
  { label: "Active batches", value: "9", hint: "Across classes", icon: Layers },
  {
    label: "Sessions / week",
    value: "14",
    hint: "Completed",
    icon: CalendarCheck,
  },
  { label: "Attendance", value: "92%", hint: "Last 30 days", icon: TrendingUp },
];

// Fixed heights (as %) for the pure-CSS attendance-trend bar chart.
const BARS = [72, 84, 66, 90, 78, 94, 88, 92];
const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Classes", icon: Layers, active: false },
  { label: "Attendance", icon: CalendarCheck, active: false },
  { label: "Exams", icon: NotebookPen, active: false },
  { label: "Fees", icon: IndianRupee, active: false },
];

export function DashboardMockup() {
  return (
    <div aria-hidden className="pointer-events-none flex select-none text-xs">
      {/* Sidebar */}
      <div className="hidden w-40 shrink-0 flex-col gap-4 border-r border-border pr-4 sm:flex">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center bg-primary text-[0.5rem] font-bold text-primary-foreground">
            T
          </span>
          <span className="font-heading text-[0.7rem] font-semibold tracking-wider uppercase">
            Sunrise Academy
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <span
              key={item.label}
              className={
                item.active
                  ? "flex items-center gap-2 bg-muted px-2 py-1.5 font-medium text-foreground"
                  : "flex items-center gap-2 px-2 py-1.5 text-muted-foreground"
              }
            >
              <item.icon className="size-3.5" />
              {item.label}
            </span>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="min-w-0 flex-1 sm:pl-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-heading text-sm font-semibold tracking-wide uppercase">
              Dashboard
            </p>
            <p className="text-[0.625rem] text-muted-foreground">
              Monday, 27 October
            </p>
          </div>
          <span className="bg-primary px-3 py-1.5 text-[0.625rem] font-semibold tracking-widest text-primary-foreground uppercase">
            + New session
          </span>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {KPIS.map((kpi) => (
            <div
              key={kpi.label}
              className="flex flex-col gap-1 bg-background p-2.5 ring-1 ring-foreground/5"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[0.5625rem] font-medium tracking-wide uppercase">
                  {kpi.label}
                </span>
                <kpi.icon className="size-3" />
              </div>
              <span className="text-base font-bold tracking-tight">
                {kpi.value}
              </span>
              <span className="text-[0.5625rem] text-muted-foreground">
                {kpi.hint}
              </span>
            </div>
          ))}
        </div>

        {/* Attendance trend chart */}
        <div className="mt-3 bg-background p-3 ring-1 ring-foreground/5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.625rem] font-semibold tracking-wide uppercase">
              Attendance trend
            </span>
            <span className="text-[0.5625rem] text-muted-foreground">
              8 weeks
            </span>
          </div>
          <div className="flex h-24 items-end justify-between gap-1.5">
            {BARS.map((height, i) => (
              <div
                key={WEEK_LABELS[i]}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full bg-primary/80"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[0.5rem] text-muted-foreground">
                  {WEEK_LABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
