import type { Metadata } from "next";

import { ChatShell } from "@/components/chat/chat-shell";
import { PageShell } from "@/components/shell/page-shell";

export const metadata: Metadata = {
  title: "Chat",
  description: "Conversas do CAMPUS.",
};

export default function ChatPage() {
  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <ChatShell />
      </div>
    </PageShell>
  );
}
