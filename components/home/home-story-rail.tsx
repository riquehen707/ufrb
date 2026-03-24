import Image from "next/image";
import Link from "next/link";

const storyCards = [
  {
    title: "Aulas e ajuda academica",
    description:
      "Organize aulas particulares, grupos de estudo e monitoria sem sair da mesma rede.",
    image: "/home/student-scene.svg",
    href: "/trabalhos?aba=aulas",
    metric: "Particular e grupo",
    chips: ["Dar aula", "Entrar em grupo", "Abrir demanda"],
  },
  {
    title: "Moradia compartilhada",
    description:
      "Mostre valor por pessoa, quartos, regras da casa, garagem e convivio com mais clareza.",
    image: "/home/moradia-scene.svg",
    href: "/feed?type=product&category=Moradia",
    metric: "Quarto, casa e republica",
    chips: ["Buscar moradia", "Dividir aluguel", "Ver perfil"],
  },
  {
    title: "Servicos, freelas e projetos",
    description:
      "Conecte quem precisa com quem sabe fazer: pequenos servicos, demandas e renda extra.",
    image: "/home/servicos-scene.svg",
    href: "/trabalhos?aba=servicos",
    metric: "Ajuda pratica e renda extra",
    chips: ["Publicar servico", "Encontrar ajuda", "Fechar demanda"],
  },
  {
    title: "Transporte comunitario",
    description:
      "Monte grupos por horario, veja rotas e deixe mais facil dividir o custo da ida e volta.",
    image: "/home/transporte-scene.svg",
    href: "/trabalhos?aba=transporte",
    metric: "Rotas e grupos por horario",
    chips: ["Criar rota", "Entrar no grupo", "Dividir corrida"],
  },
] as const;

export function HomeStoryRail() {
  return (
    <section className="section">
      <div className="container home-story-shell">
        <div className="home-section-head">
          <span className="eyebrow">Como funciona</span>
          <h2>Um app so para estudo, renda e vida pratica.</h2>
          <p>
            Arrasta para o lado e ve como o CAMPUS organiza as partes que mais pesam
            na rotina universitaria.
          </p>
        </div>

        <div className="home-story-rail">
          {storyCards.map((card) => (
            <article key={card.title} className="home-story-card">
              <Image
                className="home-story-media"
                src={card.image}
                alt={card.title}
                width={1200}
                height={820}
                loading="lazy"
              />

              <div className="home-story-copy">
                <span className="home-showcase-label">{card.metric}</span>
                <strong>{card.title}</strong>
                <p>{card.description}</p>

                <div className="home-showcase-chip-row" aria-label={card.title}>
                  {card.chips.map((chip) => (
                    <span key={chip} className="home-showcase-chip">
                      {chip}
                    </span>
                  ))}
                </div>

                <Link href={card.href} className="home-inline-link">
                  Ver oportunidades
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
