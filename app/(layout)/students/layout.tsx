import { requireAuth } from "@/lib/roles";

export default async function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <div className="flex flex-col gap-4">{children}</div>;
}
