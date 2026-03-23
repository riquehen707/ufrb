import type { Listing } from "@/lib/listings";
import {
  formatHousingAvailableFrom,
  getHousingGenderLabel,
  getHousingIncludedItems,
  getHousingObligationText,
  getHousingPaymentLabel,
  housingListingKindLabels,
} from "@/lib/housing";
import {
  itemConditionLabels,
  listingIntentLabels,
  listingTypeLabels,
  negotiationModeLabels,
} from "@/lib/listing-taxonomy";

type DetailAction = {
  label: string;
  href: string;
};

type DetailSummary = {
  label: string;
  value: string;
  hint: string;
};

export type ListingDetailConfig = {
  eyebrow: string;
  lead: string;
  summary: DetailSummary[];
  experienceTitle: string;
  experienceItems: string[];
  negotiationTitle: string;
  negotiationItems: string[];
  primaryAction: DetailAction;
  secondaryAction: DetailAction;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function getChatHref(listing: Listing, action: string) {
  return `/chat?listing=${encodeURIComponent(listing.id)}&action=${encodeURIComponent(action)}`;
}

function formatListingBudget(listing: Listing) {
  const unit = listing.priceUnit ? ` / ${listing.priceUnit}` : "";
  const value = moneyFormatter.format(listing.price);

  if (listing.intent === "request") {
    return `Ate ${value}${unit}`;
  }

  return `${value}${unit}`;
}

function getTeachingFormat(focus?: string) {
  if (!focus) {
    return "A combinar";
  }

  if (focus === "Banca") {
    return "Banca";
  }

  return focus.split(" - ")[0] ?? focus;
}

function getTeachingAudience(focus?: string) {
  if (!focus) {
    return "A combinar";
  }

  if (focus.includes("Universitario")) {
    return "Universitario";
  }

  if (focus.includes("Ensino medio")) {
    return "Ensino medio";
  }

  return focus;
}

function normalizeLookupValue(value?: string) {
  return value
    ?.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase() ?? "";
}

function getHousingConfig(listing: Listing): ListingDetailConfig {
  const details = listing.housingDetails;

  if (!details) {
    return getDefaultConfig(listing);
  }

  const sharedValue = details.splitRent
    ? moneyFormatter.format(details.splitRent)
    : formatListingBudget(listing);
  const totalRent = details.totalRent
    ? moneyFormatter.format(details.totalRent)
    : "A combinar";
  const moveIn = formatHousingAvailableFrom(details.availableFrom);
  const obligations = getHousingObligationText(details.obligations);
  const includedItems = getHousingIncludedItems(details);

  if (listing.intent === "offer") {
    return {
      eyebrow: "Oferta de moradia",
      lead:
        "Essa pagina precisa mostrar divisao do aluguel, rotina da casa e o tipo de convivencia esperada.",
      summary: [
        {
          label: "Formato",
          value: housingListingKindLabels[details.listingKind],
          hint: "como essa moradia entra no fluxo",
        },
        {
          label: "Valor por pessoa",
          value: sharedValue,
          hint: "quanto entra por morador",
        },
        {
          label: "Pagamento",
          value: getHousingPaymentLabel(details.paymentDay),
          hint: "dia em que a casa organiza o repasse",
        },
      ],
      experienceTitle: "O que essa pagina precisa resolver",
      experienceItems: [
        `Aluguel total da casa: ${totalRent}.`,
        `Entrada prevista: ${moveIn}.`,
        details.genderPreference
          ? `Preferencia de genero: ${getHousingGenderLabel(details.genderPreference)}.`
          : "Genero da casa precisa estar claro antes da visita.",
      ],
      negotiationTitle: "Antes de combinar visita",
      negotiationItems: [
        ...(obligations.length
          ? obligations.map((item) => `Regra da casa: ${item}.`)
          : ["Vale alinhar regras de convivio antes de fechar."]),
        ...(includedItems.length
          ? [`Incluso no valor: ${includedItems.join(", ")}.`]
          : ["Confirma o que entra no valor mensal antes de aceitar."]),
        "Se a convivencia funcionar, esse perfil ainda pode receber avaliacao de moradia.",
      ],
      primaryAction: {
        label: "Pedir visita",
        href: getChatHref(listing, "pedir-visita-moradia"),
      },
      secondaryAction: {
        label: "Ver mais moradias",
        href: `/feed?type=product&category=${encodeURIComponent(listing.category)}`,
      },
    };
  }

  return {
    eyebrow: "Demanda de moradia",
    lead:
      "Aqui a pessoa esta procurando casa ou vaga e precisa deixar convivio, genero e vencimento claros.",
    summary: [
      {
        label: "Busca",
        value: housingListingKindLabels[details.listingKind],
        hint: "tipo de moradia procurada",
      },
      {
        label: "Faixa",
        value: sharedValue,
        hint: "quanto consegue pagar por mes",
      },
      {
        label: "Pagamento",
        value: getHousingPaymentLabel(details.paymentDay),
        hint: "dia preferido para fechar a divisao",
      },
    ],
    experienceTitle: "O que essa pagina precisa resolver",
    experienceItems: [
      `Entrada desejada: ${moveIn}.`,
      details.genderPreference
        ? `Preferencia de genero: ${getHousingGenderLabel(details.genderPreference)}.`
        : "Genero da casa precisa aparecer cedo.",
      "Deixar claro o tipo de casa evita conversa perdida.",
    ],
    negotiationTitle: "Antes de responder",
    negotiationItems: [
      ...(obligations.length
        ? obligations.map((item) => `Expectativa de convivencia: ${item}.`)
        : ["Vale alinhar limpeza, visitas e contas da casa antes de responder."]),
      "Se tua casa combina com essa rotina, responde ja com valor total e fotos.",
      "Moradia boa precisa fechar logistica e convivio ao mesmo tempo.",
    ],
    primaryAction: {
      label: "Oferecer vaga",
      href: getChatHref(listing, "oferecer-vaga-moradia"),
    },
    secondaryAction: {
      label: "Abrir moradias no feed",
      href: `/feed?type=product&category=${encodeURIComponent(listing.category)}`,
    },
  };
}

function getDefaultConfig(listing: Listing): ListingDetailConfig {
  if (listing.type === "product" && listing.intent === "offer") {
    return {
      eyebrow: "Oferta de produto",
      lead:
        "Essa pagina precisa destacar estado, entrega e negociacao com leitura direta.",
      summary: [
        {
          label: "Categoria",
          value: listing.category,
          hint: "onde esse item entra no feed",
        },
        {
          label: "Estado",
          value: listing.itemCondition
            ? itemConditionLabels[listing.itemCondition]
            : "Sem estado",
          hint: "condicao declarada do item",
        },
        {
          label: "Entrega",
          value: listing.deliveryMode,
          hint: "como combinar retirada ou envio local",
        },
      ],
      experienceTitle: "O que essa pagina precisa resolver",
      experienceItems: [
        "Mostrar estado real do item sem esconder desgaste ou uso.",
        "Deixar claro onde combinar entrega ou retirada.",
        "Separar preco, categoria e negociacao para decisao mais rapida.",
      ],
      negotiationTitle: "Antes de fechar",
      negotiationItems: [
        `Negociacao atual: ${negotiationModeLabels[listing.negotiationMode]}.`,
        "Vale confirmar funcionamento, acessorios inclusos e disponibilidade.",
        "Se fizer sentido, abre conversa sem sair do mesmo fluxo do app.",
      ],
      primaryAction: {
        label: "Tenho interesse",
        href: getChatHref(listing, "interesse-produto"),
      },
      secondaryAction: {
        label: "Ver produtos parecidos",
        href: `/feed?type=product&category=${encodeURIComponent(listing.category)}`,
      },
    };
  }

  if (listing.type === "product" && listing.intent === "request") {
    return {
      eyebrow: "Demanda de produto",
      lead:
        "Aqui a leitura precisa deixar claro o que a pessoa procura e quanto faz sentido pagar.",
      summary: [
        {
          label: "Busca",
          value: listing.category,
          hint: "tipo de item procurado",
        },
        {
          label: "Faixa",
          value: formatListingBudget(listing),
          hint: "orcamento maximo informado",
        },
        {
          label: "Entrega",
          value: listing.deliveryMode,
          hint: "como a pessoa quer combinar",
        },
      ],
      experienceTitle: "O que essa pagina precisa resolver",
      experienceItems: [
        "Definir o item procurado sem deixar brecha de interpretacao.",
        "Mostrar valor estimado e estado minimo esperado.",
        "Abrir uma resposta simples para quem tem exatamente o que foi pedido.",
      ],
      negotiationTitle: "Antes de responder",
      negotiationItems: [
        "Confirma se teu item bate com a necessidade descrita.",
        "Se o estado for diferente, vale avisar antes de negociar.",
        "Usa o chat para alinhar retirada, fotos e valor final.",
      ],
      primaryAction: {
        label: "Responder demanda",
        href: getChatHref(listing, "responder-demanda-produto"),
      },
      secondaryAction: {
        label: "Ver ofertas parecidas",
        href: `/feed?type=product&category=${encodeURIComponent(listing.category)}`,
      },
    };
  }

  if (listing.type === "service" && listing.intent === "offer") {
    return {
      eyebrow: "Oferta de servico",
      lead:
        "O foco aqui e mostrar escopo, formato e como esse servico acontece na pratica.",
      summary: [
        {
          label: "Recorte",
          value: listing.focus ?? "A combinar",
          hint: "onde esse servico se encaixa",
        },
        {
          label: "Cobranca",
          value: formatListingBudget(listing),
          hint: "valor base declarado",
        },
        {
          label: "Entrega",
          value: listing.deliveryMode,
          hint: "presencial, online ou combinado",
        },
      ],
      experienceTitle: "O que essa pagina precisa resolver",
      experienceItems: [
        "Explicar bem o que entra e o que nao entra no servico.",
        "Destacar formato de atendimento e tempo esperado.",
        "Dar seguranca para o pedido nascer sem conversa solta demais.",
      ],
      negotiationTitle: "Antes de contratar",
      negotiationItems: [
        `Negociacao atual: ${negotiationModeLabels[listing.negotiationMode]}.`,
        "Vale alinhar prazo, escopo e ponto de encontro.",
        "No chat, a pessoa ja entra com o contexto completo do anuncio.",
      ],
      primaryAction: {
        label: "Solicitar servico",
        href: getChatHref(listing, "solicitar-servico"),
      },
      secondaryAction: {
        label: "Ver servicos parecidos",
        href: `/feed?type=service&category=${encodeURIComponent(listing.category)}`,
      },
    };
  }

  return {
    eyebrow: "Demanda de servico",
    lead:
      "Essa pagina precisa deixar a necessidade clara para quem vai responder a demanda.",
    summary: [
      {
        label: "Recorte",
        value: listing.focus ?? "A combinar",
        hint: "tipo de ajuda procurada",
      },
      {
        label: "Faixa",
        value: formatListingBudget(listing),
        hint: "orcamento base da demanda",
      },
      {
        label: "Formato",
        value: listing.deliveryMode,
        hint: "como a pessoa quer que o servico role",
      },
    ],
    experienceTitle: "O que essa pagina precisa resolver",
    experienceItems: [
      "Mostrar o problema real antes de pedir proposta.",
      "Deixar claro local, prazo e formato esperado.",
      "Facilitar resposta de quem realmente consegue atender.",
    ],
    negotiationTitle: "Antes de responder",
    negotiationItems: [
      "Confirma se teu servico cobre esse escopo.",
      "Se o valor variar, explica o que muda no atendimento.",
      "Abre o chat ja com proposta objetiva para acelerar o fechamento.",
    ],
    primaryAction: {
      label: "Responder demanda",
      href: getChatHref(listing, "responder-demanda-servico"),
    },
    secondaryAction: {
      label: "Ver servicos parecidos",
      href: `/feed?type=service&category=${encodeURIComponent(listing.category)}`,
    },
  };
}

function getClassesConfig(listing: Listing): ListingDetailConfig {
  const format = getTeachingFormat(listing.focus);
  const audience = getTeachingAudience(listing.focus);

  if (listing.intent === "offer") {
    return {
      eyebrow: "Oferta de aulas",
      lead:
        "A pagina de aulas precisa destacar formato, nivel e o botao certo para particular ou grupo.",
      summary: [
        {
          label: "Formato",
          value: format,
          hint: "como essa aula acontece",
        },
        {
          label: "Publico",
          value: audience,
          hint: "quem essa aula atende melhor",
        },
        {
          label: "Valor",
          value: formatListingBudget(listing),
          hint: "base por hora, entrega ou grupo",
        },
      ],
      experienceTitle: "Acoes que essa pagina precisa ter",
      experienceItems: [
        "Separar aula particular de grupo sem deixar o aluno perdido.",
        "Mostrar nivel de ensino e recorte da materia logo no topo.",
        "Dar acesso rapido para agendar aula ou entrar em grupo.",
      ],
      negotiationTitle: "Antes de marcar",
      negotiationItems: [
        "Confirma materia, horario e local ou formato online.",
        "Se for grupo, vale alinhar quantas pessoas ja estao entrando.",
        "No mesmo perfil a pessoa ainda pode vender, comprar e dar carona.",
      ],
      primaryAction: {
        label: "Agendar aula particular",
        href: getChatHref(listing, "agendar-aula"),
      },
      secondaryAction: {
        label: "Inscrever-se em grupo",
        href: "/trabalhos?aba=aulas",
      },
    };
  }

  return {
    eyebrow: "Demanda de aulas",
    lead:
      "Quando o anuncio e uma demanda de ensino, a pagina precisa funcionar como chamada para professor ou turma.",
    summary: [
      {
        label: "Formato",
        value: format,
        hint: "particular, grupo ou banca",
      },
      {
        label: "Publico",
        value: audience,
        hint: "nivel de ensino dessa demanda",
      },
      {
        label: "Orcamento",
        value: formatListingBudget(listing),
        hint: "faixa declarada por quem abriu o pedido",
      },
    ],
    experienceTitle: "Acoes que essa pagina precisa ter",
    experienceItems: [
      "Deixar claro se a pessoa quer professor, turma ou os dois.",
      "Mostrar nivel de ensino e materia com leitura imediata.",
      "Abrir resposta rapida para professor ou aluno que quer montar grupo.",
    ],
    negotiationTitle: "Antes de responder",
    negotiationItems: [
      "Confirma horario, local e se ja existem outros alunos esperando.",
      "Se tu ensina esse tema, entra com proposta objetiva.",
      "Se fizer sentido, o fluxo pode migrar para turma dentro da aba de aulas.",
    ],
    primaryAction: {
      label: "Responder demanda de ensino",
      href: getChatHref(listing, "responder-demanda-ensino"),
    },
    secondaryAction: {
      label: "Montar turma",
      href: "/trabalhos?aba=aulas",
    },
  };
}

function getTransportConfig(listing: Listing): ListingDetailConfig {
  if (listing.intent === "offer") {
    return {
      eyebrow: "Oferta de transporte",
      lead:
        "A pagina de transporte precisa destacar horario, rota e rateio sem misturar com um servico generico.",
      summary: [
        {
          label: "Rota",
          value: listing.focus ?? listing.campus,
          hint: "recorte principal do trajeto",
        },
        {
          label: "Horario",
          value: listing.deliveryMode,
          hint: "como esse grupo se organiza",
        },
        {
          label: "Rateio",
          value: formatListingBudget(listing),
          hint: "valor base por corrida ou pessoa",
        },
      ],
      experienceTitle: "Acoes que essa pagina precisa ter",
      experienceItems: [
        "Mostrar rota ou ponto de encontro logo no primeiro bloco.",
        "Dar clareza sobre horario de ida ou retorno.",
        "Abrir uma acao direta para entrar nesse horario.",
      ],
      negotiationTitle: "Antes de entrar",
      negotiationItems: [
        "Confirma ponto de embarque e quantidade de pessoas.",
        "Se o valor for rateado, vale alinhar lotacao e tempo de espera.",
        "Esse tipo de anuncio conversa melhor com mapas e grupos ativos do hub.",
      ],
      primaryAction: {
        label: "Entrar nesse horario",
        href: getChatHref(listing, "entrar-transporte"),
      },
      secondaryAction: {
        label: "Ver rotas parecidas",
        href: "/trabalhos",
      },
    };
  }

  return {
    eyebrow: "Demanda de transporte",
    lead:
      "Quando a pessoa procura vaga, a pagina precisa funcionar como pedido de rota, horario e rateio.",
    summary: [
      {
        label: "Rota",
        value: listing.focus ?? listing.campus,
        hint: "trecho que a pessoa quer resolver",
      },
      {
        label: "Horario",
        value: listing.deliveryMode,
        hint: "janela de saida ou chegada",
      },
      {
        label: "Orcamento",
        value: formatListingBudget(listing),
        hint: "valor estimado para entrar no grupo",
      },
    ],
    experienceTitle: "Acoes que essa pagina precisa ter",
    experienceItems: [
      "Mostrar horario desejado de forma objetiva.",
      "Dar um botao claro para oferecer vaga ou montar grupo.",
      "Separar transporte de outros servicos porque a logica de rota e outra.",
    ],
    negotiationTitle: "Antes de responder",
    negotiationItems: [
      "Confirma se teu horario bate com o pedido.",
      "Se tua rota muda, explica o impacto no valor e no ponto de encontro.",
      "O passo seguinte ideal e levar essa conversa para o fluxo de transporte.",
    ],
    primaryAction: {
      label: "Oferecer vaga",
      href: getChatHref(listing, "oferecer-vaga"),
    },
    secondaryAction: {
      label: "Montar grupo",
      href: "/trabalhos",
    },
  };
}

function getGeneralServicesConfig(listing: Listing): ListingDetailConfig {
  if (listing.intent === "offer") {
    return {
      eyebrow: "Oferta de servicos gerais",
      lead:
        "Aqui o anuncio precisa mostrar escopo de casa, local de atendimento e combinacao de visita.",
      summary: [
        {
          label: "Escopo",
          value: listing.focus ?? "Servico geral",
          hint: "onde esse servico entra melhor",
        },
        {
          label: "Visita",
          value: listing.deliveryMode,
          hint: "como o atendimento acontece",
        },
        {
          label: "Valor",
          value: formatListingBudget(listing),
          hint: "preco base para iniciar a conversa",
        },
      ],
      experienceTitle: "Acoes que essa pagina precisa ter",
      experienceItems: [
        "Mostrar escopo de moradia sem virar anuncio generico de emprego.",
        "Deixar local e tipo de visita muito claros.",
        "Abrir pedido rapido para quem precisa resolver algo em casa.",
      ],
      negotiationTitle: "Antes de solicitar",
      negotiationItems: [
        "Vale confirmar se a pessoa atende esse escopo especifico.",
        "Se ja existirem materiais ou pecas, informa isso no chat.",
        "Para casa estudantil, o mais importante e resolver rapido e com clareza.",
      ],
      primaryAction: {
        label: "Solicitar servico",
        href: getChatHref(listing, "solicitar-servico-geral"),
      },
      secondaryAction: {
        label: "Ver escopos parecidos",
        href: "/trabalhos?aba=servicos",
      },
    };
  }

  return {
    eyebrow: "Demanda de servicos gerais",
    lead:
      "Numa demanda de casa, a pagina precisa destacar urgencia, escopo e local antes do preco.",
    summary: [
      {
        label: "Escopo",
        value: listing.focus ?? "Servico geral",
        hint: "tipo de ajuda que a casa precisa",
      },
      {
        label: "Local",
        value: listing.deliveryMode,
        hint: "como o atendimento deve acontecer",
      },
      {
        label: "Orcamento",
        value: formatListingBudget(listing),
        hint: "faixa base para responder a demanda",
      },
    ],
    experienceTitle: "Acoes que essa pagina precisa ter",
    experienceItems: [
      "Descrever o problema antes de abrir proposta.",
      "Separar urgencia, local e escopo em blocos claros.",
      "Dar resposta rapida para quem ja faz esse tipo de corre.",
    ],
    negotiationTitle: "Antes de responder",
    negotiationItems: [
      "Se tu atende esse escopo, entra dizendo o que esta incluso.",
      "Combina visita ou horario antes de discutir variacao de valor.",
      "Quando o escopo cresce, a conversa precisa continuar no chat com contexto.",
    ],
    primaryAction: {
      label: "Responder demanda",
      href: getChatHref(listing, "responder-demanda-servico-geral"),
    },
    secondaryAction: {
      label: "Ver demandas parecidas",
      href: "/trabalhos?aba=servicos",
    },
  };
}

export function getListingDetailConfig(listing: Listing): ListingDetailConfig {
  const normalizedCategory = normalizeLookupValue(listing.category);

  if (normalizedCategory === "moradia" && listing.housingDetails) {
    return getHousingConfig(listing);
  }

  if (normalizedCategory === "aulas e monitoria") {
    return getClassesConfig(listing);
  }

  if (normalizedCategory === "transporte comunitario") {
    return getTransportConfig(listing);
  }

  if (normalizedCategory === "servicos gerais") {
    return getGeneralServicesConfig(listing);
  }

  return getDefaultConfig(listing);
}

export function getListingMetaChips(listing: Listing) {
  return [
    listingIntentLabels[listing.intent],
    listingTypeLabels[listing.type],
    listing.category,
    listing.focus,
    listing.housingDetails?.genderPreference
      ? getHousingGenderLabel(listing.housingDetails.genderPreference)
      : null,
    listing.itemCondition ? itemConditionLabels[listing.itemCondition] : null,
  ].filter(Boolean) as string[];
}

export function getListingMoneyHeadline(listing: Listing) {
  return formatListingBudget(listing);
}
