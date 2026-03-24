import Image from "next/image";
import Link from "next/link";

const storyCards = [
  {
    title: "Aulas e ajuda academica",
    description: "Particular, grupo, banca e reforco dentro da mesma rede.",
    image: "/home/student-scene.svg",
    href: "/trabalhos?aba=aulas",
    kicker: "Estudo e renda",
    chips: ["Dar aula", "Entrar em grupo"],
    cta: "Ver aulas",
  },
  {
    title: "Moradia com mais contexto",
    description: "Valor por pessoa, quartos, regras da casa e convivencia.",
    image: "/home/moradia-scene.svg",
    href: "/feed?type=product&category=Moradia",
    kicker: "Casa e convivencia",
    chips: ["Buscar moradia", "Dividir aluguel"],
    cta: "Ver moradias",
  },
  {
    title: "Servicos e freelas reais",
    description: "Pedidos e prestadores com foco no que resolve a vida pratica.",
    image: "/home/servicos-scene.svg",
    href: "/trabalhos?aba=servicos",
    kicker: "Renda extra",
    chips: ["Publicar servico", "Encontrar ajuda"],
    cta: "Ver servicos",
  },
  {
    title: "Transporte comunitario",
    description: "Rotas, grupos por horario e divisao mais facil do custo.",
    image: "/home/transporte-scene.svg",
    href: "/trabalhos?aba=transporte",
    kicker: "Mobilidade",
    chips: ["Criar rota", "Dividir corrida"],
    cta: "Ver transporte",
  },
] as const;

export function HomeStoryRail() {
  return (
    <section className="section">
      <div className="container home-story-shell">
        <div className="home-section-head">
          <span className="eyebrow">Fluxos prontos</span>
          <h2>Entradas mais claras para cada tipo de rotina.</h2>
          <p>Em vez de repetir o feed, essa faixa mostra os caminhos que mais fazem sentido para usar o app.</p>
        </div>

        <div className="home-story-rail">
          {storyCards.map((card) => (
            <article key={card.title} className="home-story-card">
              <div className="home-story-media-wrap">
                <Image
                  className="home-story-media"
                  src={card.image}
                  alt={card.title}
                  width={1200}
                  height={820}
                  loading="lazy"
                />
                <span className="home-story-kicker">{card.kicker}</span>
              </div>

              <div className="home-story-copy">
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
                  {card.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
