"use client";

import { AddBatch } from "@/components/add-batch";
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
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { BookSearch, ChevronRightIcon } from "lucide-react";

export function NavMain() {
  const { data: batches } = useQuery(
    orpc.owner.batch.getBatchByOrg.queryOptions(),
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger
            render={<SidebarMenuButton tooltip={"Batches"} />}
          >
            <BookSearch />
            <span>Batches</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <AddBatch />
              {batches?.map((batch) => (
                <SidebarMenuSubItem key={batch.id}>
                  <SidebarMenuSubButton>
                    <span>{batch.name}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
