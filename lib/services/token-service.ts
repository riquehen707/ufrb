import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  MonthlyGrantResult,
  PlanType,
  TokenSnapshot,
  TokenTransactionReason,
} from "@/lib/monetization/types";

type SupabaseLike = SupabaseClient;

type TokenProfileRow = {
  id: string;
  plan_type: PlanType | null;
  token_balance: number | null;
  token_earned: number | null;
  monthly_token_last_granted_at: string | null;
};

type MonthlyGrantRow = {
  granted: boolean;
  profile_id: string;
  plan_type: PlanType;
  granted_amount: number;
  token_balance: number;
  next_eligible_at: string | null;
};

function normalizeMonthlyGrantRow(row: MonthlyGrantRow): MonthlyGrantResult {
  return {
    granted: Boolean(row.granted),
    profileId: row.profile_id,
    planType: row.plan_type,
    grantedAmount: Number(row.granted_amount ?? 0),
    tokenBalance: Number(row.token_balance ?? 0),
    nextEligibleAt: row.next_eligible_at,
  };
}

export function normalizeTokenSnapshot(row: TokenProfileRow): TokenSnapshot {
  return {
    profileId: row.id,
    planType: row.plan_type ?? "free",
    tokenBalance: Number(row.token_balance ?? 0),
    tokenEarned: Number(row.token_earned ?? 0),
    monthlyTokenLastGrantedAt: row.monthly_token_last_granted_at,
  };
}

export async function getAuthenticatedTokenSnapshot(supabase: SupabaseLike) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, plan_type, token_balance, token_earned, monthly_token_last_granted_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeTokenSnapshot(data as TokenProfileRow);
}

export async function grantMonthlyTokensIfEligible(supabase: SupabaseLike) {
  const { data, error } = await supabase.rpc("grant_monthly_tokens_if_eligible");

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  return row ? normalizeMonthlyGrantRow(row as MonthlyGrantRow) : null;
}

export async function creditTokens(params: {
  supabase: SupabaseLike;
  profileId: string;
  amount: number;
  reason: TokenTransactionReason;
  referenceId?: string | null;
  note?: string | null;
}) {
  const { data, error } = await params.supabase.rpc("credit_profile_tokens", {
    target_profile_id: params.profileId,
    credit_amount: params.amount,
    credit_reason: params.reason,
    credit_reference_id: params.referenceId ?? null,
    credit_note: params.note ?? null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function debitTokens(params: {
  supabase: SupabaseLike;
  profileId: string;
  amount: number;
  reason: TokenTransactionReason;
  referenceId?: string | null;
  note?: string | null;
}) {
  const { data, error } = await params.supabase.rpc("debit_profile_tokens", {
    target_profile_id: params.profileId,
    debit_amount: params.amount,
    debit_reason: params.reason,
    debit_reference_id: params.referenceId ?? null,
    debit_note: params.note ?? null,
  });

  if (error) {
    throw error;
  }

  return data;
}
