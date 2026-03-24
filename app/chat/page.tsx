import type { Metadata } from "next";

import { ChatShell } from "@/components/chat/chat-shell";
import { PageShell } from "@/components/shell/page-shell";
import { getCurrentChatSnapshot } from "@/lib/chat";
import { getCurrentProfile } from "@/lib/profiles";

type ChatPageProps = {
  searchParams: Promise<{
    listing?: string | string[] | undefined;
    action?: string | string[] | undefined;
    conversation?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Chat",
  description: "Conversas do CAMPUS.",
};

function readSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const { profile } = await getCurrentProfile();
  const snapshot = await getCurrentChatSnapshot({
    profileId: profile?.id ?? null,
    listingId: readSingleValue(params.listing),
    action: readSingleValue(params.action),
    conversationId: readSingleValue(params.conversation),
  });

  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <ChatShell
          threads={snapshot.threads}
          initialSelectedThreadId={snapshot.selectedThreadId}
          initialDraft={snapshot.suggestedDraft}
          isAuthenticated={Boolean(profile)}
        />
      </div>
    </PageShell>
  );
}
