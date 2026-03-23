import Link from "next/link";
import { ArrowRight, Download, GraduationCap, MapPin } from "lucide-react";

import type { Listing } from "@/lib/mock-data";

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

            <h1 className="home-hero-title">Tudo que circula no campus.</h1>

            <p className="home-hero-description">
              Produtos, moradia, aulas, transporte e demandas entre estudantes.
            </p>

            <div className="home-hero-actions">
              <Link href="#baixar-app" className="home-hero-button secondary">
                <Download size={18} />
                Baixar o app
              </Link>
              <Link href="/feed" className="home-hero-button primary">
                Explorar o feed
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <aside className="home-hero-collage" aria-label="Previa do que circula no app">
            {collageListings.map((listing, index) => (
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
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
