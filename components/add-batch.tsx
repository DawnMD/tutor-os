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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const DAYS = Array.from({ length: 7 }, (_, i) => ({
  value: i,
  label: format(new Date(2026, 0, 4 + i), "EEEE"), // Sunday -> Saturday
}));

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");

  const m = (minutes % 60).toString().padStart(2, "0");

  return `${h}:${m}`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const formSchema = z.object({
  schedules: z
    .array(
      z.object({
        dayOfWeek: z.number(),
        startMinutes: z.number(),
        endMinutes: z.number(),
      }),
    )
    .min(1, "Add at least one email address."),
  name: z.string(),
});

const DAY_LABELS = Object.fromEntries(
  DAYS.map((day) => [day.value, day.label]),
) satisfies Record<number, string>;

export const AddBatch = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const { setOpenMobile } = useSidebar();

  const { mutateAsync } = useMutation(
    orpc.owner.batch.createBatch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchByOrg.queryKey(),
        });
        setOpenDialog(false);
        setOpenMobile(false);
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error //zodResolver type error
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      schedules: [
        {
          dayOfWeek: 1,
          endMinutes: 9 * 60,
          startMinutes: 10 * 60,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules",
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast.promise(
      mutateAsync({
        name: data.name,
        schdeules: data.schedules.map((item) => ({
          day: item.dayOfWeek,
          start: item.startMinutes,
          end: item.endMinutes,
        })),
        classId: "",
      }),
      {
        loading: "Creating batch",
        success: "Batch created",
        error: "Failed to create batch",
      },
    );
  }

  return (
    <>
      <SidebarMenuSubItem onClick={() => setOpenDialog(true)}>
        <SidebarMenuSubButton>
          <PlusIcon />
          <span>Add Batch</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
      <Dialog
        disablePointerDismissal
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <form id="create-batch" onSubmit={form.handleSubmit(onSubmit)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create Batch</DialogTitle>
              <DialogDescription>
                Create new batch here. Add multiple schedules for the batch.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="batch-name">Batch Name</FieldLabel>
                    <Input
                      {...field}
                      id="batch-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Class 12 Batch"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <FieldSet className="gap-4">
              <FieldLegend variant="label">Schedules</FieldLegend>
              <FieldDescription>
                Add multiple schedule of the batch
              </FieldDescription>
              <FieldGroup className="gap-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    {/* Day */}
                    <Controller
                      control={form.control}
                      name={`schedules.${index}.dayOfWeek`}
                      render={({ field }) => (
                        <Select
                          value={field.value.toString()}
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue>
                              {(value) => DAY_LABELS[Number(value)] ?? ""}
                            </SelectValue>
                          </SelectTrigger>

                          <SelectContent>
                            {DAYS.map((day) => (
                              <SelectItem
                                key={day.value}
                                value={day.value.toString()}
                              >
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />

                    {/* Start */}
                    <Controller
                      control={form.control}
                      name={`schedules.${index}.startMinutes`}
                      render={({ field }) => (
                        <Input
                          type="time"
                          value={minutesToTime(field.value)}
                          onChange={(e) =>
                            field.onChange(timeToMinutes(e.target.value))
                          }
                        />
                      )}
                    />

                    {/* End */}
                    <Controller
                      control={form.control}
                      name={`schedules.${index}.endMinutes`}
                      render={({ field }) => (
                        <Input
                          type="time"
                          value={minutesToTime(field.value)}
                          onChange={(e) =>
                            field.onChange(timeToMinutes(e.target.value))
                          }
                        />
                      )}
                    />

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <XIcon />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      dayOfWeek: 1,
                      endMinutes: 9 * 60,
                      startMinutes: 10 * 60,
                    })
                  }
                >
                  Add Schedule
                </Button>
              </FieldGroup>
              {form.formState.errors.schedules?.root && (
                <FieldError errors={[form.formState.errors.schedules.root]} />
              )}
            </FieldSet>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                form="create-batch"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
};
