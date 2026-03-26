import { NextResponse } from "next/server";

import { isTokenPackageCode } from "@/lib/monetization/token-packages";
import { createTokenPackageCheckout } from "@/lib/services/picpay-billing-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CreatePaymentBody = {
  packageCode?: string;
  customerName?: string;
  customerEmail?: string;
  customerDocument?: string;
  customerPhone?: string;
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "127.0.0.1";
  }

  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase indisponivel." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sem sessao ativa." }, { status: 401 });
  }

  let body: CreatePaymentBody;

  try {
    body = (await request.json()) as CreatePaymentBody;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  if (!body.packageCode || !isTokenPackageCode(body.packageCode)) {
    return NextResponse.json({ error: "Pacote invalido." }, { status: 400 });
  }

  const customerDocument = body.customerDocument?.trim() ?? "";
  const customerPhone = body.customerPhone?.trim() ?? "";
  const customerName =
    body.customerName?.trim() ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Perfil CAMPUS";
  const customerEmail = body.customerEmail?.trim() || user.email || "";

  if (!customerDocument || !customerPhone || !customerEmail) {
    return NextResponse.json(
      { error: "Documento, telefone e e-mail sao obrigatorios." },
      { status: 400 },
    );
  }

  try {
    const result = await createTokenPackageCheckout({
      profileId: user.id,
      packageCode: body.packageCode,
      customerName,
      customerEmail,
      customerDocument,
      customerPhone,
      customerIp: getClientIp(request),
    });

    return NextResponse.json({
      paymentId: result.payment.id,
      package: result.package,
      merchantChargeId: result.charge.merchantChargeId,
      transactionId: result.charge.transactionId ?? null,
      qrCode: result.charge.qrCode ?? null,
      qrCodeBase64: result.charge.qrCodeBase64 ?? null,
      expiresAt: result.charge.expiresAt ?? null,
      status: result.payment.status,
    });
  } catch (error) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Nao foi possivel criar a cobranca.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
