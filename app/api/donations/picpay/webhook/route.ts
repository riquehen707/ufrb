import { NextResponse } from "next/server";

import {
  getPicPayCharge,
  getPicPayWebhookToken,
  mapPicPayChargeToDonationStatus,
  resolvePicPayWebhookToken,
} from "@/lib/payments/picpay";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PicPayWebhookPayload = {
  data?: {
    merchantChargeId?: string;
  };
};

export async function POST(request: Request) {
  const configuredWebhookToken = getPicPayWebhookToken();
  const receivedAuthorization = resolvePicPayWebhookToken(
    request.headers.get("authorization"),
  );

  if (!configuredWebhookToken || receivedAuthorization !== configuredWebhookToken) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  let payload: PicPayWebhookPayload;

  try {
    payload = (await request.json()) as PicPayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const merchantChargeId = payload.data?.merchantChargeId?.trim();

  if (!merchantChargeId) {
    return NextResponse.json(
      { error: "merchantChargeId obrigatorio." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin indisponivel." },
      { status: 503 },
    );
  }

  try {
    const charge = await getPicPayCharge(merchantChargeId);
    const nextStatus = mapPicPayChargeToDonationStatus(charge);
    const transaction = charge.transactions?.[0];
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("donations")
      .update({
        status: nextStatus,
        provider_transaction_id: transaction?.transactionId ?? charge.id ?? null,
        provider_payload: {
          provider: "picpay",
          webhook: payload,
          charge,
        },
        confirmed_at: nextStatus === "confirmed" ? now : null,
        cancelled_at: nextStatus === "cancelled" ? now : null,
      })
      .eq("id", merchantChargeId)
      .select("id, status, supporter_profile_id")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "Nao foi possivel atualizar a doacao." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      donationId: data.id,
      status: data.status,
      supporterProfileId: data.supporter_profile_id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel validar o pagamento no PicPay.",
      },
      { status: 502 },
    );
  }
}
