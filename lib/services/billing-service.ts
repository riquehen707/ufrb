import { getPlanConfig } from "@/lib/monetization/plans";
import type {
  PaymentKind,
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@/lib/monetization/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { creditTokens } from "@/lib/services/token-service";

export type BillingPaymentRow = {
  id: string;
  profile_id: string;
  subscription_id: string | null;
  kind: PaymentKind;
  plan_type: PlanType;
  status: PaymentStatus;
  provider: string | null;
  provider_payment_id: string | null;
  merchant_charge_id: string | null;
  package_code: string | null;
  token_amount: number;
  amount_cents: number;
  currency: string;
  checkout_url: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  expires_at: string | null;
  granted_at: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type BillingSubscriptionRow = {
  id: string;
  profile_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  provider: string | null;
  provider_plan_id: string | null;
  provider_subscription_id: string | null;
  customer_email: string | null;
  customer_document: string | null;
  token_grant_amount: number;
  badge_enabled: boolean;
  metadata: Record<string, unknown> | null;
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type UpsertSubscriptionInput = {
  id?: string;
  profileId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  provider?: string | null;
  providerPlanId?: string | null;
  providerSubscriptionId?: string | null;
  customerEmail?: string | null;
  customerDocument?: string | null;
  tokenGrantAmount?: number;
  badgeEnabled?: boolean;
  metadata?: Record<string, unknown>;
  startedAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
};

type RecordPaymentInput = {
  profileId: string;
  subscriptionId?: string | null;
  kind: PaymentKind;
  planType?: PlanType;
  status: PaymentStatus;
  provider?: string | null;
  providerPaymentId?: string | null;
  merchantChargeId?: string | null;
  packageCode?: string | null;
  tokenAmount?: number;
  amountCents: number;
  currency?: string;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  metadata?: Record<string, unknown>;
};

function getAdminClientOrThrow() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("SUPABASE_ADMIN_UNAVAILABLE");
  }

  return supabase;
}

async function setListingPriorityBoost(profileId: string, boost: number) {
  const supabase = getAdminClientOrThrow();
  const { error } = await supabase
    .from("listings")
    .update({ priority_boost: boost })
    .eq("owner_id", profileId)
    .eq("status", "active");

  if (error) {
    throw error;
  }
}

export async function upsertSubscription(input: UpsertSubscriptionInput) {
  const supabase = getAdminClientOrThrow();
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    profile_id: input.profileId,
    plan_type: input.planType,
    status: input.status,
    provider: input.provider ?? null,
    provider_plan_id: input.providerPlanId ?? null,
    provider_subscription_id: input.providerSubscriptionId ?? null,
    customer_email: input.customerEmail ?? null,
    customer_document: input.customerDocument ?? null,
    token_grant_amount: input.tokenGrantAmount ?? getPlanConfig(input.planType).monthlyTokenGrant,
    badge_enabled: input.badgeEnabled ?? input.planType === "pro",
    metadata: input.metadata ?? {},
    started_at: input.startedAt ?? null,
    current_period_start: input.currentPeriodStart ?? null,
    current_period_end: input.currentPeriodEnd ?? null,
    cancelled_at: input.cancelledAt ?? null,
  };

  const query = input.providerSubscriptionId
    ? supabase
        .from("subscriptions")
        .upsert(payload, { onConflict: "provider_subscription_id" })
    : input.id
      ? supabase.from("subscriptions").upsert(payload)
      : supabase.from("subscriptions").insert(payload);

  const { data, error } = await query.select("*").single();

  if (error) {
    throw error;
  }

  return data as BillingSubscriptionRow;
}

export async function findSubscriptionByProviderId(providerSubscriptionId: string) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("provider_subscription_id", providerSubscriptionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BillingSubscriptionRow | null) ?? null;
}

export async function findSubscriptionById(subscriptionId: string) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BillingSubscriptionRow | null) ?? null;
}

export async function findLatestProSubscriptionForProfile(profileId: string) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("plan_type", "pro")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BillingSubscriptionRow | null) ?? null;
}

export async function findLatestProPlanId() {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("provider_plan_id")
    .eq("plan_type", "pro")
    .not("provider_plan_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.provider_plan_id as string | null | undefined) ?? null;
}

export async function findMatchingProSubscriptionForCustomer(input: {
  customerEmail?: string | null;
  customerDocument?: string | null;
}) {
  const supabase = getAdminClientOrThrow();
  const normalizedDocument = input.customerDocument?.replace(/\D/g, "") ?? null;

  let query = supabase
    .from("subscriptions")
    .select("*")
    .eq("provider", "picpay")
    .eq("plan_type", "pro")
    .in("status", ["active", "inactive", "past_due"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (normalizedDocument) {
    query = query.eq("customer_document", normalizedDocument);
  } else if (input.customerEmail) {
    query = query.eq("customer_email", input.customerEmail);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BillingSubscriptionRow | null) ?? null;
}

export async function recordPayment(input: RecordPaymentInput) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      profile_id: input.profileId,
      subscription_id: input.subscriptionId ?? null,
      kind: input.kind,
      plan_type: input.planType ?? "free",
      status: input.status,
      provider: input.provider ?? null,
      provider_payment_id: input.providerPaymentId ?? null,
      merchant_charge_id: input.merchantChargeId ?? null,
      package_code: input.packageCode ?? null,
      token_amount: input.tokenAmount ?? 0,
      amount_cents: input.amountCents,
      currency: input.currency ?? "BRL",
      checkout_url: input.checkoutUrl ?? null,
      qr_code: input.qrCode ?? null,
      qr_code_base64: input.qrCodeBase64 ?? null,
      expires_at: input.expiresAt ?? null,
      paid_at: input.paidAt ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as BillingPaymentRow;
}

export async function findPaymentByMerchantChargeId(merchantChargeId: string) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("merchant_charge_id", merchantChargeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BillingPaymentRow | null) ?? null;
}

export async function findPaymentByProviderPaymentId(providerPaymentId: string) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BillingPaymentRow | null) ?? null;
}

export async function updatePaymentState(input: {
  paymentId: string;
  status: PaymentStatus;
  providerPaymentId?: string | null;
  merchantChargeId?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("payments")
    .update({
      status: input.status,
      provider_payment_id: input.providerPaymentId ?? undefined,
      merchant_charge_id: input.merchantChargeId ?? undefined,
      paid_at: input.paidAt ?? undefined,
      expires_at: input.expiresAt ?? undefined,
      checkout_url: input.checkoutUrl ?? undefined,
      qr_code: input.qrCode ?? undefined,
      qr_code_base64: input.qrCodeBase64 ?? undefined,
      metadata: input.metadata ?? undefined,
    })
    .eq("id", input.paymentId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as BillingPaymentRow;
}

export async function markPaymentGranted(paymentId: string) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("payments")
    .update({
      granted_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .is("granted_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BillingPaymentRow | null) ?? null;
}

export async function syncProfilePlanState(input: {
  profileId: string;
  planType: PlanType;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}) {
  const supabase = getAdminClientOrThrow();
  const { error } = await supabase
    .from("profiles")
    .update({
      plan_type: input.planType,
      monthly_token_last_granted_at:
        input.planType === "pro" ? new Date().toISOString() : undefined,
    })
    .eq("id", input.profileId);

  if (error) {
    throw error;
  }

  await setListingPriorityBoost(input.profileId, input.planType === "pro" ? 1 : 0);
}

export async function activateProPlan(input: {
  profileId: string;
  subscriptionId?: string | null;
  paymentId?: string | null;
  tokenAmount?: number;
  note?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}) {
  const supabase = getAdminClientOrThrow();
  const plan = getPlanConfig("pro");

  await syncProfilePlanState({
    profileId: input.profileId,
    planType: "pro",
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
  });

  if (input.subscriptionId) {
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        badge_enabled: true,
        current_period_start: input.currentPeriodStart ?? new Date().toISOString(),
        current_period_end: input.currentPeriodEnd ?? undefined,
      })
      .eq("id", input.subscriptionId);

    if (subscriptionError) {
      throw subscriptionError;
    }
  }

  await creditTokens({
    supabase,
    profileId: input.profileId,
    amount: input.tokenAmount ?? plan.monthlyTokenGrant,
    reason: "subscription_grant",
    referenceId: input.subscriptionId ?? input.paymentId ?? null,
    note: input.note ?? "Credito do plano Pro.",
  });
}

export async function syncExpiredProAccess(profileId: string) {
  const supabase = getAdminClientOrThrow();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("profile_id", profileId)
    .eq("plan_type", "pro")
    .in("status", ["active", "past_due"])
    .lt("current_period_end", nowIso);

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return false;
  }

  const subscriptionIds = data
    .map((row) => row.id as string | null)
    .filter((value): value is string => Boolean(value));

  if (subscriptionIds.length) {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "inactive",
      })
      .in("id", subscriptionIds);

    if (updateError) {
      throw updateError;
    }
  }

  const keepPro = await hasActiveProSubscription(profileId);

  if (!keepPro) {
    await syncProfilePlanState({
      profileId,
      planType: "free",
    });
  }

  return true;
}

export async function grantTokenPackagePurchase(input: {
  paymentId: string;
  profileId: string;
  tokenAmount: number;
  note?: string | null;
}) {
  const supabase = getAdminClientOrThrow();
  await creditTokens({
    supabase,
    profileId: input.profileId,
    amount: input.tokenAmount,
    reason: "token_package_purchase",
    referenceId: input.paymentId,
    note: input.note ?? "Compra avulsa de tokens.",
  });
}

export async function updateSubscriptionState(input: {
  subscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getAdminClientOrThrow();
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: input.status,
      current_period_start: input.currentPeriodStart ?? undefined,
      current_period_end: input.currentPeriodEnd ?? undefined,
      cancelled_at: input.cancelledAt ?? undefined,
      metadata: input.metadata ?? undefined,
    })
    .eq("id", input.subscriptionId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as BillingSubscriptionRow;
}

export async function hasActiveProSubscription(profileId: string, excludeSubscriptionId?: string | null) {
  const supabase = getAdminClientOrThrow();
  let query = supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("plan_type", "pro")
    .in("status", ["active", "past_due"]);

  if (excludeSubscriptionId) {
    query = query.neq("id", excludeSubscriptionId);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}
