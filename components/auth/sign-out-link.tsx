"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/** Signs out and reloads, so the current page re-renders its signed-out branch. */
export function SignOutLink({ label = "Sign out" }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);

        const { error } = await authClient.signOut();

        if (error) {
          setPending(false);
          toast.error("Could not sign out. Try again.");
          return;
        }

        router.refresh();
      }}
    >
      {pending ? "Signing out…" : label}
    </Button>
  );
}
