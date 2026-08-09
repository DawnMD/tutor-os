"use client";

import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function TeamSwitcher({ canCreate = false }: { canCreate?: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isMobile, setOpenMobile } = useSidebar();

  // An org switch can change the viewer's role; re-land on /dashboard and
  // refresh so the branched server pages re-render for the new role.
  const afterSetActive = () => {
    queryClient.invalidateQueries();
    router.push("/dashboard");
    router.refresh();
  };

  const [openDialog, setOpenDialog] = useState(false);

  const { data: organizations, isPending } = authClient.useListOrganizations();
  const { data: organization, isPending: isOrganizationPending } =
    authClient.useActiveOrganization();

  if (isPending || isOrganizationPending || !organization) {
    return <Skeleton className="h-14" />;
  }

  const ownedOrganizations = organizations ?? [];

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem data-tour="team-switcher">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                />
              }
            >
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {organization.name}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-fit"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                {ownedOrganizations.map((team, index) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() =>
                      toast.promise(
                        authClient.organization
                          .setActive({ organizationId: team.id })
                          .then(({ error }) => {
                            if (error) throw new Error(error.message);
                            afterSetActive();
                          }),
                        {
                          loading: "Switching workspace",
                          success: "Workspace switched",
                          error: "Failed to switch workspace",
                        },
                      )
                    }
                    disabled={team.id === organization.id}
                    className="gap-2 p-2"
                  >
                    {team.name}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {canCreate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="gap-2 p-2"
                      onClick={() => setOpenDialog(true)}
                    >
                      <div className="flex size-6 items-center justify-center border bg-transparent">
                        <PlusIcon className="size-4" />
                      </div>
                      <div className="font-medium text-muted-foreground">
                        Add workspace
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <CreateOrganizationDialog
        open={canCreate && openDialog}
        onOpenChange={setOpenDialog}
        onCreated={() => {
          setOpenMobile(false);
          afterSetActive();
        }}
      />
    </>
  );
}
