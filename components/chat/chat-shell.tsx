"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BusFront,
  GraduationCap,
  MapPin,
  MessageCircleMore,
  PackageSearch,
  Search,
  Send,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";

import styles from "@/components/chat/chat-shell.module.scss";
import type { ChatScope, ChatThread } from "@/lib/chat";

type Props = {
  threads: ChatThread[];
  initialSelectedThreadId: string | null;
  initialDraft?: string;
  isAuthenticated: boolean;
};

type MobileStage = "list" | "thread";
type ComposerMessage = {
  id: string;
  text: string;
  time: string;
  createdAt: string;
};
type ThreadMessage = ChatThread["messages"][number];

const scopeOptions: Array<{
  id: "all" | ChatScope;
  label: string;
  icon: typeof MessageCircleMore;
}> = [
  { id: "all", label: "Tudo", icon: MessageCircleMore },
  { id: "products", label: "Produtos", icon: PackageSearch },
  { id: "services", label: "Servicos", icon: Wrench },
  { id: "classes", label: "Aulas", icon: GraduationCap },
  { id: "transport", label: "Transporte", icon: BusFront },
];

function getScopeIcon(scope: ChatScope) {
  if (scope === "classes") {
    return GraduationCap;
  }

  if (scope === "transport") {
    return BusFront;
  }

  if (scope === "services") {
    return Wrench;
  }

  return PackageSearch;
}

function getScopeLabel(scope: ChatScope) {
  if (scope === "classes") {
    return "Aulas";
  }

  if (scope === "transport") {
    return "Transporte";
  }

  if (scope === "services") {
    return "Servicos";
  }

  return "Produtos";
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ChatShell({
  threads,
  initialSelectedThreadId,
  initialDraft = "",
  isAuthenticated,
}: Props) {
  const [scope, setScope] = useState<"all" | ChatScope>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [draft, setDraft] = useState(initialDraft);
  const [threadState, setThreadState] = useState<ChatThread[]>(threads);
  const [selectedThreadId, setSelectedThreadId] = useState(
    initialSelectedThreadId ?? threads[0]?.id ?? "",
  );
  const [feedback, setFeedback] = useState<{
    tone: "info" | "error";
    text: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileStage, setMobileStage] = useState<MobileStage>("list");

  useEffect(() => {
    setThreadState(threads);
  }, [threads]);

  useEffect(() => {
    setSelectedThreadId(initialSelectedThreadId ?? threads[0]?.id ?? "");
  }, [initialSelectedThreadId, threads]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 980px)");

    const syncViewport = (matches: boolean) => {
      setIsMobile(matches);

      if (!matches) {
        setMobileStage("list");
      }
    };

    syncViewport(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      syncViewport(event.matches);
    };

    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  const filteredThreads = useMemo(() => {
    return threadState.filter((thread) => {
      const matchesScope = scope === "all" ? true : thread.scope === scope;
      const haystack = [
        thread.title,
        thread.counterpart,
        thread.counterpartCourse,
        thread.snippet,
        thread.campus,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = deferredQuery ? haystack.includes(deferredQuery) : true;

      return matchesScope && matchesQuery;
    });
  }, [deferredQuery, scope, threadState]);

  const resolvedSelectedThreadId = filteredThreads.some(
    (thread) => thread.id === selectedThreadId,
  )
    ? selectedThreadId
    : filteredThreads[0]?.id ?? "";

  const selectedThread =
    filteredThreads.find((thread) => thread.id === resolvedSelectedThreadId) ??
    filteredThreads[0] ??
    null;
  const showListPanel = !isMobile || mobileStage === "list";
  const showThreadPanel = !isMobile || mobileStage === "thread";

  function openThread(threadId: string) {
    setSelectedThreadId(threadId);
    setFeedback(null);

    if (isMobile) {
      setMobileStage("thread");
    }
  }

  function closeThread() {
    setMobileStage("list");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedThread || !draft.trim() || isSending) {
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: selectedThread.id,
          body: draft.trim(),
        }),
      });

      const payload = (await response.json()) as
        | ComposerMessage
        | { error?: string };

      if (!response.ok || !("id" in payload)) {
        setFeedback({
          tone: "error",
          text:
            "error" in payload && payload.error
              ? payload.error
              : "Nao deu para enviar a mensagem agora.",
        });
        return;
      }

      setThreadState((currentThreads) =>
        currentThreads
          .map((thread) => {
            if (thread.id !== selectedThread.id) {
              return thread;
            }

            const nextMessage: ThreadMessage = {
              id: payload.id,
              author: "me",
              text: payload.text,
              time: payload.time,
              createdAt: payload.createdAt,
            };

            return {
              ...thread,
              time: payload.time,
              snippet: payload.text,
              messages: [...thread.messages, nextMessage],
            };
          })
          .sort((left, right) => {
            if (left.id === selectedThread.id) {
              return -1;
            }

            if (right.id === selectedThread.id) {
              return 1;
            }

            return 0;
          }),
      );
      setDraft("");
    } catch {
      setFeedback({
        tone: "error",
        text: "Nao rolou enviar agora. Tenta de novo em instantes.",
      });
    } finally {
      setIsSending(false);
    }
  }

  const totalThreads = threadState.length;

  return (
    <section className={styles.shell}>
      {showListPanel ? (
        <div className={styles.listShell}>
          <header className={styles.topbar}>
            <div className={styles.heading}>
              <span className="eyebrow">Chat</span>
              <h1 className={styles.title}>Conversas</h1>
              <p className={styles.lead}>
                Produtos, servicos, aulas e combinados no mesmo lugar.
              </p>
            </div>

            <span className={styles.countPill}>{totalThreads}</span>
          </header>

          <div className={styles.commandBar}>
            <label className={styles.searchField}>
              <Search size={16} />
              <input
                type="search"
                placeholder="Buscar pessoa ou anuncio"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className={styles.scopeRow} aria-label="Filtros do chat">
              {scopeOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.scopeButton} ${
                      scope === option.id ? styles.scopeButtonActive : ""
                    }`}
                    onClick={() => setScope(option.id)}
                  >
                    <Icon size={15} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.threadList}>
            {filteredThreads.map((thread) => {
              const Icon = getScopeIcon(thread.scope);

              return (
                <button
                  key={thread.id}
                  type="button"
                  className={`${styles.threadCard} ${
                    selectedThread?.id === thread.id ? styles.threadCardActive : ""
                  }`}
                  onClick={() => openThread(thread.id)}
                >
                  <div className={styles.threadAvatar}>{getInitials(thread.counterpart)}</div>

                  <div className={styles.threadContent}>
                    <div className={styles.threadTopline}>
                      <strong>{thread.counterpart}</strong>
                      <span>{thread.time}</span>
                    </div>

                    <div className={styles.threadContext}>
                      <Icon size={13} />
                      <span>{thread.title}</span>
                    </div>

                    <p>{thread.snippet}</p>
                  </div>
                </button>
              );
            })}

            {!filteredThreads.length ? (
              <div className={styles.emptyState}>
                <strong>
                  {isAuthenticated ? "Nenhuma conversa por aqui." : "Entra na tua conta para abrir conversas."}
                </strong>
                <p>
                  {isAuthenticated
                    ? "Quando tu chamar alguem por um anuncio, a conversa aparece aqui."
                    : "O chat nasce quando tu entra em um anuncio e inicia contato."}
                </p>
                <div className={styles.emptyActions}>
                  <Link href={isAuthenticated ? "/feed" : "/entrar"} className={styles.primaryLink}>
                    {isAuthenticated ? "Abrir feed" : "Entrar"}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showThreadPanel ? (
        <aside className={styles.threadShell}>
          {selectedThread ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderMain}>
                  {isMobile ? (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={closeThread}
                      aria-label="Voltar para conversas"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  ) : null}

                  <div className={styles.threadAvatarLarge}>
                    {getInitials(selectedThread.counterpart)}
                  </div>

                  <div className={styles.chatHeaderCopy}>
                    <strong>{selectedThread.counterpart}</strong>
                    <span>{selectedThread.counterpartCourse ?? "Perfil CAMPUS"}</span>
                  </div>
                </div>

                {selectedThread.counterpartHref ? (
                  <Link href={selectedThread.counterpartHref} className={styles.headerLink}>
                    <UserRound size={16} />
                    Perfil
                  </Link>
                ) : null}
              </div>

              <div className={styles.contextRow}>
                <span className={styles.contextChip}>
                  <Sparkles size={14} />
                  {getScopeLabel(selectedThread.scope)}
                </span>
                <span className={styles.contextChip}>
                  <MapPin size={14} />
                  {selectedThread.campus}
                </span>
                {selectedThread.listingHref ? (
                  <Link href={selectedThread.listingHref} className={styles.contextLink}>
                    {selectedThread.title}
                  </Link>
                ) : (
                  <span className={styles.contextChip}>{selectedThread.title}</span>
                )}
              </div>

              <div className={styles.messageViewport}>
                {selectedThread.messages.length ? (
                  selectedThread.messages.map((message) => (
                    <article
                      key={message.id}
                      className={`${styles.messageBubble} ${
                        message.author === "me" ? styles.messageBubbleMine : ""
                      }`}
                    >
                      <p>{message.text}</p>
                      <span>{message.time}</span>
                    </article>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <strong>Conversa aberta.</strong>
                    <p>Essa janela ja esta pronta para combinar detalhes sem sair do app.</p>
                  </div>
                )}
              </div>

              {feedback ? (
                <div className="status-banner" data-tone={feedback.tone}>
                  {feedback.text}
                </div>
              ) : null}

              <form className={styles.composerBar} onSubmit={handleSubmit}>
                <label className={styles.composerField}>
                  <input
                    type="text"
                    placeholder="Escreve uma mensagem"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={!draft.trim() || isSending}
                  aria-label="Enviar mensagem"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className={styles.emptyStage}>
              <strong>Abre uma conversa.</strong>
              <p>O detalhe entra aqui quando tu escolher um contato ou um anuncio.</p>
            </div>
          )}
        </aside>
      ) : null}
    </section>
  );
}
