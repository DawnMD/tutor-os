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
import { BookSearch, ChevronRightIcon, Users } from "lucide-react";
import Link from "next/link";

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href={"/owner/students"} />}>
            <Users />
            <span>Students</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <Collapsible className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger
            render={<SidebarMenuButton tooltip={"Batches"} />}
          >
            <BookSearch />
            <span>Batches</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <NavBatchMain />
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
