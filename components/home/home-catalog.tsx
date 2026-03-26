"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  House,
  Package,
  Search,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { MarketplaceLaneCard } from "@/components/marketplace/marketplace-lane-card";
import styles from "@/components/home/home-catalog.module.scss";
import type { Listing } from "@/lib/listings";

type HomeCatalogSectionId = "products" | "housing" | "classes" | "services";

type Props = {
  productListings: Listing[];
  housingListings: Listing[];
  classListings: Listing[];
  serviceListings: Listing[];
};

type HomeCatalogSection = {
  id: HomeCatalogSectionId;
  title: string;
  description: string;
  href: string;
  laneId: "products" | "housing" | "classes" | "services";
  icon: LucideIcon;
  listings: Listing[];
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function getPriceHeadline(listing: Listing) {
  const unit = listing.priceUnit ? ` / ${listing.priceUnit}` : "";
  return `${moneyFormatter.format(listing.price)}${unit}`;
}

function matchesQuery(listing: Listing, query: string) {
  if (!query) {
    return true;
  }

  const searchableContent = [
    listing.title,
    listing.description,
    listing.category,
    listing.focus ?? "",
    listing.sellerName,
    listing.campus,
    listing.locationNote ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return searchableContent.includes(query);
}

export function HomeCatalog({
  productListings,
  housingListings,
  classListings,
  serviceListings,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"all" | HomeCatalogSectionId>("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const sections = useMemo<HomeCatalogSection[]>(
    () => [
      {
        id: "products",
        title: "Produtos",
        description: "Livros, eletronicos e itens que ja estao circulando no campus.",
        href: "/feed?type=product",
        laneId: "products",
        icon: Package,
        listings: productListings,
      },
      {
        id: "housing",
        title: "Moradia",
        description: "Quartos, vagas e casas para dividir com mais contexto.",
        href: "/feed?type=product&category=Moradia",
        laneId: "housing",
        icon: House,
        listings: housingListings,
      },
      {
        id: "classes",
        title: "Aulas",
        description: "Monitoria, reforco e banca com leitura mais rapida.",
        href: "/feed?type=service&category=Aulas%20e%20monitoria",
        laneId: "classes",
        icon: GraduationCap,
        listings: classListings,
      },
      {
        id: "services",
        title: "Servicos",
        description: "Freelas, reparos e ajuda pratica dentro da rede.",
        href: "/feed?type=service",
        laneId: "services",
        icon: BriefcaseBusiness,
        listings: serviceListings,
      },
    ],
    [classListings, housingListings, productListings, serviceListings],
  );

  const visibleSections = sections
    .filter((section) => (activeSection === "all" ? true : section.id === activeSection))
    .map((section) => ({
      ...section,
      listings: section.listings.filter((listing) => matchesQuery(listing, deferredQuery)),
    }));

  return (
    <section className={styles.catalog}>
      <div className={styles.topbar}>
        <div className={styles.heading}>
          <h1>Catalogo do campus</h1>
          <p>Produtos, moradia, aulas e servicos em trilhos separados.</p>
        </div>

        <div className={styles.commandButtons}>
          <button
            type="button"
            className={`${styles.commandButton} ${searchOpen ? styles.commandButtonActive : ""}`}
            onClick={() => setSearchOpen((current) => !current)}
            aria-expanded={searchOpen}
            aria-controls="home-search-panel"
            aria-label="Abrir busca"
          >
            <Search size={17} />
          </button>

          <button
            type="button"
            className={`${styles.commandButton} ${filtersOpen ? styles.commandButtonActive : ""}`}
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            aria-controls="home-filter-panel"
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div id="home-search-panel" className={styles.searchPanel}>
          <div className={styles.searchField}>
            <Search size={18} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Buscar no catalogo"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      {filtersOpen ? (
        <div id="home-filter-panel" className={styles.filterPanel}>
          <button
            type="button"
            className={`${styles.filterChip} ${
              activeSection === "all" ? styles.filterChipActive : ""
            }`}
            onClick={() => setActiveSection("all")}
          >
            Tudo
          </button>

          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`${styles.filterChip} ${
                activeSection === section.id ? styles.filterChipActive : ""
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.sectionStack}>
        {visibleSections.map((section) => {
          const Icon = section.icon;

          return (
            <section key={section.id} className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionHeading}>
                  <span className={styles.sectionIcon}>
                    <Icon size={17} />
                  </span>
                  <div className={styles.sectionCopy}>
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                </div>

                <Link href={section.href} className={styles.inlineLink}>
                  Ver tudo
                  <ArrowRight size={15} />
                </Link>
              </div>

              {section.listings.length ? (
                <div className={styles.rail}>
                  {section.listings.map((listing) => (
                    <MarketplaceLaneCard
                      key={listing.id}
                      listing={listing}
                      laneId={section.laneId}
                      priceHeadline={getPriceHeadline(listing)}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyRail}>
                  <strong>
                    {deferredQuery
                      ? "Nada apareceu com essa busca."
                      : `Ainda nao ha anuncios em ${section.title.toLowerCase()}.`}
                  </strong>
                  <p>
                    {deferredQuery
                      ? "Tenta outro termo ou abre o feed completo."
                      : "Quando entrarem anuncios reais, eles aparecem aqui."}
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>

    </section>
  );
}
