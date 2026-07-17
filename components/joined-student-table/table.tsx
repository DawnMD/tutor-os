"use client";

import { orpc } from "@/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const formSchema = z.object({
  email: z.email(),
});

export const JoinedStudentsTable = () => {
  const queryClient = useQueryClient();

  const { data: joinedStudents } = useQuery(
    orpc.owner.student.getActiveStudentsByOrg.queryOptions(),
  );

  const { data: pendingInvitations } = useQuery(
    orpc.owner.student.getPendingStudentsByOrg.queryOptions(),
  );

  const { mutate } = useMutation(
    orpc.owner.student.addStundent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getPendingStudentsByOrg.queryKey(),
        });
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error //zodResolver type error
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutate({
      email: data.email,
    });
  };

  console.log(pendingInvitations);

  if (!joinedStudents) {
    return null;
  }

  return (
    <div>
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <form id="add-student" onSubmit={form.handleSubmit(onSubmit)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Student</DialogTitle>
              <DialogDescription>Add a new student here</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="batch-name">Student Email</FieldLabel>
                    <Input
                      {...field}
                      id="batch-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="johndoe@email.com"
                      autoComplete="off"
                      type="email"
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
                form="add-student"
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
      <DataTable data={joinedStudents} columns={columns} />
    </div>
  );
};
