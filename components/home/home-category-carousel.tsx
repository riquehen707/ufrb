import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BusFront,
  GraduationCap,
  HandCoins,
  House,
  Wrench,
} from "lucide-react";

type CategoryCard = {
  title: string;
  note: string;
  href: string;
  icon: LucideIcon;
};

const categoryCards: CategoryCard[] = [
  {
    title: "Livros",
    note: "Academicos e lazer",
    href: "/feed?type=product&category=Livros",
    icon: BookMarked,
  },
  {
    title: "Moradia",
    note: "Quarto e republica",
    href: "/feed?type=product&category=Moradia",
    icon: House,
  },
  {
    title: "Aulas",
    note: "Monitoria e reforco",
    href: "/trabalhos?aba=aulas",
    icon: GraduationCap,
  },
  {
    title: "Transporte",
    note: "Rotas e grupos",
    href: "/trabalhos",
    icon: BusFront,
  },
  {
    title: "Servicos gerais",
    note: "Casa e pequenos corres",
    href: "/trabalhos?aba=servicos",
    icon: Wrench,
  },
  {
    title: "Demandas",
    note: "Pedidos abertos",
    href: "/feed?intent=request",
    icon: HandCoins,
  },
];

export function HomeCategoryCarousel() {
  const loopedCards = [...categoryCards, ...categoryCards];

  return (
    <section
      className="section home-category-section"
      aria-labelledby="home-category-title"
    >
      <div className="container home-category-shell">
        <div className="home-section-head">
          <span className="eyebrow">Categorias</span>
          <h2 id="home-category-title">Explora por categoria</h2>
        </div>

        <div className="home-category-marquee">
          <div className="home-category-track">
            {loopedCards.map(({ title, note, href, icon: Icon }, index) => {
              const duplicate = index >= categoryCards.length;

              return (
                <Link
                  key={`${title}-${duplicate ? "copy" : "base"}`}
                  href={href}
                  className="home-category-card"
                  aria-hidden={duplicate ? true : undefined}
                  tabIndex={duplicate ? -1 : undefined}
                >
                  <span className="home-category-icon">
                    <Icon size={18} />
                  </span>
                  <div className="home-category-copy">
                    <strong>{title}</strong>
                    <span>{note}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
