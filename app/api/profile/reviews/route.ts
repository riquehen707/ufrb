import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReviewBody = {
  orderId?: string;
  rating?: number;
  comment?: string;
};

type OrderRow = {
  id: string;
  buyer_profile_id: string;
  seller_profile_id: string;
  order_type: "product" | "service";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  reviewed_by_buyer_at: string | null;
  reviewed_by_seller_at: string | null;
};

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

  let body: ReviewBody;

  try {
    body = (await request.json()) as ReviewBody;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const rating = Number(body.rating);

  if (!body.orderId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Pedido e nota validos sao obrigatorios." },
      { status: 400 },
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("marketplace_orders")
    .select(
      "id, buyer_profile_id, seller_profile_id, order_type, status, reviewed_by_buyer_at, reviewed_by_seller_at",
    )
    .eq("id", body.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
  }

  const typedOrder = order as OrderRow;

  if (typedOrder.status !== "completed") {
    return NextResponse.json(
      { error: "So da para avaliar pedidos concluidos." },
      { status: 400 },
    );
  }

  const isBuyer = typedOrder.buyer_profile_id === user.id;
  const isSeller = typedOrder.seller_profile_id === user.id;

  if (!isBuyer && !isSeller) {
    return NextResponse.json(
      { error: "Tu nao participa desse pedido." },
      { status: 403 },
    );
  }

  if ((isBuyer && typedOrder.reviewed_by_buyer_at) || (isSeller && typedOrder.reviewed_by_seller_at)) {
    return NextResponse.json(
      { error: "Essa avaliacao ja foi enviada." },
      { status: 409 },
    );
  }

  const reviewedProfileId = isBuyer
    ? typedOrder.seller_profile_id
    : typedOrder.buyer_profile_id;

  const { error: reviewError } = await supabase.from("marketplace_reviews").insert({
    order_id: typedOrder.id,
    reviewer_id: user.id,
    reviewed_profile_id: reviewedProfileId,
    review_type: typedOrder.order_type,
    rating,
    comment: body.comment?.trim() || null,
  });

  if (reviewError) {
    return NextResponse.json(
      { error: "Nao foi possivel salvar a avaliacao." },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const updatePayload = isBuyer
    ? { reviewed_by_buyer_at: now }
    : { reviewed_by_seller_at: now };

  const { error: updateError } = await supabase
    .from("marketplace_orders")
    .update(updatePayload)
    .eq("id", typedOrder.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Avaliacao salva, mas o pedido nao atualizou." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    orderId: typedOrder.id,
    reviewedProfileId,
    rating,
  });
}
