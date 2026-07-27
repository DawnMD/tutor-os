"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavStudent } from "@/components/nav-student";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>{isOwner ? <NavMain /> : <NavStudent />}</SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
