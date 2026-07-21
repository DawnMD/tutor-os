"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/orpc/client";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  workspace: z.string(),
});

export function TeamSwitcher() {
  const queryClient = useQueryClient();

  const { isMobile, setOpenMobile } = useSidebar();

  const [openDialog, setOpenDialog] = useState(false);

  const { userMemberships, isLoaded, setActive, createOrganization } =
    useOrganizationList({
      userMemberships: {
        infinite: true,
      },
    });

  const { organization, isLoaded: isOrganizationLoaded } = useOrganization();

  const memberships = userMemberships.data ?? [];

  const ownedOrganizations = memberships.map((item) => item);

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error //resolver issue
    resolver: zodResolver(formSchema),
    defaultValues: {
      workspace: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!createOrganization) return;
    toast.promise(
      createOrganization({
        name: data.workspace,
      })
        .then((data) =>
          setActive({
            organization: data.id,
          }),
        )
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: orpc.owner.class.getAllClass.queryKey(),
          });
          setOpenDialog(false);
          setOpenMobile(false);
        }),
      {
        loading: "Creating workspace",
        success: "Workspace created and switched",
        error: "Failed to create workspace",
      },
    );
  }

  if (!isLoaded || !isOrganizationLoaded || !organization) {
    return <Skeleton className="h-14" />;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
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
                    key={team.organization.id}
                    onClick={() =>
                      toast.promise(
                        setActive({
                          organization: team.organization.id,
                        }).then(() => {
                          queryClient.invalidateQueries({
                            queryKey: orpc.owner.class.getAllClass.queryKey(),
                          });
                        }),
                        {
                          loading: "Switching workspace",
                          success: "Workspace switched",
                          error: "Failed to switch workspace",
                        },
                      )
                    }
                    disabled={team.organization.id === organization.id}
                    className="gap-2 p-2"
                  >
                    {team.organization.name}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => setOpenDialog(true)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <PlusIcon className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Add workspace
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <Dialog
        disablePointerDismissal
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <form id="create-workspace" onSubmit={form.handleSubmit(onSubmit)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create workspace</DialogTitle>
              <DialogDescription>
                Create new workspace here. Click create when you&apos;ve chosen.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Controller
                name="workspace"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="workspace">Workspace Title</FieldLabel>
                    <Input
                      {...field}
                      id="workspace"
                      aria-invalid={fieldState.invalid}
                      placeholder="Salt Lake Batch"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                form="create-workspace"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
