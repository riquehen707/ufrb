import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile, type PublicProfile } from "@/lib/profiles";

export type TokenTransactionHistoryItem = {
  id: string;
  type: "credit" | "debit";
  reason: string;
  amount: number;
  note?: string;
  referenceId?: string;
  createdAt: string;
};

export type TokenPaymentHistoryItem = {
  id: string;
  kind: "token_package" | "subscription";
  status: "pending" | "authorized" | "paid" | "failed" | "refunded" | "cancelled";
  amountCents: number;
  tokenAmount: number;
  packageCode?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  checkoutUrl?: string;
  expiresAt?: string;
  paidAt?: string;
  createdAt: string;
};

export type TokenSubscriptionSummary = {
  id: string;
  status: "inactive" | "active" | "past_due" | "cancelled";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  tokenGrantAmount: number;
  badgeEnabled: boolean;
};

export type TokenDashboardData = {
  profile: PublicProfile;
  transactions: TokenTransactionHistoryItem[];
  payments: TokenPaymentHistoryItem[];
  activeSubscription: TokenSubscriptionSummary | null;
  pendingTokenPayment: TokenPaymentHistoryItem | null;
  pendingSubscriptionPayment: TokenPaymentHistoryItem | null;
};

type TokenTransactionRow = {
  id: string;
  type: "credit" | "debit";
  reason: string;
  amount: number | null;
  note: string | null;
  reference_id: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  kind: "token_package" | "subscription";
  status:
    | "pending"
    | "authorized"
    | "paid"
    | "failed"
    | "refunded"
    | "cancelled";
  amount_cents: number | null;
  token_amount: number | null;
  package_code: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  checkout_url: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  status: "inactive" | "active" | "past_due" | "cancelled";
  current_period_start: string | null;
  current_period_end: string | null;
  token_grant_amount: number | null;
  badge_enabled: boolean | null;
};

function normalizeTransaction(row: TokenTransactionRow): TokenTransactionHistoryItem {
  return {
    id: row.id,
    type: row.type,
    reason: row.reason,
    amount: Number(row.amount ?? 0),
    note: row.note ?? undefined,
    referenceId: row.reference_id ?? undefined,
    createdAt: row.created_at,
  };
}

function normalizePayment(row: PaymentRow): TokenPaymentHistoryItem {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    amountCents: Number(row.amount_cents ?? 0),
    tokenAmount: Number(row.token_amount ?? 0),
    packageCode: row.package_code ?? undefined,
    qrCode: row.qr_code ?? undefined,
    qrCodeBase64: row.qr_code_base64 ?? undefined,
    checkoutUrl: row.checkout_url ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    paidAt: row.paid_at ?? undefined,
    createdAt: row.created_at,
  };
}

function normalizeSubscription(row: SubscriptionRow): TokenSubscriptionSummary {
  return {
    id: row.id,
    status: row.status,
    currentPeriodStart: row.current_period_start ?? undefined,
    currentPeriodEnd: row.current_period_end ?? undefined,
    tokenGrantAmount: Number(row.token_grant_amount ?? 0),
    badgeEnabled: Boolean(row.badge_enabled),
  };
}

export async function getCurrentTokenDashboard(): Promise<TokenDashboardData | null> {
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      profile,
      transactions: [],
      payments: [],
      activeSubscription: null,
      pendingTokenPayment: null,
      pendingSubscriptionPayment: null,
    };
  }

  const [transactionsResult, paymentsResult, subscriptionsResult] = await Promise.all([
    supabase
      .from("token_transactions")
      .select("id, type, reason, amount, note, reference_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("payments")
      .select(
        "id, kind, status, amount_cents, token_amount, package_code, qr_code, qr_code_base64, checkout_url, expires_at, paid_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("subscriptions")
      .select(
        "id, status, current_period_start, current_period_end, token_grant_amount, badge_enabled",
      )
      .eq("plan_type", "pro")
      .order("updated_at", { ascending: false })
      .limit(2),
  ]);

  const transactions = (transactionsResult.data ?? []).map((row) =>
    normalizeTransaction(row as TokenTransactionRow),
  );
  const payments = (paymentsResult.data ?? []).map((row) =>
    normalizePayment(row as PaymentRow),
  );
  const activeSubscriptionRow = (subscriptionsResult.data ?? []).find(
    (subscription) =>
      subscription.status === "active" || subscription.status === "past_due",
  );

  const pendingTokenPayment =
    payments.find(
      (payment) =>
        payment.kind === "token_package" &&
        (payment.status === "pending" || payment.status === "authorized"),
    ) ?? null;
  const pendingSubscriptionPayment =
    payments.find(
      (payment) =>
        payment.kind === "subscription" &&
        (payment.status === "pending" || payment.status === "authorized"),
    ) ?? null;

  return {
    profile,
    transactions,
    payments,
    activeSubscription: activeSubscriptionRow
      ? normalizeSubscription(activeSubscriptionRow as SubscriptionRow)
      : null,
    pendingTokenPayment,
    pendingSubscriptionPayment,
  };
}
