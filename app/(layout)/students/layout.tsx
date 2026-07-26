import { auth } from "@clerk/nextjs/server";

export default async function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();

  return <div className="flex flex-col gap-4">{children}</div>;
}
