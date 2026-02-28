import { router, protectedProcedure } from "../trpc";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getTrialDaysRemaining, isSubscriptionActive } from "@/lib/subscription";
import { TRPCError } from "@trpc/server";

export const billingRouter = router({
  getStatus: protectedProcedure.query(({ ctx }) => {
    const { user } = ctx;
    return {
      status: user.subscriptionStatus,
      isActive: isSubscriptionActive(
        user.subscriptionStatus,
        user.trialEndsAt,
        user.subscriptionEndsAt
      ),
      trialDaysRemaining: getTrialDaysRemaining(user.trialEndsAt),
      subscriptionEndsAt: user.subscriptionEndsAt,
    };
  }),

  createCheckoutSession: protectedProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx;

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id, clerkId: user.clerkId },
      });
      customerId = customer.id;
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/chat?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?checkout=cancelled`,
      metadata: { userId: user.id },
    });

    return { url: session.url };
  }),

  getPortalUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx;

    if (!user.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No billing account found",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/chat`,
    });

    return { url: session.url };
  }),
});
