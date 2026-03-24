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
  eyebrow: string;
  note: string;
  href: string;
  icon: LucideIcon;
};

const categoryCards: CategoryCard[] = [
  {
    title: "Livros e materiais",
    eyebrow: "Trocas e vendas",
    note: "Academicos, leitura e materiais do curso.",
    href: "/feed?type=product&category=Livros",
    icon: BookMarked,
  },
  {
    title: "Moradia",
    eyebrow: "Casa e convivencia",
    note: "Quartos, republicas, alugueis e vagas para dividir.",
    href: "/feed?type=product&category=Moradia",
    icon: House,
  },
  {
    title: "Aulas",
    eyebrow: "Ajuda academica",
    note: "Monitoria, reforco, grupos e professores disponiveis.",
    href: "/trabalhos?aba=aulas",
    icon: GraduationCap,
  },
  {
    title: "Transporte",
    eyebrow: "Rotas e horarios",
    note: "Caronas recorrentes e grupos para dividir a corrida.",
    href: "/trabalhos?aba=transporte",
    icon: BusFront,
  },
  {
    title: "Servicos gerais",
    eyebrow: "Pequenos corres",
    note: "Instalacao, reparo, design, ajuda pratica e mais.",
    href: "/trabalhos?aba=servicos",
    icon: Wrench,
  },
  {
    title: "Demandas abertas",
    eyebrow: "O que falta resolver",
    note: "Pedidos reais de estudantes buscando ajuda agora.",
    href: "/feed?intent=request",
    icon: HandCoins,
  },
] as const;

export function HomeCategoryCarousel() {
  return (
    <section
      className="section home-category-section"
      aria-labelledby="home-category-title"
    >
      <div className="container home-category-shell">
        <div className="home-section-head">
          <span className="eyebrow">Oportunidades</span>
          <h2 id="home-category-title">Comeca pelo que faz sentido para tua rotina.</h2>
          <p>
            Produtos, moradia, aulas, transporte e servicos organizados de um jeito
            rapido de entender.
          </p>
        </div>

        <div className="home-category-marquee">
          <div className="home-category-track">
            {categoryCards.map(({ title, eyebrow, note, href, icon: Icon }) => (
              <Link key={title} href={href} className="home-category-card">
                <span className="home-category-icon">
                  <Icon size={20} />
                </span>

                <div className="home-category-copy">
                  <span className="home-category-eyebrow">{eyebrow}</span>
                  <strong>{title}</strong>
                  <span>{note}</span>
                </div>

                <span className="home-category-link">Explorar</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
