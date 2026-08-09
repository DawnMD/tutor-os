import type { Metadata } from "next";
import { headers } from "next/headers";

import { AuthCard, AuthShell } from "@/components/auth/auth-card";
import { OrganizationPicker } from "@/components/organization/organization-picker";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Select workspace",
};

export default async function SelectOrganizationPage() {
  await requireAuth();

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  return (
    <AuthShell>
      <AuthCard
        title="Choose a workspace"
        description="Pick the institute you want to work in."
      >
        <OrganizationPicker
          organizations={organizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
          }))}
        />
      </AuthCard>
    </AuthShell>
  );
}
