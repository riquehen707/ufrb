import {
  isPicPayConfigured,
  picpayApiBaseUrl,
  picpayClientId,
  picpayClientSecret,
  picpayWebhookToken,
} from "@/lib/supabase/env";

type PicPayTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  message?: string;
};

type PicPayChargeTransaction = {
  transactionId?: string;
  transactionStatus?: string;
  pix?: {
    qrCode?: string;
    qrCodeBase64?: string;
    endToEndId?: string;
    expiresAt?: string;
  };
  wallet?: {
    qrCode?: string;
    qrCodeBase64?: string;
    expiresAt?: string;
  };
};

export type PicPayChargeResponse = {
  id?: string;
  merchantChargeId?: string;
  chargeStatus?: string;
  transactions?: PicPayChargeTransaction[];
  message?: string;
  success?: boolean;
  errors?: unknown;
};

type PicPayPixChargeInput = {
  merchantChargeId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  customerIp: string;
};

export type PicPayPixChargeResult = {
  chargeId: string;
  merchantChargeId: string;
  chargeStatus: string;
  transactionId?: string;
  transactionStatus?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  endToEndId?: string;
  expiresAt?: string;
  raw: PicPayChargeResponse;
};

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

function normalizeCpf(document: string) {
  return document.replace(/\D/g, "");
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits.slice(2) : digits;

  if (normalized.length < 10 || normalized.length > 11) {
    throw new Error("Telefone invalido para gerar o Pix.");
  }

  return {
    countryCode: "55",
    areaCode: normalized.slice(0, 2),
    number: normalized.slice(2),
    type: "MOBILE" as const,
  };
}

function getPrimaryTransaction(charge: PicPayChargeResponse) {
  return charge.transactions?.[0];
}

export function resolvePicPayWebhookToken(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  return headerValue.startsWith("Bearer ")
    ? headerValue.slice("Bearer ".length).trim()
    : headerValue.trim();
}

export function mapPicPayChargeToDonationStatus(
  charge: Pick<PicPayChargeResponse, "chargeStatus" | "transactions">,
) {
  const chargeStatus = charge.chargeStatus?.toUpperCase() ?? "";
  const transactionStatus =
    getPrimaryTransaction(charge)?.transactionStatus?.toUpperCase() ?? "";

  if (chargeStatus === "PAID" || transactionStatus === "PAID") {
    return "confirmed" as const;
  }

  if (
    ["CANCELED", "DENIED", "ERROR", "REFUNDED", "CHARGEBACK"].includes(
      chargeStatus,
    ) ||
    ["CANCELED", "DENIED", "ERROR", "EXPIRED", "REFUNDED", "CHARGEBACK"].includes(
      transactionStatus,
    )
  ) {
    return "cancelled" as const;
  }

  return "pending" as const;
}

export function getPicPayWebhookToken() {
  return picpayWebhookToken ?? null;
}

export { isPicPayConfigured };

async function getPicPayAccessToken() {
  if (!isPicPayConfigured() || !picpayClientId || !picpayClientSecret) {
    throw new Error("PicPay nao configurado.");
  }

  const response = await fetch(`${picpayApiBaseUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: picpayClientId,
      client_secret: picpayClientSecret,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | PicPayTokenResponse
    | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      normalizePicPayError(payload, "Nao foi possivel autenticar no PicPay."),
    );
  }

  return payload.access_token;
}

export async function createPicPayPixCharge(
  input: PicPayPixChargeInput,
): Promise<PicPayPixChargeResult> {
  const document = normalizeCpf(input.customerDocument);

  if (document.length !== 11) {
    throw new Error("CPF invalido para gerar o Pix.");
  }

  const token = await getPicPayAccessToken();
  const phone = normalizePhone(input.customerPhone);
  const response = await fetch(`${picpayApiBaseUrl}/charge/pix`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      paymentSource: "GATEWAY",
      merchantChargeId: input.merchantChargeId,
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        documentType: "CPF",
        document,
        phone,
        deviceInformation: {
          ip: input.customerIp,
        },
      },
      transactions: [
        {
          amount: Math.round(input.amount * 100),
          pix: {
            expiration: 900,
          },
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | PicPayChargeResponse
    | null;

  if (!response.ok || !payload) {
    throw new Error(
      normalizePicPayError(payload, "Nao foi possivel gerar o Pix no PicPay."),
    );
  }

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
  };
}

export async function getPicPayCharge(merchantChargeId: string) {
  const token = await getPicPayAccessToken();
  const response = await fetch(
    `${picpayApiBaseUrl}/charge/${merchantChargeId}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | PicPayChargeResponse
    | null;

  if (!response.ok || !payload) {
    throw new Error(
      normalizePicPayError(payload, "Nao foi possivel consultar o Pix no PicPay."),
    );
  }

  return payload;
}
