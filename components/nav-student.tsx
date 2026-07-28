"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveBatchColor } from "@/lib/batch-colors";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarIcon,
  ChevronRightIcon,
  GraduationCap,
  LayoutDashboardIcon,
} from "lucide-react";
import Link from "next/link";

const BATCH_LINKS = ({
  batchId,
  classId,
}: {
  classId: string;
  batchId: string;
}) => [
  {
    name: "Overview",
    href: `/class/${classId}/batch/${batchId}/overview`,
  },
  {
    name: "Attendance",
    href: `/class/${classId}/batch/${batchId}/attendance`,
  },
  {
    name: "Exam Results",
    href: `/class/${classId}/batch/${batchId}/exams`,
  },
  {
    name: "Notes",
    href: `/class/${classId}/batch/${batchId}/notes`,
  },
];

export function NavStudent() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href={"/dashboard"} />}>
            <LayoutDashboardIcon />
            <span>Dashboard</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href={"/calendar"} />}>
            <CalendarIcon />
            <span>Calendar</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <Collapsible
          defaultOpen
          className="group/collapsible"
          render={<SidebarMenuItem />}
        >
          <CollapsibleTrigger
            render={<SidebarMenuButton tooltip={"My Batches"} />}
          >
            <GraduationCap />
            <span>My Batches</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <StudentBatchNav />
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function StudentBatchNav() {
  const { data: batches, isLoading } = useQuery(
    orpc.student.batch.list.queryOptions(),
  );

  if (!batches || isLoading) {
    return (
      <SidebarMenuSub>
        <Skeleton className="h-7" />
        <Skeleton className="h-7" />
      </SidebarMenuSub>
    );
  }

  if (!batches.length) {
    return (
      <SidebarMenuSub>
        <SidebarMenuSubItem>
          <SidebarMenuSubButton>No batches yet</SidebarMenuSubButton>
        </SidebarMenuSubItem>
      </SidebarMenuSub>
    );
  }

  return (
    <SidebarMenuSub>
      {batches.map((batch) => (
        <SidebarMenuSubItem key={batch.id}>
          <Collapsible defaultOpen className="group/sub-collapsible">
            <CollapsibleTrigger
              nativeButton={false}
              render={<SidebarMenuSubButton />}
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  resolveBatchColor(batch.color, batch.id).dot,
                )}
              />
              <span>{batch.name}</span>
              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/sub-collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {BATCH_LINKS({
                  classId: batch.classId,
                  batchId: batch.id,
                }).map((item) => (
                  <SidebarMenuSubItem key={item.href}>
                    <SidebarMenuSubButton render={<Link href={item.href} />}>
                      {item.name}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}
