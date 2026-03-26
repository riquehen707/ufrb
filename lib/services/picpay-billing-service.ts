import { getPlanConfig } from "@/lib/monetization/plans";
import {
  getTokenPackage,
  type TokenPackageCode,
} from "@/lib/monetization/token-packages";
import {
  createPicPayPixCharge,
  extractWebhookPaymentData,
  getPicPayCharge,
  mapPicPayPaymentStatus,
  normalizeCustomer,
} from "@/lib/payments/picpay/client";
import type { PicPayWebhookEvent } from "@/lib/payments/picpay/types";
import {
  finalizePaidPaymentGrant,
  findLatestProSubscriptionForProfile,
  findPaymentByMerchantChargeId,
  findPaymentByProviderPaymentId,
  findSubscriptionById,
  recordPayment,
  updatePaymentState,
  upsertSubscription,
  type BillingPaymentRow,
  type BillingSubscriptionRow,
} from "@/lib/services/billing-service";

function normalizeDocument(value?: string | null) {
  return value?.replace(/\D/g, "") ?? null;
}

function addMonthsIso(base: string | Date, months: number) {
  const nextDate = new Date(base);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate.toISOString();
}

async function finalizeGrantedPayment(
  payment: BillingPaymentRow,
  options?: {
    subscriptionPeriodStart?: string | null;
    subscriptionPeriodEnd?: string | null;
    note?: string | null;
  },
) {
  if (payment.granted_at) {
    return payment;
  }

  return finalizePaidPaymentGrant({
    paymentId: payment.id,
    subscriptionPeriodStart: options?.subscriptionPeriodStart ?? null,
    subscriptionPeriodEnd: options?.subscriptionPeriodEnd ?? null,
    note: options?.note ?? null,
  });
}

export async function createTokenPackageCheckout(input: {
  profileId: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  customerIp: string;
  packageCode: TokenPackageCode;
}) {
  const tokenPackage = getTokenPackage(input.packageCode);
  const merchantChargeId = crypto.randomUUID();
  const customer = normalizeCustomer({
    name: input.customerName,
    email: input.customerEmail,
    document: input.customerDocument,
    phone: input.customerPhone,
  });
  const charge = await createPicPayPixCharge({
    merchantChargeId,
    amountCents: tokenPackage.amountCents,
    customer,
    customerIp: input.customerIp,
  });

  const payment = await recordPayment({
    profileId: input.profileId,
    kind: "token_package",
    planType: "free",
    status: "pending",
    provider: "picpay",
    providerPaymentId: charge.transactionId ?? charge.chargeId,
    merchantChargeId: charge.merchantChargeId,
    packageCode: tokenPackage.code,
    tokenAmount: tokenPackage.tokenAmount,
    amountCents: tokenPackage.amountCents,
    currency: "BRL",
    checkoutUrl: null,
    qrCode: charge.qrCode ?? null,
    qrCodeBase64: charge.qrCodeBase64 ?? null,
    expiresAt: charge.expiresAt ?? null,
    metadata: {
      chargeId: charge.chargeId,
      endToEndId: charge.endToEndId ?? null,
      mode: "pix_single_purchase",
    },
  });

  return {
    package: tokenPackage,
    payment,
    charge,
  };
}

export async function createProPlanCheckout(input: {
  profileId: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  customerIp: string;
}) {
  const plan = getPlanConfig("pro");
  const merchantChargeId = crypto.randomUUID();
  const customer = normalizeCustomer({
    name: input.customerName,
    email: input.customerEmail,
    document: input.customerDocument,
    phone: input.customerPhone,
  });
  const existingSubscription = await findLatestProSubscriptionForProfile(input.profileId);
  const subscription = await upsertSubscription({
    id: existingSubscription?.id,
    profileId: input.profileId,
    planType: "pro",
    status: existingSubscription?.status === "active" ? "active" : "inactive",
    provider: "picpay",
    customerEmail: customer.email,
    customerDocument: normalizeDocument(customer.document),
    tokenGrantAmount: plan.monthlyTokenGrant,
    badgeEnabled: true,
    metadata: {
      ...(existingSubscription?.metadata ?? {}),
      mode: "pix_manual_cycle",
    },
    startedAt: existingSubscription?.started_at ?? null,
    currentPeriodStart: existingSubscription?.current_period_start ?? null,
    currentPeriodEnd: existingSubscription?.current_period_end ?? null,
    cancelledAt: existingSubscription?.cancelled_at ?? null,
  });
  const charge = await createPicPayPixCharge({
    merchantChargeId,
    amountCents: plan.monthlyPriceCents,
    customer,
    customerIp: input.customerIp,
  });

  const payment = await recordPayment({
    profileId: input.profileId,
    subscriptionId: subscription.id,
    kind: "subscription",
    planType: "pro",
    status: "pending",
    provider: "picpay",
    providerPaymentId: charge.transactionId ?? charge.chargeId,
    merchantChargeId: charge.merchantChargeId,
    tokenAmount: plan.monthlyTokenGrant,
    amountCents: plan.monthlyPriceCents,
    currency: "BRL",
    checkoutUrl: null,
    qrCode: charge.qrCode ?? null,
    qrCodeBase64: charge.qrCodeBase64 ?? null,
    expiresAt: charge.expiresAt ?? null,
    metadata: {
      chargeId: charge.chargeId,
      endToEndId: charge.endToEndId ?? null,
      mode: "pix_manual_cycle",
    },
  });

  return {
    subscription,
    payment,
    charge,
  };
}

export async function processPicPayWebhook(event: PicPayWebhookEvent) {
  const webhook = extractWebhookPaymentData(event);

  if (!webhook.merchantChargeId && !webhook.transactionId) {
    return {
      ignored: true,
      reason: "missing_charge_identifiers",
    } as const;
  }

  const payment =
    (webhook.merchantChargeId
      ? await findPaymentByMerchantChargeId(webhook.merchantChargeId)
      : null) ??
    (webhook.transactionId
      ? await findPaymentByProviderPaymentId(webhook.transactionId)
      : null);

  if (!payment && webhook.merchantChargeId) {
    const charge = await getPicPayCharge(webhook.merchantChargeId).catch(() => null);

    if (charge?.chargeStatus?.toUpperCase() === "PAID") {
      return {
        ignored: true,
        reason: "payment_not_registered_locally",
      } as const;
    }
  }

  if (!payment) {
    return {
      ignored: true,
      reason: "payment_not_found",
    } as const;
  }

  const nextStatus = mapPicPayPaymentStatus({
    providerStatus: webhook.paymentStatus,
  });

  const updatedPayment = await updatePaymentState({
    paymentId: payment.id,
    status: nextStatus,
    providerPaymentId: webhook.transactionId ?? payment.provider_payment_id,
    merchantChargeId: webhook.merchantChargeId ?? payment.merchant_charge_id,
    paidAt:
      nextStatus === "paid"
        ? webhook.paidAt ?? new Date().toISOString()
        : payment.paid_at,
    expiresAt: webhook.expiresAt ?? payment.expires_at,
  });

  let subscription: BillingSubscriptionRow | null = null;

  if (updatedPayment.subscription_id) {
    subscription = await findSubscriptionById(updatedPayment.subscription_id).catch(
      () => null,
    );
  }

  if (nextStatus === "paid") {
    if (updatedPayment.kind === "subscription") {
      const paidAt = webhook.paidAt ?? new Date().toISOString();
      const extensionBase =
        subscription?.current_period_end &&
        new Date(subscription.current_period_end).getTime() > new Date(paidAt).getTime()
          ? subscription.current_period_end
          : paidAt;
      const nextPeriodEnd = addMonthsIso(extensionBase, 1);

      const grantedPayment = await finalizeGrantedPayment(updatedPayment, {
        subscriptionPeriodStart: paidAt,
        subscriptionPeriodEnd: nextPeriodEnd,
        note: "Plano Pro ativado via Pix.",
      });

      return {
        ignored: false,
        payment: grantedPayment,
        subscription: grantedPayment.subscription_id
          ? await findSubscriptionById(grantedPayment.subscription_id).catch(() => null)
          : null,
      } as const;
    }

    const grantedPayment = await finalizeGrantedPayment(updatedPayment);

    return {
      ignored: false,
      payment: grantedPayment,
      subscription: null,
    } as const;
  }

  return {
    ignored: false,
    payment: updatedPayment,
    subscription,
  } as const;
}
