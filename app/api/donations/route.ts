import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { createDonationReference } from "@/lib/donations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DonationRequestBody = {
  donorName?: string;
  donorEmail?: string;
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
  const amount = Number(body.amount);
  const method = body.method?.trim() ?? "pix";
  const note = body.note?.trim() || null;
  const isPublic = body.isPublic ?? true;

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const donationId = randomUUID();
  const paymentReference = createDonationReference(donationId);

  const { error } = await supabase.from("donations").insert({
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
