import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ChatScope = "products" | "classes" | "transport" | "services";

export type ChatMessage = {
  id: string;
  author: "me" | "them";
  text: string;
  time: string;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  scope: ChatScope;
  title: string;
  counterpart: string;
  counterpartId: string;
  counterpartCourse?: string;
  campus: string;
  time: string;
  snippet: string;
  listingId?: string | null;
  listingHref?: string;
  counterpartHref?: string;
  messages: ChatMessage[];
};

export type ChatSnapshot = {
  threads: ChatThread[];
  selectedThreadId: string | null;
  suggestedDraft: string;
};

type ConversationRow = {
  id: string;
  listing_id: string | null;
  participant_a_id: string;
  participant_b_id: string;
  scope: ChatScope;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ProfileMetaRow = {
  id: string;
  full_name: string | null;
  course: string | null;
};

type ListingMetaRow = {
  id: string;
  owner_id: string | null;
  title: string;
  category: string;
  campus: string | null;
  status?: string | null;
};

function normalizeLookupValue(value?: string | null) {
  return value
    ?.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase() ?? "";
}

function resolveChatScope(category?: string | null): ChatScope {
  const normalized = normalizeLookupValue(category);

  if (normalized === "aulas e monitoria") {
    return "classes";
  }

  if (normalized === "transporte comunitario") {
    return "transport";
  }

  if (normalized.includes("servicos")) {
    return "services";
  }

  return "products";
}

function formatThreadTime(dateString?: string | null) {
  if (!dateString) {
    return "agora";
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const sameDay = now.toDateString() === date.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (yesterday.toDateString() === date.toDateString()) {
    return "Ontem";
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
    });
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatMessageTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSuggestedDraft(action?: string | null) {
  const normalized = normalizeLookupValue(action).replace(/\s+/g, "-");

  if (!normalized) {
    return "";
  }

  if (
    normalized.includes("aula") ||
    normalized.includes("ensino") ||
    normalized.includes("grupo")
  ) {
    return "Oi! Tenho interesse nessa aula. Consegue me passar horarios e como a gente pode combinar?";
  }

  if (
    normalized.includes("transporte") ||
    normalized.includes("vaga") ||
    normalized.includes("rota")
  ) {
    return "Oi! Tenho interesse nesse horario. Consegue me confirmar rota, ponto e valor por pessoa?";
  }

  if (
    normalized.includes("moradia") ||
    normalized.includes("visita") ||
    normalized.includes("casa")
  ) {
    return "Oi! Tenho interesse nessa moradia. Queria alinhar visita, valor e como funciona a convivencia.";
  }

  if (normalized.includes("demanda")) {
    return "Oi! Vi tua demanda e consigo ajudar. Posso te mandar uma proposta por aqui?";
  }

  if (normalized.includes("servico")) {
    return "Oi! Tenho interesse nesse servico. Consegue me passar disponibilidade e como costuma fechar o valor?";
  }

  return "Oi! Tenho interesse nesse anuncio. Podemos combinar por aqui?";
}

async function ensureConversationForListing(
  profileId: string,
  listingId: string,
) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_id, title, category, campus, status")
    .eq("id", listingId)
    .eq("status", "active")
    .maybeSingle();

  if (listingError || !listing) {
    return null;
  }

  const typedListing = listing as ListingMetaRow;

  if (!typedListing.owner_id || typedListing.owner_id === profileId) {
    return null;
  }

  const [participantA, participantB] = [profileId, typedListing.owner_id].sort((a, b) =>
    a.localeCompare(b),
  );

  const { data: existingConversation } = await supabase
    .from("marketplace_conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("participant_a_id", participantA)
    .eq("participant_b_id", participantB)
    .maybeSingle();

  if (existingConversation?.id) {
    return existingConversation.id as string;
  }

  const { data: insertedConversation, error: insertError } = await supabase
    .from("marketplace_conversations")
    .insert({
      listing_id: listingId,
      participant_a_id: participantA,
      participant_b_id: participantB,
      created_by: profileId,
      scope: resolveChatScope(typedListing.category),
    })
    .select("id")
    .single();

  if (insertError || !insertedConversation?.id) {
    return null;
  }

  return insertedConversation.id as string;
}

export async function getCurrentChatSnapshot(options?: {
  profileId?: string | null;
  listingId?: string | null;
  action?: string | null;
  conversationId?: string | null;
}): Promise<ChatSnapshot> {
  const profileId = options?.profileId ?? null;

  if (!profileId || !isSupabaseConfigured()) {
    return {
      threads: [],
      selectedThreadId: null,
      suggestedDraft: getSuggestedDraft(options?.action),
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      threads: [],
      selectedThreadId: null,
      suggestedDraft: getSuggestedDraft(options?.action),
    };
  }

  const openedConversationId =
    options?.listingId ? await ensureConversationForListing(profileId, options.listingId) : null;

  const { data: conversationRows, error: conversationsError } = await supabase
    .from("marketplace_conversations")
    .select(
      "id, listing_id, participant_a_id, participant_b_id, scope, last_message_preview, last_message_at, created_at, updated_at",
    )
    .or(`participant_a_id.eq.${profileId},participant_b_id.eq.${profileId}`)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (conversationsError || !conversationRows?.length) {
    return {
      threads: [],
      selectedThreadId: null,
      suggestedDraft: getSuggestedDraft(options?.action),
    };
  }

  const typedConversations = conversationRows as ConversationRow[];
  const selectedThreadId =
    typedConversations.find((thread) => thread.id === openedConversationId)?.id ??
    typedConversations.find((thread) => thread.id === options?.conversationId)?.id ??
    typedConversations[0]?.id ??
    null;
  const listingIds = Array.from(
    new Set(
      typedConversations
        .map((conversation) => conversation.listing_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const counterpartIds = Array.from(
    new Set(
      typedConversations
        .map((conversation) =>
          conversation.participant_a_id === profileId
            ? conversation.participant_b_id
            : conversation.participant_a_id,
        )
        .filter(Boolean),
    ),
  );
  const conversationIds = typedConversations.map((conversation) => conversation.id);

  const [listingRows, profileRows, messageRows] = await Promise.all([
    listingIds.length
      ? supabase
          .from("listings")
          .select("id, owner_id, title, category, campus")
          .in("id", listingIds)
          .then(({ data }) => (data ?? []) as ListingMetaRow[])
      : Promise.resolve([] as ListingMetaRow[]),
    counterpartIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, course")
          .in("id", counterpartIds)
          .then(({ data }) => (data ?? []) as ProfileMetaRow[])
      : Promise.resolve([] as ProfileMetaRow[]),
    conversationIds.length
      ? supabase
          .from("marketplace_messages")
          .select("id, conversation_id, sender_id, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: true })
          .limit(300)
          .then(({ data }) => (data ?? []) as MessageRow[])
      : Promise.resolve([] as MessageRow[]),
  ]);

  const listingMap = new Map(listingRows.map((row) => [row.id, row]));
  const profileMap = new Map(profileRows.map((row) => [row.id, row]));
  const messagesByConversation = new Map<string, ChatMessage[]>();

  messageRows.forEach((message) => {
    const bucket = messagesByConversation.get(message.conversation_id) ?? [];
    bucket.push({
      id: message.id,
      author: message.sender_id === profileId ? "me" : "them",
      text: message.body,
      time: formatMessageTime(message.created_at),
      createdAt: message.created_at,
    });
    messagesByConversation.set(message.conversation_id, bucket);
  });

  const threads = typedConversations.map((conversation) => {
    const counterpartId =
      conversation.participant_a_id === profileId
        ? conversation.participant_b_id
        : conversation.participant_a_id;
    const counterpart = profileMap.get(counterpartId);
    const listing = conversation.listing_id
      ? listingMap.get(conversation.listing_id)
      : null;
    const messages = messagesByConversation.get(conversation.id) ?? [];
    const latestMessage = messages.at(-1);

    return {
      id: conversation.id,
      scope: conversation.scope,
      title: listing?.title ?? "Conversa do CAMPUS",
      counterpart: counterpart?.full_name ?? "Contato CAMPUS",
      counterpartId,
      counterpartCourse: counterpart?.course ?? undefined,
      campus: listing?.campus ?? "Campus a combinar",
      time: formatThreadTime(conversation.last_message_at ?? conversation.created_at),
      snippet:
        latestMessage?.text ??
        conversation.last_message_preview ??
        "Conversa aberta. Manda a primeira mensagem.",
      listingId: listing?.id ?? null,
      listingHref: listing?.id ? `/anuncios/${listing.id}` : undefined,
      counterpartHref: counterpartId ? `/perfil/${counterpartId}` : undefined,
      messages,
    } satisfies ChatThread;
  });

  return {
    threads,
    selectedThreadId,
    suggestedDraft: getSuggestedDraft(options?.action),
  };
}
