import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { AddClassCard } from "@/components/add-class-card";
import { ClassCards } from "@/components/class-cards";
import { PageTour } from "@/components/tour/page-tour";
import { requireOwnerPage } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Classes",
};

export default async function ClassPage() {
  await auth.protect();
  await requireOwnerPage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <PageTour tourId="owner-classes" />
      <AddClassCard />
      <ClassCards />
    </div>
  );
}
