import Link from "next/link";
import {
  BusFront,
  GraduationCap,
  House,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { MarketplaceLaneCard } from "@/components/marketplace/marketplace-lane-card";
import styles from "@/components/essentials/essentials-hub.module.scss";
import type { Listing } from "@/lib/listings";

type Props = {
  studyListings: Listing[];
  housingListings: Listing[];
  transportListings: Listing[];
};

type EssentialDeckItem = {
  id: "grupos" | "moradia" | "transporte";
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  anchor: string;
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

function EmptyRail({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className={styles.emptyRail}>
      <strong>{title}</strong>
      <p>{description}</p>
      <Link href={href} className="secondary-button">
        {action}
      </Link>
    </div>
  );
}

export function EssentialsHub({
  studyListings,
  housingListings,
  transportListings,
}: Props) {
  const deckItems: EssentialDeckItem[] = [
    {
      id: "grupos",
      title: "Grupos e aulas",
      description: "Entrar em monitoria, reforco e grupos de estudo.",
      icon: GraduationCap,
      count: studyListings.length,
      anchor: "#grupos",
    },
    {
      id: "moradia",
      title: "Moradia",
      description: "Ver vagas, quartos e casas para dividir.",
      icon: House,
      count: housingListings.length,
      anchor: "#moradia",
    },
    {
      id: "transporte",
      title: "Transporte",
      description: "Entrar em rotas e grupos por horario.",
      icon: BusFront,
      count: transportListings.length,
      anchor: "#transporte",
    },
  ];

  return (
    <section className={styles.hub}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">Essenciais</span>
          <h1>O que resolve a rotina do campus com menos atrito.</h1>
          <p>
            Um ponto rapido para entrar em grupos, procurar moradia e achar rotas
            compartilhadas sem ficar pulando entre telas.
          </p>
        </div>
      </div>

      <div className={styles.deck} aria-label="Entradas principais">
        {deckItems.map(({ id, title, description, icon: Icon, count, anchor }) => (
          <Link key={id} href={anchor} className={styles.deckCard}>
            <span className={styles.deckIcon}>
              <Icon size={20} />
            </span>
            <div className={styles.deckCopy}>
              <strong>{title}</strong>
              <span>{description}</span>
            </div>
            <em>{count}</em>
          </Link>
        ))}
      </div>

      <div className={styles.stack}>
        <section id="grupos" className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionCopy}>
              <span className={styles.sectionEyebrow}>Estudo e apoio</span>
              <h2>Grupos e aulas</h2>
              <p>Aqui entram monitoria, reforco, banca e grupos em formacao.</p>
            </div>
            <Link href="/trabalhos?aba=aulas" className={styles.inlineLink}>
              Abrir aulas
              <ArrowRight size={15} />
            </Link>
          </div>

          {studyListings.length ? (
            <div className={styles.rail}>
              {studyListings.map((listing) => (
                <MarketplaceLaneCard
                  key={listing.id}
                  listing={listing}
                  laneId="classes"
                  priceHeadline={getPriceHeadline(listing)}
                />
              ))}
            </div>
          ) : (
            <EmptyRail
              title="Ainda nao ha grupos ativos."
              description="Assim que novas aulas e grupos aparecerem, eles entram aqui."
              href="/trabalhos?aba=aulas"
              action="Abrir aulas"
            />
          )}
        </section>

        <section id="moradia" className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionCopy}>
              <span className={styles.sectionEyebrow}>Casa e convivencia</span>
              <h2>Moradia</h2>
              <p>Quartos, vagas em republica e casas para dividir com mais contexto.</p>
            </div>
            <Link href="/feed?type=product&category=Moradia" className={styles.inlineLink}>
              Ver moradia
              <ArrowRight size={15} />
            </Link>
          </div>

          {housingListings.length ? (
            <div className={styles.rail}>
              {housingListings.map((listing) => (
                <MarketplaceLaneCard
                  key={listing.id}
                  listing={listing}
                  laneId="housing"
                  priceHeadline={getPriceHeadline(listing)}
                />
              ))}
            </div>
          ) : (
            <EmptyRail
              title="Sem moradias ativas no momento."
              description="Quando surgirem novas vagas ou quartos, eles entram aqui."
              href="/feed?type=product&category=Moradia"
              action="Buscar moradia"
            />
          )}
        </section>

        <section id="transporte" className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionCopy}>
              <span className={styles.sectionEyebrow}>Mobilidade</span>
              <h2>Transporte</h2>
              <p>Rotas recorrentes e grupos para dividir o custo do trajeto.</p>
            </div>
            <Link href="/trabalhos?aba=transporte" className={styles.inlineLink}>
              Ver transporte
              <ArrowRight size={15} />
            </Link>
          </div>

          {transportListings.length ? (
            <div className={styles.rail}>
              {transportListings.map((listing) => (
                <MarketplaceLaneCard
                  key={listing.id}
                  listing={listing}
                  laneId="transport"
                  priceHeadline={getPriceHeadline(listing)}
                />
              ))}
            </div>
          ) : (
            <EmptyRail
              title="Ainda nao ha rotas abertas."
              description="Quando alguem publicar novas rotas ou pedidos de vaga, eles aparecem aqui."
              href="/trabalhos?aba=transporte"
              action="Abrir transporte"
            />
          )}
        </section>
      </div>
    </section>
  );
}
