export const planTypes = ["free", "pro"] as const;
export type PlanType = (typeof planTypes)[number];

export const listingTiers = ["simple", "premium"] as const;
export type ListingTier = (typeof listingTiers)[number];

export const tokenTransactionTypes = ["credit", "debit"] as const;
export type TokenTransactionType = (typeof tokenTransactionTypes)[number];

export const tokenTransactionReasons = [
  "initial_grant",
  "monthly_grant_free",
  "monthly_grant_pro",
  "token_package_purchase",
  "listing_create_simple",
  "listing_create_premium",
  "listing_renewal",
  "listing_featured",
  "subscription_grant",
  "manual_adjustment",
  "refund",
] as const;
export type TokenTransactionReason = (typeof tokenTransactionReasons)[number];

export const subscriptionStatuses = [
  "inactive",
  "active",
  "past_due",
  "cancelled",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const paymentStatuses = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const paymentKinds = ["token_package", "subscription"] as const;
export type PaymentKind = (typeof paymentKinds)[number];

export type TokenSnapshot = {
  profileId: string;
  planType: PlanType;
  tokenBalance: number;
  tokenEarned: number;
  monthlyTokenLastGrantedAt: string | null;
};

export type MonthlyGrantResult = {
  granted: boolean;
  profileId: string;
  planType: PlanType;
  grantedAmount: number;
  tokenBalance: number;
  nextEligibleAt: string | null;
};
