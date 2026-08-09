"use client";

import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Organization = { id: string; name: string };

/**
 * Replacement for Clerk's `<OrganizationList hidePersonal />`. The list is
 * rendered on the server so there's no empty flash; switching and creating stay
 * on the client because both rewrite the session cookie.
 */
export function OrganizationPicker({
  organizations,
}: {
  organizations: Organization[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const afterSetActive = () => {
    queryClient.invalidateQueries();
    router.push("/dashboard");
    router.refresh();
  };

  async function selectOrganization(organizationId: string) {
    setSwitchingTo(organizationId);

    const { error } = await authClient.organization.setActive({
      organizationId,
    });

    if (error) {
      setSwitchingTo(null);
      toast.error(error.message ?? "Could not open that workspace.");
      return;
    }

    afterSetActive();
  }

  return (
    <>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {organizations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have a workspace yet. Create one to get started — or
            ask your tutor to re-send your invitation if you were expecting one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {organizations.map((organization) => (
              <li key={organization.id}>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={switchingTo !== null}
                  onClick={() => selectOrganization(organization.id)}
                >
                  {organization.name}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button onClick={() => setOpenDialog(true)}>
          <PlusIcon />
          Create workspace
        </Button>
      </div>

      <CreateOrganizationDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onCreated={afterSetActive}
      />
    </>
  );
}
