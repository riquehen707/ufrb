import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

import { InstallAppButton } from "@/components/engagement/install-app-button";

type HeroTile = {
  title: string;
  note: string;
  image: string;
  href: string;
  cta: string;
  featured?: boolean;
};

const heroTiles: HeroTile[] = [
  {
    title: "Aulas, monitoria e banca",
    note: "Ajuda academica",
    image: "/home/student-scene.svg",
    href: "/trabalhos?aba=aulas",
    cta: "Ver aulas",
    featured: true,
  },
  {
    title: "Moradia compartilhada",
    note: "Casa e convivencia",
    image: "/home/moradia-scene.svg",
    href: "/feed?type=product&category=Moradia",
    cta: "Buscar moradia",
  },
  {
    title: "Freelas, servicos e demandas",
    note: "Renda extra",
    image: "/home/servicos-scene.svg",
    href: "/trabalhos?aba=servicos",
    cta: "Encontrar ajuda",
  },
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
              Ganhe dinheiro e resolva a vida no campus com gente da tua rede.
            </h1>

            <p className="home-hero-description">
              Aulas, freelas, moradia, caronas e pedidos reais entre estudantes, sem
              mural baguncado e sem perder tempo.
            </p>

            <div className="home-hero-actions">
              <InstallAppButton
                className="home-hero-button secondary"
                hiddenWhenInstalled
              />
              <Link href="/feed" className="home-hero-button primary">
                Explorar o feed
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="home-hero-caption">
              Produtos, moradia, servicos, aulas e demandas em um fluxo mais claro.
            </div>
          </div>

          <aside className="home-hero-mosaic" aria-label="Oportunidades em destaque">
            {heroTiles.map((tile) => (
              <Link
                key={tile.title}
                href={tile.href}
                className={`home-hero-media-card ${tile.featured ? "featured" : ""}`}
              >
                <Image
                  className="home-hero-media-image"
                  src={tile.image}
                  alt={tile.title}
                  width={1200}
                  height={820}
                  priority={tile.featured}
                />

                <div className="home-hero-media-scrim" />

                <div className="home-hero-media-copy">
                  <span>{tile.note}</span>
                  <strong>{tile.title}</strong>
                  <em>{tile.cta}</em>
                </div>
              </Link>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
