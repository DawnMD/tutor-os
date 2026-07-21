import { auth } from "@clerk/nextjs/server";

import { AddClassCard } from "@/components/add-class-card";
import { ClassCards } from "@/components/class-cards";

export default async function ClassPage() {
  await auth.protect();

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <AddClassCard />
      <ClassCards />
    </div>
  );
}
