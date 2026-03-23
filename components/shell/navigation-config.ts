import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  BusFront,
  CircleUserRound,
  Compass,
  GraduationCap,
  HandCoins,
  House,
  MessageSquareText,
  SquarePen,
  Store,
  UserRoundPlus,
  Wrench,
} from "lucide-react";

import { normalizeWorkTab } from "@/lib/work-hub";

type SearchParamReader = Pick<URLSearchParams, "get"> | null | undefined;

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  meta?: string;
};

export type NavigationAction = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type NavigationContext = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions: NavigationAction[];
};

export type NavigationRouteState = {
  pathname: string;
  searchParams?: SearchParamReader;
};

function matchesRoot(pathname: string) {
  return pathname === "/";
}

function matchesPrefix(prefix: string) {
  return (pathname: string) => pathname.startsWith(prefix);
}

function matchesAnyPrefix(...prefixes: string[]) {
  return (pathname: string) =>
    prefixes.some((prefix) => pathname.startsWith(prefix));
}

function readParam(searchParams: SearchParamReader, key: string) {
  return searchParams?.get(key) ?? null;
}

function buildHref(pathname: string, query?: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function buildAnnounceHref(options?: {
  intent?: "offer" | "request";
  type?: "service" | "product";
  category?: string;
}) {
  return buildHref("/anunciar", options);
}

function buildFeedHref(options?: {
  mode?: "consumer" | "seller";
  type?: "service" | "product";
  intent?: "offer" | "request";
  category?: string;
}) {
  return buildHref("/feed", options);
}

function getListingId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "anuncios") {
    return null;
  }

  return segments[1] ?? null;
}

function getHomeContext(): NavigationContext {
  return {
    label: "Criar",
    title: "Acoes",
    description: "Publicar ou abrir trabalhos.",
    icon: SquarePen,
    actions: [
      {
        href: buildAnnounceHref({ intent: "offer" }),
        label: "Publicar oferta",
        description: "Produto ou servico.",
        icon: SquarePen,
      },
      {
        href: buildAnnounceHref({ intent: "request" }),
        label: "Criar demanda",
        description: "Fazer um pedido.",
        icon: HandCoins,
      },
      {
        href: "/trabalhos",
        label: "Abrir trabalhos",
        description: "Aulas e transporte.",
        icon: BriefcaseBusiness,
      },
    ],
  };
}

function getFeedContext(searchParams: SearchParamReader): NavigationContext {
  const workspace =
    readParam(searchParams, "mode") === "seller" ? "seller" : "consumer";

  if (workspace === "seller") {
    return {
      label: "Anunciar",
      title: "Anunciar",
      description: "Criar anuncio ou demanda.",
      icon: SquarePen,
      actions: [
        {
          href: buildAnnounceHref({ intent: "offer", type: "product" }),
          label: "Novo produto",
          description: "Livro, moradia ou item.",
          icon: SquarePen,
        },
        {
          href: buildAnnounceHref({ intent: "offer", type: "service" }),
          label: "Novo servico",
          description: "Aulas ou servicos.",
          icon: BriefcaseBusiness,
        },
        {
          href: buildAnnounceHref({ intent: "request" }),
          label: "Nova demanda",
          description: "Pedido aberto.",
          icon: HandCoins,
        },
      ],
    };
  }

  return {
    label: "Explorar",
    title: "Explorar",
    description: "Atalhos do feed.",
    icon: Compass,
    actions: [
      {
        href: buildAnnounceHref({ intent: "request" }),
        label: "Nova demanda",
        description: "Pedir algo.",
        icon: HandCoins,
      },
      {
        href: buildFeedHref({ mode: "seller" }),
        label: "Modo vender",
        description: "Ver demandas.",
        icon: Store,
      },
      {
        href: "/trabalhos",
        label: "Abrir trabalhos",
        description: "Aulas e transporte.",
        icon: BriefcaseBusiness,
      },
    ],
  };
}

function getPublishContext(searchParams: SearchParamReader): NavigationContext {
  const type = readParam(searchParams, "type");
  const category = readParam(searchParams, "category");

  if (type === "product") {
    return {
      label: "Produto",
      title: "Produto",
      description: "Modelos rapidos.",
      icon: SquarePen,
      actions: [
        {
          href: buildAnnounceHref({
            intent: "offer",
            type: "product",
            category: "Livros",
          }),
          label: "Livros",
          description: "Anuncio de livros.",
          icon: SquarePen,
        },
        {
          href: buildAnnounceHref({
            intent: "offer",
            type: "product",
            category: "Moradia",
          }),
          label: "Moradia",
          description: "Quarto e casa.",
          icon: House,
        },
        {
          href: buildAnnounceHref({
            intent: "request",
            type: "product",
            category: category ?? "Livros",
          }),
          label: "Virar demanda",
          description: "Trocar para pedido.",
          icon: HandCoins,
        },
      ],
    };
  }

  if (
    category === "Transporte comunitario" ||
    category === "Transporte comunitário"
  ) {
    return {
      label: "Rotas",
      title: "Transporte",
      description: "Rotas e vagas.",
      icon: BusFront,
      actions: [
        {
          href: buildAnnounceHref({
            intent: "offer",
            type: "service",
            category: "Transporte comunitário",
          }),
          label: "Oferecer rota",
          description: "Publicar rota.",
          icon: BusFront,
        },
        {
          href: buildAnnounceHref({
            intent: "request",
            type: "service",
            category: "Transporte comunitário",
          }),
          label: "Pedir vaga",
          description: "Entrar em uma rota.",
          icon: HandCoins,
        },
        {
          href: "/trabalhos",
          label: "Abrir transporte",
          description: "Ver transporte.",
          icon: BriefcaseBusiness,
        },
      ],
    };
  }

  if (
    category === "Servicos gerais" ||
    category === "Serviços gerais"
  ) {
    return {
      label: "Casa",
      title: "Servicos",
      description: "Pedidos e ofertas.",
      icon: Wrench,
      actions: [
        {
          href: buildAnnounceHref({
            intent: "offer",
            type: "service",
            category: "Serviços gerais",
          }),
          label: "Oferecer servico",
          description: "Publicar servico.",
          icon: Wrench,
        },
        {
          href: buildAnnounceHref({
            intent: "request",
            type: "service",
            category: "Serviços gerais",
          }),
          label: "Abrir demanda",
          description: "Criar pedido.",
          icon: HandCoins,
        },
        {
          href: buildFeedHref({
            type: "service",
            category: "Serviços gerais",
          }),
          label: "Ver no feed",
          description: "Abrir feed.",
          icon: Compass,
        },
      ],
    };
  }

  return {
    label: "Aulas",
    title: "Aulas",
    description: "Publicar ou pedir.",
    icon: GraduationCap,
    actions: [
      {
        href: buildAnnounceHref({
          intent: "offer",
          type: "service",
          category: "Aulas e monitoria",
        }),
        label: "Oferecer aula",
        description: "Publicar aula.",
        icon: GraduationCap,
      },
      {
        href: buildAnnounceHref({
          intent: "request",
          type: "service",
          category: "Aulas e monitoria",
        }),
        label: "Abrir demanda",
        description: "Criar pedido.",
        icon: HandCoins,
      },
      {
        href: buildHref("/trabalhos", { aba: "aulas" }),
        label: "Abrir aulas",
        description: "Ver aulas.",
        icon: BriefcaseBusiness,
      },
    ],
  };
}

function getWorkContext(searchParams: SearchParamReader): NavigationContext {
  const activeTab = normalizeWorkTab(readParam(searchParams, "aba"));

  if (activeTab === "aulas") {
    return {
      label: "Aulas",
      title: "Aulas",
      description: "Atalhos da aba.",
      icon: GraduationCap,
      actions: [
        {
          href: buildAnnounceHref({
            intent: "offer",
            type: "service",
            category: "Aulas e monitoria",
          }),
          label: "Oferecer aula",
          description: "Publicar aula.",
          icon: GraduationCap,
        },
        {
          href: buildAnnounceHref({
            intent: "request",
            type: "service",
            category: "Aulas e monitoria",
          }),
          label: "Abrir demanda",
          description: "Criar pedido.",
          icon: HandCoins,
        },
        {
          href: buildFeedHref({
            type: "service",
            category: "Aulas e monitoria",
          }),
          label: "Ver no feed",
          description: "Abrir feed.",
          icon: Compass,
        },
      ],
    };
  }

  if (activeTab === "servicos") {
    return {
      label: "Servicos",
      title: "Servicos",
      description: "Atalhos da aba.",
      icon: Wrench,
      actions: [
        {
          href: buildAnnounceHref({
            intent: "offer",
            type: "service",
            category: "Serviços gerais",
          }),
          label: "Oferecer servico",
          description: "Publicar servico.",
          icon: Wrench,
        },
        {
          href: buildAnnounceHref({
            intent: "request",
            type: "service",
            category: "Serviços gerais",
          }),
          label: "Abrir demanda",
          description: "Criar pedido.",
          icon: HandCoins,
        },
        {
          href: buildFeedHref({
            type: "service",
            category: "Serviços gerais",
          }),
          label: "Ver no feed",
          description: "Abrir feed.",
          icon: Compass,
        },
      ],
    };
  }

  return {
    label: "Rotas",
    title: "Transporte",
    description: "Atalhos da aba.",
    icon: BusFront,
    actions: [
      {
        href: buildAnnounceHref({
          intent: "offer",
          type: "service",
          category: "Transporte comunitário",
        }),
        label: "Oferecer rota",
        description: "Publicar rota.",
        icon: BusFront,
      },
      {
        href: buildAnnounceHref({
          intent: "request",
          type: "service",
          category: "Transporte comunitário",
        }),
        label: "Pedir vaga",
        description: "Criar pedido.",
        icon: HandCoins,
      },
      {
        href: buildFeedHref({
          type: "service",
          category: "Transporte comunitário",
        }),
        label: "Ver no feed",
        description: "Abrir feed.",
        icon: Compass,
      },
    ],
  };
}

function getListingContext(pathname: string): NavigationContext {
  const listingId = getListingId(pathname);
  const listingChatHref = listingId
    ? buildHref("/chat", {
        listing: listingId,
        action: "interesse-anuncio",
      })
    : "/chat";

  return {
    label: "Interagir",
    title: "Anuncio",
    description: "Acoes rapidas.",
    icon: MessageSquareText,
    actions: [
      {
        href: listingChatHref,
        label: "Abrir conversa",
        description: "Ir para o chat.",
        icon: MessageSquareText,
      },
      {
        href: "/feed",
        label: "Voltar ao feed",
        description: "Voltar.",
        icon: Compass,
      },
      {
        href: "/perfil",
        label: "Ver perfil",
        description: "Abrir perfil.",
        icon: CircleUserRound,
      },
    ],
  };
}

function getChatContext(searchParams: SearchParamReader): NavigationContext {
  const listingId = readParam(searchParams, "listing");

  if (listingId) {
    return {
      label: "Resposta",
      title: "Conversa",
      description: "Atalhos do chat.",
      icon: MessageSquareText,
      actions: [
        {
          href: `/anuncios/${listingId}`,
          label: "Voltar ao anuncio",
          description: "Abrir anuncio.",
          icon: Compass,
        },
        {
          href: "/feed",
          label: "Explorar feed",
          description: "Abrir feed.",
          icon: Compass,
        },
        {
          href: "/perfil",
          label: "Abrir perfil",
          description: "Abrir perfil.",
          icon: CircleUserRound,
        },
      ],
    };
  }

  return {
    label: "Conversar",
    title: "Chat",
    description: "Acoes rapidas.",
    icon: MessageSquareText,
    actions: [
      {
        href: "/feed",
        label: "Buscar anuncios",
        description: "Abrir feed.",
        icon: Compass,
      },
      {
        href: "/trabalhos",
        label: "Abrir trabalhos",
        description: "Abrir trabalhos.",
        icon: BriefcaseBusiness,
      },
      {
        href: "/perfil",
        label: "Ver perfil",
        description: "Abrir perfil.",
        icon: CircleUserRound,
      },
    ],
  };
}

function getProfileContext(pathname: string): NavigationContext {
  if (pathname.startsWith("/perfil/editar")) {
    return {
      label: "Perfil",
      title: "Editar perfil",
      description: "Atalhos da conta.",
      icon: SquarePen,
      actions: [
        {
          href: "/perfil",
          label: "Meu perfil",
          description: "Voltar para a conta.",
          icon: CircleUserRound,
        },
        {
          href: buildFeedHref({ mode: "seller" }),
          label: "Modo vender",
          description: "Revisar teu feed.",
          icon: Store,
        },
        {
          href: "/chat",
          label: "Abrir chat",
          description: "Ir para conversas.",
          icon: MessageSquareText,
        },
      ],
    };
  }

  if (pathname !== "/perfil") {
    return {
      label: "Contato",
      title: "Perfil publico",
      description: "Acoes desse perfil.",
      icon: CircleUserRound,
      actions: [
        {
          href: "/chat",
          label: "Abrir chat",
          description: "Conversar com esse perfil.",
          icon: MessageSquareText,
        },
        {
          href: "/feed",
          label: "Voltar ao feed",
          description: "Continuar explorando.",
          icon: Compass,
        },
        {
          href: "/perfil",
          label: "Minha conta",
          description: "Abrir teu perfil.",
          icon: UserRoundPlus,
        },
      ],
    };
  }

  return {
    label: "Perfil",
    title: "Minha conta",
    description: "Conta, reputacao e atalhos.",
    icon: UserRoundPlus,
    actions: [
      {
        href: "/perfil/editar",
        label: "Editar perfil",
        description: "Ajustar dados publicos.",
        icon: SquarePen,
      },
      {
        href: buildFeedHref({ mode: "seller" }),
        label: "Modo vender",
        description: "Ver oportunidades.",
        icon: Store,
      },
      {
        href: "/chat",
        label: "Abrir chat",
        description: "Ir para o chat.",
        icon: MessageSquareText,
      },
    ],
  };
}

function getDonationContext(): NavigationContext {
  return {
    label: "Apoiar",
    title: "Apoiar",
    description: "Acoes rapidas.",
    icon: HandCoins,
    actions: [
      {
        href: "/feed",
        label: "Ir para o feed",
        description: "Abrir feed.",
        icon: Compass,
      },
      {
        href: "/perfil",
        label: "Abrir perfil",
        description: "Abrir perfil.",
        icon: CircleUserRound,
      },
      {
        href: buildAnnounceHref({ intent: "offer" }),
        label: "Publicar oferta",
        description: "Criar anuncio.",
        icon: SquarePen,
      },
    ],
  };
}

export const fixedMobileNavItems: NavigationItem[] = [
  {
    href: "/",
    label: "Inicio",
    icon: House,
    match: matchesRoot,
  },
  {
    href: "/feed",
    label: "Feed",
    icon: Compass,
    match: matchesAnyPrefix("/feed", "/anuncios"),
  },
  {
    href: "/chat",
    label: "Chat",
    icon: MessageSquareText,
    match: matchesPrefix("/chat"),
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: CircleUserRound,
    match: matchesPrefix("/perfil"),
  },
];

export const desktopNavItems: NavigationItem[] = [
  {
    href: "/feed",
    label: "Feed",
    meta: "Descobrir",
    icon: Compass,
    match: matchesAnyPrefix("/feed", "/anuncios"),
  },
  {
    href: "/trabalhos",
    label: "Trabalhos",
    meta: "Aulas e servicos",
    icon: BriefcaseBusiness,
    match: matchesPrefix("/trabalhos"),
  },
  {
    href: "/chat",
    label: "Chat",
    meta: "Conversas",
    icon: MessageSquareText,
    match: matchesPrefix("/chat"),
  },
  {
    href: "/perfil",
    label: "Perfil",
    meta: "Conta",
    icon: CircleUserRound,
    match: matchesPrefix("/perfil"),
  },
];

export const defaultNavigationContext = getHomeContext();

export function isRouteActive(pathname: string, item: Pick<NavigationItem, "match">) {
  return item.match(pathname);
}

export function getNavigationContext({
  pathname,
  searchParams,
}: NavigationRouteState): NavigationContext {
  if (pathname === "/") {
    return getHomeContext();
  }

  if (pathname.startsWith("/feed")) {
    return getFeedContext(searchParams);
  }

  if (pathname.startsWith("/anunciar")) {
    return getPublishContext(searchParams);
  }

  if (pathname.startsWith("/anuncios/")) {
    return getListingContext(pathname);
  }

  if (pathname.startsWith("/trabalhos")) {
    return getWorkContext(searchParams);
  }

  if (pathname.startsWith("/chat")) {
    return getChatContext(searchParams);
  }

  if (pathname.startsWith("/perfil")) {
    return getProfileContext(pathname);
  }

  if (pathname.startsWith("/doar")) {
    return getDonationContext();
  }

  return defaultNavigationContext;
}
