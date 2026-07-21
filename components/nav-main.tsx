"use client";

import { NavBatchMain } from "@/components/nav-batch-main";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BookSearch,
  Building,
  ChevronRightIcon,
  LayoutDashboardIcon,
  Users,
} from "lucide-react";
import Link from "next/link";

export function NavMain() {
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
          <SidebarMenuButton render={<Link href={"/students"} />}>
            <Users />
            <span>Students</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <Collapsible className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger
            nativeButton={false}
            render={
              <SidebarMenuButton
                tooltip={"Batches"}
                render={<Link href={"/class"} />}
              />
            }
          >
            <Building />
            <span>Class</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </Collapsible>
        {/* <Collapsible className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger
            render={<SidebarMenuButton tooltip={"Batches"} />}
          >
            <BookSearch />
            <span>Batches</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <NavBatchMain />
        </Collapsible> */}
      </SidebarMenu>
    </SidebarGroup>
  );
}
