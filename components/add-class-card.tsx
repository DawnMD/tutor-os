"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Field, FieldError, FieldGroup } from "./ui/field";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const AddClassCard = () => {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error //zodResolver type error
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { mutateAsync } = useMutation(
    orpc.owner.class.createClass.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.class.getAllClass.queryKey(),
        });
        form.reset();
      },
    }),
  );

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast.promise(
      mutateAsync({
        name: data.name,
        description: data.description,
      }),
      {
        loading: "Creating class",
        success: "Class created",
        error: "Failed to create class",
      },
    );
  }

  return (
    <Card className="w-full ">
      <form id="create-class" onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Create a new class</CardTitle>
          <CardDescription>Enter class name to create</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id="class-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Classname"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    placeholder="Description"
                    className="min-h-30"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </form>
      <CardFooter className="p-3">
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
          form="create-class"
        >
          Create Class
        </Button>
      </CardFooter>
    </Card>
  );
};
