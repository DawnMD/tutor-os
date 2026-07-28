const STATUS = {
  present: { label: "Present", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  late: { label: "Late", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  absent: { label: "Absent", text: "text-destructive", dot: "bg-destructive" },
  excused: { label: "Excused", text: "text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
} as const;

const ROWS: {
  name: string;
  initials: string;
  batch: string;
  status: keyof typeof STATUS;
}[] = [
  { name: "Ananya Sharma", initials: "AS", batch: "Physics XI-A", status: "present" },
  { name: "Rohan Iyer", initials: "RI", batch: "Physics XI-A", status: "present" },
  { name: "Kavya Reddy", initials: "KR", batch: "Physics XI-A", status: "late" },
  { name: "Arjun Menon", initials: "AM", batch: "Physics XI-A", status: "present" },
  { name: "Diya Nair", initials: "DN", batch: "Physics XI-A", status: "absent" },
  { name: "Vikram Rao", initials: "VR", batch: "Physics XI-A", status: "excused" },
];

export function AttendanceMockup() {
  return (
    <div aria-hidden className="pointer-events-none select-none text-xs">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-heading text-sm font-semibold tracking-wide uppercase">
            Today&apos;s attendance
          </p>
          <p className="text-[0.625rem] text-muted-foreground">
            Physics XI-A · 27 Oct
          </p>
        </div>
        <span className="bg-emerald-500/10 px-3 py-1.5 text-[0.625rem] font-semibold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
          23 / 25 present
        </span>
      </div>

      <div className="flex flex-col divide-y divide-border ring-1 ring-foreground/5">
        {ROWS.map((row) => {
          const s = STATUS[row.status];
          return (
            <div
              key={row.name}
              className="flex items-center gap-3 bg-background px-3 py-2"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium text-muted-foreground">
                {row.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-[0.625rem] text-muted-foreground">
                  {row.batch}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-widest uppercase ${s.text}`}
              >
                <span className={`size-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
