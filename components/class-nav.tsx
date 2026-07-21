"use client";

import { AddBatch } from "@/components/add-batch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

const BATCH_LINKS = ({
  batchId,
  classId,
}: {
  classId: string;
  batchId: string;
}) => {
  return [
    {
      name: "Overview",
      href: `/class/${classId}/batch/${batchId}/overview`,
    },
    {
      name: "Students",
      href: `/class/${classId}/batch/${batchId}/students`,
    },
  ];
};

export const ClassNav = () => {
  const { data: classes, isLoading } = useQuery(
    orpc.owner.class.getAllClass.queryOptions(),
  );

  if (!classes || isLoading) {
    return (
      <SidebarMenuSub>
        <Skeleton className="h-7" />
        <Skeleton className="h-7" />
        <Skeleton className="h-7" />
      </SidebarMenuSub>
    );
  }

  return (
    <SidebarMenuSub>
      {classes.map((item) => (
        <SidebarMenuSubItem key={item.id}>
          <Collapsible className="group/sub-collapsible">
            <CollapsibleTrigger
              nativeButton={false}
              render={<SidebarMenuSubButton />}
            >
              <span>{item.name}</span>
              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/sub-collapsible:rotate-90" />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                {!item.batches.length ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>No Batch</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : (
                  item.batches.map((batch) => (
                    <SidebarMenuSubItem key={batch.id}>
                      <Collapsible className="group/sub-collapsible">
                        <CollapsibleTrigger
                          nativeButton={false}
                          render={<SidebarMenuSubButton />}
                        >
                          <span>{batch.name}</span>
                          <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/sub-collapsible:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {BATCH_LINKS({
                              classId: item.id,
                              batchId: batch.id,
                            }).map((item) => (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton
                                  render={<Link href={item.href} />}
                                >
                                  {item.name}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuSubItem>
                  ))
                )}
                <AddBatch classId={item.id} />
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
};
