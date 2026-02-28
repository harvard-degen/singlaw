export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { TRIAL_DAYS } from "@/lib/subscription";

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name: string | null;
    last_name: string | null;
    primary_email_address_id: string;
  };
  type: "user.created" | "user.deleted" | "user.updated";
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkUserEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name, primary_email_address_id } =
      event.data;

    const primaryEmail = email_addresses.find(
      (e) => e.id === primary_email_address_id
    );

    if (!primaryEmail) {
      return new Response("No primary email", { status: 400 });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    await db.user.create({
      data: {
        clerkId: id,
        email: primaryEmail.email_address,
        name: [first_name, last_name].filter(Boolean).join(" ") || null,
        subscriptionStatus: "TRIAL",
        trialEndsAt,
        queryResetDate: new Date(),
      },
    });
  }

  if (event.type === "user.deleted") {
    await db.user
      .delete({ where: { clerkId: event.data.id } })
      .catch(() => null); // may already be deleted
  }

  return new Response("OK", { status: 200 });
}
