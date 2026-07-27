"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  // next-themes resolves the active theme only on the client, so hold a
  // stable value during hydration to avoid a mismatch. useSyncExternalStore
  // returns the server snapshot (false) then the client snapshot (true)
  // without an effect or cascading render.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const active = mounted ? (theme ?? "system") : "system";

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn(
        "flex w-full items-center gap-1 rounded-lg border border-border bg-muted/60 p-1",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "border border-border bg-background text-foreground shadow-sm"
                : "border border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full transition-colors",
                isActive ? "bg-primary" : "bg-muted-foreground/40",
              )}
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
