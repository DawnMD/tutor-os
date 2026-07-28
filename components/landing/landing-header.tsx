import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { Wordmark } from "./section";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Wordmark />
        <nav className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
