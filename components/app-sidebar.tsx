"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavStudent } from "@/components/nav-student";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { OrganizationRole } from "@/orpc/orpc";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  orgRole: string | null;
};

export function AppSidebar({ orgRole, ...props }: AppSidebarProps) {
  const isOwner = orgRole === OrganizationRole.OWNER;

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <TeamSwitcher canCreate={isOwner} />
      </SidebarHeader>
      <SidebarContent>{isOwner ? <NavMain /> : <NavStudent />}</SidebarContent>
      <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          <ThemeToggle />
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
