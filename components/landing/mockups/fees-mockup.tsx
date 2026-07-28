import { BanknoteArrowUp, Clock } from "lucide-react";

const ROWS: {
  name: string;
  initials: string;
  amount: string;
  status: "paid" | "due";
  method?: string;
}[] = [
  { name: "Ananya Sharma", initials: "AS", amount: "₹1,500", status: "paid", method: "UPI" },
  { name: "Rohan Iyer", initials: "RI", amount: "₹1,500", status: "paid", method: "UPI" },
  { name: "Kavya Reddy", initials: "KR", amount: "₹1,500", status: "due" },
  { name: "Arjun Menon", initials: "AM", amount: "₹1,500", status: "paid", method: "UPI" },
];

export function FeesMockup() {
  return (
    <div aria-hidden className="pointer-events-none select-none text-xs">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="flex items-start justify-between gap-2 bg-background p-2.5 ring-1 ring-foreground/5">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[0.5625rem] font-medium tracking-wide text-muted-foreground uppercase">
              Collected
            </p>
            <p className="text-base font-bold tracking-tight">₹67,500</p>
            <p className="text-[0.5625rem] text-muted-foreground">
              Paid this month
            </p>
          </div>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BanknoteArrowUp className="size-3.5" />
          </span>
        </div>
        <div className="flex items-start justify-between gap-2 bg-background p-2.5 ring-1 ring-foreground/5">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[0.5625rem] font-medium tracking-wide text-muted-foreground uppercase">
              Pending
            </p>
            <p className="text-base font-bold tracking-tight">₹16,500</p>
            <p className="text-[0.5625rem] text-muted-foreground">
              11 students pending
            </p>
          </div>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="size-3.5" />
          </span>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border ring-1 ring-foreground/5">
        {ROWS.map((row) => (
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
                October fee
              </p>
            </div>
            <span className="text-xs font-semibold tracking-tight">
              {row.amount}
            </span>
            {row.status === "paid" ? (
              <span className="inline-flex w-16 items-center justify-end gap-1.5 text-[0.625rem] font-semibold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Paid · {row.method}
              </span>
            ) : (
              <span className="inline-flex w-16 items-center justify-end gap-1.5 text-[0.625rem] font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Due
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-center text-[0.5625rem] tracking-wide text-muted-foreground uppercase">
        Powered by Razorpay
      </p>
    </div>
  );
}
