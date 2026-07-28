import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { TourReplayButton } from "@/components/tour/tour-replay-button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  await auth.protect();

  const { orgId, orgRole } = await auth();

  // The shell is shared by both roles, but every page assumes an active org.
  if (!orgId) redirect("/select-organization");

  return (
    <SidebarProvider>
      <AppSidebar orgRole={orgRole ?? null} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 " />
            <AppBreadcrumb />
          </div>
          <div className="ml-auto px-4">
            <TourReplayButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
