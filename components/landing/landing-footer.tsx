import Link from "next/link";

import { Wordmark } from "./section";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Wordmark />
          <p className="text-sm text-muted-foreground">
            Built for tuition and coaching institutes in India.
          </p>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/sign-in"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Get started
          </Link>
        </nav>
      </div>
      <div className="mx-auto mt-8 w-full max-w-6xl border-t border-border pt-6">
        <p className="text-xs tracking-wide text-muted-foreground">
          © 2026 TutorOS
        </p>
      </div>
    </footer>
  );
}
