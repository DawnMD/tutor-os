import { cn } from "@/lib/utils";

/**
 * Fake browser chrome wrapper for the coded UI mockups. Purely decorative:
 * hidden from assistive tech and non-interactive.
 */
export function MockupFrame({
  url = "tutoros.app/dashboard",
  className,
  children,
}: {
  url?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none overflow-hidden bg-card text-card-foreground shadow-sm ring-1 ring-foreground/5 select-none",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="mx-auto w-full max-w-[16rem] truncate rounded-none bg-background px-3 py-1 text-center text-[0.625rem] tracking-wide text-muted-foreground ring-1 ring-foreground/5">
          {url}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
