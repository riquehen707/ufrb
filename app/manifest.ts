import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CAMPUS",
    short_name: "CAMPUS",
    description:
      "Marketplace universitario para produtos, moradia, aulas, transporte e servicos do dia a dia.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f1020",
    theme_color: "#6d4aff",
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
        name: "Abrir feed",
        short_name: "Feed",
        description: "Explorar servicos e produtos",
        url: "/feed",
      },
      {
        name: "Abrir Trabalhos",
        short_name: "Trabalhos",
        description: "Transporte, aulas e servicos gerais",
        url: "/trabalhos",
      },
      {
        name: "Abrir chat",
        short_name: "Chat",
        description: "Conversas do CAMPUS",
        url: "/chat",
      },
      {
        name: "Abrir perfil",
        short_name: "Perfil",
        description: "Conta, reputacao e atalhos",
        url: "/perfil",
      },
    ],
  };
}
