"use client";

import { useMemo, useState } from "react";
import {
  BusFront,
  Clock3,
  GraduationCap,
  MapPin,
  MessageCircleMore,
  PackageSearch,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";

import styles from "@/components/chat/chat-shell.module.scss";

type ThreadScope = "all" | "products" | "classes" | "transport";

type MessageItem = {
  id: string;
  author: "me" | "them";
  text: string;
  time: string;
};

type ChatThread = {
  id: string;
  scope: Exclude<ThreadScope, "all">;
  title: string;
  counterpart: string;
  campus: string;
  time: string;
  unread: number;
  status: string;
  snippet: string;
  actions: string[];
  messages: MessageItem[];
};

const scopeOptions: Array<{
  id: ThreadScope;
  label: string;
  icon: typeof PackageSearch;
}> = [
  { id: "all", label: "Tudo", icon: MessageCircleMore },
  { id: "products", label: "Produtos", icon: PackageSearch },
  { id: "classes", label: "Aulas", icon: GraduationCap },
  { id: "transport", label: "Transporte", icon: BusFront },
];

const threads: ChatThread[] = [
  {
    id: "thread-notebook",
    scope: "products",
    title: "Notebook Lenovo Ideapad",
    counterpart: "Caio Ribeiro",
    campus: "Cruz das Almas",
    time: "agora",
    unread: 2,
    status: "Negociacao ativa",
    snippet: "Fecho por R$ 2.150 se tu conseguir buscar ainda hoje no campus.",
    actions: ["Mandar proposta", "Pedir fotos", "Ver anuncio"],
    messages: [
      {
        id: "msg-1",
        author: "them",
        text: "Consigo levar perto do pavilhao 2 depois das 16h.",
        time: "15:42",
      },
      {
        id: "msg-2",
        author: "me",
        text: "Se eu confirmar agora, tu segura ate o fim da aula?",
        time: "15:44",
      },
      {
        id: "msg-3",
        author: "them",
        text: "Seguro sim. So me manda o horario certinho.",
        time: "15:45",
      },
    ],
  },
  {
    id: "thread-fisica",
    scope: "classes",
    title: "Fisica I particular",
    counterpart: "Ana Beatriz",
    campus: "Biblioteca central",
    time: "12 min",
    unread: 1,
    status: "Aguardando horario",
    snippet: "Quarta 18:30 funciona. Falta so bater o local e a primeira hora.",
    actions: ["Confirmar aula", "Mandar local", "Ver perfil"],
    messages: [
      {
        id: "msg-4",
        author: "them",
        text: "Quarta 18:30 funciona. Pode ser biblioteca ou online.",
        time: "14:10",
      },
      {
        id: "msg-5",
        author: "me",
        text: "Prefiro presencial. Vou sair do laboratorio 18:10.",
        time: "14:16",
      },
      {
        id: "msg-6",
        author: "them",
        text: "Perfeito. Te mando a mesa certinha quando eu chegar.",
        time: "14:18",
      },
    ],
  },
  {
    id: "thread-rodoviaria",
    scope: "transport",
    title: "Rodoviaria -> UFRB 07:10",
    counterpart: "Grupo de manha",
    campus: "Cruz das Almas",
    time: "27 min",
    unread: 0,
    status: "Grupo quase cheio",
    snippet: "Entrou mais uma pessoa. O rateio caiu para R$ 7,00 por pessoa.",
    actions: ["Entrar no grupo", "Mandar local", "Ver rota"],
    messages: [
      {
        id: "msg-7",
        author: "them",
        text: "Entrou mais uma pessoa no mesmo horario.",
        time: "13:21",
      },
      {
        id: "msg-8",
        author: "them",
        text: "O rateio caiu para R$ 7,00 por pessoa.",
        time: "13:21",
      },
      {
        id: "msg-9",
        author: "me",
        text: "Consigo estar na frente da rodoviaria 07:05.",
        time: "13:24",
      },
    ],
  },
  {
    id: "thread-tela",
    scope: "products",
    title: "Instalacao de tela na janela",
    counterpart: "Luan Matos",
    campus: "Republica perto do campus",
    time: "1 h",
    unread: 0,
    status: "Visita combinada",
    snippet: "Ele vai passar no fim da tarde para medir e fechar o valor.",
    actions: ["Confirmar visita", "Mandar fotos", "Ver servico"],
    messages: [
      {
        id: "msg-10",
        author: "me",
        text: "Te mandei as fotos da janela e das medidas.",
        time: "10:30",
      },
      {
        id: "msg-11",
        author: "them",
        text: "Vi aqui. No fim da tarde passo ai para conferir.",
        time: "10:34",
      },
      {
        id: "msg-12",
        author: "them",
        text: "Se estiver tudo certo, ja fecho o valor na hora.",
        time: "10:35",
      },
    ],
  },
];

function getScopeLabel(scope: ChatThread["scope"]) {
  if (scope === "classes") {
    return "Aulas";
  }

  if (scope === "transport") {
    return "Transporte";
  }

  return "Produtos";
}

function getScopeIcon(scope: ChatThread["scope"]) {
  if (scope === "classes") {
    return GraduationCap;
  }

  if (scope === "transport") {
    return BusFront;
  }

  return PackageSearch;
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ChatShell() {
  const [scope, setScope] = useState<ThreadScope>("all");
  const [query, setQuery] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState(threads[0]?.id ?? "");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesScope = scope === "all" ? true : thread.scope === scope;
      const haystack = [
        thread.title,
        thread.counterpart,
        thread.snippet,
        thread.status,
        thread.campus,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true;

      return matchesScope && matchesQuery;
    });
  }, [normalizedQuery, scope]);

  const resolvedSelectedThreadId = filteredThreads.some(
    (thread) => thread.id === selectedThreadId,
  )
    ? selectedThreadId
    : filteredThreads[0]?.id ?? "";

  const selectedThread =
    filteredThreads.find((thread) => thread.id === resolvedSelectedThreadId) ??
    filteredThreads[0] ??
    null;

  const unreadCount = threads.reduce((total, thread) => total + thread.unread, 0);
  const activeCount = threads.length;
  const todayCount = threads.filter((thread) => thread.time === "agora" || thread.time.includes("min")).length;

  return (
    <section className={styles.shell}>
      <div className={styles.topbar}>
        <div className={styles.heading}>
          <span className="eyebrow">Chat CAMPUS</span>
          <h1 className={styles.title}>Conversas em andamento</h1>
          <p className={styles.lead}>Produtos, aulas e rotas.</p>
        </div>

        <div className={styles.metrics}>
          <article className={styles.metricCard}>
            <MessageCircleMore size={16} />
            <strong>{activeCount}</strong>
            <span>abertas</span>
          </article>
          <article className={styles.metricCard}>
            <ShieldCheck size={16} />
            <strong>{unreadCount}</strong>
            <span>nao lidas</span>
          </article>
          <article className={styles.metricCard}>
            <Clock3 size={16} />
            <strong>{todayCount}</strong>
            <span>de hoje</span>
          </article>
        </div>
      </div>

      <div className={styles.commandBar}>
        <label className={styles.searchField}>
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar conversa, pessoa ou anuncio"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className={styles.scopeRow} aria-label="Filtrar conversas">
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
                <Icon size={16} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.layout}>
        <section className={styles.threadPanel}>
          <div className={styles.sectionHeader}>
            <strong>{filteredThreads.length} conversas</strong>
            <span>{scope === "all" ? "Tudo no mesmo lugar" : "Filtro ativo"}</span>
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
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className={styles.threadAvatar}>{getInitials(thread.counterpart)}</div>

                  <div className={styles.threadContent}>
                    <div className={styles.threadTopline}>
                      <strong>{thread.title}</strong>
                      <span>{thread.time}</span>
                    </div>

                    <div className={styles.threadMeta}>
                      <span className={styles.threadScope}>
                        <Icon size={14} />
                        {getScopeLabel(thread.scope)}
                      </span>
                      <span>{thread.counterpart}</span>
                    </div>

                    <p>{thread.snippet}</p>
                  </div>

                  <div className={styles.threadSide}>
                    <span className={styles.threadStatus}>{thread.status}</span>
                    {thread.unread ? (
                      <span className={styles.unreadBadge}>{thread.unread}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}

            {!filteredThreads.length ? (
              <div className={styles.emptyState}>
                <strong>Nada por aqui.</strong>
                <p>Tenta outro filtro.</p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className={styles.previewPanel}>
          {selectedThread ? (
            <>
              <div className={styles.previewHeader}>
                <div>
                  <span className="eyebrow">{getScopeLabel(selectedThread.scope)}</span>
                  <h2>{selectedThread.title}</h2>
                  <p>{selectedThread.counterpart}</p>
                </div>

                <div className={styles.previewMeta}>
                  <span>
                    <MapPin size={14} />
                    {selectedThread.campus}
                  </span>
                  <span>{selectedThread.status}</span>
                </div>
              </div>

              <div className={styles.messageStack}>
                {selectedThread.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`${styles.messageBubble} ${
                      message.author === "me" ? styles.messageBubbleMine : ""
                    }`}
                  >
                    <p>{message.text}</p>
                    <span>{message.time}</span>
                  </article>
                ))}
              </div>

              <div className={styles.previewActions}>
                {selectedThread.actions.map((action) => (
                  <button key={action} type="button" className={styles.actionButton}>
                    {action}
                  </button>
                ))}
              </div>

              <button type="button" className={styles.sendButton}>
                <Send size={16} />
                Abrir conversa
              </button>
            </>
          ) : (
            <div className={styles.emptyState}>
              <strong>Nenhuma conversa selecionada.</strong>
              <p>Abre uma conversa da lista.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
