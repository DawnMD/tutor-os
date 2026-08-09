import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { TourReplayButton } from "@/components/tour/tour-replay-button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireOrganization } from "@/lib/roles";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  // The shell is shared by both roles, but every page assumes an active org —
  // this redirects to /sign-in with no session, /select-organization with no
  // active workspace.
  const { role } = await requireOrganization();

  return (
    <SidebarProvider>
      <AppSidebar orgRole={role} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 " />
            <AppBreadcrumb orgRole={role} />
          </div>
          <div className="ml-auto px-4">
            <TourReplayButton orgRole={role} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
