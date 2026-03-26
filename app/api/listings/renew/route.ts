import { NextResponse } from "next/server";

import { renewListingWithTokens } from "@/lib/services/listing-service";
import { getAuthenticatedTokenSnapshot } from "@/lib/services/token-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RenewListingBody = {
  listingId?: string;
};

function getErrorPayload(error: unknown) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "Nao foi possivel renovar o anuncio.";

  if (message.includes("Saldo de tokens insuficiente")) {
    return {
      status: 409,
      error: "Saldo de tokens insuficiente para renovar esse anuncio.",
    };
  }

  if (message.includes("Anuncio nao encontrado")) {
    return {
      status: 404,
      error: "Anuncio nao encontrado para renovacao.",
    };
  }

  return {
    status: 500,
    error: "Nao foi possivel renovar o anuncio agora.",
  };
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

  let body: RenewListingBody;

  try {
    body = (await request.json()) as RenewListingBody;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  if (!body.listingId?.trim()) {
    return NextResponse.json(
      { error: "Anuncio invalido para renovacao." },
      { status: 400 },
    );
  }

  try {
    const result = await renewListingWithTokens({
      supabase,
      profileId: user.id,
      listingId: body.listingId,
    });
    const tokenSnapshot = await getAuthenticatedTokenSnapshot(supabase);

    return NextResponse.json({
      listing: result.listing,
      tokenCost: result.monetization.amount,
      tokenBalance: tokenSnapshot?.tokenBalance ?? null,
    });
  } catch (error) {
    const payload = getErrorPayload(error);
    return NextResponse.json({ error: payload.error }, { status: payload.status });
  }
}
