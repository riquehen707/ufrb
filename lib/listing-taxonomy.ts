export type ListingType = "service" | "product";
export type ListingIntent = "offer" | "request";
export type ItemCondition = "new" | "used";
export type NegotiationMode = "fixed" | "negotiable" | "counter_offer";

export const serviceCategories = [
  "Aulas e monitoria",
  "Design",
  "Audiovisual",
  "Idiomas",
  "Academico",
  "Transporte comunitario",
  "Servicos gerais",
] as const;

export const productCategories = [
  "Livros",
  "Tecnologia",
  "Moradia",
  "Laboratorio",
  "Eletronicos",
  "Musica",
] as const;

const focusOptionsByCategory: Record<string, string[]> = {
  "Aulas e monitoria": [
    "Particular - Universitario",
    "Grupo - Universitario",
    "Particular - Ensino medio",
    "Grupo - Ensino medio",
    "Banca",
  ],
  Design: ["Apresentacao", "Social media", "Identidade", "Portfolio"],
  Audiovisual: ["Fotografia", "Video", "Cobertura", "Edicao"],
  Idiomas: ["Ingles", "Espanhol", "Traducao", "Conversacao"],
  Academico: ["ABNT", "TCC", "Artigo", "Resumo"],
  "Transporte comunitario": [
    "Grupo por horario",
    "Campus e cidade",
    "Rodoviaria",
    "Bairros",
  ],
  "Servicos gerais": ["Faxina", "Lavanderia", "Montagem", "Pequenos reparos"],
  Livros: ["Academico", "Entretenimento", "Concurso", "Pesquisa"],
  Tecnologia: ["Estudos", "Trampo", "Games", "Acessorios"],
  Moradia: [
    "Vaga em republica",
    "Quarto individual",
    "Quarto compartilhado",
    "Apartamento inteiro",
  ],
  Laboratorio: ["Quimica", "Saude", "Biologicas", "Campo"],
  Eletronicos: ["Cozinha", "Notebook", "Celular", "Audio", "Imagem"],
  Musica: ["Iniciante", "Banda", "Producao", "Lazer"],
};

export const listingTypeLabels: Record<ListingType, string> = {
  service: "Servico",
  product: "Produto",
};

export const listingIntentLabels: Record<ListingIntent, string> = {
  offer: "Oferta",
  request: "Demanda",
};

export const itemConditionLabels: Record<ItemCondition, string> = {
  new: "Novo",
  used: "Usado",
};

export const negotiationModeLabels: Record<NegotiationMode, string> = {
  fixed: "Preco fixo",
  negotiable: "Aceita ofertas",
  counter_offer: "Aceita ofertas",
};

export const negotiationModeHints: Record<NegotiationMode, string> = {
  fixed: "Preco mais direto, sem muita ida e volta.",
  negotiable: "O anunciante esta aberto a receber ofertas.",
  counter_offer: "O anunciante esta aberto a receber ofertas.",
};

export function getCategoriesForType(type: ListingType): readonly string[] {
  return type === "service" ? serviceCategories : productCategories;
}

export function getFocusOptions(category: string): string[] {
  return focusOptionsByCategory[category] ?? [];
}
