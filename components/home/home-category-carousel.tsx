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
  action: string;
  tone: "study" | "home" | "work" | "move";
  icon: LucideIcon;
};

const categoryCards: CategoryCard[] = [
  {
    title: "Livros e materiais",
    eyebrow: "Trocas e vendas",
    note: "Academicos, leitura e itens que ainda circulam bem no campus.",
    href: "/feed?type=product&category=Livros",
    action: "Ver materiais",
    tone: "study",
    icon: BookMarked,
  },
  {
    title: "Moradia",
    eyebrow: "Casa e convivencia",
    note: "Quartos, republicas, alugueis e vagas para dividir com mais clareza.",
    href: "/feed?type=product&category=Moradia",
    action: "Buscar moradia",
    tone: "home",
    icon: House,
  },
  {
    title: "Aulas",
    eyebrow: "Ajuda academica",
    note: "Monitoria, reforco, grupos e professores disponiveis.",
    href: "/trabalhos?aba=aulas",
    action: "Dar aula",
    tone: "study",
    icon: GraduationCap,
  },
  {
    title: "Transporte",
    eyebrow: "Rotas e horarios",
    note: "Caronas recorrentes e grupos para dividir a corrida.",
    href: "/trabalhos?aba=transporte",
    action: "Ver rotas",
    tone: "move",
    icon: BusFront,
  },
  {
    title: "Servicos gerais",
    eyebrow: "Pequenos corres",
    note: "Instalacao, reparo, design, limpeza e ajuda pratica.",
    href: "/trabalhos?aba=servicos",
    action: "Publicar servico",
    tone: "work",
    icon: Wrench,
  },
  {
    title: "Demandas abertas",
    eyebrow: "O que falta resolver",
    note: "Pedidos reais de estudantes buscando ajuda agora.",
    href: "/feed?intent=request",
    action: "Ver demandas",
    tone: "work",
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
          <span className="eyebrow">Frentes principais</span>
          <h2 id="home-category-title">Escolhe por onde tua rotina aperta primeiro.</h2>
          <p>Estudo, casa, renda extra, transporte e demandas em cards mais diretos.</p>
        </div>

        <div className="home-category-marquee">
          <div className="home-category-track">
            {categoryCards.map(({ title, eyebrow, note, href, action, tone, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="home-category-card"
                data-tone={tone}
              >
                <div className="home-category-topline">
                  <span className="home-category-icon">
                    <Icon size={20} />
                  </span>
                  <span className="home-category-action">{action}</span>
                </div>

                <div className="home-category-copy">
                  <span className="home-category-eyebrow">{eyebrow}</span>
                  <strong>{title}</strong>
                  <span>{note}</span>
                </div>

                <span className="home-category-link">{action}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
