"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { orpc } from "@/orpc/client";
import { Outputs } from "@/orpc/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Checkbox } from "./ui/checkbox";

type JoinedStudent =
  Outputs["owner"]["student"]["getActiveStudentsByOrg"][number];

const columns: ColumnDef<JoinedStudent>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "batches",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Batches" />
    ),
    cell: ({ row }) => {
      const data = row.original;
      const formatted = data.batches.map((item) => item.name).join(", ");

      return <Badge variant={"outline"}>{formatted}</Badge>;
    },
  },
  {
    accessorKey: "joinedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined At" />
    ),
    cell: ({ row }) => {
      const data = row.original;
      const formatted = format(data.joinedAt, "PPP");

      return formatted;
    },
  },
  {
    accessorKey: "actions",
    cell: ({ row }) => {
      const userId = row.original.user_id;
      const id = row.original.id;
      const batches = row.original.batches;

      return (
        <JoinedStudentTableActionButton
          userId={userId}
          id={id}
          batches={batches.map((item) => item.id)}
        />
      );
    },
  },
];

const formSchema = z.object({
  batches: z.array(z.string()),
});

const JoinedStudentTableActionButton = ({
  userId,
  id,
  batches,
}: {
  userId: string;
  id: string;
  batches: JoinedStudent["batches"][number]["id"][];
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: allBatches } = useQuery(
    orpc.owner.batch.getBatchByOrg.queryOptions(),
  );

  const { mutateAsync: archieveStudent } = useMutation(
    orpc.owner.student.archieveStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getActiveStudentsByOrg.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getArchieveStudentsByOrg.queryKey(),
        });
      },
    }),
  );

  const { mutateAsync: addStudentToBatches } = useMutation(
    orpc.owner.student.addStudentToBatches.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getActiveStudentsByOrg.queryKey(),
        });
        setOpen(false);
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error //resolver issue
    resolver: zodResolver(formSchema),
    defaultValues: {
      batches: batches,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        batches: batches,
      });
    }
  }, [open, batches, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast.promise(
      addStudentToBatches({
        batchIds: data.batches,
        studentId: id,
      }),
      {
        loading: "Saving changes...",
        success: "Saved",
        error: "Failed to save changes",
      },
    );
  }

  return (
    <>
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
              onClick={() =>
                toast.promise(archieveStudent({ studentId: userId }), {
                  loading: "Archieving",
                  success: "Archieved",
                  error: "Failed to archieve",
                })
              }
            >
              Archieve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              Add To Batches
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
        <form id="add-to-batches" onSubmit={form.handleSubmit(onSubmit)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add student to batches</DialogTitle>
              <DialogDescription>
                You can add student to multiple batches. Click save when
                you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Controller
                name="batches"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FieldSet>
                    <FieldLegend variant="label">Batches</FieldLegend>
                    <FieldGroup data-slot="checkbox-group">
                      {allBatches?.map((batch) => (
                        <Field
                          key={batch.id}
                          orientation="horizontal"
                          data-invalid={fieldState.invalid}
                        >
                          <Checkbox
                            id={`add-to-batches-checkbox-${batch.id}`}
                            name={field.name}
                            aria-invalid={fieldState.invalid}
                            checked={field.value.includes(batch.id)}
                            onCheckedChange={(checked) => {
                              field.onChange(
                                checked
                                  ? [...field.value, batch.id]
                                  : field.value.filter((id) => id !== batch.id),
                              );
                            }}
                          />
                          <FieldLabel
                            htmlFor={`add-to-batches-checkbox-${batch.id}`}
                            className="font-normal"
                          >
                            {batch.name}
                          </FieldLabel>
                        </Field>
                      ))}
                    </FieldGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldSet>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button type="submit" form="add-to-batches">
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
};

export const JoinedStudentsTable = () => {
  const { data: joinedStudents, isLoading } = useQuery(
    orpc.owner.student.getActiveStudentsByOrg.queryOptions(),
  );

  return (
    <DataTable data={joinedStudents} columns={columns} loading={isLoading} />
  );
};
