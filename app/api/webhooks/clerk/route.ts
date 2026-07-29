import { OrganizationRole } from "@/orpc/orpc";
import { db } from "@/prisma/db";
import { OrganizationMembershipWebhookEvent } from "@clerk/nextjs/server";
import { verifyWebhook, WebhookEvent } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

async function onOrganizationMembershipCreated(
  event: OrganizationMembershipWebhookEvent,
) {
  if (event.data.role !== OrganizationRole.STUDENT) {
    // Not a student (org:admin) — nothing to mirror. Note that the deleted
    // handler must therefore tolerate a missing Student row.
    return;
  }

  await db.student.upsert({
    where: {
      clerkOrganizationId_clerkUserId: {
        clerkUserId: event.data.public_user_data.user_id,
        clerkOrganizationId: event.data.organization.id,
      },
    },

    update: {
      clerkOrganizationId: event.data.organization.id,
      fullName: [
        event.data.public_user_data.first_name,
        event.data.public_user_data.last_name,
      ]
        .filter(Boolean)
        .join(" "),

      email: event.data.public_user_data.identifier,

      // Re-adding a previously removed member restores them (removal archives
      // rather than deletes, so their history is still here).
      archivedAt: null,
    },

    create: {
      clerkUserId: event.data.public_user_data.user_id,

      clerkOrganizationId: event.data.organization.id,

      fullName: [
        event.data.public_user_data.first_name,
        event.data.public_user_data.last_name,
      ]
        .filter(Boolean)
        .join(" "),

      email: event.data.public_user_data.identifier,
    },
  });
}

/**
 * Archive rather than delete. `Student` cascades to FeePayment,
 * AttendanceRecord and ExamResult, so a hard delete would destroy the tutor's
 * entire payment and attendance history for that student the moment a
 * membership is removed. `updateMany` is also idempotent: no row matches for an
 * org:admin membership (we never create one) or a replayed delivery, and
 * `delete` would throw P2025 there — a 400 that Clerk retries indefinitely.
 */
async function archiveStudentMembership(
  event: OrganizationMembershipWebhookEvent,
) {
  await db.student.updateMany({
    where: {
      clerkUserId: event.data.public_user_data.user_id,
      clerkOrganizationId: event.data.organization.id,
      archivedAt: null,
    },
    data: { archivedAt: new Date() },
  });
}

/**
 * A role change is either direction: promoted to org:admin (they stop being a
 * student — archive) or demoted to student (mirror them in, restoring an
 * archived row if one exists).
 */
async function onOrganizationMembershipUpdated(
  event: OrganizationMembershipWebhookEvent,
) {
  if (event.data.role === OrganizationRole.STUDENT) {
    return onOrganizationMembershipCreated(event);
  }

  return archiveStudentMembership(event);
}

async function handleClerkWebhook(event: WebhookEvent) {
  switch (event.type) {
    case "organizationMembership.created":
      return onOrganizationMembershipCreated(event);

    case "organizationMembership.updated":
      return onOrganizationMembershipUpdated(event);

    case "organizationMembership.deleted":
      return archiveStudentMembership(event);

    default:
      return;
  }
}

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    await handleClerkWebhook(evt);

    return new Response("User synced", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
