import { router, protectedProcedure } from "../trpc";
import { getTrialDaysRemaining } from "@/lib/subscription";

export const authRouter = router({
  getProfile: protectedProcedure.query(({ ctx }) => {
    const { user } = ctx;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      subscriptionEndsAt: user.subscriptionEndsAt,
      trialDaysRemaining: getTrialDaysRemaining(user.trialEndsAt),
      queriesThisMonth: user.queriesThisMonth,
    };
  }),
});
