import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        404
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Back to dashboard
      </Button>
    </main>
  );
}
