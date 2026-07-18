import { db } from "@/prisma/db";
import { OrganizationMembershipWebhookEvent } from "@clerk/nextjs/server";
import { verifyWebhook, WebhookEvent } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

async function onOrganizationMembershipCreated(
  event: OrganizationMembershipWebhookEvent,
) {
  if (event.data.role !== "org:member") {
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

async function onOrganizationMembershipDeleted(
  event: OrganizationMembershipWebhookEvent,
) {
  await db.student.delete({
    where: {
      clerkOrganizationId_clerkUserId: {
        clerkUserId: event.data.public_user_data.user_id,
        clerkOrganizationId: event.data.organization.id,
      },
    },
  });
}

async function handleClerkWebhook(event: WebhookEvent) {
  switch (event.type) {
    case "organizationMembership.created":
      return onOrganizationMembershipCreated(event);

    case "organizationMembership.deleted":
      return onOrganizationMembershipDeleted(event);

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
