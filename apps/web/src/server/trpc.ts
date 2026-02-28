import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import superjson from "superjson";
import { db } from "@/lib/db";
import { isSubscriptionActive } from "@/lib/subscription";

export async function createContext() {
  const { userId } = await auth();
  return { userId };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await db.user.findUnique({
    where: { clerkId: ctx.userId },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  }

  return next({ ctx: { ...ctx, user } });
});

export const activeSubscriptionProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const active = isSubscriptionActive(
      ctx.user.subscriptionStatus,
      ctx.user.trialEndsAt,
      ctx.user.subscriptionEndsAt
    );

    if (!active) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "SUBSCRIPTION_REQUIRED",
      });
    }

    return next({ ctx });
  }
);
