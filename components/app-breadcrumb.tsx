"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { orpc } from "@/orpc/client";
import { OrganizationRole } from "@/orpc/orpc";

type Crumb = { label: string; href?: string };

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  calendar: "Calendar",
  students: "Students",
  class: "Class",
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const { orgRole, isLoaded } = useAuth();
  const isOwner = orgRole === OrganizationRole.OWNER;

  const segments = pathname.split("/").filter(Boolean);

  const isClassRoute = segments[0] === "class";
  const classId = isClassRoute ? segments[1] : undefined;
  const batchId =
    isClassRoute && segments[2] === "batch" ? segments[3] : undefined;
  const tab = segments[4]; // "overview" | "students" | ...
  const studentId = tab === "students" ? segments[5] : undefined;

  // Owner-only name lookups; never fired for students (they'd throw FORBIDDEN).
  const { data: classes } = useQuery({
    ...orpc.owner.class.getAllClass.queryOptions(),
    enabled: isOwner && Boolean(classId),
  });

  const { data: student } = useQuery({
    ...orpc.owner.batchStudent.getStudentDashboard.queryOptions({
      input: { batchId: batchId ?? "", studentId: studentId ?? "" },
    }),
    enabled: isOwner && Boolean(batchId && studentId),
  });

  // Student name lookup resolves off their enrolled-batch list cache.
  const { data: studentBatches } = useQuery({
    ...orpc.student.batch.list.queryOptions(),
    // Wait for Clerk to hydrate: before `isLoaded`, `orgRole` is undefined so an
    // owner reads as `!isOwner` and this student-only query fires → FORBIDDEN.
    enabled: isLoaded && !isOwner && Boolean(classId),
  });

  const crumbs = buildCrumbs();

  function buildCrumbs(): Crumb[] {
    if (!isClassRoute) {
      if (isOwner && segments[0] === "students") {
        const crumbs: Crumb[] = [
          { label: "Students", href: "/students/joined" },
        ];
        if (segments[1] === "joined") crumbs.push({ label: "Joined" });
        if (segments[1] === "pending") crumbs.push({ label: "Pending" });
        return crumbs;
      }

      const root = segments[0] ?? "dashboard";
      return [{ label: STATIC_LABELS[root] ?? root }];
    }

    // Student class/batch crumbs: names resolve off their enrolled-batch cache,
    // with no Students segment and no class landing link.
    if (!isOwner) {
      const crumbs: Crumb[] = [];
      if (!classId) return crumbs;

      const batch = studentBatches?.find((b) => b.id === batchId);
      const overviewHref = `/class/${classId}/batch/${batchId}/overview`;

      crumbs.push({ label: batch?.class.name ?? "…" });

      if (batchId) {
        crumbs.push({ label: batch?.name ?? "…", href: overviewHref });
      }

      if (tab === "overview") crumbs.push({ label: "Overview" });
      else if (tab === "attendance") crumbs.push({ label: "Attendance" });
      else if (tab === "exams") crumbs.push({ label: "Exam Results" });

      return crumbs;
    }

    const crumbs: Crumb[] = [{ label: "Class", href: "/class" }];

    if (!classId) return crumbs;

    const cls = classes?.find((c) => c.id === classId);
    const batch = cls?.batches.find((b) => b.id === batchId);
    const overviewHref = `/class/${classId}/batch/${batchId}/overview`;
    const studentsHref = `/class/${classId}/batch/${batchId}/students`;

    // No dedicated page for a single class, so this stays plain text.
    crumbs.push({ label: cls?.name ?? "…" });

    if (batchId) {
      crumbs.push({ label: batch?.name ?? "…", href: overviewHref });
    }

    if (tab === "overview") {
      crumbs.push({ label: "Overview" });
    } else if (tab === "sessions") {
      crumbs.push({ label: "Sessions" });
    } else if (tab === "attendance") {
      crumbs.push({ label: "Attendance" });
    } else if (tab === "exams") {
      crumbs.push({ label: "Exams" });
    } else if (tab === "students") {
      crumbs.push({
        label: "Students",
        href: studentId ? studentsHref : undefined,
      });
      if (studentId) {
        crumbs.push({ label: student?.fullName ?? "…" });
      }
    }

    return crumbs;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
