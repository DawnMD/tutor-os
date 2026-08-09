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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  workspace: z.string().trim().min(1, "Give the workspace a name").max(80),
});

/**
 * Create a workspace and switch to it.
 *
 * Creation goes through the server (`org.create`) because Better Auth needs a
 * unique slug; activation stays on the client so the session cookie the switch
 * rewrites actually reaches the browser.
 */
export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { workspace: "" },
  });

  const createOrganization = useMutation(orpc.org.create.mutationOptions());

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await toast.promise(
      (async () => {
        const organization = await createOrganization.mutateAsync({
          name: data.workspace,
        });

        const { error } = await authClient.organization.setActive({
          organizationId: organization.id,
        });

        if (error) throw new Error(error.message);

        form.reset();
        onOpenChange(false);
        onCreated();
      })(),
      {
        loading: "Creating workspace",
        success: "Workspace created and switched",
        error: (error) =>
          error instanceof Error && error.message
            ? error.message
            : "Failed to create workspace",
      },
    );
  }

  return (
    <Dialog disablePointerDismissal open={open} onOpenChange={onOpenChange}>
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
  );
}
