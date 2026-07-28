import Link from "next/link";

import { cn } from "@/lib/utils";

/** Coded brand wordmark: amber square glyph + TUTOROS caps. No image assets. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="flex size-6 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
        T
      </span>
      <span className="font-heading text-base font-semibold tracking-wide uppercase">
        TutorOS
      </span>
    </Link>
  );
}

/** Small uppercase micro-type label used above section headings. */
export function EyebrowLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      {children}
    </p>
  );
}

/** Section wrapper: vertical rhythm + centered max-width container. */
export function Section({
  children,
  className,
  containerClassName,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("px-4 py-16 sm:py-24", className)}>
      <div className={cn("mx-auto w-full max-w-6xl", containerClassName)}>
        {children}
      </div>
    </section>
  );
}
