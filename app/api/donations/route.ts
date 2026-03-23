import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { createDonationReference } from "@/lib/donations";
import {
  createPicPayPixCharge,
  isPicPayConfigured,
  mapPicPayChargeToDonationStatus,
} from "@/lib/payments/picpay";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DonationRequestBody = {
  donorName?: string;
  donorEmail?: string;
  donorDocument?: string;
  donorPhone?: string;
  amount?: number;
  method?: string;
  note?: string;
  isPublic?: boolean;
};

const allowedMethods = new Set(["pix", "apoio", "transferencia"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase indisponivel." },
      { status: 503 },
    );
  }

  let body: DonationRequestBody;

  try {
    body = (await request.json()) as DonationRequestBody;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const donorName = body.donorName?.trim();
  const donorEmail = body.donorEmail?.trim() || null;
  const donorDocument = body.donorDocument?.trim() || null;
  const donorPhone = body.donorPhone?.trim() || null;
  const amount = Number(body.amount);
  const method = body.method?.trim() ?? "pix";
  const note = body.note?.trim() || null;
  const isPublic = body.isPublic ?? true;
  const usePicPayForPix = method === "pix" && isPicPayConfigured();

  if (!donorName || Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Nome e valor valido sao obrigatorios." },
      { status: 400 },
    );
  }

  if (!allowedMethods.has(method)) {
    return NextResponse.json(
      { error: "Metodo de apoio invalido." },
      { status: 400 },
    );
  }

  if (usePicPayForPix && (!donorEmail || !donorDocument || !donorPhone)) {
    return NextResponse.json(
      {
        error: "E-mail, CPF e celular sao obrigatorios para gerar o Pix.",
      },
      { status: 400 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const donationAdminClient = usePicPayForPix ? createSupabaseAdminClient() : null;

  if (usePicPayForPix && !donationAdminClient) {
    return NextResponse.json(
      { error: "Configuracao admin do Supabase indisponivel." },
      { status: 503 },
    );
  }

  const donationWriter = donationAdminClient ?? supabase;

  const donationId = randomUUID();
  const paymentReference = createDonationReference(donationId);

  const { error } = await donationWriter.from("donations").insert({
    id: donationId,
    supporter_profile_id: user?.id ?? null,
    donor_name: donorName,
    donor_email: donorEmail,
    amount,
    method,
    note,
    is_public: isPublic,
    payment_reference: paymentReference,
    status: "pending",
  });

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel registrar o apoio agora." },
      { status: 500 },
    );
  }

  if (usePicPayForPix && donorEmail && donorDocument && donorPhone) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const customerIp =
      forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "127.0.0.1";

    try {
      const charge = await createPicPayPixCharge({
        merchantChargeId: donationId,
        amount,
        customerName: donorName,
        customerEmail: donorEmail,
        customerDocument: donorDocument,
        customerPhone: donorPhone,
        customerIp,
      });
      const nextStatus = mapPicPayChargeToDonationStatus(charge.raw);
      const now = new Date().toISOString();
      const { error: chargeUpdateError } = await donationWriter
        .from("donations")
        .update({
          status: nextStatus,
          provider_transaction_id: charge.transactionId ?? charge.chargeId,
          provider_payload: {
            provider: "picpay",
            chargeId: charge.chargeId,
            merchantChargeId: charge.merchantChargeId,
            chargeStatus: charge.chargeStatus,
            transactionStatus: charge.transactionStatus ?? null,
            endToEndId: charge.endToEndId ?? null,
          },
          confirmed_at: nextStatus === "confirmed" ? now : null,
          cancelled_at: nextStatus === "cancelled" ? now : null,
        })
        .eq("id", donationId);

      if (chargeUpdateError) {
        throw new Error("Nao foi possivel salvar a cobranca do PicPay.");
      }

      return NextResponse.json(
        {
          donationId,
          paymentReference,
          amount,
          status: nextStatus,
          provider: "picpay",
          qrCode: charge.qrCode ?? null,
          qrCodeBase64: charge.qrCodeBase64 ?? null,
          expiresAt: charge.expiresAt ?? null,
        },
        { status: 201 },
      );
    } catch (picpayError) {
      await donationWriter.from("donations").delete().eq("id", donationId);

      return NextResponse.json(
        {
          error:
            picpayError instanceof Error
              ? picpayError.message
              : "Nao foi possivel gerar o Pix agora.",
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json(
    {
      donationId,
      paymentReference,
      amount,
      status: "pending",
    },
    { status: 201 },
  );
}
