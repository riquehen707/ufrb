import {
  isPicPayConfigured,
  picPayAuthBaseUrl,
  picPayCallerOrigin,
  picPayClientId,
  picPayClientSecret,
  picPayPixBaseUrl,
  picPayWebhookToken,
} from "@/lib/payments/picpay/config";
import type {
  PicPayAuthTokenResponse,
  PicPayChargeResponse,
  PicPayCustomer,
  PicPayPhone,
  PicPayPixChargeResult,
  PicPayWebhookEvent,
} from "@/lib/payments/picpay/types";

type CachedToken = {
  value: string;
  expiresAt: number;
};

let tokenCache: CachedToken | null = null;
let tokenRequest: Promise<string> | null = null;

function normalizePicPayError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  if ("errors" in payload && Array.isArray(payload.errors)) {
    const firstError = payload.errors[0];

    if (
      firstError &&
      typeof firstError === "object" &&
      "message" in firstError &&
      typeof firstError.message === "string"
    ) {
      return firstError.message;
    }
  }

  return fallback;
}

function getPrimaryTransaction(charge: PicPayChargeResponse) {
  return charge.transactions?.[0];
}

function normalizeDocument(document: string) {
  return document.replace(/\D/g, "");
}

export function normalizePhone(phone: string): PicPayPhone {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits.slice(2) : digits;

  if (normalized.length < 10 || normalized.length > 11) {
    throw new Error("Telefone invalido para o PicPay.");
  }

  return {
    countryCode: "55",
    areaCode: normalized.slice(0, 2),
    number: normalized.slice(2),
    type: "MOBILE",
  };
}

export function normalizeCustomer(input: {
  name: string;
  email: string;
  document: string;
  documentType?: "CPF" | "CNPJ";
  phone: string;
}): PicPayCustomer {
  const document = normalizeDocument(input.document);

  if (document.length !== 11 && document.length !== 14) {
    throw new Error("Documento invalido para o PicPay.");
  }

  return {
    name: input.name,
    email: input.email,
    document,
    documentType: input.documentType ?? (document.length === 14 ? "CNPJ" : "CPF"),
    phone: normalizePhone(input.phone),
  };
}

export function resolvePicPayWebhookToken(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  return headerValue.startsWith("Bearer ")
    ? headerValue.slice("Bearer ".length).trim()
    : headerValue.trim();
}

export function getPicPayWebhookToken() {
  return picPayWebhookToken ?? null;
}

export function mapPicPayPaymentStatus(input: {
  providerStatus?: string | null;
  chargeStatus?: string | null;
}) {
  const providerStatus = input.providerStatus?.toUpperCase() ?? "";
  const chargeStatus = input.chargeStatus?.toUpperCase() ?? "";
  const normalizedStatus = providerStatus || chargeStatus;

  if (["PAID", "CAPTURED"].includes(normalizedStatus)) {
    return "paid" as const;
  }

  if (["AUTHORIZED", "PRE_AUTHORIZED"].includes(normalizedStatus)) {
    return "authorized" as const;
  }

  if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(normalizedStatus)) {
    return "refunded" as const;
  }

  if (["DENIED", "ERROR", "CHARGEBACK"].includes(normalizedStatus)) {
    return "failed" as const;
  }

  if (["CANCELED", "EXPIRED"].includes(normalizedStatus)) {
    return "cancelled" as const;
  }

  return "pending" as const;
}

async function getAccessToken() {
  if (!isPicPayConfigured() || !picPayClientId || !picPayClientSecret) {
    throw new Error("PICPAY_NOT_CONFIGURED");
  }

  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.value;
  }

  if (tokenRequest) {
    return tokenRequest;
  }

  tokenRequest = (async () => {
    const response = await fetch(`${picPayAuthBaseUrl}/oauth2/token`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: picPayClientId,
        client_secret: picPayClientSecret,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | PicPayAuthTokenResponse
      | null;

    if (!response.ok || !payload?.access_token) {
      throw new Error(
        normalizePicPayError(payload, "Nao foi possivel autenticar no PicPay."),
      );
    }

    tokenCache = {
      value: payload.access_token,
      expiresAt: Date.now() + Math.max((payload.expires_in ?? 300) - 30, 30) * 1000,
    };

    return payload.access_token;
  })();

  try {
    return await tokenRequest;
  } finally {
    tokenRequest = null;
  }
}

async function requestPicPay<T>(input: {
  baseUrl: string;
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
}) {
  const token = await getAccessToken();
  const response = await fetch(`${input.baseUrl}${input.path}`, {
    method: input.method ?? "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...(input.body
        ? {
            "content-type": "application/json",
          }
        : {}),
      "caller-origin": picPayCallerOrigin,
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || !payload) {
    throw new Error(normalizePicPayError(payload, "Erro na API do PicPay."));
  }

  return payload;
}

export async function createPicPayPixCharge(input: {
  merchantChargeId: string;
  amountCents: number;
  customer: PicPayCustomer;
  customerIp: string;
  expirationSeconds?: number;
}) {
  const payload = await requestPicPay<PicPayChargeResponse>({
    baseUrl: picPayPixBaseUrl,
    path: "/charge/pix",
    method: "POST",
    body: {
      paymentSource: "GATEWAY",
      merchantChargeId: input.merchantChargeId,
      customer: {
        ...input.customer,
        deviceInformation: {
          ip: input.customerIp,
        },
      },
      transactions: [
        {
          amount: input.amountCents,
          pix: {
            expiration: input.expirationSeconds ?? 900,
          },
        },
      ],
    },
  });

  const transaction = getPrimaryTransaction(payload);
  const pix = transaction?.pix ?? transaction?.wallet;

  if (!payload.id || !payload.merchantChargeId) {
    throw new Error("PicPay respondeu sem identificadores da cobranca.");
  }

  return {
    chargeId: payload.id,
    merchantChargeId: payload.merchantChargeId,
    chargeStatus: payload.chargeStatus ?? "PENDING",
    transactionId: transaction?.transactionId,
    transactionStatus: transaction?.transactionStatus,
    qrCode: pix?.qrCode,
    qrCodeBase64: pix?.qrCodeBase64,
    endToEndId: transaction?.pix?.endToEndId,
    expiresAt: pix?.expiresAt,
    raw: payload,
  } satisfies PicPayPixChargeResult;
}

export async function getPicPayCharge(merchantChargeId: string) {
  return requestPicPay<PicPayChargeResponse>({
    baseUrl: picPayPixBaseUrl,
    path: `/charge/${merchantChargeId}`,
  });
}

export function extractWebhookPaymentData(event: PicPayWebhookEvent) {
  const transaction = event.data?.transactions?.[0];

  return {
    eventId: event.id ?? null,
    eventType: event.type ?? null,
    merchantChargeId: event.data?.merchantChargeId ?? null,
    chargeId: event.data?.chargeId ?? null,
    transactionId: transaction?.transactionId ?? null,
    paymentType: transaction?.paymentType ?? null,
    paymentStatus: transaction?.status ?? event.data?.status ?? null,
    amountCents: transaction?.amount ?? event.data?.amount ?? 0,
    paidAt: transaction?.updatedAt ?? event.eventDate ?? null,
    expiresAt:
      transaction?.pix?.expiresAt ?? transaction?.wallet?.expiresAt ?? null,
    customerEmail: event.data?.customer?.email ?? null,
    customerDocument: event.data?.customer?.document ?? null,
  };
}
