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

type EssentialSignal = {
  id: "grupos" | "moradia" | "transporte";
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  anchor: string;
  priceHint: string;
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

function getSignalCountLabel(
  id: EssentialSignal["id"],
  count: number,
) {
  if (id === "grupos") {
    return count === 1 ? "1 grupo ou aula" : `${count} grupos e aulas`;
  }

  if (id === "moradia") {
    return count === 1 ? "1 vaga de moradia" : `${count} vagas de moradia`;
  }

  return count === 1 ? "1 rota aberta" : `${count} rotas abertas`;
}

function getSignalPriceHint(listings: Listing[]) {
  if (!listings.length) {
    return "Sem anuncios agora";
  }

  const cheapestListing = [...listings].sort((left, right) => left.price - right.price)[0];
  return `Desde ${getPriceHeadline(cheapestListing)}`;
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
  const signals: EssentialSignal[] = [
    {
      id: "grupos",
      title: "Grupos e aulas",
      description: "Entrar em monitoria, reforco e grupos de estudo.",
      icon: GraduationCap,
      count: studyListings.length,
      anchor: "#grupos",
      priceHint: getSignalPriceHint(studyListings),
    },
    {
      id: "moradia",
      title: "Moradia",
      description: "Ver vagas, quartos e casas para dividir.",
      icon: House,
      count: housingListings.length,
      anchor: "#moradia",
      priceHint: getSignalPriceHint(housingListings),
    },
    {
      id: "transporte",
      title: "Transporte",
      description: "Entrar em rotas e grupos por horario.",
      icon: BusFront,
      count: transportListings.length,
      anchor: "#transporte",
      priceHint: getSignalPriceHint(transportListings),
    },
  ];

  return (
    <section className={styles.hub}>
      <div className={styles.hero}>
        <div className={styles.heroLayout}>
          <div className={styles.heroCopy}>
            <span className="eyebrow">Essenciais</span>
            <h1>O que resolve a rotina do campus com menos atrito.</h1>
            <p>
              Entre em grupos, veja vagas para dividir casa e acompanhe rotas
              compartilhadas sem sair do fluxo principal.
            </p>
          </div>

          <div className={styles.signalGrid} aria-label="Entradas principais">
            {signals.map(({ id, title, description, icon: Icon, count, anchor, priceHint }) => (
              <Link key={id} href={anchor} className={styles.signalCard}>
                <span className={styles.signalTopline}>
                  <span className={styles.signalIcon}>
                    <Icon size={18} />
                  </span>
                  <em>{getSignalCountLabel(id, count)}</em>
                </span>

                <div className={styles.signalCopy}>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>

                <small>{priceHint}</small>
              </Link>
            ))}
          </div>
        </div>
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
