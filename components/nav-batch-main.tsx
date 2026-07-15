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

// Physics
// ├── Overview
// ├── Sessions
// ├── Students
// ├── Attendance
// ├── Notes
// └── Exams

const BATCH_LINKS = (id: string) => {
  return [
    {
      name: "Overview",
      href: `/batch/${id}/overview`,
    },
    {
      name: "Sessions",
      href: `/batch/${id}/sessions`,
    },
    {
      name: "Students",
      href: `/batch/${id}/students`,
    },
    {
      name: "Attendance",
      href: `/batch/${id}/attendance`,
    },
    {
      name: "Exams",
      href: `/batch/${id}/exams`,
    },
    // {
    //   name: "Notes",
    //   href: `/batch/${id}/notes`,
    // },
  ];
};

const BatchSection = () => {
  const { data: batches, isLoading } = useQuery(
    orpc.owner.batch.getBatchByOrg.queryOptions(),
  );

  if (isLoading || !batches) {
    return (
      <>
        <Skeleton className="h-7" />
        <Skeleton className="h-7" />
        <Skeleton className="h-7" />
      </>
    );
  }

  return (
    <SidebarMenuSub>
      {batches.map((batch) => (
        <Collapsible
          className="group/sub-collapsible"
          key={batch.id}
          render={<SidebarMenuSubItem />}
        >
          <CollapsibleTrigger
            nativeButton={false}
            render={<SidebarMenuSubButton />}
          >
            <span>{batch.name}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/sub-collapsible:rotate-90" />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub>
              {BATCH_LINKS(batch.id).map((item) => (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton render={<Link href={item.href} />}>
                    {item.name}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </SidebarMenuSub>
  );
};

export const NavBatchMain = () => {
  return (
    <SidebarMenuSub>
      <AddBatch />
      <BatchSection />
    </SidebarMenuSub>
  );
};
