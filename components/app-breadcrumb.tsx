"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { orpc } from "@/orpc/client";

type Crumb = { label: string; href?: string };

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Students",
  class: "Class",
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const isClassRoute = segments[0] === "class";
  const classId = isClassRoute ? segments[1] : undefined;
  const batchId =
    isClassRoute && segments[2] === "batch" ? segments[3] : undefined;
  const tab = segments[4]; // "overview" | "students"
  const studentId = tab === "students" ? segments[5] : undefined;

  const { data: classes } = useQuery({
    ...orpc.owner.class.getAllClass.queryOptions(),
    enabled: Boolean(classId),
  });

  const { data: student } = useQuery({
    ...orpc.owner.batchStudent.getStudentDashboard.queryOptions({
      input: { batchId: batchId ?? "", studentId: studentId ?? "" },
    }),
    enabled: Boolean(batchId && studentId),
  });

  const crumbs = buildCrumbs();

  function buildCrumbs(): Crumb[] {
    if (!isClassRoute) {
      const root = segments[0] ?? "dashboard";
      return [{ label: STATIC_LABELS[root] ?? root }];
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
