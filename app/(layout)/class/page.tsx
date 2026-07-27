import { auth } from "@clerk/nextjs/server";

import { AddClassCard } from "@/components/add-class-card";
import { ClassCards } from "@/components/class-cards";
import { requireOwnerPage } from "@/lib/roles";

export default async function ClassPage() {
  await auth.protect();
  await requireOwnerPage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <AddClassCard />
      <ClassCards />
    </div>
  );
}
