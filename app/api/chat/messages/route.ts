import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type MessageBody = {
  conversationId?: string;
  body?: string;
};

type ConversationRow = {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
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

  let body: MessageBody;

  try {
    body = (await request.json()) as MessageBody;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const text = body.body?.trim() ?? "";

  if (!body.conversationId || text.length < 2) {
    return NextResponse.json(
      { error: "Conversa e mensagem sao obrigatorias." },
      { status: 400 },
    );
  }

  if (text.length > 1200) {
    return NextResponse.json(
      { error: "A mensagem passou do limite." },
      { status: 400 },
    );
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("marketplace_conversations")
    .select("id, participant_a_id, participant_b_id")
    .eq("id", body.conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return NextResponse.json(
      { error: "Conversa nao encontrada." },
      { status: 404 },
    );
  }

  const typedConversation = conversation as ConversationRow;
  const isParticipant =
    typedConversation.participant_a_id === user.id ||
    typedConversation.participant_b_id === user.id;

  if (!isParticipant) {
    return NextResponse.json(
      { error: "Tu nao participa dessa conversa." },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const { data: message, error: messageError } = await supabase
    .from("marketplace_messages")
    .insert({
      conversation_id: body.conversationId,
      sender_id: user.id,
      body: text,
    })
    .select("id, body, created_at")
    .single();

  if (messageError || !message) {
    return NextResponse.json(
      { error: "Nao foi possivel enviar a mensagem." },
      { status: 500 },
    );
  }

  await supabase
    .from("marketplace_conversations")
    .update({
      last_message_preview: text.slice(0, 180),
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", body.conversationId);

  return NextResponse.json({
    id: message.id,
    text: message.body,
    createdAt: message.created_at,
    time: new Date(message.created_at).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}
