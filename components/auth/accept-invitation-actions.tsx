"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Accept / decline buttons for a pending invitation.
 *
 * Accepting is an explicit click rather than a `useEffect` on mount: under
 * React's dev double-render that would fire the mutation twice, and a failure
 * would have nowhere to surface.
 */
export function AcceptInvitationActions({
  invitationId,
  organizationId,
}: {
  invitationId: string;
  organizationId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<"accept" | "reject" | null>(null);

  async function accept() {
    setPending("accept");

    const { error } = await authClient.organization.acceptInvitation({
      invitationId,
    });

    if (error) {
      setPending(null);
      toast.error(error.message ?? "Could not accept this invitation.");
      return;
    }

    // The `afterAcceptInvitation` hook has already written the Student row by
    // the time this resolves, so the dashboard renders fully on first paint.
    const { error: activateError } = await authClient.organization.setActive({
      organizationId,
    });

    if (activateError) {
      setPending(null);
      toast.error("Joined, but couldn't open the workspace. Try signing in.");
      return;
    }

    queryClient.invalidateQueries();
    router.push("/dashboard");
    router.refresh();
  }

  async function reject() {
    setPending("reject");

    const { error } = await authClient.organization.rejectInvitation({
      invitationId,
    });

    if (error) {
      setPending(null);
      toast.error(error.message ?? "Could not decline this invitation.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1"
        disabled={pending !== null}
        onClick={accept}
      >
        {pending === "accept" ? "Joining…" : "Accept invitation"}
      </Button>
      <Button
        variant="outline"
        disabled={pending !== null}
        onClick={reject}
      >
        Decline
      </Button>
    </div>
  );
}
