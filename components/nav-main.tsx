"use client";

import { ClassNav } from "@/components/class-nav";
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
} from "@/components/ui/sidebar";
import {
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
          <CollapsibleContent>
            <ClassNav />
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
