"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { LogOutIcon } from "lucide-react";

export function NavUser() {
  const { isLoaded, user } = useUser();

  if (!isLoaded || !user) {
    return <Skeleton className="h-14" />;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <SidebarMenuButton size="lg" className="aria-expanded:bg-muted">
            <Avatar>
              <AvatarImage
                src={user.imageUrl}
                alt={user.fullName ?? "Default user"}
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.fullName}</span>
              <span className="truncate text-xs">
                {user.emailAddresses[0].emailAddress}
              </span>
            </div>
            <LogOutIcon className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
