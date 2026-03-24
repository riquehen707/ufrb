import Link from "next/link";
import { ArrowRight, GraduationCap, MapPin } from "lucide-react";

import { InstallAppButton } from "@/components/engagement/install-app-button";
import type { Listing } from "@/lib/listings";

type Props = {
  listings: Listing[];
};

const collageTones = ["primary", "accent", "neutral"] as const;

function formatPrice(listing: Listing) {
  const value = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(listing.price);

  if (listing.intent === "request") {
    return `Ate ${value}`;
  }

  return listing.priceUnit ? `${value} / ${listing.priceUnit}` : value;
}

export function HomeHero({ listings }: Props) {
  const featuredListings = listings.filter((listing) => listing.featured).slice(0, 3);
  const collageListings = featuredListings.length >= 3 ? featuredListings : listings.slice(0, 3);
  const hasListings = collageListings.length > 0;

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
              A vida universitaria vira renda, troca e autonomia.
            </h1>

            <p className="home-hero-description">
              Aulas, servicos, moradia, caronas, projetos e demandas reais entre estudantes.
            </p>

            <div className="home-hero-actions">
              <InstallAppButton className="home-hero-button secondary" />
              <Link href="/feed" className="home-hero-button primary">
                Explorar o feed
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <aside className="home-hero-collage" aria-label="Previa das oportunidades do app">
            {hasListings ? (
              collageListings.map((listing, index) => (
                <article
                  key={listing.id}
                  className={`home-collage-card ${index === 0 ? "lead" : "stacked"}`}
                  data-tone={collageTones[index] ?? "neutral"}
                >
                  <div className="home-collage-surface" />
                  <div className="home-collage-copy">
                    <div className="home-collage-top">
                      <span className="home-collage-badge">{listing.category}</span>
                      <span className="home-collage-meta">
                        <MapPin size={13} />
                        {listing.campus}
                      </span>
                    </div>
                    <strong>{listing.title}</strong>
                    <p>{formatPrice(listing)}</p>
                  </div>
                </article>
              ))
            ) : (
              <>
                <article className="home-collage-card lead" data-tone="primary">
                  <div className="home-collage-surface" />
                  <div className="home-collage-copy">
                    <div className="home-collage-top">
                        <span className="home-collage-badge">Oportunidades reais</span>
                        <span className="home-collage-meta">Sem vitrine inventada</span>
                      </div>
                      <strong>O campus passa a circular por aqui.</strong>
                      <p>Quando a comunidade publica, a rede de oportunidades comeca a girar.</p>
                    </div>
                  </article>
                  <article className="home-collage-card stacked" data-tone="accent">
                  <div className="home-collage-surface" />
                  <div className="home-collage-copy">
                    <div className="home-collage-top">
                        <span className="home-collage-badge">Troca e renda</span>
                        <span className="home-collage-meta">Tempo real</span>
                      </div>
                      <strong>Ganhe dinheiro com o que voce sabe fazer.</strong>
                      <p>Aulas, servicos, moradia, produtos e projetos circulam por aqui.</p>
                    </div>
                  </article>
                  <article className="home-collage-card stacked" data-tone="neutral">
                  <div className="home-collage-surface" />
                  <div className="home-collage-copy">
                    <div className="home-collage-top">
                        <span className="home-collage-badge">Rede universitaria</span>
                        <span className="home-collage-meta">Campus</span>
                      </div>
                      <strong>Resolve estudo, renda e vida pratica no mesmo lugar.</strong>
                      <p>Explora oportunidades ou publica o primeiro movimento da tua rede.</p>
                    </div>
                  </article>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
