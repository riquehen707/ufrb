import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CAMPUS",
    short_name: "CAMPUS",
    description:
      "Rede universitaria para trocar, gerar renda, estudar e resolver a vida no campus.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff2d6f",
    lang: "pt-BR",
    categories: ["education", "shopping", "productivity"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Ver oportunidades",
        short_name: "Feed",
        description: "Explorar oportunidades reais",
        url: "/feed",
      },
      {
        name: "Dar aula ou ajudar",
        short_name: "Trabalhos",
        description: "Aulas, transporte e servicos do campus",
        url: "/trabalhos",
      },
      {
        name: "Conversas",
        short_name: "Chat",
        description: "Falar com estudantes",
        url: "/chat",
      },
      {
        name: "Minha conta",
        short_name: "Perfil",
        description: "Conta, reputacao e teu ecossistema",
        url: "/perfil",
      },
    ],
  };
}
