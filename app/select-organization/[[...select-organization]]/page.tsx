import type { Metadata } from "next";
import { OrganizationList } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Select organization",
};

export default async function SelectOrganizationPage() {
  await auth.protect();

  return (
    <div className="bg-muted flex w-full flex-1 items-center justify-center p-6 md:p-10">
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/"
        afterCreateOrganizationUrl="/"
      />
    </div>
  );
}
