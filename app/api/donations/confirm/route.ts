import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { donationWebhookSecret } from "@/lib/supabase/env";

type DonationConfirmationBody = {
  donationId?: string;
  status?: "confirmed" | "cancelled";
  paymentReference?: string;
  providerTransactionId?: string;
  providerPayload?: unknown;
};

export async function POST(request: Request) {
  const secret = request.headers.get("x-donation-webhook-secret");

  if (!donationWebhookSecret || secret !== donationWebhookSecret) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin indisponivel." },
      { status: 503 },
    );
  }

  let body: DonationConfirmationBody;

  try {
    body = (await request.json()) as DonationConfirmationBody;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  if (!body.donationId) {
    return NextResponse.json(
      { error: "Donation id obrigatorio." },
      { status: 400 },
    );
  }

  const nextStatus = body.status ?? "confirmed";

  if (nextStatus !== "confirmed" && nextStatus !== "cancelled") {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("donations")
    .update({
      status: nextStatus,
      payment_reference: body.paymentReference ?? null,
      provider_transaction_id: body.providerTransactionId ?? null,
      provider_payload:
        body.providerPayload && typeof body.providerPayload === "object"
          ? body.providerPayload
          : {},
      confirmed_at: nextStatus === "confirmed" ? now : null,
      cancelled_at: nextStatus === "cancelled" ? now : null,
    })
    .eq("id", body.donationId)
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
}
