export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const signature = headerPayload.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency check
  const existing = await db.stripeEvent.findUnique({ where: { id: event.id } });
  if (existing) {
    return new Response("Already processed", { status: 200 });
  }

  await db.stripeEvent.create({
    data: { id: event.id, type: event.type },
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEnd = (sub as any).current_period_end as number;

      await db.user.update({
        where: { stripeCustomerId: session.customer as string },
        data: {
          stripeSubscriptionId: sub.id,
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: new Date(periodEnd * 1000),
        },
      });
      break;
    }

    case "invoice.paid": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription as string | null;
      if (!subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEnd = (sub as any).current_period_end as number;

      await db.user.update({
        where: { stripeSubscriptionId: sub.id },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: new Date(periodEnd * 1000),
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription as string | null;
      if (!subscriptionId) break;

      await db.user.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { subscriptionStatus: "PAST_DUE" },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db.user.update({
        where: { stripeSubscriptionId: sub.id },
        data: { subscriptionStatus: "CANCELLED", subscriptionEndsAt: new Date() },
      });
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
