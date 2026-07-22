'use cache';

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import BatchOverviewContent from "./_components/batch-overview-content";

export default async function BatchOverviewpage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/overview">) {
  const { userId, orgId } = await auth.protect();
  const { batchId, classId } = await params;

  // Fetch batch details
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      class: true,
      students: {
        include: {
          student: true,
        },
      },
      schedules: true,
      sessions: {
        orderBy: { classDate: "desc" },
        take: 10,
        include: {
          attendance: true,
        },
      },
      exams: {
        orderBy: { examDate: "desc" },
        take: 5,
      },
    },
  });

  if (!batch || batch.clerkOrganizationId !== orgId) {
    return <div>Batch not found</div>;
  }

  return <BatchOverviewContent batch={batch} />;
}
