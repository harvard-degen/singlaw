import { SubscriptionStatus } from "@prisma/client";

export const TRIAL_DAYS = 21;
export const QUERY_DAILY_LIMIT = 100;
export const PLAN_PRICE_SGD = 29;

export function isSubscriptionActive(
  status: SubscriptionStatus,
  trialEndsAt: Date | null,
  subscriptionEndsAt: Date | null
): boolean {
  const now = new Date();

  if (status === SubscriptionStatus.TRIAL) {
    return trialEndsAt !== null && trialEndsAt > now;
  }

  if (status === SubscriptionStatus.ACTIVE) {
    return subscriptionEndsAt === null || subscriptionEndsAt > now;
  }

  return false;
}

export function getTrialDaysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const now = new Date();
  const diff = trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
