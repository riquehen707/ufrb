import { NextResponse } from "next/server";

import type { HousingDetails } from "@/lib/housing";
import type {
  ItemCondition,
  ListingIntent,
  ListingType,
  NegotiationMode,
} from "@/lib/listing-taxonomy";
import { createListingWithTokens } from "@/lib/services/listing-service";
import { getAuthenticatedTokenSnapshot } from "@/lib/services/token-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateListingBody = {
  sellerCourse?: string | null;
  intent?: ListingIntent;
  campus?: string;
  type?: ListingType;
  category?: string;
  focus?: string | null;
  itemCondition?: ItemCondition | null;
  negotiationMode?: NegotiationMode;
  imageUrl?: string | null;
  galleryUrls?: string[];
  locationNote?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  housingDetails?: HousingDetails | null;
  title?: string;
  description?: string;
  price?: number;
  priceUnit?: string | null;
  deliveryMode?: string;
  tags?: string[];
};

function isListingType(value: unknown): value is ListingType {
  return value === "product" || value === "service";
}

function isListingIntent(value: unknown): value is ListingIntent {
  return value === "offer" || value === "request";
}

function isNegotiationMode(value: unknown): value is NegotiationMode {
  return value === "fixed" || value === "negotiable" || value === "counter_offer";
}

function isItemCondition(value: unknown): value is ItemCondition {
  return value === "new" || value === "used";
}

function getErrorPayload(error: unknown) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "Nao foi possivel criar o anuncio.";

  if (message.includes("Saldo de tokens insuficiente")) {
    return {
      status: 409,
      error: "Saldo de tokens insuficiente para publicar esse anuncio.",
    };
  }

  if (message.includes("Nao autorizado")) {
    return {
      status: 403,
      error: "Sessao sem permissao para publicar.",
    };
  }

  return {
    status: 500,
    error: "Nao foi possivel criar o anuncio agora.",
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

  let body: CreateListingBody;

  try {
    body = (await request.json()) as CreateListingBody;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const campus = body.campus?.trim() ?? "";
  const category = body.category?.trim() ?? "";
  const deliveryMode = body.deliveryMode?.trim() ?? "";
  const type = body.type;
  const intent = body.intent;
  const negotiationMode = body.negotiationMode;
  const price = Number(body.price);

  if (
    !title ||
    !description ||
    !campus ||
    !category ||
    !deliveryMode ||
    !isListingType(type) ||
    !isListingIntent(intent) ||
    !isNegotiationMode(negotiationMode) ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return NextResponse.json(
      { error: "Preenche os campos principais do anuncio." },
      { status: 400 },
    );
  }

  if (type === "product" && body.itemCondition && !isItemCondition(body.itemCondition)) {
    return NextResponse.json(
      { error: "Estado do item invalido." },
      { status: 400 },
    );
  }

  try {
    const result = await createListingWithTokens({
      supabase,
      profileId: user.id,
      input: {
        sellerName:
          user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Perfil CAMPUS",
        sellerCourse: body.sellerCourse?.trim() || null,
        intent,
        campus,
        type,
        category,
        focus: body.focus?.trim() || null,
        itemCondition: type === "product" ? (body.itemCondition ?? "used") : null,
        negotiationMode,
        imageUrl: body.imageUrl ?? null,
        galleryUrls: body.galleryUrls ?? [],
        locationNote: body.locationNote?.trim() || null,
        locationLat: body.locationLat ?? null,
        locationLng: body.locationLng ?? null,
        housingDetails: body.housingDetails ?? null,
        title,
        description,
        price,
        priceUnit: body.priceUnit?.trim() || null,
        deliveryMode,
        tags: body.tags ?? [],
      },
    });

    const tokenSnapshot = await getAuthenticatedTokenSnapshot(supabase);

    return NextResponse.json({
      listing: result.listing,
      tokenCost: result.monetization.amount,
      listingTier: result.monetization.tier,
      tokenBalance: tokenSnapshot?.tokenBalance ?? null,
    });
  } catch (error) {
    const payload = getErrorPayload(error);
    return NextResponse.json({ error: payload.error }, { status: payload.status });
  }
}
