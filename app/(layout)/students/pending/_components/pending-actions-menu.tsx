"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PendingInvitation } from "./pending-columns";

export const PendingActionsMenu = ({
  invitation,
}: {
  invitation: PendingInvitation;
}) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: orpc.owner.student.getPendingInvitations.queryKey(),
    });
  };

  const { mutateAsync: resendInvitation } = useMutation(
    orpc.owner.student.resendInvitation.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  const { mutateAsync: revokeInvitation } = useMutation(
    orpc.owner.student.revokeInvitation.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-8 w-8 p-0" />}
      >
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              toast.promise(
                resendInvitation({ invitationId: invitation.id }),
                {
                  loading: "Resending invitation...",
                  success: "Invitation resent",
                  error: "Failed to resend invitation",
                },
              );
            }}
          >
            Resend Invitation
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              toast.promise(
                revokeInvitation({ invitationId: invitation.id }),
                {
                  loading: "Revoking invitation...",
                  success: "Invitation revoked",
                  error: "Failed to revoke invitation",
                },
              );
            }}
          >
            Revoke Invitation
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
