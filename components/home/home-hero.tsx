import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

import { InstallAppButton } from "@/components/engagement/install-app-button";

const previewCards = [
  {
    title: "Aulas particulares, grupos e monitoria",
    note: "Aulas e ajuda academica",
    detail: "Professores, grupos de estudo e demandas abertas no mesmo fluxo.",
    image: "/home/student-scene.svg",
    href: "/trabalhos?aba=aulas",
    cta: "Dar aula",
  },
  {
    title: "Moradia compartilhada com mais clareza",
    note: "Quartos, republicas e convivencia",
    detail: "Valores, regras da casa, vagas e avaliacao de convivio sem bagunca.",
    image: "/home/moradia-scene.svg",
    href: "/feed?type=product&category=Moradia",
    cta: "Buscar moradia",
  },
  {
    title: "Freelas, servicos e problemas reais do campus",
    note: "Renda extra e ajuda pratica",
    detail: "Pedidos de servico, pequenos corres e gente pronta para resolver.",
    image: "/home/servicos-scene.svg",
    href: "/feed?intent=request",
    cta: "Encontrar ajuda",
  },
] as const;

const proofPills = [
  "Aulas e ajuda academica",
  "Moradia compartilhada",
  "Servicos, renda e projetos",
] as const;

export function HomeHero() {
  return (
    <section className="section home-hero-section">
      <div className="container home-hero-shell">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <div className="home-hero-topline">
              <span className="eyebrow">
                <GraduationCap size={16} />
                CAMPUS
              </span>
            </div>

            <h1 className="home-hero-title">
              Ganhe dinheiro, encontre ajuda e resolva a vida no campus.
            </h1>

            <p className="home-hero-description">
              Aulas, freelas, moradia, caronas e oportunidades reais entre estudantes da
              mesma rede.
            </p>

            <div className="home-hero-proof-row" aria-label="Principais frentes do app">
              {proofPills.map((pill) => (
                <span key={pill} className="home-hero-proof-pill">
                  {pill}
                </span>
              ))}
            </div>

            <div className="home-hero-actions">
              <InstallAppButton className="home-hero-button secondary" />
              <Link href="/feed" className="home-hero-button primary">
                Explorar o feed
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <aside className="home-hero-preview" aria-label="O que voce encontra no CAMPUS">
            <div className="home-hero-preview-head">
              <div>
                <span className="eyebrow">No app</span>
                <h2>Oportunidades e ajuda em uma navegacao so.</h2>
              </div>

              <Link href="/feed" className="home-inline-link">
                Ver oportunidades
              </Link>
            </div>

            <div className="home-hero-preview-rail">
              {previewCards.map((card) => (
                <article key={card.title} className="home-preview-card">
                  <Image
                    className="home-preview-media"
                    src={card.image}
                    alt={card.title}
                    width={1200}
                    height={820}
                    loading="lazy"
                  />
                  <div className="home-preview-copy">
                    <span className="home-preview-kicker">{card.note}</span>
                    <strong>{card.title}</strong>
                    <p>{card.detail}</p>
                    <Link href={card.href} className="home-inline-link">
                      {card.cta}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
