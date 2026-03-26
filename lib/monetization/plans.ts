import type { PlanType } from "@/lib/monetization/types";

export type PlanConfig = {
  label: string;
  monthlyPriceCents: number;
  monthlyTokenGrant: number;
  initialTokenGrant: number;
};

export const PLAN_CONFIG: Record<PlanType, PlanConfig> = {
  free: {
    label: "Gratis",
    monthlyPriceCents: 0,
    monthlyTokenGrant: 3,
    initialTokenGrant: 5,
  },
  pro: {
    label: "Pro",
    monthlyPriceCents: 1990,
    monthlyTokenGrant: 40,
    initialTokenGrant: 5,
  },
};

export const DEFAULT_PLAN_TYPE: PlanType = "free";

export function getPlanConfig(planType: PlanType) {
  return PLAN_CONFIG[planType];
}

export function getMonthlyTokenGrant(planType: PlanType) {
  return PLAN_CONFIG[planType].monthlyTokenGrant;
}

export function getLowBalanceThreshold(planType: PlanType) {
  return planType === "pro" ? 5 : 1;
}

export function getNextMonthlyGrantDate(lastGrantedAt?: string | null) {
  if (!lastGrantedAt) {
    return null;
  }

  const nextDate = new Date(lastGrantedAt);

  if (Number.isNaN(nextDate.getTime())) {
    return null;
  }

  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}
